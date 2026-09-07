// NXP AN12196 test vectors (as reproduced in nfc-developer/sdm-backend
// tests/test_libsdm.py). Keys are the factory-default all-zero keys unless
// stated. These are the vectors the deck's appendix cites: "open-source
// verifiers exist" — this is ours, and it must agree with them byte for byte.
import { describe, expect, it } from 'vitest';
import {
  aesCmac,
  aesEncryptBlock,
  aesCbcDecryptNoPad,
  computeSdmMac,
  decryptPiccData,
  hex,
  parseTagTamper,
  sessionMacKey,
  truncateMac,
  verifyEncryptedSun,
  verifyPlainSun
} from '../src/lib/sun.js';
import { parseTapParams, tapUrl, verifyTap } from '../src/lib/url.js';

const ZERO = hex.from('00000000000000000000000000000000');
const KEYS = { metaReadKey: ZERO, fileReadKey: ZERO };

describe('AES primitives (RFC 4493 / FIPS-197 vectors)', () => {
  it('AES-128 single block matches FIPS-197 C.1', async () => {
    const key = hex.from('000102030405060708090a0b0c0d0e0f');
    const pt = hex.from('00112233445566778899aabbccddeeff');
    expect(hex.to(await aesEncryptBlock(key, pt))).toBe('69c4e0d86a7b0430d8cdb78070b4c55a');
  });

  it('CBC decrypt without padding round-trips a block through the pad trick', async () => {
    const key = hex.from('000102030405060708090a0b0c0d0e0f');
    const ct = hex.from('69c4e0d86a7b0430d8cdb78070b4c55a');
    const pt = await aesCbcDecryptNoPad(key, new Uint8Array(16), ct);
    expect(hex.to(pt)).toBe('00112233445566778899aabbccddeeff');
  });

  it('AES-CMAC matches RFC 4493 examples 1-4', async () => {
    const key = hex.from('2b7e151628aed2a6abf7158809cf4f3c');
    const m = hex.from('6bc1bee22e409f96e93d7e117393172aae2d8a571e03ac9c9eb76fac45af8e5130c81c46a35ce411e5fbc1191a0a52eff69f2445df4f9b17ad2b417be66c3710');
    expect(hex.to(await aesCmac(key, new Uint8Array(0)))).toBe('bb1d6929e95937287fa37d129b756746');
    expect(hex.to(await aesCmac(key, m.slice(0, 16)))).toBe('070a16b46b4d4144f79bdd9dd04a287c');
    expect(hex.to(await aesCmac(key, m.slice(0, 40)))).toBe('dfa66747de9ae63030ca32611497c827');
    expect(hex.to(await aesCmac(key, m))).toBe('51f0bebf7e3b9d92fc49741779363cfe');
  });

  it('truncateMac keeps the odd bytes', () => {
    expect(hex.to(truncateMac(hex.from('00112233445566778899aabbccddeeff')))).toBe('1133557799bbddff');
  });
});

describe('AN12196 encrypted PICC data + SDMMAC', () => {
  it('sun1 (AN12196 p.12): zero keys, no file data', async () => {
    const r = await verifyEncryptedSun(KEYS, {
      piccEnc: hex.from('EF963FF7828658A599F3041510671E88'),
      cmac: hex.from('94EED9EE65337086')
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.tag).toBe(0xc7);
    expect(r.uid).toBe('04de5f1eacc040');
    expect(r.readCounter).toBe(61);
    expect(r.fileData).toBeUndefined();
  });

  it('sun2 (AN12196 p.18): zero keys, enc file data, MAC input "<ENC>&cmac="', async () => {
    const r = await verifyEncryptedSun(KEYS, {
      piccEnc: hex.from('FD91EC264309878BE6345CBE53BADF40'),
      cmac: hex.from('ECC1E7F6C6C73BF6'),
      encFileData: hex.from('CEE9A53E3E463EF1F459635736738962'),
      macParam: 'cmac'
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.uid).toBe('04958caa5c5e80');
    expect(r.readCounter).toBe(8);
    expect(new TextDecoder().decode(r.fileData!)).toBe('xxxxxxxxxxxxxxxx');
  });

  it('sun3 (custom keys): enc file data, no MAC separator', async () => {
    const r = await verifyEncryptedSun(
      { metaReadKey: hex.from('42aff114f2cb3b6141be6dc95dfc5416'), fileReadKey: hex.from('b62a9baf092439bd43c62aee96b970c5') },
      {
        piccEnc: hex.from('8ACADDEF0A9B62CDAE39A16B83FC14DE'),
        cmac: hex.from('238B2543A8DEBAD8'),
        encFileData: hex.from('B8436E11F627BB7F543FCC0C1E0D1A89'),
        macParam: ''
      }
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.uid).toBe('041d3c8a2d6b80');
    expect(r.readCounter).toBe(291);
    expect(hex.to(r.fileData!)).toBe('4e545858716e6f5f6f42467077792d56');
  });

  it('sun2 with a corrupted SDMMAC is refused', async () => {
    const r = await verifyEncryptedSun(KEYS, {
      piccEnc: hex.from('FD91EC264309878BE6345CBE53BADF40'),
      cmac: hex.from('3CC1E7F6C6C33B33'),
      encFileData: hex.from('CEE9A53E3E463EF1F459635736738962'),
      macParam: 'cmac'
    });
    expect(r).toEqual({ ok: false, reason: 'bad_cmac' });
  });

  it('PICC data decrypt exposes tag / uid / counter', async () => {
    const p = await decryptPiccData(ZERO, hex.from('EF963FF7828658A599F3041510671E88'));
    expect(p.tag).toBe(0xc7);
    expect(hex.to(p.uid!)).toBe('04de5f1eacc040');
    expect(hex.to(p.ctrLE!)).toBe('3d0000');
  });

  it('session MAC key + SDMMAC over empty input reproduce sun1', async () => {
    const k = await sessionMacKey(ZERO, hex.from('04de5f1eacc040'), hex.from('3d0000'));
    expect(hex.to(await computeSdmMac(k, new Uint8Array(0)))).toBe('94eed9ee65337086');
  });
});

describe('AN12196 plaintext mirror', () => {
  it('plain: uid 041E3C8A2D6B80 ctr 000006 verifies', async () => {
    const r = await verifyPlainSun(ZERO, { uid: hex.from('041E3C8A2D6B80'), readCounter: 6, cmac: hex.from('4B00064004B0B3D3') });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.uid).toBe('041e3c8a2d6b80');
    expect(r.readCounter).toBe(6);
  });

  it('plain with a corrupted SDMMAC is refused', async () => {
    const r = await verifyPlainSun(ZERO, { uid: hex.from('041E3C8A2D6B80'), readCounter: 6, cmac: hex.from('AB00064004B0B3AB') });
    expect(r).toEqual({ ok: false, reason: 'bad_cmac' });
  });
});

describe('TagTamper mirror', () => {
  it('parses permanent + current', () => {
    expect(parseTagTamper('CC')).toEqual({ raw: 'CC', permanent: 'closed', current: 'closed' });
    expect(parseTagTamper('OC')).toEqual({ raw: 'OC', permanent: 'open', current: 'closed' });
    expect(parseTagTamper(undefined)).toBeUndefined();
  });
});

describe('URL scheme', () => {
  const BASE = 'https://custody.example';

  it('encrypted /t round-trips through tapUrl → verifyTap', async () => {
    const url = new URL(tapUrl(BASE, { mode: 'encrypted', e: 'EF963FF7828658A599F3041510671E88', c: '94EED9EE65337086', tt: 'CC' }));
    expect(url.pathname).toBe('/t');
    const r = await verifyTap(url.searchParams, KEYS);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.uid).toBe('04de5f1eacc040');
    expect(r.readCounter).toBe(61);
    expect(r.tagTamper?.permanent).toBe('closed');
  });

  it('plain /t verifies', async () => {
    const url = new URL(tapUrl(BASE, { mode: 'plain', u: '041E3C8A2D6B80', n: '000006', c: '4B00064004B0B3D3' }));
    const r = await verifyTap(url.searchParams, KEYS);
    expect(r.ok).toBe(true);
  });

  it('missing c is refused without throwing', async () => {
    const r = await verifyTap(new URLSearchParams('e=EF963FF7828658A599F3041510671E88'), KEYS);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe('missing_param');
  });

  it('non-hex e is refused without throwing', async () => {
    const r = await verifyTap(new URLSearchParams('e=zz&c=94EED9EE65337086'), KEYS);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe('bad_hex');
  });

  it('parseTapParams distinguishes modes', () => {
    expect(parseTapParams(new URLSearchParams('e=AA&c=BB')).mode).toBe('encrypted');
    expect(parseTapParams(new URLSearchParams('u=AA&n=000001&c=BB')).mode).toBe('plain');
  });
});

import qrcodeTerminal from 'qrcode-terminal';

export function showCompanionQR(url: string): void {
  console.error('');
  console.error('\x1b[36m[Rive Companion]\x1b[0m Open this URL in a browser:');
  console.error(`\x1b[36m${url}\x1b[0m`);
  console.error('');
  qrcodeTerminal.generate(url, { small: true }, (qr: string) => {
    console.error(qr);
  });
  console.error('');
}

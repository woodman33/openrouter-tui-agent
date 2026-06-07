import qrcodeTerminal from 'qrcode-terminal';
import { writeLog } from '../utils/logger.js';

export function showCompanionQR(url: string): void {
  if (process.env.TIMMY_TUI_ACTIVE === 'true') {
    writeLog('companion.log', 'info', `[Rive Companion] Open this URL in a browser: ${url}`);
    qrcodeTerminal.generate(url, { small: true }, (qr: string) => {
      writeLog('companion.log', 'info', `QR code:\n${qr}`);
    });
    return;
  }
  console.error('');
  console.error('\x1b[36m[Rive Companion]\x1b[0m Open this URL in a browser:');
  console.error(`\x1b[36m${url}\x1b[0m`);
  console.error('');
  qrcodeTerminal.generate(url, { small: true }, (qr: string) => {
    console.error(qr);
  });
  console.error('');
}

import { chromium, type Browser, type Page } from 'playwright';
import { EventEmitter } from 'eventemitter3';
import type { FrameBuffer } from './pipeline.js';
import { logger } from '../utils/logger.js';
import { theme } from '../tui/theme.js';

export class RiveFrameExtractor extends EventEmitter {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private running = false;
  private frameId = 0;
  private currentState = 'idle';

  async init(riveFilePath: string, width = 400, height = 300): Promise<void> {
    logger.info('Starting headless browser for Rive frame extraction');
    this.browser = await chromium.launch({ headless: true });
    this.page = await this.browser.newPage({ viewport: { width, height } });

    // Load an HTML page that contains the Rive canvas
    const html = buildRiveHtml(riveFilePath, width, height);
    await this.page.setContent(html, { waitUntil: 'networkidle' });
    await this.page.waitForSelector('canvas', { timeout: 10000 });
    logger.info('Rive canvas initialized');
  }

  async setState(state: string): Promise<void> {
    this.currentState = state;
    if (this.page) {
      try {
        await this.page.evaluate((s: string) => {
          (window as any).setRiveState?.(s);
        }, state);
      } catch (e) {
        logger.error('Failed to set Rive state:', state, e);
      }
    }
  }

  async *frameGenerator(fps = 20): AsyncGenerator<FrameBuffer> {
    this.running = true;
    const interval = 1000 / fps;
    let lastCapture = 0;

    while (this.running && this.page) {
      const now = Date.now();
      if (now - lastCapture >= interval) {
        try {
          const canvas = await this.page.$('canvas');
          if (canvas) {
            const data = await canvas.screenshot({ type: 'png' });
            const vp = this.page.viewportSize();
            yield {
              data,
              width: vp?.width || 400,
              height: vp?.height || 300,
              id: this.frameId++,
              timestamp: now,
            };
          }
        } catch (e) {
          logger.error('Frame capture error:', e);
        }
        lastCapture = now;
      }
      // Sleep to avoid pegging CPU
      await new Promise(r => setTimeout(r, Math.max(1, interval - (Date.now() - lastCapture))));
    }
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

function buildRiveHtml(riveFilePath: string, width: number, height: number): string {
  // Use official Rive canvas CDN runtime and load a stunning public animation.
  // We use Marty or Vehicles which are stable public Rive assets.
  return `
<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; background: ${theme.surfaceBase}; display: flex; align-items: center; justify-content: center; width: 100vw; height: 100vh; overflow: hidden; }
  canvas { display: block; width: 100%; height: 100%; }
</style>
</head>
<body>
<canvas id="rive-canvas" width="${width}" height="${height}"></canvas>
<script src="https://unpkg.com/@rive-app/canvas@2.9.1/js/rive.js"></script>
<script>
  const canvas = document.getElementById('rive-canvas');
  const ctx = canvas.getContext('2d');
  let rInstance = null;
  let currentState = 'idle';

  // State display fallback
  function drawPlaceholder(text) {
    ctx.fillStyle = '${theme.surfaceBase}';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '${theme.info}';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Rive TUI Mascot', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillStyle = '${theme.textSecondary}';
    ctx.font = '14px monospace';
    ctx.fillText('State: ' + text, canvas.width / 2, canvas.height / 2 + 20);
  }

  try {
    // Load a beautiful interactive Rive asset
    rInstance = new rive.Rive({
      src: 'https://cdn.rive.app/animations/vehicles.riv',
      canvas: canvas,
      autoplay: true,
      stateMachines: 'bumpy',
      onLoad: () => {
        rInstance.resizeDrawingSurfaceToCanvas();
        try {
          const inputs = rInstance.stateMachineInputs('bumpy');
          const bumpInput = inputs.find(i => i.name === 'bump');
          window.triggerBump = () => {
            if (bumpInput) bumpInput.fire();
          };
        } catch (e) {
          console.error("State machine inputs error:", e);
        }
      },
      onStateChange: (event) => {
        console.log("Rive State changed to:", event);
      }
    });
  } catch (err) {
    console.error("Rive failed to initialize:", err);
    drawPlaceholder('loading fallback');
  }

  window.setRiveState = (state) => {
    currentState = state;
    if (!rInstance) {
      drawPlaceholder(state);
      return;
    }
    
    // Trigger animations or state machine inputs based on the agent state
    try {
      if (state === 'thinking' || state === 'tool_call') {
        if (window.triggerBump) window.triggerBump();
      } else if (state === 'streaming') {
        if (window.triggerBump) {
          // Keep bumping during stream to animate
          if (!window.bumpInterval) {
            window.bumpInterval = setInterval(() => {
              if (currentState === 'streaming' && window.triggerBump) {
                window.triggerBump();
              } else {
                clearInterval(window.bumpInterval);
                window.bumpInterval = null;
              }
            }, 600);
          }
        }
      }
    } catch (e) {
      console.error("Rive trigger error:", e);
    }
  };
</script>
</body>
</html>
  `.trim();
}

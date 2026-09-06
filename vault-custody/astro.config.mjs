// Vault Custody pages — static by default (receipt / card / relic / series /
// manufacturer / log prerender from fixtures), with the tap route (/t) and the
// JSON API rendered on demand at the edge through the Cloudflare adapter.
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://custody.timmy.dev',
  output: 'static',
  adapter: cloudflare({ imageService: 'compile' }),
  trailingSlash: 'never',
  build: { format: 'file' }
});

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * This file's own directory — the site root.
 *
 * `import.meta.dirname` rather than `__dirname`: Vite 8's native config loader
 * evaluates the config as an ES module, where `__dirname` does not exist, and
 * warns about it today ahead of making that loader the default.
 */
const SITE_DIR = import.meta.dirname;

// Feature: ai-workflow-run
//
// The test configuration is kept separate from `vite.config.ts`, which Vitest
// would otherwise extend: that file installs the dev-only `/api/*` mock plugin,
// and a suite whose subject is `api.mjs`'s own transport must not have a
// middleware answering its requests. Vitest prefers this file when both exist,
// so the build config is left to describe the build alone.
//
// The `/…` aliases are the one thing the suite cannot do without. The site's
// modules import each other with root-absolute specifiers (`import … from
// '/api.mjs'`), which Vite resolves against the project root at build time; in
// a test run there is no server root to resolve against, so each specifier is
// mapped here. The list is exactly the model and API modules that survived the
// The component tree now lives under `src/Components` and is imported relatively.
//
// JSDOM rather than Node: `api.mjs` reads Attachment bytes through `FileReader`,
// which Node does not provide, and `submitRun`'s read path is under test.
//
// TZ is pinned so Property 9 (timestamp display floors the instant to the local
// minute) is deterministic wherever the suite runs. Europe/Zurich is the
// reference zone; the block that needs 30- and 45-minute offsets overrides TZ
// itself and restores it.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '/api.mjs': path.resolve(SITE_DIR, 'api.mjs'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['test/setup.ts'],
    include: ['test/**/*.{spec,test}.{ts,tsx,js,jsx,mjs}'],
    exclude: ['node_modules', 'dist'],
    env: {
      TZ: 'Europe/Zurich',
    },
  },
});

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { mockApiPlugin } from './dev/mock-api.ts';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';

  return {
    // `mockApiPlugin` sets `apply: 'serve'`, so it answers the SPA's
    // same-origin `/api/*` calls in the dev server only and is a no-op
    // in any build — nothing it touches reaches `dist/`.
    plugins: [react(), mockApiPlugin()],
    server: {
      host: true, // expose on LAN so you can test on a real mobile device
      port: 5174, // 5173 belongs to the create app, so both can run at once
    },
    preview: {
      host: true,
      port: 4174,
    },
    build: {
      outDir: 'dist',
      sourcemap: !isProd,
      minify: isProd ? 'esbuild' : false,
      target: 'es2022',
    },
    css: {
      preprocessorOptions: {
        scss: {
          // Silence deprecation noise coming from Bootstrap's Sass.
          quietDeps: true,
          // Bootswatch themes ship as `@import`-style partials that rely on a
          // shared global Sass scope, so `main.scss` must use `@import` to layer
          // them around Bootstrap. Mute that specific (dependency-driven)
          // deprecation until Bootswatch ships module-system partials.
          silenceDeprecations: ['import'],
        },
      },
    },
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV ?? mode),
    },
  };
});

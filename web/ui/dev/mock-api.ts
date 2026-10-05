// The Vite dev server has no `/api/` backend (see README § "Local
// development" → "Known gap"): the SPA calls same-origin `/api/...`
// paths that CloudFront routes to API Gateway in production, so under
// `npm run dev` those requests 404 and the app shows "No investments
// found". This plugin fills that gap by answering `/api/*` from an
// in-memory, stateful store seeded with the example data under
// `../../test/`, so the editor is fully exercisable locally.
//
// It is wired into `vite.config.ts` for `serve` (dev) mode ONLY and is
// never part of a build — nothing here reaches `dist/`.
//
// The mocked surface mirrors `api.mjs` one-to-one:
//   GET    /api/investments
//
// Error responses use the `{ error, message }` envelope that
// `api.mjs` → `request()` decodes into an `ApiError` code.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { Connect, Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

const HERE = dirname(fileURLToPath(import.meta.url));
const TEST_DIR = resolve(HERE);

// ─── Example-data loading ────────────────────────────────────────────
//

/** Reads a file under `../../test`, returning '' if it is absent. */
function readTest(name: string): string {
  try {
    return readFileSync(resolve(TEST_DIR, name), 'utf-8');
  } catch {
    return '';
  }
}

// ─── In-memory store ─────────────────────────────────────────────────


// ─── HTTP helpers ────────────────────────────────────────────────────

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(payload);
}

function sendText(res: ServerResponse, status: number, body: string): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.end(body);
}

/** `api.mjs` decodes `{ error }` into an ApiError code; mirror that. */
function sendError(
  res: ServerResponse,
  status: number,
  code: string,
  message: string,
): void {
  sendJson(res, status, { error: code, message });
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolveBody, rejectBody) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.from(c)));
    req.on('end', () => resolveBody(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', rejectBody);
  });
}

// ─── Router ──────────────────────────────────────────────────────────

/**
 * Handles a single `/api/*` request against the store, returning true
 * if it matched a route (and has already written the response) or false
 * to let the request fall through to Vite.
 */
async function handle(
  store: any,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = new URL(req.url ?? '', 'http://localhost');
  const { pathname } = url;
  const method = (req.method ?? 'GET').toUpperCase();

  if (!pathname.startsWith('/api/')) return false;

  // GET /api/investments
  if (pathname === '/api/investments' && method === 'GET') {
    sendJson(res, 200, { investments: Object.keys(store) });
    return true;
  }

}

// ─── Plugin ──────────────────────────────────────────────────────────

/**
 * Vite plugin that mocks the workflow-create `/api/*` surface in dev.
 * Use only in `serve` mode — see `vite.config.ts`.
 */
export function mockApiPlugin(): Plugin {
  return {
    name: 'workflow-create-mock-api',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      const store = {};
      const count = Object.keys(store).length;
      server.config.logger.info(
        `[mock-api] serving ${count} mock(s) at /api/* (dev only)`,
      );
      const middleware: Connect.NextHandleFunction = (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();
        handle(store, req, res).then((matched) => {
          if (!matched) next();
        }).catch((err) => {
          sendError(res, 500, 'storage_error', err?.message ?? 'Mock API error');
        });
      };
      server.middlewares.use(middleware);
    },
  };
}

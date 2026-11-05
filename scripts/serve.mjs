import { realpathSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectRoot, publicFiles, readSiteFile, redirectDocument, redirects } from './build.mjs';

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8' };
export function createSiteServer({ root = projectRoot } = {}) {
  const directory = realpathSync(root);
  let files;
  async function publishedFile(name) {
    // Refresh the photo list whenever the homepage is reloaded during editing.
    if (!files || name === 'index.html') {
      const index = await readSiteFile(directory, 'index.html');
      files = publicFiles(index.toString('utf8'));
      if (name === 'index.html') return index;
    }
    if (files.has(name)) return readSiteFile(directory, name);
  }

  return createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'no-cache');
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end();
      return;
    }
    let path;
    try {
      path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    } catch {
      response.writeHead(400);
      response.end('Bad request');
      return;
    }
    // Both a domain root and the GitHub Pages project prefix work in preview.
    if (path === '/page') {
      response.writeHead(301, { Location: '/page/' });
      response.end();
      return;
    }
    if (path.startsWith('/page/')) path = path.slice(5);
    const route = /^\/([^/.]+)(?:\/|\.html)?$/.exec(path)?.[1];
    if (redirects.has(route)) {
      response.writeHead(200, { 'Content-Type': types['.html'] });
      response.end(redirectDocument(route, path.endsWith('/')));
      return;
    }
    const name = path === '/' ? 'index.html' : path.slice(1);
    try {
      const data = await publishedFile(name);
      if (data) {
        response.writeHead(200, { 'Content-Type': types[extname(name)] || 'application/octet-stream' });
        response.end(data);
        return;
      }
    } catch {
      // A missing or disallowed file gets the same public 404.
    }
    try {
      const body = await readSiteFile(directory, '404.html');
      response.writeHead(404, { 'Content-Type': types['.html'] });
      response.end(body);
    } catch {
      response.writeHead(500);
      response.end();
    }
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createSiteServer({ root: process.argv.includes('--dist') ? resolve(projectRoot, 'dist') : projectRoot });
  const port = Number(process.env.PORT || 4173);
  server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}/page/`));
}

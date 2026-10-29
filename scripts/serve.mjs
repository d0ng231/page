import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectRoot, redirectDocument, redirects } from './build.mjs';

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8' };
export function createSiteServer({ root = projectRoot } = {}) {
  return createServer(async (request, response) => {
    let path;
    try { path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
    catch { response.writeHead(400); response.end('Bad request'); return; }
    // Serve both domain-root previews and the GitHub Pages /page/ deployment path.
    if (path === '/page') { response.writeHead(302, { Location: '/page/' }); response.end(); return; }
    if (path.startsWith('/page/')) path = path.slice(5);
    const route = path.replace(/^\//, '').replace(/\/$|\.html$/g, '');
    if (redirects[route]) {
      response.writeHead(200, { 'Content-Type': types['.html'] });
      response.end(redirectDocument(path.endsWith('/') ? `../${redirects[route]}` : `./${redirects[route]}`));
      return;
    }
    if (path === '/') path = '/index.html';
    // Expose only public files, never Git data, tests, archives, or build scripts.
    if (!(/^\/(index\.html|404\.html|styles\.css|app\.js|robots\.txt|sitemap\.xml)$/.test(path) || /^\/assets\/(photos|design)\/[^/]+$/.test(path))) {
      response.writeHead(404, { 'Content-Type': types['.html'] });
      response.end(await readFile(resolve(root, '404.html'))); return;
    }
    const file = resolve(root, `.${path}`);
    if (!file.startsWith(resolve(root) + sep)) { response.writeHead(403); response.end('Forbidden'); return; }
    try {
      const info = await stat(file);
      if (!info.isFile()) throw new Error('Not a file');
      const data = await readFile(file);
      response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
      response.end(data);
    } catch {
      response.writeHead(404, { 'Content-Type': types['.html'] });
      response.end(await readFile(resolve(root, '404.html')));
    }
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createSiteServer({ root: process.argv.includes('--dist') ? resolve(projectRoot, 'dist') : projectRoot });
  const port = Number(process.env.PORT || 4173);
  server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}/page/`));
}

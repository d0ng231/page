import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { build } from '../scripts/build.mjs';
import { createSiteServer } from '../scripts/serve.mjs';

await test('Production site is complete, subpath-safe, and contains no private source', async t => {
  const temporary = await mkdtemp(join(tmpdir(), 'matt-page-'));
  const output = join(temporary, 'dist');
  t.after(() => rm(temporary, { recursive: true, force: true }));
  await build(output);
  const html = await readFile(join(output, 'index.html'), 'utf8');
  for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    const reference = match[1];
    if (/^(https?:|mailto:)/.test(reference)) continue;
    await access(join(output, reference));
  }
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
  for (const match of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(match[1]), `Missing anchor ${match[1]}`);
  for (const privatePath of ['.git', '.qa', 'archive', 'scripts', 'tests', 'package.json', 'assets/images']) {
    await assert.rejects(access(join(output, privatePath)));
  }
  const font = await readFile(join(output, 'assets/design/manrope-latin.woff2'));
  assert.equal(font.subarray(0, 4).toString(), 'wOF2');
  for (const route of ['about', 'research', 'projects', 'gallery']) {
    const redirected = await readFile(join(output, route, 'index.html'), 'utf8');
    assert.match(redirected, /url=\.\.\/#/);
    const flat = await readFile(join(output, `${route}.html`), 'utf8');
    assert.match(flat, /url=\.\/#/);
  }
  const server = createSiteServer({ root: output });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const path of ['/', '/page/', '/page/styles.css', '/page/app.js', '/page/assets/photos/chongqing.jpg', '/page/assets/design/social-card.png', '/page/about/', '/page/research.html']) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200, `Expected public resource ${path}`);
  }
  for (const path of ['/.git/config', '/archive/indigo/_config.yml', '/scripts/serve.mjs', '/not-a-page', '/page/assets/design/../../package.json']) {
    const response = await fetch(base + path);
    assert.equal(response.status, 404, `Should not expose ${path}`);
    assert.match(await response.text(), /This page has moved/);
  }
  assert.equal((await fetch(base + '/%E0%A4%A')).status, 400);
  assert.match((await fetch(base + '/page/styles.css')).headers.get('content-type'), /text\/css/);
  assert.match((await fetch(base + '/page/app.js')).headers.get('content-type'), /javascript/);
  assert.match((await fetch(base + '/page/assets/design/manrope-latin.woff2')).headers.get('content-type'), /font\/woff2/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { access, appendFile, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
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
  for (const [, set] of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const candidate of set.split(',')) await access(join(output, candidate.trim().split(/\s+/)[0]));
  }
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
  for (const match of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(match[1]), `Missing anchor ${match[1]}`);
  for (const privatePath of ['.git', '.qa', 'archive', 'scripts', 'tests', 'package.json', 'assets/images']) {
    await assert.rejects(access(join(output, privatePath)));
  }
  const font = await readFile(join(output, 'assets/design/manrope-latin.woff2'));
  assert.equal(font.subarray(0, 4).toString(), 'wOF2');
  const expectedLinks = {
    work: ['work', 'research', 'projects', 'blog', 'tags', 'ISMRM-2024-uncertainty'],
    demo: ['demo', 'demos'], photos: ['photos', 'photography', 'gallery'], about: ['about'],
  };
  const navigation = html.match(/<nav\b[^>]*>([\s\S]*?)<\/nav>/)[1];
  assert.deepEqual([...navigation.matchAll(/href="([^"]+)"/g)].map(match => match[1]), ['#work', '#demo', '#photos']);
  for (const [oldId, section] of [['research', 'work'], ['demos', 'demo'], ['photography', 'photos']]) {
    const body = html.match(new RegExp(`<section[^>]* id="${section}"[^>]*>([\\s\\S]*?)</section>`))[1];
    assert.ok(body.includes(`id="${oldId}" data-legacy-anchor`));
  }
  const documents = [html, await readFile(join(output, '404.html'), 'utf8')];
  for (const [section, routes] of Object.entries(expectedLinks)) {
    assert.ok(ids.has(section));
    for (const route of routes) {
      for (const file of [route + '/index.html', route + '.html']) {
        const doc = await readFile(join(output, file), 'utf8');
        const from = new URL(file, 'https://example.org/page/');
        const expected = 'https://example.org/page/#' + section;
        const refresh = doc.match(/http-equiv="refresh" content="0;url=([^"]+)"/)[1];
        const fallback = doc.match(/<a href="([^"]+)"/)[1];
        assert.equal(new URL(refresh, from).href, expected);
        assert.equal(new URL(fallback, from).href, expected);
        documents.push(doc);
      }
    }
  }
  for (const doc of documents) {
    const policy = doc.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/)[1];
    assert.ok(doc.indexOf(policy) < doc.indexOf('<script'));
    for (const rule of ["default-src 'none'", "script-src 'self'", "style-src 'self'", "base-uri 'none'", "form-action 'none'"]) {
      assert.ok(policy.split('; ').includes(rule));
    }
    assert.doesNotMatch(policy, /unsafe-|\*/);
    assert.match(doc, /<meta name="referrer" content="no-referrer">/);
    assert.doesNotMatch(doc, /<script\b(?![^>]*\bsrc=)|<style\b|\son[a-z]+\s*=|\sstyle\s*=/i);
  }
  const server = createSiteServer({ root: output });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const path of ['/', '/page/', '/page/styles.css', '/page/theme.js', '/page/app.js', '/page/assets/photos/chongqing.jpg', '/page/assets/design/social-card.png', '/page/photos/', '/page/about/', '/page/research.html']) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200, `Expected public resource ${path}`);
  }
  for (const path of ['/.git/config', '/archive/indigo/_config.yml', '/scripts/serve.mjs', '/not-a-page', '/page/assets/design/../../package.json', '/page/__proto__', '/page/constructor/', '/toString.html', '/page/assets/photos/%2e%2e%2f%2e%2e%2fpackage.json']) {
    const response = await fetch(base + path);
    assert.equal(response.status, 404, `Should not expose ${path}`);
    assert.match(await response.text(), /Page not found/);
  }
  assert.equal((await fetch(base + '/%E0%A4%A')).status, 400);
  assert.match((await fetch(base + '/page/styles.css')).headers.get('content-type'), /text\/css/);
  assert.match((await fetch(base + '/page/app.js')).headers.get('content-type'), /javascript/);
  assert.match((await fetch(base + '/page/assets/design/manrope-latin.woff2')).headers.get('content-type'), /font\/woff2/);
  assert.equal((await fetch(base + '/page/', { method: 'POST' })).status, 405);
});

await test('Only referenced photos and approved regular files can be served or published', async t => {
  const temporary = await mkdtemp(join(tmpdir(), 'matt-page-assets-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const source = await build(join(temporary, 'source'));
  const output = join(temporary, 'second-build');
  const privateFile = join(temporary, 'private-fixture');
  await writeFile(privateFile, 'unpublished test fixture');
  await appendFile(join(source, 'index.html'), '<!-- <img src="assets/photos/unpublished.jpg"> -->');
  for (const name of ['assets/photos/.notes', 'assets/photos/unpublished.jpg', 'assets/design/notes.txt']) {
    await writeFile(join(source, name), 'unpublished test fixture');
  }
  await build(output, source);
  const server = createSiteServer({ root: source });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  const origin = 'http://127.0.0.1:' + server.address().port + '/page/';
  for (const name of ['assets/photos/.notes', 'assets/photos/unpublished.jpg', 'assets/design/notes.txt']) {
    await assert.rejects(access(join(output, name)), { code: 'ENOENT' });
    assert.equal((await fetch(origin + name)).status, 404);
  }
  const approved = 'assets/photos/chongqing.jpg';
  await rm(join(source, approved));
  await symlink(privateFile, join(source, approved));
  assert.equal((await fetch(origin + approved)).status, 404);
  await assert.rejects(build(output, source), /Refusing a linked or external site file/);
});

import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const redirects = {
  about: '#about', research: '#research', projects: '#research', gallery: '#photography', blog: '#research', tags: '#research',
  'ISMRM-2024-uncertainty': '#research',
};
export function redirectDocument(destination) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=${destination}"><title>Matt Li — This page has moved</title><body style="background:#f8f8f7;color:#20201f;font:14px system-ui;padding:10vw"><p>This page has moved.</p><a style="color:inherit" href="${destination}">Continue to Matt Li’s website →</a></body></html>`;
}
export async function build(output = join(projectRoot, 'dist')) {
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  for (const name of ['index.html', 'styles.css', 'app.js', '404.html', 'robots.txt', 'sitemap.xml', '.nojekyll']) await cp(join(projectRoot, name), join(output, name));
  await cp(join(projectRoot, 'assets/photos'), join(output, 'assets/photos'), { recursive: true });
  await cp(join(projectRoot, 'assets/design'), join(output, 'assets/design'), { recursive: true });
  for (const [route, hash] of Object.entries(redirects)) {
    await mkdir(join(output, route), { recursive: true });
    await writeFile(join(output, route, 'index.html'), redirectDocument(`../${hash}`));
    await writeFile(join(output, `${route}.html`), redirectDocument(`./${hash}`));
  }
  const index = await readFile(join(output, 'index.html'), 'utf8');
  if (index.includes('site.url') || index.includes('layout:')) throw new Error('Legacy Jekyll markup found in production HTML.');
  console.log(`Built static site in ${output}`);
  return output;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build();

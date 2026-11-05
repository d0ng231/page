import { constants } from 'node:fs';
import { mkdir, open, realpath, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const redirects = new Map([
  ['work', 'work'], ['demo', 'demo'], ['photos', 'photos'], ['about', 'about'],
  ['research', 'work'], ['projects', 'work'], ['blog', 'work'], ['tags', 'work'],
  ['ISMRM-2024-uncertainty', 'work'], ['demos', 'demo'], ['gallery', 'photos'], ['photography', 'photos'],
]);

export function redirectDocument(route, inDirectory) {
  const section = redirects.get(route);
  if (!section) throw new Error('Unknown section link');
  const prefix = inDirectory ? '../' : './';
  const destination = prefix + '#' + section;
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; base-uri 'none'; form-action 'none'">
  <meta name="referrer" content="no-referrer">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark light">
  <meta name="theme-color" content="#141414">
  <meta name="robots" content="noindex">
  <meta http-equiv="refresh" content="0;url=${destination}">
  <title>Matt Li — This page has moved</title>
  <script src="${prefix}theme.js"></script>
  <link rel="stylesheet" href="${prefix}styles.css">
</head>
<body class="notice">
  <main><a href="${destination}">Continue to Matt Li’s website</a></main>
</body>
</html>`;
}

export function publicFiles(index) {
  const files = new Set([
    'index.html', '404.html', 'styles.css', 'theme.js', 'app.js', 'robots.txt', 'sitemap.xml', '.nojekyll',
    'assets/design/favicon.svg', 'assets/design/social-card.png', 'assets/design/social-card.svg',
    'assets/design/manrope-latin.woff2', 'assets/design/Manrope-OFL.txt',
    // Published photo links from the original gallery are still in use.
    'assets/photos/chongqing.jpg', 'assets/photos/chongqing-small.jpg',
    'assets/photos/urban-layers.jpg', 'assets/photos/urban-layers-small.jpg',
  ]);
  const markup = index.replace(/<!--[\s\S]*?-->/g, '');
  const attributes = markup.matchAll(/\s(?:href|src|srcset)\s*=\s*(["'])([^<>]*?)\1/g);
  for (const [, , value] of attributes) {
    for (const [, photo] of value.matchAll(/(?:^|,\s*)(assets\/photos\/[a-z0-9-]+\.jpg)(?=$|[\s,])/g)) {
      files.add(photo);
    }
  }
  return files;
}

// The build and preview use the same boundary, including for a linked parent directory.
export async function readSiteFile(root, relative) {
  const file = join(root, relative);
  if (!file.startsWith(root + sep) || await realpath(file) !== file) {
    throw new Error(`Refusing a linked or external site file: ${relative}`);
  }
  const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    if (!(await handle.stat()).isFile()) throw new Error(`Expected a regular file: ${relative}`);
    return await handle.readFile();
  } finally {
    await handle.close();
  }
}

export async function build(output = join(projectRoot, 'dist'), source = projectRoot) {
  const root = await realpath(source);
  const index = (await readSiteFile(root, 'index.html')).toString('utf8');
  if (index.includes('site.url') || index.includes('layout:')) throw new Error('Legacy Jekyll markup found in production HTML.');
  await rm(output, { recursive: true, force: true });
  await mkdir(join(output, 'assets/photos'), { recursive: true });
  await mkdir(join(output, 'assets/design'), { recursive: true });
  for (const file of publicFiles(index)) {
    const data = file === 'index.html' ? index : await readSiteFile(root, file);
    await writeFile(join(output, file), data);
  }
  for (const route of redirects.keys()) {
    await mkdir(join(output, route));
    await writeFile(join(output, route, 'index.html'), redirectDocument(route, true));
    await writeFile(join(output, `${route}.html`), redirectDocument(route, false));
  }
  console.log(`Built static site in ${output}`);
  return output;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build();

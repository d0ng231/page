# Matt Li · page

A minimal, mostly monochrome personal site for Matt (Chenjun) Li. Plain HTML, CSS, and JavaScript with a self-hosted font; no packages, analytics, or backend are required.

## Local preview

Node.js 20 or newer:

```sh
npm run dev
npm test
npm run build
npm run preview
```

Open `http://127.0.0.1:4173/page/`. The root URL also works. Without npm, use `node scripts/serve.mjs`, `node --test tests/*.test.mjs`, and `node scripts/build.mjs`. The page also works as a local HTML file; clipboard support depends on the browser context.

## Content and design

- `index.html`: biography, five projects, demo links, background, and curated photographs. Research content was checked against the CV updated October 29, 2026. Under-review papers are labeled accordingly.
- `styles.css`: compact responsive layout, light/dark themes, subtle hover feedback, and reduced-motion support.
- `app.js`: theme preference, copyable local-demo command, and keyboard-accessible photo viewer.
- `assets/photos/`: optimized copies exported from the user's Photos favorites. Full compositions are retained. Web exports omit EXIF and location metadata; library originals are unchanged.
- `assets/design/`: Manrope font and OFL license, favicon, social card.
- `archive/indigo/`: preserved original Jekyll source, excluded from publication.

MELD links to its existing hosted demo. GFT is a local demo requiring installation, a checkpoint, and data. No hosted GFT endpoint or Overjet demo is implied. A reachable demo page does not verify its inference backend.

Photograph names are editorial labels. The faint `© Matt Li` watermark is a website overlay on each thumbnail and enlarged view; it is not burned into the image file. When adding images, preserve their aspect ratio, add descriptive alternative text, and include the watermark in the same image wrapper. Only add approved website derivatives to `assets/photos/` because the build copies that directory.

The latest CV's phone number and private Google Doc URL are not included in the public site. Update project links and paper statuses as needed. The archived theme retains historical sources and links but is not served.

## Accessibility

All primary content and local-demo instructions are available without JavaScript. Themes persist when local storage is available. Photo dialogs support Escape, arrow keys, focus trapping, and return focus to the selected thumbnail. No continuous animation runs. Reduced-motion preferences disable the small transitions.

## GitHub Pages

Repository: https://github.com/d0ng231/page

The included workflow tests and builds the `matt` branch, then publishes only `dist/`. In repository Settings → Pages, choose GitHub Actions. Pull requests run checks without deployment. Changes to the live site are published after a successful push and workflow run.

Public URL: `https://d0ng231.github.io/page/`. If the repository or domain changes, update the canonical/social URLs, `robots.txt`, `sitemap.xml`, and `404.html`. GitHub repository redirects do not redirect the former Pages path `/web/`.

Old section routes (`about`, `research`, `projects`, `gallery`, `blog`, `tags`) redirect to the relevant anchors. The preview server only exposes website files, not private working material, original exports, tests, or the archive.

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

Open `http://127.0.0.1:4173/page/`. The root URL also works. Without npm, use `node scripts/serve.mjs`, `node --test tests/*.test.mjs`, and `node scripts/build.mjs`. The page also works as a local HTML file.

## Content and design

- `index.html`: biography, five projects, the MELD demo, background, and a photography gallery. Research content was checked against the CV updated October 29, 2026. Under-review papers are labeled accordingly.
- `styles.css`: compact responsive layout, light/dark themes, subtle hover feedback, and reduced-motion support.
- `theme.js` restores the saved theme before the first paint. `app.js` handles the theme switch, gallery, photo viewer, and older section bookmarks.
- `assets/photos/`: responsive web copies of photographs selected by Matt from Apple Photos and his edited files. Full compositions, borders, and collages are retained. Large images use up to 2400 pixels on the long edge, without upscaling; thumbnails use up to 720 pixels in width. Web exports omit EXIF and location metadata; library originals are unchanged. The previous four image URLs remain available for existing links.
- `assets/design/`: Manrope font and OFL license, favicon, social card.
- `archive/indigo/`: preserved original Jekyll source, excluded from publication.

The Demo section links to MELD. GFT appears in Selected work.

Photographs have English titles. Years come from the saved photograph or its reference series. Captions include a city, park, or region when supported by Photos, the original series, or visible place signage. The faint `© Matt Li` watermark is a website overlay on each thumbnail and enlarged view; it is not burned into the image file. Its color follows the photograph's border, independently of the site theme. Six images appear initially, with a button to reveal the whole gallery. All photographs are accessible without JavaScript. When adding images, preserve their aspect ratio, add descriptive alternative text, and include the watermark in the same image wrapper. The build publishes the referenced JPEGs and four explicitly listed legacy images.

The homepage introduction uses the user-supplied forest photograph, showing Matt from behind, as its only personal portrait. Preserve its full composition and colors; do not add a front-facing portrait. The unwatermarked portrait appears beside the introduction on larger screens and above the name on phones. Its responsive web copies also omit private metadata.

The latest CV's phone number and private Google Doc URL are not included in the public site. Update project links and paper statuses as needed. The archived theme retains historical sources and links but is not served.

## Accessibility

All primary content is available without JavaScript. The site opens in dark mode and remembers a visitor's theme choice when local storage is available. Photo dialogs support Escape, arrow keys, focus trapping, and return focus to the selected thumbnail. No continuous animation runs. Reduced-motion preferences disable the small transitions.

## GitHub Pages

Repository: https://github.com/d0ng231/page

The included workflow tests and builds the `matt` branch, then publishes only `dist/`. In repository Settings → Pages, choose GitHub Actions. Pull requests run checks without deployment. Changes to the live site are published after a successful push and workflow run. A newer push supersedes an unfinished deployment for the same branch, so an outdated queued version does not block the latest update.

Public URL: `https://d0ng231.github.io/page/`. If the repository or domain changes, update the canonical/social URLs, `robots.txt`, `sitemap.xml`, and `404.html`. GitHub repository redirects do not redirect the former Pages path `/web/`.

The navigation uses three shareable anchors: `#work`, `#demo`, and `#photos`. The corresponding short paths (`/page/work/`, `/page/demo/`, and `/page/photos/`) open those same sections. Previous section paths, their `.html` forms, and the former homepage anchors still work.

The build and preview share a list of publishable files and reject symbolic links. The homepage, redirects, and 404 page use a Content Security Policy that allows local scripts, styles, fonts, and images and blocks form submissions and background network requests. The release workflow pins its actions to commit SHAs. Only the deployment job can publish to Pages.

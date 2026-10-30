const root = document.documentElement;
const themeToggle = document.querySelector('.theme-toggle');
function syncTheme() {
  const dark = root.dataset.theme === 'dark';
  themeToggle.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
  themeToggle.title = `Switch to ${dark ? 'light' : 'dark'} theme`;
  document.querySelector('meta[name="theme-color"]').content = dark ? '#141414' : '#f8f8f7';
}
themeToggle.hidden = false;
syncTheme();
themeToggle.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('matt-theme', root.dataset.theme); } catch {}
  syncTheme();
});
document.querySelector('#year').textContent = new Date().getFullYear();
const copyButton = document.querySelector('.copy-command');
copyButton.hidden = false;
copyButton.addEventListener('click', async () => {
  const command = document.querySelector('.command code').textContent;
  const feedback = document.querySelector('.copy-feedback');
  try {
    await navigator.clipboard.writeText(command);
    feedback.textContent = 'Command copied.';
  } catch {
    feedback.textContent = 'Select and copy the command above.';
    const range = document.createRange();
    range.selectNodeContents(document.querySelector('.command code'));
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
});
const photos = [...document.querySelectorAll('.photo a')];
const galleryToggle = document.querySelector('.gallery-toggle');
const previewCount = 6;
if (galleryToggle && photos.length > previewCount) {
  galleryToggle.hidden = false;
  function setGalleryExpanded(expanded) {
    photos.forEach((photo, index) => { photo.closest('figure').hidden = !expanded && index >= previewCount; });
    galleryToggle.setAttribute('aria-expanded', String(expanded));
    galleryToggle.innerHTML = expanded
      ? 'Show fewer photographs <span aria-hidden="true">−</span>'
      : `View all ${photos.length} photographs <span aria-hidden="true">↗</span>`;
  }
  setGalleryExpanded(false);
  galleryToggle.addEventListener('click', () => {
    const expanded = galleryToggle.getAttribute('aria-expanded') !== 'true';
    setGalleryExpanded(expanded);
    if (!expanded) galleryToggle.scrollIntoView({ block: 'nearest' });
  });
}
const lightbox = document.querySelector('.lightbox');
const largeImage = document.querySelector('#lightbox-image');
let activePhoto = 0;
let opener = null;
function showPhoto(index) {
  activePhoto = (index + photos.length) % photos.length;
  const link = photos[activePhoto];
  const thumbnail = link.querySelector('img');
  largeImage.src = link.href;
  largeImage.alt = thumbnail.alt;
  largeImage.closest('.lightbox-photo').dataset.watermark = link.dataset.watermark;
  document.querySelector('#lightbox-title').textContent = [...link.closest('figure').querySelectorAll('figcaption span')].map(span => span.textContent).join(' · ');
  document.querySelector('#lightbox-count').textContent = `${String(activePhoto + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`;
}
photos.forEach((photo, index) => photo.addEventListener('click', event => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || typeof lightbox.showModal !== 'function') return;
  event.preventDefault();
  opener = photo;
  showPhoto(index);
  lightbox.showModal();
}));
document.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
document.querySelector('.photo-prev').addEventListener('click', () => showPhoto(activePhoto - 1));
document.querySelector('.photo-next').addEventListener('click', () => showPhoto(activePhoto + 1));
lightbox.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); showPhoto(activePhoto - 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); showPhoto(activePhoto + 1); }
});
lightbox.addEventListener('close', () => opener?.focus({ preventScroll: true }));

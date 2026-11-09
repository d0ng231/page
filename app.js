const root = document.documentElement;
const themeToggle = document.querySelector('.theme-toggle');
function syncTheme() {
  const dark = root.dataset.theme === 'dark';
  themeToggle.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
  themeToggle.title = `Switch to ${dark ? 'light' : 'dark'} theme`;
  document.querySelector('meta[name="theme-color"]').content = dark ? '#0d0e0f' : '#f8f8f7';
}
themeToggle.hidden = false;
syncTheme();
themeToggle.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('matt-theme', root.dataset.theme); } catch {}
  syncTheme();
});
document.querySelector('#year').textContent = new Date().getFullYear();
const photos = [...document.querySelectorAll('.photo a')];
const galleryToggle = document.querySelector('.gallery-toggle');
const morePhotos = document.getElementById('more-photos');
if (galleryToggle && morePhotos?.childElementCount) {
  morePhotos.hidden = true;
  galleryToggle.hidden = false;
  galleryToggle.addEventListener('click', () => {
    const expanded = morePhotos.hidden;
    morePhotos.hidden = !expanded;
    galleryToggle.setAttribute('aria-expanded', String(expanded));
    galleryToggle.querySelector('.gallery-label').textContent = expanded
      ? 'Show fewer photographs' : `View all ${photos.length} photographs`;
    galleryToggle.querySelector('[aria-hidden]').textContent = expanded ? '−' : '↗';
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

function followLegacyAnchor() {
  const anchor = document.getElementById(location.hash.slice(1));
  if (anchor?.hasAttribute('data-legacy-anchor')) {
    location.replace('#' + anchor.closest('section').id);
  }
}
window.addEventListener('hashchange', followLegacyAnchor);
followLegacyAnchor();

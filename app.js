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
const title = document.querySelector('#lightbox-title');
const count = document.querySelector('#lightbox-count');
const portrait = document.querySelector('.portrait-link');
const portraitImage = portrait.querySelector('img');
const mount = portrait.closest('.intro-portrait');
const pointerTilt = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let activePhoto = null;
let opener = null;

function levelPortrait() {
  portrait.style.removeProperty('--pitch');
  portrait.style.removeProperty('--yaw');
}
mount.addEventListener('pointermove', event => {
  if (!pointerTilt.matches || event.pointerType === 'touch') return;
  const bounds = mount.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width - .5;
  const y = (event.clientY - bounds.top) / bounds.height - .5;
  portrait.style.setProperty('--pitch', `${-4 * y}deg`);
  portrait.style.setProperty('--yaw', `${5 * x}deg`);
});
mount.addEventListener('pointerleave', levelPortrait);
mount.addEventListener('pointercancel', levelPortrait);
pointerTilt.addEventListener('change', levelPortrait);

function showGalleryPhoto(index) {
  activePhoto = (index + photos.length) % photos.length;
  const link = photos[activePhoto];
  largeImage.src = link.href;
  largeImage.alt = link.querySelector('img').alt;
  largeImage.closest('.lightbox-photo').dataset.watermark = link.dataset.watermark;
  title.textContent = [...link.closest('figure').querySelectorAll('figcaption span')].map(span => span.textContent).join(' · ');
  count.textContent = `${String(activePhoto + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`;
}

function showPortrait() {
  activePhoto = null;
  title.textContent = 'Matt in the forest';
  count.textContent = '';
  largeImage.alt = portraitImage.alt;
  largeImage.src = portraitImage.currentSrc || portraitImage.src;
  if (largeImage.src === portrait.href) return;
  const full = new Image();
  full.onload = () => {
    if (activePhoto === null) largeImage.src = full.src;
  };
  full.src = portrait.href;
}

function changeViewer(update) {
  if (activePhoto === null && !reducedMotion.matches && document.startViewTransition) {
    document.startViewTransition(update);
  } else {
    update();
  }
}

function openPhoto(event, index) {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || typeof lightbox.showModal !== 'function') return;
  event.preventDefault();
  opener = event.currentTarget;
  lightbox.toggleAttribute('data-portrait', index === null);
  if (index === null) showPortrait();
  else showGalleryPhoto(index);
  changeViewer(() => lightbox.showModal());
}
portrait.addEventListener('click', event => openPhoto(event, null));
photos.forEach((photo, index) => photo.addEventListener('click', event => openPhoto(event, index)));

function closePhoto() { changeViewer(() => lightbox.close()); }
document.querySelector('.lightbox-close').addEventListener('click', closePhoto);
lightbox.addEventListener('cancel', event => {
  if (activePhoto === null) {
    event.preventDefault();
    closePhoto();
  }
});
document.querySelector('.photo-prev').addEventListener('click', () => showGalleryPhoto(activePhoto - 1));
document.querySelector('.photo-next').addEventListener('click', () => showGalleryPhoto(activePhoto + 1));
lightbox.addEventListener('keydown', event => {
  if (activePhoto === null) return;
  if (event.key === 'ArrowLeft') { event.preventDefault(); showGalleryPhoto(activePhoto - 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); showGalleryPhoto(activePhoto + 1); }
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

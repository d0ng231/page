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
const lightbox = document.querySelector('.lightbox');
const largeImage = document.querySelector('#lightbox-image');
const imageFrame = largeImage.closest('.lightbox-photo');
const title = document.querySelector('#lightbox-title');
const count = document.querySelector('#lightbox-count');
const portrait = document.querySelector('.portrait-link');
const mount = portrait.closest('.intro-portrait');
const pointerTilt = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let activePhoto = null;
let opener = null;
let imageRequest = 0;

new ResizeObserver(() => {
  if (lightbox.open) {
    lightbox.style.setProperty('--caption-height', `${Math.ceil(title.getBoundingClientRect().height)}px`);
  }
}).observe(title);

function loadPhoto(link, caption) {
  const request = ++imageRequest;
  const thumbnail = link.querySelector('img');
  const width = Number(thumbnail.getAttribute('width'));
  const height = Number(thumbnail.getAttribute('height'));
  const full = new Image();
  let fullFailed = false;
  const previewReady = thumbnail.complete && thumbnail.naturalWidth > 0;

  lightbox.style.setProperty('--photo-ratio', String(width / height));
  lightbox.style.setProperty('--photo-width', `${width}px`);
  largeImage.width = width;
  largeImage.height = height;
  largeImage.alt = thumbnail.alt;
  imageFrame.setAttribute('aria-busy', String(!previewReady));
  title.textContent = previewReady ? caption : `${caption} · Loading…`;

  function imageUnavailable() {
    if (request !== imageRequest) return;
    imageFrame.setAttribute('aria-busy', 'false');
    title.textContent = `${caption} · Image unavailable. Please try again.`;
  }
  largeImage.onload = () => {
    if (request !== imageRequest) return;
    imageFrame.setAttribute('aria-busy', 'false');
    title.textContent = caption;
  };
  largeImage.onerror = () => {
    if (fullFailed) imageUnavailable();
  };
  full.onload = () => {
    if (request !== imageRequest) return;
    largeImage.src = full.src;
  };
  full.onerror = () => {
    fullFailed = true;
    if (largeImage.complete && !largeImage.naturalWidth) imageUnavailable();
  };
  largeImage.src = thumbnail.currentSrc || thumbnail.src;
  full.src = link.href;
}

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
  imageFrame.dataset.watermark = link.dataset.watermark;
  const caption = [...link.closest('figure').querySelectorAll('figcaption span')].map(span => span.textContent).join(' · ');
  loadPhoto(link, caption);
  count.textContent = `${String(activePhoto + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`;
}

function showPortrait() {
  activePhoto = null;
  count.textContent = '';
  loadPhoto(portrait, 'Matt in the forest');
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
lightbox.addEventListener('close', () => {
  imageRequest++;
  opener?.focus({ preventScroll: true });
});

function followLegacyAnchor() {
  const anchor = document.getElementById(location.hash.slice(1));
  if (anchor?.hasAttribute('data-legacy-anchor')) {
    location.replace('#' + anchor.closest('section').id);
  }
}
window.addEventListener('hashchange', followLegacyAnchor);
followLegacyAnchor();

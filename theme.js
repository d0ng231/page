try {
  if (localStorage.getItem('matt-theme') === 'light') {
    document.documentElement.dataset.theme = 'light';
    document.querySelector('meta[name="theme-color"]').content = '#f8f8f7';
  }
} catch {
  // The HTML already selects dark mode when storage is unavailable.
}

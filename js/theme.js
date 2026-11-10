const colorSchemePreference = window.matchMedia('(prefers-color-scheme: light)');
const themeColor = document.querySelector('meta[name="theme-color"]');

function applySystemTheme(event) {
  const isLight = event.matches;
  document.documentElement.dataset.theme = isLight ? 'light' : 'dark';
  themeColor?.setAttribute('content', isLight ? '#F6F4EF' : '#101827');
}

applySystemTheme(colorSchemePreference);
colorSchemePreference.addEventListener('change', applySystemTheme);

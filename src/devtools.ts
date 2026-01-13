// Register MockAPI panel in DevTools
chrome.devtools.panels.create(
  'MockAPI',
  '', // No icon path for now, will use default
  'popup.html',
  () => {
    // eslint-disable-next-line no-console
    console.log('[MockAPI] DevTools panel created');
  }
);

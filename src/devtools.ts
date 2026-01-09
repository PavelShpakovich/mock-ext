// Register MockAPI panel in DevTools
chrome.devtools.panels.create(
  'MockAPI',
  '', // No icon path for now, will use default
  'popup.html',
  () => {
    console.log('[MockAPI] DevTools panel created');
  }
);

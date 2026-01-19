// Register Moq panel in DevTools
chrome.devtools.panels.create(
  'Moq',
  '', // No icon path for now, will use default
  'popup.html',
  () => {
    // eslint-disable-next-line no-console
    console.log('[Moq] DevTools panel created');
  }
);

// Listen for messages from background to show DevTools prompt
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'openDevTools') {
    showDevToolsPrompt(message.language || 'en', message.theme || 'system');
  }
});

const translations = {
  en: {
    title: 'Open DevTools',
    message: 'to open DevTools and access MockAPI panel',
    gotIt: 'Got it',
  },
  ru: {
    title: 'Открыть DevTools',
    message: 'чтобы открыть DevTools и получить доступ к панели MockAPI',
    gotIt: 'Понятно',
  },
};

function showDevToolsPrompt(language: string = 'en', theme: string = 'system') {
  const t = translations[language as keyof typeof translations] || translations.en;
  // Remove any existing prompt
  const existing = document.getElementById('mockapi-devtools-prompt');
  if (existing) {
    existing.remove();
  }

  // Resolve theme: if 'system', detect system preference
  const isDark = theme === 'system' ? window.matchMedia('(prefers-color-scheme: dark)').matches : theme === 'dark';

  // Theme-aware colors
  const bgGradient = isDark
    ? 'linear-gradient(135deg, #111827 0%, #1f2937 100%)'
    : 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)';
  const borderColor = isDark ? '#10b981' : '#10b981';
  const textColor = isDark ? 'white' : '#111827';
  const titleColor = isDark ? '#10b981' : '#059669';
  const boxShadow = isDark
    ? '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(16, 185, 129, 0.2)'
    : '0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(16, 185, 129, 0.3)';
  const shortcutBg = isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)';
  const shortcutColor = isDark ? '#10b981' : '#059669';
  const dismissColor = isDark ? '#9ca3af' : '#6b7280';

  // Create prompt overlay
  const overlay = document.createElement('div');
  overlay.id = 'mockapi-devtools-prompt';
  overlay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${bgGradient};
    border: 1px solid ${borderColor};
    color: ${textColor};
    padding: 20px 24px;
    border-radius: 12px;
    box-shadow: ${boxShadow};
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    max-width: 320px;
    animation: slideInRight 0.3s ease-out;
  `;

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const shortcut = isMac ? '⌥⌘I' : 'Ctrl+Shift+I';

  overlay.innerHTML = `
    <div style="display: flex; align-items: start; gap: 12px;">
      <div style="flex: 1;">
        <div style="font-weight: 600; margin-bottom: 8px; font-size: 15px; color: ${titleColor};">
          ${t.title}
        </div>
        <div style="opacity: 0.95; margin-bottom: 12px;">
          <span style="margin-right: 4px;">${
            language === 'ru' ? 'Нажмите' : 'Press'
          }</span><strong style="background: ${shortcutBg}; padding: 2px 8px; border-radius: 4px; font-family: monospace; color: ${shortcutColor};">${shortcut}</strong><span style="margin-left: 4px;">${
            t.message
          }</span>
        </div>
        <button id="mockapi-prompt-close" style="
          background: #10b981;
          border: none;
          color: white;
          padding: 6px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: background 0.2s;
        ">${t.gotIt}</button>
      </div>
      <button id="mockapi-prompt-dismiss" style="
        background: none;
        border: none;
        color: ${dismissColor};
        cursor: pointer;
        font-size: 20px;
        padding: 0;
        line-height: 1;
        opacity: 0.7;
        transition: opacity 0.2s;
      ">×</button>
    </div>
  `;

  // Add animation keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(overlay);

  // Add hover effect to buttons
  const closeBtn = overlay.querySelector('#mockapi-prompt-close') as HTMLElement;
  const dismissBtn = overlay.querySelector('#mockapi-prompt-dismiss') as HTMLElement;

  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = '#059669';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = '#10b981';
  });

  dismissBtn.addEventListener('mouseenter', () => {
    dismissBtn.style.opacity = '1';
  });
  dismissBtn.addEventListener('mouseleave', () => {
    dismissBtn.style.opacity = '0.7';
  });

  // Remove prompt on click
  const removePrompt = () => {
    overlay.style.animation = 'slideInRight 0.3s ease-out reverse';
    setTimeout(() => overlay.remove(), 300);
  };

  closeBtn.addEventListener('click', removePrompt);
  dismissBtn.addEventListener('click', removePrompt);

  // Auto-remove after 8 seconds
  setTimeout(removePrompt, 8000);
}

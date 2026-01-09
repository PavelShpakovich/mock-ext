import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import { I18nProvider } from './contexts/I18nContext';
import './styles.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <I18nProvider>
      <App />
    </I18nProvider>
  );
}

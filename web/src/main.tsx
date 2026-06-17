import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@tutti-os/ui-system/styles.css';
import { App } from './App';
import { AppLocaleProvider } from './i18n';
import './style.css';
import './styles.css';

if (import.meta.env.DEV) {
  void import('./dev/tuttiExternalMock');
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <AppLocaleProvider>
        <App />
      </AppLocaleProvider>
    </StrictMode>,
  );
}

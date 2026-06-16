import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { I18nProvider, resolveInitialLocale } from './i18n';
import './styles.css';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <I18nProvider locale={resolveInitialLocale()}>
        <App />
      </I18nProvider>
    </StrictMode>,
  );
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@tutti-os/ui-system/styles.css';
import '@tutti-os/ui-rich-text/at-panel/index.css';
import { App } from './App';
import { TuttiExternalMentionServiceRoot } from './components/TuttiExternalMentionServiceRoot';
import { AppLocaleProvider } from './i18n';
import { installTuttiExternalPageDiagnostics } from './lib/tuttiExternalLogs';
import './style.css';
import './styles.css';

if (import.meta.env.DEV) {
  void import('./dev/tuttiExternalMock');
}

installTuttiExternalPageDiagnostics();

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <AppLocaleProvider>
        <TuttiExternalMentionServiceRoot>
          <App />
        </TuttiExternalMentionServiceRoot>
      </AppLocaleProvider>
    </StrictMode>,
  );
}

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import en from './messages/en.json';
import zhCN from './messages/zh-CN.json';

export type Locale = 'en' | 'zh-CN';

type Messages = Record<string, string>;

const catalogs: Record<Locale, Messages> = {
  en,
  'zh-CN': zhCN,
};

function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const normalized = value.trim().replace('_', '-');
  if (normalized.toLowerCase() === 'zh-cn') return 'zh-CN';
  if (normalized.toLowerCase().startsWith('en')) return 'en';
  return null;
}

export function resolveInitialLocale(): Locale {
  const candidates = [...(navigator.languages ?? []), navigator.language, document.documentElement.lang];
  for (const candidate of candidates) {
    const locale = normalizeLocale(candidate);
    if (locale) return locale;
  }
  return 'en';
}

type I18nContextValue = {
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const value = useMemo<I18nContextValue>(() => {
    const translate = (key: string, params: Record<string, string | number> = {}) => {
      const template = catalogs[locale][key] ?? catalogs.en[key] ?? key;
      return template.replace(/\{(\w+)\}/g, (_, name: string) =>
        Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : `{${name}}`,
      );
    };
    return { locale, t: translate };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

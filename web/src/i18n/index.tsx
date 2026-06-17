import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
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

function localeFromAppContextValue(value: unknown): Locale | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.locale === 'string') {
    return normalizeLocale(record.locale);
  }
  if (typeof record.getLocale === 'function') {
    try {
      const localeValue = record.getLocale();
      if (typeof localeValue === 'string') {
        return normalizeLocale(localeValue);
      }
    } catch {
      return null;
    }
  }
  return null;
}

async function localeFromAppContextValueAsync(value: unknown): Promise<Locale | null> {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.locale === 'string') {
    return normalizeLocale(record.locale);
  }
  if (typeof record.get === 'function') {
    try {
      return localeFromAppContextValue(await record.get());
    } catch {
      return null;
    }
  }
  if (typeof record.getLocale === 'function') {
    try {
      const localeValue = await record.getLocale();
      return normalizeLocale(typeof localeValue === 'string' ? localeValue : null);
    } catch {
      return null;
    }
  }
  return localeFromAppContextValue(value);
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

export function AppLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(resolveInitialLocale);

  useEffect(() => {
    let cancelled = false;
    const unsubscribers: Array<() => void> = [];

    const applyLocale = (nextLocale: Locale | null) => {
      if (!nextLocale || cancelled) return;
      setLocale((current) => (current === nextLocale ? current : nextLocale));
    };

    void (async () => {
      const externalApp = window.tuttiExternal?.app;
      if (externalApp?.getContext) {
        try {
          applyLocale(await localeFromAppContextValueAsync(await externalApp.getContext()));
        } catch {
          // Ignore bridge failures and keep the resolved fallback locale.
        }
      }

      if (externalApp?.subscribe) {
        unsubscribers.push(
          externalApp.subscribe((context) => {
            void localeFromAppContextValueAsync(context).then(applyLocale);
          }),
        );
      }

    })();

    return () => {
      cancelled = true;
      for (const unsubscribe of unsubscribers) unsubscribe();
    };
  }, []);

  return <I18nProvider locale={locale}>{children}</I18nProvider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

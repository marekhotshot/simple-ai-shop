export type Locale = 'sk' | 'en';

export function resolveLocale(input: string | undefined): Locale {
  return input === 'en' ? 'en' : 'sk';
}

export function fallbackText(sk: string, en?: string | null, locale: Locale = 'sk'): string {
  if (locale === 'en') {
    // For English locale: prefer English, fallback to Slovak
  if (en && en.trim().length > 0) {
    return en;
  }
  return sk;
  } else {
    // For Slovak locale: prefer Slovak, fallback to English
    if (sk && sk.trim().length > 0) {
      return sk;
    }
    return en || sk;
  }
}

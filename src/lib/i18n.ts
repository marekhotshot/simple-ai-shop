export type Locale = 'sk' | 'en';

export function resolveLocale(input: string | undefined): Locale {
  return input === 'en' ? 'en' : 'sk';
}

export function fallbackText(sk: string, en?: string | null): string {
  if (en && en.trim().length > 0) {
    return en;
  }
  return sk;
}

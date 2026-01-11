'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function LocaleLangUpdater() {
  const pathname = usePathname();
  
  useEffect(() => {
    // Extract locale from pathname (/sk/... or /en/...)
    const localeMatch = pathname.match(/^\/(sk|en)(\/|$)/);
    const locale: string = localeMatch && localeMatch[1] ? localeMatch[1] : 'sk';
    
    // Update the html lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [pathname]);
  
  return null;
}

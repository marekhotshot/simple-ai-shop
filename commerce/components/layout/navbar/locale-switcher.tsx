"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

export function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
  const pathname = usePathname();
  const router = useRouter();

  // Extract path without locale
  const pathWithoutLocale = pathname.replace(/^\/[^/]+/, '') || '/';
  const skPath = `/sk${pathWithoutLocale}`;
  const enPath = `/en${pathWithoutLocale}`;

  return (
    <div className="flex items-center gap-2 text-sm">
      <Link
        href={skPath}
        className={`px-2 py-1 rounded ${
          currentLocale === 'sk'
            ? 'bg-blue-600 text-white'
            : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
        }`}
      >
        SK
      </Link>
      <Link
        href={enPath}
        className={`px-2 py-1 rounded ${
          currentLocale === 'en'
            ? 'bg-blue-600 text-white'
            : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
        }`}
      >
        EN
      </Link>
    </div>
  );
}

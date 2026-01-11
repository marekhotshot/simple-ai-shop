import CartModal from "components/cart/modal";
import { getMenu } from 'lib/express';
import { Menu } from 'lib/express/types';
import Link from "next/link";
import { Suspense } from "react";
import MobileMenu from "./mobile-menu";
import { LocaleSwitcher } from "./locale-switcher";

export async function Navbar({ locale = 'sk' }: { locale?: string }) {
  const menu = await getMenu("next-js-frontend-header-menu");

  return (
    <nav className="relative flex items-center justify-between p-4 lg:px-6">
      <div className="block flex-none md:hidden">
        <Suspense fallback={null}>
          <MobileMenu menu={menu} locale={locale} />
        </Suspense>
      </div>
      <div className="flex w-full items-center justify-between">
        <Link
          href={`/${locale}`}
          prefetch={true}
          className="flex items-center text-xl font-bold text-neutral-900 dark:text-white hover:text-neutral-600 dark:hover:text-neutral-300"
        >
          IgorMraz.com
        </Link>
        
        <ul className="hidden gap-4 text-sm md:flex md:items-center lg:gap-6">
          <li>
            <Link
              href={`/${locale}`}
              prefetch={true}
              className="text-neutral-500 underline-offset-4 hover:text-black hover:underline dark:text-neutral-400 dark:hover:text-neutral-300 whitespace-nowrap"
            >
              {locale === 'en' ? 'Home' : 'Domov'}
            </Link>
          </li>
          <li>
            <Link
              href={`/${locale}/about`}
              prefetch={true}
              className="text-neutral-500 underline-offset-4 hover:text-black hover:underline dark:text-neutral-400 dark:hover:text-neutral-300 whitespace-nowrap"
            >
              {locale === 'en' ? 'About' : 'O umelcovi'}
            </Link>
          </li>
          <li>
            <Link
              href={`/${locale}/shop`}
              prefetch={true}
              className="text-neutral-500 underline-offset-4 hover:text-black hover:underline dark:text-neutral-400 dark:hover:text-neutral-300 whitespace-nowrap"
            >
              {locale === 'en' ? 'Shop' : 'Obchod'}
            </Link>
          </li>
          <li>
            <Link
              href={`/${locale}/custom`}
              prefetch={true}
              className="text-neutral-500 underline-offset-4 hover:text-black hover:underline dark:text-neutral-400 dark:hover:text-neutral-300 whitespace-nowrap"
            >
              {locale === 'en' ? 'Custom' : 'Na mieru'}
            </Link>
          </li>
          <li>
            <Link
              href={`/${locale}/contact`}
              prefetch={true}
              className="text-neutral-500 underline-offset-4 hover:text-black hover:underline dark:text-neutral-400 dark:hover:text-neutral-300 whitespace-nowrap"
            >
              {locale === 'en' ? 'Contact' : 'Kontakt'}
            </Link>
          </li>
          <li>
            <Link
              href={`/${locale}/faq`}
              prefetch={true}
              className="text-neutral-500 underline-offset-4 hover:text-black hover:underline dark:text-neutral-400 dark:hover:text-neutral-300 whitespace-nowrap"
            >
              FAQ
            </Link>
          </li>
        </ul>
        
        <div className="flex items-center gap-3">
          <LocaleSwitcher currentLocale={locale} />
          <CartModal locale={locale} />
        </div>
      </div>
    </nav>
  );
}

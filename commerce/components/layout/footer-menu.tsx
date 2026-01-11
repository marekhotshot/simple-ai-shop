import Link from "next/link";
import { Menu } from 'lib/express/types';

export default function FooterMenu({ menu, locale = 'sk' }: { menu: Menu[]; locale?: string }) {
  const footerLinks = [
    { title: locale === 'sk' ? 'O umelcovi' : 'About the Artist', path: `/${locale}/about` },
    { title: locale === 'sk' ? 'Obchod' : 'Shop', path: `/${locale}/shop` },
    { title: locale === 'sk' ? 'Objednávka na mieru' : 'Custom Order', path: `/${locale}/custom` },
    { title: locale === 'sk' ? 'Kontakt' : 'Contact', path: `/${locale}/contact` },
    { title: 'FAQ', path: `/${locale}/faq` },
    { title: locale === 'sk' ? 'Ochrana súkromia' : 'Privacy', path: `/${locale}/privacy` },
    { title: locale === 'sk' ? 'Obchodné podmienky' : 'Terms', path: `/${locale}/terms` },
    { title: locale === 'sk' ? 'Doprava' : 'Shipping', path: `/${locale}/shipping` },
    { title: locale === 'sk' ? 'Reklamácie' : 'Returns', path: `/${locale}/returns` },
  ];

  return (
    <nav>
      <ul className="flex flex-col gap-2">
        {footerLinks.map((item) => (
          <li key={item.path}>
            <Link
              href={item.path}
              className="hover:text-neutral-900 dark:hover:text-neutral-200"
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

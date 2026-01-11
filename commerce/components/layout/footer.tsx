import FooterMenu from "components/layout/footer-menu";
import { getMenu } from 'lib/express';
import { Suspense } from "react";

const { COMPANY_NAME, SITE_NAME } = process.env;

const translations = {
  sk: {
    shippingTitle: "Doprava",
    shippingText: "Všetky položky sa odosielajú do 3–5 pracovných dní. Objednávky na mieru závisia od zložitosti a sú cenovo odhadnuté individuálne. Všetky zásielky obsahujú sledovanie.",
    returnsTitle: "Reklamácie",
    returnsText: "Kvôli jedinečnej povahe umenia sú reklamácie akceptované len v prípade poškodenia počas prepravy. Prosím, kontaktujte nás do 3 dní od dodania s fotografiami.",
    contactTitle: "Kontakt",
    email: "Email",
    instagram: "Instagram",
    facebook: "Facebook",
    followUs: "Sledujte nás",
    copyright: "© 2026 igormraz.com. Všetky práva vyhradené.",
    createdBy: "Vytvoril Hotshot",
  },
  en: {
    shippingTitle: "Shipping Policy",
    shippingText: "All items ship within 3–5 business days. Custom orders depend on complexity and are quoted individually. All shipments include tracking.",
    returnsTitle: "Returns",
    returnsText: "Due to the unique nature of the art, returns are only accepted in cases of damage during transit. Please contact us within 3 days of delivery with photos.",
    contactTitle: "Contact",
    email: "Email",
    instagram: "Instagram",
    facebook: "Facebook",
    followUs: "Follow Us",
    copyright: "© 2026 igormraz.com. All rights reserved.",
    createdBy: "Created by Hotshot",
  },
};

export default async function Footer({ locale = 'sk' }: { locale?: string }) {
  const currentYear = new Date().getFullYear();
  const copyrightDate = 2026;
  const skeleton =
    "w-full h-6 animate-pulse rounded-sm bg-neutral-200 dark:bg-neutral-700";
  const menu = await getMenu("next-js-frontend-footer-menu");
  const copyrightName = COMPANY_NAME || SITE_NAME || "";
  const t = translations[locale as keyof typeof translations] || translations.en;

  return (
    <footer className="text-sm text-neutral-500 dark:text-neutral-400">
      <div className="mx-auto w-full max-w-7xl border-t border-neutral-200 px-6 py-12 dark:border-neutral-700">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Navigation */}
          <div>
            <Suspense
              fallback={
                <div className="flex h-[188px] w-[200px] flex-col gap-2">
                  <div className={skeleton} />
                  <div className={skeleton} />
                  <div className={skeleton} />
                </div>
              }
            >
              <FooterMenu menu={menu} locale={locale} />
            </Suspense>
          </div>
          
          {/* Policies */}
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 font-semibold text-neutral-900 dark:text-white">{t.shippingTitle}</h3>
              <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">{t.shippingText}</p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-neutral-900 dark:text-white">{t.returnsTitle}</h3>
              <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">{t.returnsText}</p>
            </div>
          </div>

          {/* Contact & Social */}
          <div>
            <h3 className="mb-3 font-semibold text-neutral-900 dark:text-white">{t.contactTitle}</h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">{t.email}: </span>
                <a href="mailto:hi@igormraz.com" className="text-neutral-600 hover:underline dark:text-neutral-400">
                  hi@igormraz.com
                </a>
              </div>
              <div>
                <p className="mb-2 font-medium text-neutral-700 dark:text-neutral-300">{t.followUs}</p>
                <div className="space-y-1">
                  <a
                    href="https://instagram.com/dummylink"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-neutral-600 hover:underline dark:text-neutral-400"
                  >
                    {t.instagram}
                  </a>
                  <a
                    href="https://facebook.com/dummylink"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-neutral-600 hover:underline dark:text-neutral-400"
                  >
                    {t.facebook}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="border-t border-neutral-200 py-4 text-xs dark:border-neutral-700">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-6 md:flex-row">
          <p className="text-neutral-600 dark:text-neutral-400">
            {t.copyright}
          </p>
          <p>
            <a href="https://hotshot.sk" className="text-neutral-600 hover:underline dark:text-neutral-400">
              {t.createdBy}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

const translations = {
  sk: {
    title: "Objednávka zrušená",
    message: "Vaša objednávka bola zrušená. Neboli vám účtované žiadne poplatky.",
    backToHome: "Späť na domovskú stránku",
    continueShopping: "Pokračovať v nákupe",
  },
  en: {
    title: "Order Cancelled",
    message: "Your order has been cancelled. No charges were made.",
    backToHome: "Back to Home",
    continueShopping: "Continue Shopping",
  },
};

export default function CancelPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'sk';
  const t = translations[locale as keyof typeof translations] || translations.sk;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-8 text-center dark:border-orange-800 dark:bg-orange-900/20">
        <h1 className="mb-4 text-3xl font-bold text-orange-800 dark:text-orange-200">
          {t.title}
        </h1>
        <p className="mb-6 text-lg text-orange-700 dark:text-orange-300">
          {t.message}
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href={`/${locale}`}
            className="bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium"
          >
            {t.backToHome}
          </Link>
          <Link
            href={`/${locale}`}
            className="bg-neutral-200 text-neutral-800 py-3 px-6 rounded-md hover:bg-neutral-300 font-medium dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
          >
            {t.continueShopping}
          </Link>
        </div>
      </div>
    </div>
  );
}

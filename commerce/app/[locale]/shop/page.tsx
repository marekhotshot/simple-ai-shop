import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProducts } from 'lib/express';
import { defaultSort, sorting } from "lib/constants";

const translations = {
  sk: {
    title: "Dostupné práce",
    description: "Všetky kusy sú jedinečné a ručne vyrobené. To, čo vidíte, je to, čo je dostupné — keď je to preč, je to preč.",
    all: "Všetky",
    categories: {
      wall_carvings: "Nástenné reliéfy",
      sculptures: "Sochy",
      nature: "Inšpirované prírodou",
      fantasy: "Fantasy a mýty",
      custom: "Objednávky na mieru",
    },
  },
  en: {
    title: "Available Works",
    description: "All pieces are unique and made by hand. What you see is what's available — once it's gone, it's gone.",
    all: "All",
    categories: {
      wall_carvings: "Wall Carvings",
      sculptures: "Sculptures",
      nature: "Nature-Inspired",
      fantasy: "Fantasy & Myth",
      custom: "Custom Orders",
    },
  },
};

export const metadata = {
  title: "Shop",
  description: "Browse available handmade wood carvings and sculptures by Igor Mráz.",
};

// Disable caching to ensure random order on each page load
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ShopPage(props: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await props.params;
  const { locale } = params;
  
  if (locale !== 'sk' && locale !== 'en') {
    notFound();
  }

  const searchParams = await props.searchParams;
  const { sort, category } = searchParams as { [key: string]: string };
  const { sortKey, reverse } =
    sorting.find((item) => item.slug === sort) || defaultSort;

  // Include RESERVED products in shop (but not SOLD or HIDDEN)
  const products = await getProducts({ sortKey, reverse, locale, includeReserved: true, category });
  const t = translations[locale as keyof typeof translations] || translations.en;

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-16">
        <h1 className="mb-4 text-4xl font-bold">{t.title}</h1>
        <p className="mb-8 text-lg text-neutral-600 dark:text-neutral-400">
          {t.description}
        </p>

        {/* Category Filters */}
        <div className="mb-8 flex flex-wrap gap-3">
          <a
            href={`/${locale}/shop`}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              !category
                ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100'
                : 'border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800'
            }`}
          >
            {t.all}
          </a>
          <a
            href={`/${locale}/shop?category=wall_carvings`}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              category === 'wall_carvings'
                ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100'
                : 'border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800'
            }`}
          >
            {t.categories.wall_carvings}
          </a>
          <a
            href={`/${locale}/shop?category=sculptures`}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              category === 'sculptures'
                ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100'
                : 'border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800'
            }`}
          >
            {t.categories.sculptures}
          </a>
          <a
            href={`/${locale}/shop?category=nature`}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              category === 'nature'
                ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100'
                : 'border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800'
            }`}
          >
            {t.categories.nature}
          </a>
          <a
            href={`/${locale}/shop?category=fantasy`}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              category === 'fantasy'
                ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100'
                : 'border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800'
            }`}
          >
            {t.categories.fantasy}
          </a>
          <a
            href={`/${locale}/custom`}
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            {t.categories.custom}
          </a>
        </div>

        {products.length > 0 ? (
          <Grid className="grid-cols-2">
            <ProductGridItems products={products} locale={locale} />
          </Grid>
        ) : (
          <div className="py-12 text-center text-neutral-500">
            <p>Žiadne produkty k dispozícii.</p>
          </div>
        )}
      </div>
    </>
  );
}

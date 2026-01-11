import { Carousel } from "components/carousel";
import { ThreeItemGrid } from "components/grid/three-items";
import Footer from "components/layout/footer";
import { notFound } from "next/navigation";
import Link from "next/link";

const translations = {
  sk: {
    heroHeading: "Ručne vyrobené drevorezby a sochy od Igora Mráza",
    heroSubheading: "Unikátne drevené umenie zrodené z viac ako 20 rokov remeselnej práce. Každý kus má svoj príbeh — žiadne kópie, žiadna sériová výroba.",
    ctaButton: "Preskúmať kolekciu",
    introTitle: "Vitajte v oficiálnom obchode Igora Mráza",
    introText: "Slovenský drevorezbár, ktorý s vášňou premieňa surové drevo na expresívne, detailné umenie. Či už vás priťahujú mytologické scény, abstraktné organické formy alebo rozprávkové bytosti, garantujeme vám kus s dušou a príbehom.",
  },
  en: {
    heroHeading: "Handmade Wood Carvings & Sculptures by Igor Mráz",
    heroSubheading: "One-of-a-kind wooden art born from 20+ years of craftsmanship. Each piece tells a story — no copies, no mass production.",
    ctaButton: "Explore the Collection",
    introTitle: "Welcome to the official store of Igor Mráz",
    introText: "— a Slovak woodcarver with a passion for transforming raw wood into expressive, detailed art. Whether you're drawn to mythological scenes, abstract organic forms, or whimsical creatures, you're guaranteed a piece with soul and story.",
  },
};

export const metadata = {
  description:
    "igormraz - Handmade wood carvings and sculptures by Igor Mráz. One-of-a-kind wooden art from Slovakia.",
  openGraph: {
    type: "website",
  },
};

// Disable caching to ensure random order on each page load
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  if (locale !== 'sk' && locale !== 'en') {
    notFound();
  }

  const t = translations[locale as keyof typeof translations] || translations.en;

  return (
    <>
      {/* Hero Section */}
      <div className="relative mb-12 flex min-h-[500px] items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-8 text-center dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
        <div className="z-10 max-w-4xl">
          <h1 className="mb-6 text-4xl font-bold leading-tight text-neutral-900 dark:text-white sm:text-5xl md:text-6xl">
            {t.heroHeading}
          </h1>
          <p className="mb-8 text-xl leading-relaxed text-neutral-700 dark:text-neutral-300 sm:text-2xl">
            {t.heroSubheading}
          </p>
          <Link
            href={`/${locale}/shop`}
            className="inline-block rounded-lg bg-amber-600 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800"
          >
            {t.ctaButton}
          </Link>
        </div>
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="h-full w-full bg-pattern-dots"></div>
        </div>
      </div>

      {/* Intro Section */}
      <div className="mx-auto max-w-4xl px-6 py-12 text-center">
        <h2 className="mb-4 text-3xl font-bold text-neutral-900 dark:text-white">
          {t.introTitle}
        </h2>
        <p className="text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
          {t.introText}
        </p>
      </div>

      {/* Featured Products Grid */}
      <div className="mx-auto max-w-7xl px-6 pb-32">
        <ThreeItemGrid locale={locale} />
      </div>
    </>
  );
}

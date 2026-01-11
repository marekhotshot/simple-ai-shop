import { GridTileImage } from "components/grid/tile";
import { Gallery } from "components/product/gallery";
import { ProductDescription } from "components/product/product-description";
import { HIDDEN_PRODUCT_TAG } from "lib/constants";
import { getProduct, getProductRecommendations } from 'lib/express';
import type { Image } from 'lib/express/types';
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const product = await getProduct(params.slug, params.locale);

  if (!product) return notFound();

  const { url, width, height, altText: alt } = product.featuredImage || {};
  const indexable = !product.tags.includes(HIDDEN_PRODUCT_TAG);

  const title = params.locale === 'en' 
    ? `Hand-Carved Wall Art – "${product.title}" (Unique Piece)`
    : `Ručne vyrezaný nástenný reliéf – "${product.title}" (Jedinečný kus)`;

  return {
    title: title,
    description: product.seo.description || product.description,
    robots: {
      index: indexable,
      follow: indexable,
      googleBot: {
        index: indexable,
        follow: indexable,
      },
    },
    openGraph: url
      ? {
          images: [
            {
              url,
              width,
              height,
              alt,
            },
          ],
        }
      : null,
  };
}

export default async function ProductPage(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const params = await props.params;
  const product = await getProduct(params.slug, params.locale);

  if (!product) return notFound();

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.featuredImage.url,
    offers: {
      "@type": "AggregateOffer",
      availability: product.availableForSale
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      priceCurrency: product.priceRange.minVariantPrice.currencyCode,
      highPrice: product.priceRange.maxVariantPrice.amount,
      lowPrice: product.priceRange.minVariantPrice.amount,
    },
  };

  const translations = {
    sk: {
      related: "Podobné produkty",
      wantSimilar: "Chcete niečo podobné?",
      shippingIncluded: "Doprava v cene",
      oneOfAKind: "Jedinečný originál",
      size: "Veľkosť",
      finish: "Povrchová úprava",
      natural: "Prírodný",
      lightOil: "Jemný olej",
      hangingHardware: "Zavesenie v cene",
      note: "Toto je hotový kus a nebude replikovaný. Odosielame po celom svete v ochrannom balení.",
      handcrafted: "Táto ručne vyrobená drevená rezba je jedinečná, vytvorená Igorom Mrázom v jeho slovenskej dielni.",
    },
    en: {
      related: "Related Products",
      wantSimilar: "Want something similar?",
      shippingIncluded: "Shipping included",
      oneOfAKind: "One-of-a-kind original",
      size: "Size",
      finish: "Finish",
      natural: "Natural",
      lightOil: "Light oil",
      hangingHardware: "Hanging hardware included",
      note: "This is a finished piece and will not be replicated. Ships worldwide in protective packaging.",
      handcrafted: "This handcrafted wooden carving is one of a kind, created by Igor Mráz in his Slovak workshop.",
    },
  };
  const t = translations[params.locale as keyof typeof translations] || translations.sk;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd),
        }}
      />
      <div className="mx-auto max-w-(--breakpoint-2xl) px-4">
        <div className="flex flex-col rounded-lg border border-neutral-200 bg-white p-8 md:p-12 lg:flex-row lg:gap-8 dark:border-neutral-800 dark:bg-black">
          <div className="h-full w-full basis-full lg:basis-4/6">
            <Suspense
              fallback={
                <div className="relative aspect-square h-full max-h-[550px] w-full overflow-hidden" />
              }
            >
              <Gallery
                images={product.images.slice(0, 5).map((image: Image) => ({
                  src: image.url,
                  altText: image.altText,
                }))}
              />
            </Suspense>
          </div>

          <div className="basis-full lg:basis-2/6">
            <Suspense fallback={null}>
              <ProductDescription 
                product={product} 
                locale={params.locale}
                status={(product as any).status || 'AVAILABLE'}
                category={(product as any).category}
              />
            </Suspense>
            
            {/* Product Details Section */}
            <div className="mt-6 space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-700 text-sm">
              <div>
                <span className="font-medium text-neutral-900 dark:text-white">{t.oneOfAKind}</span>
              </div>
              {(product as any).size && (
                <div>
                  <span className="font-medium text-neutral-900 dark:text-white">{t.size}: </span>
                  <span className="text-neutral-600 dark:text-neutral-400">{(product as any).size}</span>
                </div>
              )}
              {(product as any).finish && (
                <div>
                  <span className="font-medium text-neutral-900 dark:text-white">{t.finish}: </span>
                  <span className="text-neutral-600 dark:text-neutral-400">{(product as any).finish}</span>
                </div>
              )}
              {((product as any).category === 'PAINTINGS' || (product as any).category === 'WALL_CARVINGS') && (
                <div>
                  <span className="text-neutral-600 dark:text-neutral-400">{t.hangingHardware}</span>
                </div>
              )}
              <p className="mt-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400 italic">
                {t.note}
              </p>
            </div>

            {(product as any).status === 'SOLD' && (
              <div className="mt-6">
                <Link
                  href={`/${params.locale}/custom?productId=${product.id}&slug=${product.handle}&category=${(product as any).category || ''}`}
                  className="inline-block w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 font-medium text-center"
                >
                  {t.wantSimilar}
                </Link>
              </div>
            )}
          </div>
        </div>
        <RelatedProducts id={product.id} locale={params.locale} />
      </div>
    </>
  );
}

async function RelatedProducts({ id, locale }: { id: string; locale: string }) {
  const relatedProducts = await getProductRecommendations(id, locale);

  if (!relatedProducts.length) return null;

  const translations = {
    sk: { related: "Podobné produkty" },
    en: { related: "Related Products" },
  };
  const t = translations[locale as keyof typeof translations] || translations.sk;

  return (
    <div className="py-8">
      <h2 className="mb-4 text-2xl font-bold">{t.related}</h2>
      <ul className="flex w-full gap-4 overflow-x-auto pt-1">
        {relatedProducts.map((product) => (
          <li
            key={product.handle}
            className="aspect-square w-full flex-none min-[475px]:w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5"
          >
            <Link
              className="relative h-full w-full"
              href={`/${locale}/p/${product.handle}`}
              prefetch={true}
            >
              <GridTileImage
                alt={product.title}
                label={{
                  title: product.title,
                  amount: product.priceRange.maxVariantPrice.amount,
                  currencyCode: product.priceRange.maxVariantPrice.currencyCode,
                }}
                src={product.featuredImage?.url}
                fill
                sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, (min-width: 475px) 50vw, 100vw"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

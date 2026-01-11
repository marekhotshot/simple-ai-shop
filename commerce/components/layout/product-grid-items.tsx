import Grid from "components/grid";
import { GridTileImage } from "components/grid/tile";
import { Product } from 'lib/express/types';
import Link from "next/link";
import React from "react";

type ProductWithOrientation = Product & {
  orientation: 'square' | 'landscape' | 'portrait';
};

function normalizeOrientation(rawOrientation: string | null | undefined): 'square' | 'landscape' | 'portrait' {
  if (!rawOrientation) return 'square';
  return rawOrientation.toLowerCase() as 'square' | 'landscape' | 'portrait';
}

// Fisher-Yates shuffle algorithm for randomizing array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // TypeScript doesn't understand that j is always valid, but we know it is (0 <= j <= i)
    const temp = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = temp;
  }
  return shuffled;
}

// Masonry layout - randomize products and prepare for display
function prepareProductsForMasonry(products: Product[]): ProductWithOrientation[] {
  // Randomize products first
  const shuffledProducts = shuffleArray(products);
  
  return shuffledProducts.map((product) => {
    const rawOrientation = (product as any).imageOrientation || 'SQUARE';
    const orientation = normalizeOrientation(rawOrientation);
    return { ...product, orientation } as ProductWithOrientation;
  });
}

export default function ProductGridItems({
  products,
  locale = 'sk',
}: {
  products: Product[];
  locale?: string;
}) {
  const translations = {
    sk: {
      statusReserved: "Rezervované",
    },
    en: {
      statusReserved: "Reserved",
    },
  };
  const t = translations[locale as keyof typeof translations] || translations.sk;

  // Prepare products for masonry layout
  const preparedProducts = prepareProductsForMasonry(products);

  return (
    <>
      {preparedProducts.map((product) => {
        const orientation = product.orientation;
        // Landscape images span 2 columns, others span 1
        const colSpan = orientation === 'landscape' ? 2 : 1;
        
        return (
          <Grid.Item
            key={product.handle}
            className="animate-fadeIn"
            style={{
              gridColumn: `span ${colSpan}`,
              alignSelf: 'start',
            }}
          >
            <Link
              className="block w-full"
              href={`/${locale}/p/${product.handle}`}
              prefetch={true}
            >
              <div className="space-y-1">
                <GridTileImage
                  alt={product.title}
                  src={product.featuredImage?.url}
                  fill
                  sizes={orientation === 'landscape' ? "(min-width: 768px) 66vw, 100vw" : "(min-width: 768px) 33vw, 100vw"}
                  orientation={orientation}
                />
                <div className="px-1">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                    {product.title}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    €{(parseFloat(product.priceRange.maxVariantPrice.amount)).toFixed(2)}
                  </p>
                  {(product as any).status === 'RESERVED' && (
                    <span className="mt-1 inline-block rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      {t.statusReserved}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </Grid.Item>
        );
      })}
    </>
  );
}

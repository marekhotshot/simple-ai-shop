import { getCollectionProducts } from 'lib/express';
import ProductGridItems from "components/layout/product-grid-items";

export async function ThreeItemGrid({ locale = 'sk' }: { locale?: string }) {
  // Get all available products for homepage
  const homepageItems = await getCollectionProducts({
    collection: "", // Empty collection = all products
    locale: locale,
  });

  if (!homepageItems || homepageItems.length === 0) return null;

  // Show up to 12 products
  const allProducts = homepageItems.slice(0, 12);
  
  return (
    <section className="mx-auto max-w-7xl px-4 pb-4">
      <div className="grid grid-cols-2 grid-flow-dense grid-auto-rows-[minmax(100px,auto)] gap-0" style={{ alignItems: 'start' }}>
        <ProductGridItems products={allProducts} locale={locale} />
      </div>
    </section>
  );
}

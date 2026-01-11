import { getCollections, getPages, getCollectionProducts } from 'lib/express';
import { baseUrl, validateEnvironmentVariables } from "lib/utils";
import { MetadataRoute } from "next";

type Route = {
  url: string;
  lastModified: string;
};

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  validateEnvironmentVariables();

  const routesMap = [""].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
  }));

  const collectionsPromise = getCollections().then((collections) =>
    collections.map((collection) => ({
      url: `${baseUrl}${collection.path}`,
      lastModified: collection.updatedAt,
    })),
  );

  // Get products and generate URLs for both locales
  // Use getProducts with empty collection to get all products
  const productsPromise = getCollectionProducts({ collection: "", locale: 'sk' }).then((products) => {
    const productUrls: Route[] = [];
    
    // Generate URLs for both locales for each product
    products.forEach((product) => {
      // Add Slovak URL
      productUrls.push({
        url: `${baseUrl}/sk/p/${product.handle}`,
        lastModified: product.updatedAt,
      });
      // Add English URL
      productUrls.push({
        url: `${baseUrl}/en/p/${product.handle}`,
        lastModified: product.updatedAt,
      });
    });
    
    return productUrls;
  });

  const pagesPromise = getPages().then((pages) =>
    pages.map((page) => ({
      url: `${baseUrl}/${page.handle}`,
      lastModified: page.updatedAt,
    })),
  );

  let fetchedRoutes: Route[] = [];

  try {
    fetchedRoutes = (
      await Promise.all([collectionsPromise, productsPromise, pagesPromise])
    ).flat();
  } catch (error) {
    throw JSON.stringify(error, null, 2);
  }

  return [...routesMap, ...fetchedRoutes];
}

import {
  TAGS,
} from "lib/constants";
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
  revalidateTag,
  updateTag,
} from "next/cache";
import { cookies, headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  Cart,
  Collection,
  Image,
  Menu,
  Page,
  Product,
  ProductVariant,
  Money,
  SEO,
  ExpressProductResponse,
  ExpressProductsResponse,
} from "./types";

// Determine API URL - use environment variables, fallback to localhost for development
const API_BASE_URL = process.env.EXPRESS_API_URL || process.env.NEXT_PUBLIC_EXPRESS_API_URL || "http://localhost:3000";
// Use NEXT_PUBLIC_IMAGE_BASE_URL for client-side compatibility, fallback to public API URL
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || process.env.IMAGE_BASE_URL || API_BASE_URL;

// Check if we're in local development (for better error handling)
const isLocalDevelopment = 
  API_BASE_URL.includes('localhost') || 
  API_BASE_URL.includes('127.0.0.1') ||
  process.env.NODE_ENV === 'development';

// Helper to get locale - accepts locale as parameter to avoid Next.js cache issues
// Defaults to 'sk' if not provided
function getLocale(locale?: string): 'sk' | 'en' {
  if (locale === 'en') return 'en';
  return 'sk'; // Default to Slovak
}

// Transform price from cents to Money format
function centsToMoney(cents: number, currencyCode: string = "EUR"): Money {
  return {
    amount: (cents / 100).toFixed(2),
    currencyCode,
  };
}

// Transform image path to full URL
function imagePathToUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  
  // Backend stores paths like /products/... but Express serves them at /uploads/products/...
  // Convert various path formats to the correct /uploads/... format
  let relativePath = path;
  if (path.startsWith("/data/uploads")) {
    relativePath = path.replace("/data/uploads", "/uploads");
  } else if (path.startsWith("/uploads")) {
    relativePath = path; // Already correct
  } else if (path.startsWith("/products")) {
    // Backend returns /products/... but we need /uploads/products/...
    relativePath = `/uploads${path}`;
  } else if (path.startsWith("/")) {
    // Other absolute paths - assume they need /uploads prefix
    relativePath = `/uploads${path}`;
  } else {
    // Relative paths
    relativePath = `/uploads/${path}`;
  }
  
  // Build full URL
  if (relativePath.startsWith("/")) {
    return `${IMAGE_BASE_URL}${relativePath}`;
  }
  return `${IMAGE_BASE_URL}/${relativePath}`;
}

// Transform Express product to Commerce Product
function transformProduct(expressProduct: ExpressProductResponse): Product {
  const price = centsToMoney(expressProduct.priceCents);
  const availableForSale = expressProduct.status === "AVAILABLE";

  // Create a single default variant
  const variant: ProductVariant = {
    id: `${expressProduct.id}-default`,
    title: "Default",
    availableForSale,
    selectedOptions: [],
    price,
  };

  // Transform images
  const images: Image[] = [];
  
  if (expressProduct.images && expressProduct.images.length > 0) {
    expressProduct.images.forEach((img) => {
      images.push({
        url: imagePathToUrl(img.path),
        altText: expressProduct.title,
        width: img.width || 800,
        height: img.height || 800,
      });
    });
  } else if (expressProduct.primaryImage) {
    images.push({
      url: imagePathToUrl(expressProduct.primaryImage),
      altText: expressProduct.title,
      width: 800,
      height: 800,
    });
  }

  const featuredImage: Image = images[0] || {
    url: "",
    altText: expressProduct.title,
    width: 800,
    height: 800,
  };

  const product = {
    id: expressProduct.id,
    handle: expressProduct.slug,
    availableForSale,
    title: expressProduct.title,
    description: expressProduct.description || expressProduct.descriptionShort || "",
    descriptionHtml: `<p>${expressProduct.description || expressProduct.descriptionShort || ""}</p>`,
    options: [],
    priceRange: {
      minVariantPrice: price,
      maxVariantPrice: price,
    },
    variants: [variant],
    featuredImage,
    images,
    seo: {
      title: expressProduct.title,
      description: expressProduct.descriptionShort || expressProduct.title,
    },
    tags: [expressProduct.category.toLowerCase()],
    updatedAt: new Date().toISOString(),
    status: expressProduct.status,
    category: expressProduct.category,
    size: (expressProduct as any).size || null,
    finish: (expressProduct as any).finish || null,
    imageOrientation: (expressProduct as any).imageOrientation || null,
    featured: (expressProduct as any).featured || false,
  };
  
  return product as Product & { status: string; category: string; size?: string | null; finish?: string | null; imageOrientation?: string | null; featured?: boolean };
}

// Transform products array
function transformProducts(expressProducts: ExpressProductResponse[]): Product[] {
  return expressProducts.map(transformProduct);
}

// Collections mapping
const COLLECTIONS: Collection[] = [
  {
    handle: "",
    title: "All",
    description: "All products",
    seo: {
      title: "All",
      description: "All products",
    },
    path: "/search",
    updatedAt: new Date().toISOString(),
  },
  {
    handle: "paintings",
    title: "Paintings",
    description: "Paintings collection",
    seo: {
      title: "Paintings",
      description: "Browse our paintings collection",
    },
    path: "/search/paintings",
    updatedAt: new Date().toISOString(),
  },
  {
    handle: "sculptures",
    title: "Sculptures",
    description: "Sculptures collection",
    seo: {
      title: "Sculptures",
      description: "Browse our sculptures collection",
    },
    path: "/search/sculptures",
    updatedAt: new Date().toISOString(),
  },
];

// Cart functions (using Next.js cookies)
export async function createCart(): Promise<Cart> {
  const cartId = crypto.randomUUID();
  const cart: Cart = {
    id: cartId,
    checkoutUrl: "/checkout",
    cost: {
      subtotalAmount: { amount: "0.00", currencyCode: "EUR" },
      totalAmount: { amount: "0.00", currencyCode: "EUR" },
      totalTaxAmount: { amount: "0.00", currencyCode: "EUR" },
    },
    lines: [],
    totalQuantity: 0,
  };

  const cookieStore = await cookies();
  cookieStore.set("cart", JSON.stringify(cart), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  cookieStore.set("cartId", cartId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return cart;
}

export async function addToCart(
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const cookieStore = await cookies();
  let cartId = cookieStore.get("cartId")?.value;

  if (!cartId) {
    const newCart = await createCart();
    cartId = newCart.id!;
  }

  // Get current cart
  const cart = await getCart();
  if (!cart) {
    throw new Error("Cart not found");
  }

  // Add items to cart (simplified - in production, you'd want to merge quantities)
  const updatedLines = [...cart.lines];
  
  for (const line of lines) {
    const existingIndex = updatedLines.findIndex(
      (l) => l.merchandise.id === line.merchandiseId
    );
    
    if (existingIndex >= 0) {
      const existingLine = updatedLines[existingIndex];
      if (existingLine) {
        existingLine.quantity += line.quantity;
      }
    } else {
      // Fetch product to get details
      const productId = line.merchandiseId.replace("-default", "");
      const product = await getProductById(productId);
      if (product) {
        updatedLines.push({
          id: `${cartId}-${line.merchandiseId}`,
          quantity: line.quantity,
          cost: {
            totalAmount: {
              amount: (parseFloat(product.priceRange.minVariantPrice.amount) * line.quantity).toFixed(2),
              currencyCode: product.priceRange.minVariantPrice.currencyCode,
            },
          },
          merchandise: {
            id: line.merchandiseId,
            title: "Default",
            selectedOptions: [],
            product: {
              id: product.id,
              handle: product.handle,
              title: product.title,
              featuredImage: product.featuredImage,
            },
          },
        });
      }
    }
  }

  const subtotal = updatedLines.reduce(
    (sum, line) => sum + parseFloat(line.cost.totalAmount.amount),
    0
  );

  const updatedCart: Cart = {
    ...cart,
    lines: updatedLines,
    totalQuantity: updatedLines.reduce((sum, line) => sum + line.quantity, 0),
    cost: {
      subtotalAmount: { amount: subtotal.toFixed(2), currencyCode: "EUR" },
      totalAmount: { amount: subtotal.toFixed(2), currencyCode: "EUR" },
      totalTaxAmount: { amount: "0.00", currencyCode: "EUR" },
    },
  };

  // Store cart in cookie (simplified - in production use a database or session store)
  cookieStore.set("cart", JSON.stringify(updatedCart), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  updateTag(TAGS.cart);
  return updatedCart;
}

export async function removeFromCart(lineIds: string[]): Promise<Cart> {
  const cart = await getCart();
  if (!cart) {
    throw new Error("Cart not found");
  }

  const updatedLines = cart.lines.filter((line) => !lineIds.includes(line.id || ""));
  
  const subtotal = updatedLines.reduce(
    (sum, line) => sum + parseFloat(line.cost.totalAmount.amount),
    0
  );

  const updatedCart: Cart = {
    ...cart,
    lines: updatedLines,
    totalQuantity: updatedLines.reduce((sum, line) => sum + line.quantity, 0),
    cost: {
      subtotalAmount: { amount: subtotal.toFixed(2), currencyCode: "EUR" },
      totalAmount: { amount: subtotal.toFixed(2), currencyCode: "EUR" },
      totalTaxAmount: { amount: "0.00", currencyCode: "EUR" },
    },
  };

  const cookieStore = await cookies();
  cookieStore.set("cart", JSON.stringify(updatedCart), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  updateTag(TAGS.cart);
  return updatedCart;
}

export async function updateCart(
  lines: { id: string; merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const cart = await getCart();
  if (!cart) {
    throw new Error("Cart not found");
  }

  const updatedLines = cart.lines.map((line) => {
    const update = lines.find((l) => l.id === line.id);
    if (update) {
      return {
        ...line,
        quantity: update.quantity,
        cost: {
          totalAmount: {
            amount: (
              parseFloat(line.cost.totalAmount.amount) / line.quantity * update.quantity
            ).toFixed(2),
            currencyCode: line.cost.totalAmount.currencyCode,
          },
        },
      };
    }
    return line;
  });

  const subtotal = updatedLines.reduce(
    (sum, line) => sum + parseFloat(line.cost.totalAmount.amount),
    0
  );

  const updatedCart: Cart = {
    ...cart,
    lines: updatedLines,
    totalQuantity: updatedLines.reduce((sum, line) => sum + line.quantity, 0),
    cost: {
      subtotalAmount: { amount: subtotal.toFixed(2), currencyCode: "EUR" },
      totalAmount: { amount: subtotal.toFixed(2), currencyCode: "EUR" },
      totalTaxAmount: { amount: "0.00", currencyCode: "EUR" },
    },
  };

  const cookieStore = await cookies();
  cookieStore.set("cart", JSON.stringify(updatedCart), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  updateTag(TAGS.cart);
  return updatedCart;
}

export async function getCart(): Promise<Cart | undefined> {
  const cookieStore = await cookies();
  const cartJson = cookieStore.get("cart")?.value;
  
  if (!cartJson) {
    return undefined;
  }

  try {
    return JSON.parse(cartJson) as Cart;
  } catch {
    return undefined;
  }
}

export async function getCollection(
  handle: string
): Promise<Collection | undefined> {
  "use cache";
  cacheTag(TAGS.collections);
  cacheLife("days");

  return COLLECTIONS.find((c) => c.handle === handle);
}

export async function getCollectionProducts({
  collection,
  reverse,
  sortKey,
  locale = 'sk',
}: {
  collection: string;
  reverse?: boolean;
  sortKey?: string;
  locale?: string;
}): Promise<Product[]> {
  // Caching disabled to allow random ordering on each page load
  // Pages using this function have dynamic = 'force-dynamic' set
  const resolvedLocale = getLocale(locale);
  let category: string | null = null;

  if (collection === "paintings") {
    category = "PAINTINGS";
  } else if (collection === "sculptures") {
    category = "SCULPTURES";
  }

  const url = new URL(`${API_BASE_URL}/api/products`);
  // Only filter by available if collection is not empty (empty = show all including SOLD)
  if (collection !== "") {
    url.searchParams.set("availableOnly", "true");
  }
  url.searchParams.set("lang", resolvedLocale);
  if (category) {
    url.searchParams.set("category", category);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url.toString(), {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`Failed to fetch products: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const data: ExpressProductsResponse = await response.json();
    if (!data || !Array.isArray(data.products)) {
      console.error("Invalid response format from products API:", data);
      return [];
    }
    
    let products = transformProducts(data.products);

    // Apply sorting
    if (sortKey === "PRICE") {
      products.sort((a, b) => {
        const priceA = parseFloat(a.priceRange.minVariantPrice.amount);
        const priceB = parseFloat(b.priceRange.minVariantPrice.amount);
        return reverse ? priceB - priceA : priceA - priceB;
      });
    } else if (sortKey === "CREATED_AT") {
      products.sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        return reverse ? dateB - dateA : dateA - dateB;
      });
    }

    return products;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      if (isLocalDevelopment) {
        console.error("Request timeout when fetching collection products from", url.toString());
      }
    } else if (error.message?.includes('fetch failed') || error.cause?.code === 'ECONNREFUSED') {
      // In local development, provide helpful error message
      if (isLocalDevelopment) {
        console.error("❌ Backend server is not running or not accessible at", API_BASE_URL);
        console.error("   Please ensure backend port-forward is running:");
        console.error("   kubectl port-forward -n igormraz svc/backend 3000:3000");
        console.error("   Or start local backend: ./run-local.sh");
      } else {
        // In production, log minimal error (don't expose internal details)
        console.error("Failed to fetch collection products");
      }
    } else {
      if (isLocalDevelopment) {
        console.error("Error fetching collection products:", error.message || error);
        console.error("   API URL:", url.toString());
      } else {
        console.error("Error fetching collection products");
      }
    }
    // Always return empty array on error - page will render without products
    return [];
  }
}

export async function getCollections(): Promise<Collection[]> {
  "use cache";
  cacheTag(TAGS.collections);
  cacheLife("days");

  return COLLECTIONS;
}

export async function getMenu(handle: string): Promise<Menu[]> {
  "use cache";
  cacheTag(TAGS.collections);
  cacheLife("days");

  // Return empty menu for now - can be extended later
  return [];
}

export async function getPage(handle: string): Promise<Page> {
  throw new Error("Pages not implemented yet");
}

export async function getPages(): Promise<Page[]> {
  return [];
}

async function getProductById(productId: string, locale: string = 'sk'): Promise<Product | undefined> {
  const resolvedLocale = getLocale(locale);
  const url = `${API_BASE_URL}/api/products/id/${productId}?lang=${resolvedLocale}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (isLocalDevelopment) {
        console.error(`Failed to fetch product by ID: ${response.status} ${response.statusText}`);
      }
      return undefined;
    }
    const data: ExpressProductResponse = await response.json();
    return transformProduct(data);
  } catch (error: any) {
    if (isLocalDevelopment && (error.message?.includes('fetch failed') || error.cause?.code === 'ECONNREFUSED')) {
      console.error("❌ Backend not accessible when fetching product by ID:", API_BASE_URL);
    }
    return undefined;
  }
}

export async function getProduct(handle: string, locale: string = 'sk'): Promise<Product | undefined> {
  "use cache";
  cacheTag(TAGS.products);
  cacheLife("days");

  const resolvedLocale = getLocale(locale);
  const url = `${API_BASE_URL}/api/products/${handle}?lang=${resolvedLocale}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (isLocalDevelopment) {
        console.error(`Failed to fetch product: ${response.status} ${response.statusText}`);
      }
      return undefined;
    }
    const data: ExpressProductResponse = await response.json();
    return transformProduct(data);
  } catch (error: any) {
    if (isLocalDevelopment && (error.message?.includes('fetch failed') || error.cause?.code === 'ECONNREFUSED')) {
      console.error("❌ Backend not accessible when fetching product:", API_BASE_URL);
    } else if (isLocalDevelopment) {
      console.error("Error fetching product:", error.message || error);
    }
    return undefined;
  }
}

export async function getProductRecommendations(
  productId: string,
  locale: string = 'sk'
): Promise<Product[]> {
  "use cache";
  cacheTag(TAGS.products);
  cacheLife("days");

  const resolvedLocale = getLocale(locale);
  const url = `${API_BASE_URL}/api/products/${productId}/recommendations?lang=${resolvedLocale}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`Failed to fetch product recommendations: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const data: ExpressProductsResponse = await response.json();
    if (!data || !Array.isArray(data.products)) {
      console.error("Invalid response format from recommendations API:", data);
      return [];
    }
    
    return transformProducts(data.products);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      if (isLocalDevelopment) {
        console.error("Request timeout when fetching product recommendations");
      }
    } else if (error.message?.includes('fetch failed') || error.cause?.code === 'ECONNREFUSED') {
      if (isLocalDevelopment) {
        console.error("❌ Backend not accessible when fetching recommendations:", API_BASE_URL);
      }
    } else {
      if (isLocalDevelopment) {
        console.error("Error fetching product recommendations:", error.message || error);
      }
    }
    return [];
  }
}

export async function getProducts({
  query: searchQuery,
  reverse,
  sortKey,
  locale = 'sk',
  includeReserved = false,
  category,
}: {
  query?: string;
  reverse?: boolean;
  sortKey?: string;
  locale?: string;
  includeReserved?: boolean;
  category?: string;
}): Promise<Product[]> {
  // Caching disabled to ensure fresh product data (prices, status, etc.)
  // Pages using this function have dynamic = 'force-dynamic' set

  const resolvedLocale = getLocale(locale);
  const url = new URL(`${API_BASE_URL}/api/products`);
  // Only filter by availableOnly if we don't want to include reserved products
  if (!includeReserved) {
    url.searchParams.set("availableOnly", "true");
  }
  url.searchParams.set("lang", resolvedLocale);
  // Add category filter if provided
  if (category) {
    url.searchParams.set("category", category);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url.toString(), {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (isLocalDevelopment) {
        console.error(`Failed to fetch products: ${response.status} ${response.statusText}`);
      }
      return [];
    }
    const data: ExpressProductsResponse = await response.json();
    if (!data || !Array.isArray(data.products)) {
      if (isLocalDevelopment) {
        console.error("Invalid response format from products API:", data);
      }
      return [];
    }
    let products = transformProducts(data.products);

    // Apply search query if provided
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      products = products.filter(
        (p) =>
          p.title.toLowerCase().includes(queryLower) ||
          p.description.toLowerCase().includes(queryLower)
      );
    }

    // Apply sorting
    if (sortKey === "PRICE") {
      products.sort((a, b) => {
        const priceA = parseFloat(a.priceRange.minVariantPrice.amount);
        const priceB = parseFloat(b.priceRange.minVariantPrice.amount);
        return reverse ? priceB - priceA : priceA - priceB;
      });
    } else if (sortKey === "CREATED_AT") {
      products.sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        return reverse ? dateB - dateA : dateA - dateB;
      });
    }

    return products;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      if (isLocalDevelopment) {
        console.error("Request timeout when fetching products from", url.toString());
      }
    } else if (error.message?.includes('fetch failed') || error.cause?.code === 'ECONNREFUSED') {
      if (isLocalDevelopment) {
        console.error("❌ Backend not accessible when fetching products at", API_BASE_URL);
        console.error("   Ensure backend port-forward is running: kubectl port-forward -n igormraz svc/backend 3000:3000");
      }
    } else {
      if (isLocalDevelopment) {
        console.error("Error fetching products:", error.message || error);
        console.error("   API URL:", url.toString());
      }
    }
    // Always return empty array on error - page will render without products (graceful degradation)
    return [];
  }
}

// This is called from `app/api/revalidate.ts` so providers can control revalidation logic.
export async function revalidate(request: NextRequest): Promise<NextResponse> {
  // For Express API, we can manually trigger revalidation
  // This can be called from admin endpoints when products are updated
  const headersList = await headers();
  const topic = headersList.get("x-topic") || "unknown";
  const isCollectionUpdate = topic.includes("collection");
  const isProductUpdate = topic.includes("product");

  if (isCollectionUpdate) {
    revalidateTag(TAGS.collections, "max");
  }

  if (isProductUpdate) {
    revalidateTag(TAGS.products, "max");
  }

  return NextResponse.json({ status: 200, revalidated: true, now: Date.now() });
}


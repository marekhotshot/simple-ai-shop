// Re-export types from shopify/types.ts since they're provider-agnostic
// These types are provider-agnostic and can be used by any commerce provider
export type {
  Cart,
  CartItem,
  CartProduct,
  Collection,
  Image,
  Menu,
  Money,
  Page,
  Product,
  ProductOption,
  ProductVariant,
  SEO,
} from "../shopify/types";

// Also export from express for convenience
export * from "../shopify/types";

// Express API response types
export type ExpressProductResponse = {
  id: string;
  slug: string;
  category: string;
  priceCents: number;
  status: string;
  size?: string | null;
  finish?: string | null;
  imageOrientation?: string | null;
  featured?: boolean;
  title: string;
  description?: string;
  descriptionShort: string;
  primaryImage?: string | null;
  images?: Array<{
    path: string;
    variant: string;
    width?: number | null;
    height?: number | null;
  }>;
};

export type ExpressProductsResponse = {
  products: ExpressProductResponse[];
};


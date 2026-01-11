"use client";

import { AddToCart } from "components/cart/add-to-cart";
import Price from "components/price";
import Prose from "components/prose";
import { Product } from 'lib/express/types';
import { VariantSelector } from "./variant-selector";
import { PayPalBuyButton } from "./paypal-buy-button";
import { useEffect, useState } from "react";

export function ProductDescription({ product, locale = 'sk', status = 'AVAILABLE', category }: { product: Product; locale?: string; status?: string; category?: string }) {
  const [paypalConfigured, setPaypalConfigured] = useState(false);
  
  useEffect(() => {
    // Check if PayPal is configured
    fetch('/api/paypal/configured')
      .then(res => res.json())
      .then(data => setPaypalConfigured(data.configured || false))
      .catch(() => setPaypalConfigured(false));
  }, []);
  const translations = {
    sk: {
      shippingIncluded: "Doprava v cene",
      statusSold: "Predané",
      statusAvailable: "Dostupné",
      statusReserved: "Rezervované",
    },
    en: {
      shippingIncluded: "Shipping included",
      statusSold: "Sold",
      statusAvailable: "Available",
      statusReserved: "Reserved",
    },
  };
  const t = translations[locale as keyof typeof translations] || translations.sk;

  const statusBadge = status === 'SOLD' 
    ? <span className="ml-2 px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">{t.statusSold}</span>
    : status === 'RESERVED'
    ? <span className="ml-2 px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">{t.statusReserved}</span>
    : status === 'AVAILABLE'
    ? <span className="ml-2 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{t.statusAvailable}</span>
    : null;

  return (
    <>
      <div className="mb-6 flex flex-col border-b pb-6 dark:border-neutral-700">
        <h1 className="mb-2 text-5xl font-medium">{product.title}</h1>
        <div className="flex items-center">
          <div className="mr-auto w-auto rounded-full bg-blue-600 p-2 text-sm text-white">
            <Price
              amount={product.priceRange.maxVariantPrice.amount}
              currencyCode={product.priceRange.maxVariantPrice.currencyCode}
            />
          </div>
          {statusBadge}
        </div>
        {(status === 'AVAILABLE' || status === 'RESERVED') && (
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            {status === 'AVAILABLE' ? t.shippingIncluded : t.statusReserved}
          </p>
        )}
      </div>
      <VariantSelector options={product.options} variants={product.variants} />
      {product.descriptionHtml ? (
        <Prose
          className="mb-6 text-sm leading-tight dark:text-white/[60%]"
          html={product.descriptionHtml}
        />
      ) : product.description ? (
        <p className="mb-6 text-sm leading-tight dark:text-white/[60%]">
          {product.description}
        </p>
      ) : null}
      {status === 'AVAILABLE' || status === 'RESERVED' ? (
        <>
          {paypalConfigured && status === 'AVAILABLE' && (
            <PayPalBuyButton productId={product.id} locale={locale} />
          )}
          {status === 'AVAILABLE' && (
            <AddToCart product={product} />
          )}
        </>
      ) : null}
    </>
  );
}

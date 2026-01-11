"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// PayPal SDK - install with: pnpm add @paypal/paypal-js
// import { loadScript } from "@paypal/paypal-js";

const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL || "http://localhost:3000";

interface PayPalBuyButtonProps {
  productId: string;
  locale: string;
}

export function PayPalBuyButton({ productId, locale }: PayPalBuyButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayPalCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create PayPal order
      const response = await fetch(`${API_BASE_URL}/api/paypal/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          returnUrl: `${window.location.origin}/${locale}/success`,
          cancelUrl: `${window.location.origin}/${locale}/cancel`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create PayPal order");
        setLoading(false);
        return;
      }

      const { orderId } = await response.json();

      // TODO: Initialize PayPal SDK (requires @paypal/paypal-js package)
      // For now, redirect to PayPal directly
      // When PayPal SDK is installed, use the commented code below:
      /*
      const paypal = await loadScript({
        clientId: "YOUR_CLIENT_ID", // This should come from settings
        currency: "EUR",
      });

      if (!paypal) {
        setError("Failed to load PayPal SDK");
        setLoading(false);
        return;
      }

      const buttons = paypal.Buttons({
        createOrder: async () => orderId,
        onApprove: async (data: { orderID: string }) => {
          const captureResponse = await fetch(`${API_BASE_URL}/api/paypal/capture-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: data.orderID }),
          });

          if (captureResponse.ok) {
            router.push(`/${locale}/success?orderId=${data.orderID}`);
          } else {
            const errorData = await captureResponse.json();
            setError(errorData.error || "Payment capture failed");
          }
        },
        onError: (err: any) => {
          setError("PayPal error: " + (err.message || "Unknown error"));
          setLoading(false);
        },
      });
      */

      // Redirect to PayPal checkout
      router.push(`/${locale}/checkout?orderId=${orderId}`);
      setLoading(false);
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("PayPal checkout error:", err);
      setLoading(false);
    }
  };

  const translations = {
    sk: {
      buyNow: "Kúpiť cez PayPal",
      loading: "Spracovávam...",
    },
    en: {
      buyNow: "Buy with PayPal",
      loading: "Processing...",
    },
  };
  const t = translations[locale as keyof typeof translations] || translations.sk;

  return (
    <div className="mb-4">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}
      <button
        onClick={handlePayPalCheckout}
        disabled={loading}
        className="w-full bg-yellow-400 text-black py-3 px-4 rounded-md hover:bg-yellow-500 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin">⏳</span>
            {t.loading}
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a.804.804 0 0 0-.799.926l.365 2.29c.15.958.536 1.848 1.118 2.572a.804.804 0 0 0 1.344-.626l-.293-1.838a.806.806 0 0 0-.735-.676l-2.07-.223a.805.805 0 0 0-.008 0zm2.635-3.385a.805.805 0 0 0-.098.008l-3.19.345a.805.805 0 0 0-.707.956l.102.642c.049.312.31.545.624.545a.807.807 0 0 0 .082-.004l3.19-.345a.805.805 0 0 0 .707-.956l-.102-.642a.806.806 0 0 0-.617-.609z"/>
            </svg>
            {t.buyNow}
          </>
        )}
      </button>
    </div>
  );
}

"use client";

import { useCart } from "components/cart/cart-context";
import { useState, useEffect } from "react";
import Price from "components/price";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

type PaymentMethod = "bank_transfer" | "stripe";

export default function CheckoutForm() {
  const { cart } = useCart();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
    country: "",
  });
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [stripePublishableKey, setStripePublishableKey] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [loadingStripeConfig, setLoadingStripeConfig] = useState(true);

  const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL || "http://localhost:3000";

  // Check if Stripe is configured
  useEffect(() => {
    const checkStripeConfig = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/stripe/configured`);
        if (response.ok) {
          const data = await response.json();
          setStripeConfigured(data.configured || false);
        }
      } catch (error) {
        console.error("Error checking Stripe configuration:", error);
      } finally {
        setLoadingStripeConfig(false);
      }
    };
    checkStripeConfig();
  }, [API_BASE_URL]);

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-4">
          <a href="/sk" className="text-blue-600 hover:underline">
            Continue shopping
          </a>
        </p>
      </div>
    );
  }

  const handleBankTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cart || cart.lines.length === 0) {
      alert("Your cart is empty");
      return;
    }

    const firstLine = cart.lines[0];
    if (!firstLine || !firstLine.merchandise || !firstLine.merchandise.id) {
      alert("Invalid cart item");
      return;
    }

    const productId = firstLine.merchandise.id.replace("-default", "");
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          address: formData.address || null,
          city: formData.city || null,
          zip: formData.zip || null,
          country: formData.country || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = `/sk/success?orderId=${data.orderId}&bankDetails=${encodeURIComponent(data.bankTransferDetails || '')}`;
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to create order'}`);
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      alert("Error submitting order. Please try again.");
    }
  };

  const handleStripeInit = async () => {
    if (!cart || cart.lines.length === 0) {
      alert("Your cart is empty");
      return;
    }

    const firstLine = cart.lines[0];
    if (!firstLine || !firstLine.merchandise || !firstLine.merchandise.id) {
      alert("Invalid cart item");
      return;
    }

    // Validate required fields
    if (!formData.name || !formData.email || !formData.address || !formData.city || !formData.zip || !formData.country) {
      alert("Please fill in all shipping information before proceeding with Stripe payment");
      return;
    }

    const productId = firstLine.merchandise.id.replace("-default", "");
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          address: formData.address || null,
          city: formData.city || null,
          zip: formData.zip || null,
          country: formData.country || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
        setStripePublishableKey(data.publishableKey);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to initialize Stripe payment'}`);
      }
    } catch (error) {
      console.error("Error initializing Stripe:", error);
      alert("Error initializing payment. Please try again.");
    }
  };

  const stripeOptions: StripeElementsOptions | null = stripePublishableKey && clientSecret
    ? {
        clientSecret,
        appearance: {
          theme: 'stripe' as const,
        },
      }
    : null;

  // Extract form content to avoid duplication
  const formContent = (
    <>
      <div>
        <label className="block text-sm font-medium mb-1">Full Name</label>
        <input
          type="text"
          required
          className="w-full px-3 py-2 border border-neutral-300 rounded-md dark:bg-neutral-800 dark:border-neutral-700"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          required
          className="w-full px-3 py-2 border border-neutral-300 rounded-md dark:bg-neutral-800 dark:border-neutral-700"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Phone</label>
        <input
          type="tel"
          required
          className="w-full px-3 py-2 border border-neutral-300 rounded-md dark:bg-neutral-800 dark:border-neutral-700"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <input
          type="text"
          required
          className="w-full px-3 py-2 border border-neutral-300 rounded-md dark:bg-neutral-800 dark:border-neutral-700"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">City</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-neutral-300 rounded-md dark:bg-neutral-800 dark:border-neutral-700"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">ZIP Code</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-neutral-300 rounded-md dark:bg-neutral-800 dark:border-neutral-700"
            value={formData.zip}
            onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Country</label>
        <input
          type="text"
          required
          className="w-full px-3 py-2 border border-neutral-300 rounded-md dark:bg-neutral-800 dark:border-neutral-700"
          value={formData.country}
          onChange={async (e) => {
            const newCountry = e.target.value;
            setFormData({ ...formData, country: newCountry });
            
            if (newCountry && cart && cart.lines.length > 0) {
              const firstLine = cart.lines[0];
              if (!firstLine || !firstLine.merchandise || !firstLine.merchandise.id) {
                return;
              }
              setLoadingShipping(true);
              const productId = firstLine.merchandise.id.replace("-default", "");
              
              try {
                const response = await fetch(`${API_BASE_URL}/api/shipping/calculate`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ productId, country: newCountry }),
                });
                
                if (response.ok) {
                  const data = await response.json();
                  setShippingCost(data.shippingCents);
                }
              } catch (error) {
                console.error("Error calculating shipping:", error);
              } finally {
                setLoadingShipping(false);
              }
            }
          }}
        />
        {loadingShipping && (
          <p className="mt-1 text-xs text-neutral-500">Calculating shipping...</p>
        )}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
        <h3 className="font-semibold mb-3">Payment Method</h3>
        
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="paymentMethod"
              value="bank_transfer"
              checked={paymentMethod === "bank_transfer"}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="mt-1"
            />
            <div className="flex-1">
              <p className="font-medium text-sm">Bank Transfer</p>
              <p className="text-xs mt-1 text-neutral-600 dark:text-neutral-400">
                After submitting your order, you will receive payment instructions via email. 
                Your order will be processed once payment is received.
              </p>
            </div>
          </label>

          {!loadingStripeConfig && stripeConfigured && (
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="paymentMethod"
                value="stripe"
                checked={paymentMethod === "stripe"}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="font-medium text-sm">Credit Card (Stripe)</p>
                <p className="text-xs mt-1 text-neutral-600 dark:text-neutral-400">
                  Pay securely with your credit or debit card. Payment is processed immediately.
                </p>
              </div>
            </label>
          )}
        </div>

        {paymentMethod === "stripe" && (
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            {stripePublishableKey && stripeOptions ? (
              <StripePaymentForm
                stripePublishableKey={stripePublishableKey}
                options={stripeOptions}
                paymentIntentId={paymentIntentId}
                formData={formData}
              />
            ) : (
              <button
                type="button"
                onClick={handleStripeInit}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 font-medium"
              >
                Initialize Payment
              </button>
            )}
          </div>
        )}
      </div>

      {paymentMethod === "bank_transfer" && (
        <button
          type="submit"
          className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 font-medium"
        >
          Place Order
        </button>
      )}
    </>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
          {paymentMethod === "bank_transfer" ? (
            <form onSubmit={handleBankTransferSubmit} className="space-y-4">
              {formContent}
            </form>
          ) : (
            <div className="space-y-4">
              {formContent}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-md p-4">
            <ul className="space-y-4">
              {cart.lines.map((line) => (
                <li key={line.id} className="flex justify-between">
                  <div>
                    <p className="font-medium">{line.merchandise.product.title}</p>
                    <p className="text-sm text-neutral-500">Quantity: {line.quantity}</p>
                  </div>
                  <Price
                    className="text-right"
                    amount={line.cost.totalAmount.amount}
                    currencyCode={line.cost.totalAmount.currencyCode}
                  />
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <Price
                  amount={cart.cost.subtotalAmount.amount}
                  currencyCode={cart.cost.subtotalAmount.currencyCode}
                />
              </div>
              {shippingCost !== null && (
                <div className="flex justify-between mb-2">
                  <span>Shipping</span>
                  <Price
                    amount={(shippingCost / 100).toFixed(2)}
                    currencyCode="EUR"
                  />
                </div>
              )}
              <div className="flex justify-between mb-2">
                <span>Tax</span>
                <Price
                  amount={cart.cost.totalTaxAmount.amount}
                  currencyCode={cart.cost.totalTaxAmount.currencyCode}
                />
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-neutral-200 dark:border-neutral-700">
                <span>Total</span>
                <Price
                  amount={shippingCost !== null 
                    ? (parseFloat(cart.cost.totalAmount.amount) + (shippingCost / 100)).toFixed(2)
                    : cart.cost.totalAmount.amount
                  }
                  currencyCode={cart.cost.totalAmount.currencyCode}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StripePaymentForm({
  stripePublishableKey,
  options,
  paymentIntentId,
  formData,
}: {
  stripePublishableKey: string;
  options: StripeElementsOptions;
  paymentIntentId: string | null;
  formData: { name: string; email: string; phone: string; address: string; city: string; zip: string; country: string };
}) {
  const stripePromise = loadStripe(stripePublishableKey);
  const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL || "http://localhost:3000";

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripeCheckoutForm paymentIntentId={paymentIntentId} formData={formData} />
    </Elements>
  );
}

function StripeCheckoutForm({
  paymentIntentId,
  formData,
}: {
  paymentIntentId: string | null;
  formData: { name: string; email: string; phone: string; address: string; city: string; zip: string; country: string };
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL || "http://localhost:3000";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !paymentIntentId) {
      return;
    }

    setLoading(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        alert(submitError.message);
        setLoading(false);
        return;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/sk/success?paymentIntentId=${paymentIntentId}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        alert(error.message);
        setLoading(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm payment on backend
        try {
          const response = await fetch(`${API_BASE_URL}/api/stripe/confirm-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentIntentId }),
          });

          if (response.ok) {
            const data = await response.json();
            window.location.href = `/sk/success?orderId=${data.orderId}`;
          } else {
            const errorData = await response.json();
            alert(`Payment confirmed but order update failed: ${errorData.error || 'Unknown error'}`);
            setLoading(false);
          }
        } catch (error) {
          console.error("Error confirming payment:", error);
          alert("Payment succeeded but failed to update order. Please contact support.");
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("Error processing payment. Please try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || !elements || loading}
        className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
}

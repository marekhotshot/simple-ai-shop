"use client";

import { useCart } from "components/cart/cart-context";
import { useState } from "react";
import Price from "components/price";

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

  const handleSubmit = async (e: React.FormEvent) => {
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
    const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL || "http://localhost:3000";
    
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
        // Redirect to success page with order details
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  
                  // Calculate shipping when country is entered
                  if (newCountry && cart && cart.lines.length > 0) {
                    const firstLine = cart.lines[0];
                    if (!firstLine || !firstLine.merchandise || !firstLine.merchandise.id) {
                      return;
                    }
                    setLoadingShipping(true);
                    const productId = firstLine.merchandise.id.replace("-default", "");
                    const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL || "http://localhost:3000";
                    
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
              <h3 className="font-semibold mb-2">Payment Method</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Bank Transfer
              </p>
              <p className="text-xs mt-2 text-neutral-500 dark:text-neutral-500">
                After submitting your order, you will receive payment instructions via email. 
                Your order will be processed once payment is received.
              </p>
            </div>

            <button
              type="submit"
              className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 font-medium"
            >
              Place Order
            </button>
          </form>
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

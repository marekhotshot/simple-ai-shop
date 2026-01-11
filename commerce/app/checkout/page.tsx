import { getCart } from "lib/express";
import { CartProvider } from "components/cart/cart-context";
import CheckoutForm from "./checkout-form";

export default async function CheckoutPage() {
  const cartPromise = getCart();
  
  return (
    <CartProvider cartPromise={cartPromise}>
      <CheckoutForm />
    </CartProvider>
  );
}

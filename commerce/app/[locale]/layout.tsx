import { CartProvider } from "components/cart/cart-context";
import { Navbar } from "components/layout/navbar";
import Footer from "components/layout/footer";
import { WelcomeToast } from "components/welcome-toast";
import { getCart } from 'lib/express';
import { ReactNode } from "react";
import { Toaster } from "sonner";
import "../globals.css";
import { baseUrl } from "lib/utils";
import { notFound } from "next/navigation";

const { SITE_NAME } = process.env;

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: SITE_NAME!,
    template: `%s | ${SITE_NAME}`,
  },
  robots: {
    follow: true,
    index: true,
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  if (locale !== 'sk' && locale !== 'en') {
    notFound();
  }

  // Don't await the fetch, pass the Promise to the context provider
  const cart = getCart();

  return (
    <CartProvider cartPromise={cart}>
      <Navbar locale={locale} />
      <main className="min-h-screen">
        {children}
        <Toaster closeButton />
        <WelcomeToast />
      </main>
      <Footer locale={locale} />
    </CartProvider>
  );
}

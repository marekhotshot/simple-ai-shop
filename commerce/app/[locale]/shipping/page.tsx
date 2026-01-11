import Prose from "components/prose";
import { notFound } from "next/navigation";

const translations = {
  sk: {
    title: "Doprava",
    content: `
      <p>Všetky položky sa odosielajú do 3–5 pracovných dní. Objednávky na mieru závisia od zložitosti a sú cenovo odhadnuté individuálne. Všetky zásielky obsahujú sledovanie.</p>
    `,
  },
  en: {
    title: "Shipping Policy",
    content: `
      <p>All items ship within 3–5 business days. Custom orders depend on complexity and are quoted individually. All shipments include tracking.</p>
    `,
  },
};

export const metadata = {
  title: "Shipping Policy",
  description: "Shipping information for Igor Mráz's wood carvings and sculptures.",
};

export default async function ShippingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  if (locale !== 'sk' && locale !== 'en') {
    notFound();
  }

  const t = translations[locale as keyof typeof translations] || translations.en;

  return (
    <>
      <div className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="mb-8 text-5xl font-bold">{t.title}</h1>
        <Prose className="mb-8 text-lg leading-relaxed" html={t.content} />
      </div>
    </>
  );
}

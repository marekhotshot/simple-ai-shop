import Prose from "components/prose";
import { notFound } from "next/navigation";

const translations = {
  sk: {
    title: "Reklamácie",
    content: `
      <p>Kvôli jedinečnej povahe umenia sú reklamácie akceptované len v prípade poškodenia počas prepravy. Prosím, kontaktujte nás do 3 dní od dodania s fotografiami.</p>
    `,
  },
  en: {
    title: "Returns",
    content: `
      <p>Due to the unique nature of the art, returns are only accepted in cases of damage during transit. Please contact us within 3 days of delivery with photos.</p>
    `,
  },
};

export const metadata = {
  title: "Returns Policy",
  description: "Returns policy for Igor Mráz's handmade wood carvings and sculptures.",
};

export default async function ReturnsPage({ params }: { params: Promise<{ locale: string }> }) {
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

import { notFound } from "next/navigation";

const translations = {
  sk: {
    title: "Často kladené otázky",
    faqs: [
      {
        q: "Sú všetky kusy naozaj jedinečné?",
        a: "Áno. Igor nevyrába sériovo ani neopakuje dizajny. Každá rezba alebo socha je jedinečné umelecké dielo.",
      },
      {
        q: "Aké druhy dreva sa používajú?",
        a: "Primárne miestne získané slovenské tvrdé drevo, ako lipa, dub, orech alebo čerešňa — vybrané podľa textúry, charakteru a vhodnosti na rezanie.",
      },
      {
        q: "Posielate medzinárodne?",
        a: "Áno, posielame po celom svete so sledovaním. Náklady na dopravu a čas dodania sa vypočítavajú pri pokladni.",
      },
      {
        q: "Môžem požiadať o kus na mieru?",
        a: "Určite. Použite formulár objednávky na mieru na popísanie vašej predstavy a my vám odpovieme s cenou a časovým harmonogramom.",
      },
    ],
  },
  en: {
    title: "Frequently Asked Questions",
    faqs: [
      {
        q: "Are all pieces really unique?",
        a: "Yes. Igor does not mass-produce or repeat designs. Each carving or sculpture is a one-of-a-kind work of art.",
      },
      {
        q: "What types of wood are used?",
        a: "Primarily locally sourced Slovak hardwoods such as linden, oak, walnut or cherry — chosen for grain, character, and carving suitability.",
      },
      {
        q: "Do you ship internationally?",
        a: "Yes, we ship worldwide with tracking. Shipping cost and delivery time is calculated at checkout.",
      },
      {
        q: "Can I request a custom piece?",
        a: "Absolutely. Use the custom order form to describe your idea, and we'll follow up with pricing and timeline.",
      },
    ],
  },
};

export const metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Igor Mráz's handmade wood carvings and sculptures.",
};

export default async function FAQPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  if (locale !== 'sk' && locale !== 'en') {
    notFound();
  }

  const t = translations[locale as keyof typeof translations] || translations.en;

  return (
    <>
      <div className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="mb-8 text-5xl font-bold">{t.title}</h1>
        <div className="space-y-8">
          {t.faqs.map((faq, index) => (
            <div key={index} className="border-b border-neutral-200 pb-6 dark:border-neutral-700">
              <h2 className="mb-3 text-xl font-semibold text-neutral-900 dark:text-white">
                {faq.q}
              </h2>
              <p className="text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

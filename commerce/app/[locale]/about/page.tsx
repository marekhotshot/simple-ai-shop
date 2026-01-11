import Prose from "components/prose";
import { notFound } from "next/navigation";

const translations = {
  sk: {
    title: "O IGOROVI",
    heading: "O IGOROVI",
    intro: "Igor Mráz je slovenský rezbár, ktorý už viac než 20 rokov tvorí zo svojho domova – starej drevenice na Liptove. Nemá klasickú dielňu. Nemá ani showroom. Má len stôl, náradie, svetlo a kus dreva, ktorý sa pomaly mení na sochu.",
    philosophy: "Jeho diela nevznikajú na zákazku podľa trendov. Vznikajú preto, lebo v ňom niečo hovorí: „toto musí ísť von.\"",
    craftsmanship: "Každý výrez, každá linka, každý detail je ručná práca – bez strojov, bez opakovania.",
    background: "Igor neštudoval umenie. Študoval realitu. A naučil sa v nej vyrezávať krásu.",
    placeholder: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec nec elementum sapien. Sed vel varius nisl. Integer commodo, purus in efficitur faucibus, nunc magna lacinia erat, in condimentum ligula lorem ut nulla. In vel tincidunt sapien, sed tincidunt orci. Sed id purus nec sem aliquet imperdiet.",
  },
  en: {
    title: "ABOUT IGOR",
    heading: "ABOUT IGOR",
    intro: "Igor Mráz is a Slovak carver who has been creating from his home – an old wooden house in Liptov – for more than 20 years. He doesn't have a traditional workshop. He doesn't have a showroom either. He just has a table, tools, light, and a piece of wood that slowly transforms into a sculpture.",
    philosophy: "His works don't come from custom orders following trends. They emerge because something inside him says: \"this must come out.\"",
    craftsmanship: "Every cut, every line, every detail is handcrafted – without machines, without repetition.",
    background: "Igor didn't study art. He studied reality. And he learned to carve beauty into it.",
    placeholder: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec nec elementum sapien. Sed vel varius nisl. Integer commodo, purus in efficitur faucibus, nunc magna lacinia erat, in condimentum ligula lorem ut nulla. In vel tincidunt sapien, sed tincidunt orci. Sed id purus nec sem aliquet imperdiet.",
  },
};

export const metadata = {
  title: "About the Artist",
  description: "Learn about Igor Mráz, a Slovak woodcarver with over 20 years of experience creating unique wooden art.",
};

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  if (locale !== 'sk' && locale !== 'en') {
    notFound();
  }

  const t = translations[locale as keyof typeof translations] || translations.en;

  return (
    <>
      <div className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="mb-8 text-5xl font-bold">{t.heading}</h1>
        
        <div className="space-y-6 text-lg leading-relaxed">
          <p className="text-neutral-700 dark:text-neutral-300">{t.intro}</p>
          
          <p className="text-neutral-700 dark:text-neutral-300 italic">{t.philosophy}</p>
          
          <p className="text-neutral-700 dark:text-neutral-300">{t.craftsmanship}</p>
          
          <p className="text-neutral-700 dark:text-neutral-300 font-medium">{t.background}</p>
          
          <div className="mt-12 border-t border-neutral-200 pt-8 dark:border-neutral-700">
            <p className="text-neutral-500 dark:text-neutral-400 text-base italic">
              {t.placeholder}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

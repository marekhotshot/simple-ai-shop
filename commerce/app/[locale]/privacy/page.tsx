import Prose from "components/prose";
import { notFound } from "next/navigation";

const translations = {
  sk: {
    title: "Ochrana súkromia",
    content: `
      <h2>1. Základné informácie</h2>
      <p>Na tejto stránke zbierame iba nevyhnutné údaje potrebné na spracovanie objednávok a komunikáciu.</p>
      
      <h2>2. Zbierané údaje</h2>
      <p>Zbierame nasledujúce údaje:</p>
      <ul>
        <li>Meno a email (pre objednávky)</li>
        <li>Dodacia adresa (pre objednávky)</li>
        <li>Telefónne číslo (voliteľne)</li>
      </ul>
      
      <h2>3. Spracovanie údajov</h2>
      <p>Vaše údaje používame výlučne na:</p>
      <ul>
        <li>Spracovanie a doručenie objednávok</li>
        <li>Komunikáciu ohľadom objednávok</li>
        <li>Posielanie informácií o produktoch (iba s vaším súhlasom)</li>
      </ul>
      
      <h2>4. Ochrana údajov</h2>
      <p>Vaše údaje sú chránené a neposkytujeme ich tretím stranám bez vášho súhlasu.</p>
      
      <h2>5. Vaše práva</h2>
      <p>Máte právo na prístup, opravu alebo vymazanie vašich osobných údajov. Kontaktujte nás na email: info@igormraz.com</p>
      
      <p><em>Posledná aktualizácia: 2026-01-01</em></p>
    `,
  },
  en: {
    title: "Privacy Policy",
    content: `
      <h2>1. Basic Information</h2>
      <p>On this website, we only collect necessary data required for processing orders and communication.</p>
      
      <h2>2. Collected Data</h2>
      <p>We collect the following data:</p>
      <ul>
        <li>Name and email (for orders)</li>
        <li>Shipping address (for orders)</li>
        <li>Phone number (optional)</li>
      </ul>
      
      <h2>3. Data Processing</h2>
      <p>We use your data exclusively for:</p>
      <ul>
        <li>Processing and delivering orders</li>
        <li>Communication regarding orders</li>
        <li>Sending product information (only with your consent)</li>
      </ul>
      
      <h2>4. Data Protection</h2>
      <p>Your data is protected and we do not share it with third parties without your consent.</p>
      
      <h2>5. Your Rights</h2>
      <p>You have the right to access, correct, or delete your personal data. Contact us at: info@igormraz.com</p>
      
      <p><em>Last updated: 2026-01-01</em></p>
    `,
  },
};

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  if (locale !== 'sk' && locale !== 'en') {
    notFound();
  }

  const t = translations[locale as keyof typeof translations] || translations.sk;

  return (
    <>
      <div className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="mb-8 text-5xl font-bold">{t.title}</h1>
        <Prose className="mb-8" html={t.content} />
      </div>
    </>
  );
}

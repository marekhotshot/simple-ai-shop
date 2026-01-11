import Prose from "components/prose";
import { notFound } from "next/navigation";

const translations = {
  sk: {
    title: "Obchodné podmienky",
    content: `
      <h2>1. Všeobecné ustanovenia</h2>
      <p>Tieto obchodné podmienky upravujú nákup a predaj produktov cez našu internetovú stránku.</p>
      
      <h2>2. Ceny a platba</h2>
      <p>Všetky ceny sú uvedené v EUR a zahŕňajú DPH. Platba sa uskutočňuje cez PayPal. Doprava je zahrnutá v cene.</p>
      
      <h2>3. Objednávky</h2>
      <p>Objednávky sú záväzné až po potvrdení platby. Každý produkt je unikátny a kusový.</p>
      
      <h2>4. Doprava</h2>
      <p>Doprava je zahrnutá v cene produktu. Dodanie sa uskutoční do 14 pracovných dní po potvrdení platby.</p>
      
      <h2>5. Reklamácia a vrátenie</h2>
      <p>Vzhľadom na unikátnosť produktov sa reklamácie a vrátenia posudzujú individuálne. Kontaktujte nás na info@igormraz.com</p>
      
      <h2>6. Ochrana spotrebiteľa</h2>
      <p>Máte právo odstúpiť od kúpnej zmluvy do 14 dní od prijatia tovaru.</p>
      
      <p><em>Posledná aktualizácia: 2026-01-01</em></p>
    `,
  },
  en: {
    title: "Terms and Conditions",
    content: `
      <h2>1. General Provisions</h2>
      <p>These terms and conditions govern the purchase and sale of products through our website.</p>
      
      <h2>2. Prices and Payment</h2>
      <p>All prices are stated in EUR and include VAT. Payment is made via PayPal. Shipping is included in the price.</p>
      
      <h2>3. Orders</h2>
      <p>Orders are binding only after payment confirmation. Each product is unique and one-of-a-kind.</p>
      
      <h2>4. Shipping</h2>
      <p>Shipping is included in the product price. Delivery will be made within 14 working days after payment confirmation.</p>
      
      <h2>5. Claims and Returns</h2>
      <p>Due to the uniqueness of products, claims and returns are considered on an individual basis. Contact us at info@igormraz.com</p>
      
      <h2>6. Consumer Protection</h2>
      <p>You have the right to withdraw from the purchase agreement within 14 days of receiving the goods.</p>
      
      <p><em>Last updated: 2026-01-01</em></p>
    `,
  },
};

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
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

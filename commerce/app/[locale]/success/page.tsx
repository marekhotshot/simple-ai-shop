"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useParams } from "next/navigation";

const translations = {
  sk: {
    title: "Ďakujeme za vašu objednávku!",
    message: "Vaša objednávka bola úspešne vytvorená. Ďakujeme za váš nákup!",
    details: "Detaily objednávky vám pošleme na email.",
    orderId: "ID objednávky",
    paymentInstructions: "Inštrukcie na platbu",
    paymentNote: "Prosím, uveďte ID objednávky v poznámke k platbe.",
    nextSteps: "Čo ďalej?",
    nextStepsText: "Vaša objednávka bola rezervovaná. Prosím, dokončite platbu podľa nižšie uvedených inštrukcií. Vaša objednávka bude spracovaná po prijatí platby.",
    backToHome: "Späť na domovskú stránku",
  },
  en: {
    title: "Thank you for your order!",
    message: "Your order has been successfully created. Thank you for your purchase!",
    details: "Order details will be sent to your email.",
    orderId: "Order ID",
    paymentInstructions: "Payment Instructions",
    paymentNote: "Please include your Order ID in the payment reference.",
    nextSteps: "What's next?",
    nextStepsText: "Your order has been reserved. Please complete payment according to the instructions below. Your order will be processed once payment is received.",
    backToHome: "Back to Home",
  },
};

export default function SuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params.locale as string) || 'sk';
  const orderId = searchParams.get('orderId');
  const bankDetails = searchParams.get('bankDetails');
  const t = translations[locale as keyof typeof translations] || translations.sk;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center dark:border-green-800 dark:bg-green-900/20">
        <h1 className="mb-4 text-3xl font-bold text-green-800 dark:text-green-200">
          {t.title}
        </h1>
        <p className="mb-4 text-lg text-green-700 dark:text-green-300">
          {t.message}
        </p>
        {orderId && (
          <p className="mb-4 text-sm text-green-600 dark:text-green-400">
            <strong>{t.orderId}: {orderId}</strong>
          </p>
        )}
        
        {bankDetails && (
          <div className="mt-6 rounded-lg border border-blue-300 bg-blue-50 p-6 text-left dark:border-blue-700 dark:bg-blue-900/20">
            <h2 className="mb-3 text-lg font-semibold text-blue-800 dark:text-blue-200">
              {t.paymentInstructions}
            </h2>
            <div className="mb-3 whitespace-pre-line text-sm text-blue-700 dark:text-blue-300">
              {decodeURIComponent(bankDetails)}
            </div>
            {orderId && (
              <p className="text-xs text-blue-600 dark:text-blue-400 italic">
                {t.paymentNote}
              </p>
            )}
          </div>
        )}
        
        <div className="mt-8 rounded-lg border border-green-300 bg-white p-6 text-left dark:border-green-700 dark:bg-neutral-900">
          <h2 className="mb-2 text-lg font-semibold text-green-800 dark:text-green-200">
            {t.nextSteps}
          </h2>
          <p className="text-sm text-green-700 dark:text-green-300">
            {t.nextStepsText}
          </p>
        </div>
        <Link
          href={`/${locale}`}
          className="mt-6 inline-block bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium"
        >
          {t.backToHome}
        </Link>
      </div>
    </div>
  );
}

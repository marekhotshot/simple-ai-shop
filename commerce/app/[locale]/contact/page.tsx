"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL || "http://localhost:3000";

const translations = {
  sk: {
    title: "Kontakt",
    subtitle: "Máte otázky? Napíšte nám a my vám čoskoro odpovieme.",
    name: "Meno",
    email: "Email",
    message: "Správa",
    messagePlaceholder: "Napíšte nám vašu správu...",
    submit: "Odoslať správu",
    submitting: "Odosielam...",
    success: "Ďakujeme! Vaša správa bola odoslaná. Čoskoro sa vám ozveme.",
    backToHome: "Späť na domovskú stránku",
  },
  en: {
    title: "Contact",
    subtitle: "Have questions? Send us a message and we'll get back to you soon.",
    name: "Name",
    email: "Email",
    message: "Message",
    messagePlaceholder: "Write your message...",
    submit: "Send Message",
    submitting: "Sending...",
    success: "Thank you! Your message has been sent. We'll get back to you soon.",
    backToHome: "Back to Home",
  },
};

export default function ContactPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || 'sk';
  const t = translations[locale as keyof typeof translations] || translations.sk;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: "", email: "", message: "" });
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Something went wrong");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Error submitting contact form:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center dark:border-green-800 dark:bg-green-900/20">
          <h1 className="mb-4 text-2xl font-bold text-green-800 dark:text-green-200">{t.success}</h1>
          <Link
            href={`/${locale}`}
            className="mt-4 inline-block text-blue-600 hover:underline dark:text-blue-400"
          >
            {t.backToHome}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold">{t.title}</h1>
      <p className="mb-8 text-neutral-600 dark:text-neutral-400">{t.subtitle}</p>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">{t.name}</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-neutral-300 rounded-md dark:bg-neutral-800 dark:border-neutral-700"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t.email}</label>
          <input
            type="email"
            required
            className="w-full px-3 py-2 border border-neutral-300 rounded-md dark:bg-neutral-800 dark:border-neutral-700"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t.message}</label>
          <textarea
            required
            rows={6}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md dark:bg-neutral-800 dark:border-neutral-700"
            placeholder={t.messagePlaceholder}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
        >
          {submitting ? t.submitting : t.submit}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href={`/${locale}`}
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          {t.backToHome}
        </Link>
      </div>
    </div>
  );
}

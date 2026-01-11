"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL || "http://localhost:3000";

const translations = {
  sk: {
    title: "Hľadáte kus na mieru?",
    subtitle: "Igor privíta zákazku na mieru — či už ide o darček, osobnú víziu alebo reprodukciu štýlu, ktorý vidíte v obchode.",
    body: "Zdieľajte svoju predstavu nižšie a ozveme sa vám do 48 hodín.",
    name: "Meno",
    email: "Email",
    idea: "Nápad alebo téma",
    ideaPlaceholder: "Opíšte svoju predstavu...",
    size: "Požadovaná veľkosť / rozmery",
    sizePlaceholder: "napr. 30x20 cm",
    photos: "Referenčné fotky (voliteľné)",
    photosNote: "Môžete pridať fotky neskôr",
    submit: "Odoslať požiadavku",
    submitting: "Odosielam...",
    success: "Ďakujeme! Vaša požiadavka bola odoslaná. Ozveme sa vám do 48 hodín.",
    backToHome: "Späť na domovskú stránku",
    referenceProduct: "Podobné produktu",
  },
  en: {
    title: "Looking for a Custom Piece?",
    subtitle: "Igor welcomes custom commissions — whether it's a gift, a personal vision, or a reproduction of a style you see in the shop.",
    body: "Share your idea below and we'll get back to you within 48 hours.",
    name: "Name",
    email: "Email",
    idea: "Idea or theme",
    ideaPlaceholder: "Describe your idea...",
    size: "Desired size / dimensions",
    sizePlaceholder: "e.g., 30x20 cm",
    photos: "Reference photos (optional)",
    photosNote: "You can add photos later",
    submit: "Submit Request",
    submitting: "Submitting...",
    success: "Thank you! Your request has been submitted. We'll get back to you within 48 hours.",
    backToHome: "Back to Home",
    referenceProduct: "Similar to product",
  },
};

export default function CustomRequestPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || 'sk';
  const t = translations[locale as keyof typeof translations] || translations.sk;

  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const referenceProductId = searchParams?.get('productId') || null;
  const referenceProductSlug = searchParams?.get('slug') || null;
  const category = searchParams?.get('category') || null;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    country: "",
    message: "",
    size: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Combine message with size information
    const fullMessage = `${formData.message}\n\n${t.size}: ${formData.size || 'N/A'}`;

    try {
      const response = await fetch(`${API_BASE_URL}/api/custom-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          country: formData.country,
          message: fullMessage,
          referenceProductId,
          referenceProductSlug,
          category: category as 'PAINTINGS' | 'SCULPTURES' | null,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: "", email: "", country: "", message: "", size: "" });
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Something went wrong");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Error submitting custom request:", err);
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
      <p className="mb-4 text-lg text-neutral-600 dark:text-neutral-400">{t.subtitle}</p>
      <p className="mb-8 text-neutral-600 dark:text-neutral-400">{t.body}</p>

      {referenceProductSlug && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {t.referenceProduct}: <strong>{referenceProductSlug}</strong>
          </p>
        </div>
      )}

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
          <label className="block text-sm font-medium mb-1">{t.idea}</label>
          <textarea
            required
            rows={6}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md dark:bg-neutral-800 dark:border-neutral-700"
            placeholder={t.ideaPlaceholder}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t.size}</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-neutral-300 rounded-md dark:bg-neutral-800 dark:border-neutral-700"
            placeholder={t.sizePlaceholder}
            value={formData.size}
            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t.photos}</label>
          <p className="text-sm text-neutral-500 mb-2">{t.photosNote}</p>
          <input
            type="file"
            multiple
            accept="image/*"
            className="w-full px-3 py-2 border border-neutral-300 rounded-md dark:bg-neutral-800 dark:border-neutral-700"
            disabled
          />
          <p className="mt-2 text-xs text-neutral-500">File upload functionality coming soon</p>
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

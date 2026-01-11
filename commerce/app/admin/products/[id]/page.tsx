"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL || "http://localhost:3000";

interface Product {
  id: string;
  slug: string;
  category: string;
  priceCents: number;
  status: string;
  translations: Array<{
    locale: string;
    title: string;
    descriptionShort: string;
  }>;
  images?: Array<{
    id: string;
    path: string;
    sortOrder: number;
  }>;
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    slug: "",
    category: "PAINTINGS" as "PAINTINGS" | "SCULPTURES" | "WALL_CARVINGS" | "FREE_STANDING" | "NATURE_INSPIRED" | "FANTASY_MYTH" | "CUSTOM",
    tags: [] as string[],
    priceCents: "",
    status: "AVAILABLE" as "AVAILABLE" | "SOLD" | "HIDDEN" | "RESERVED",
    size: "",
    finish: "",
    imageOrientation: "square" as "square" | "landscape" | "portrait",
    featured: false,
    translations: {
      sk: { title: "", descriptionShort: "" },
      en: { title: "", descriptionShort: "" },
    },
  });

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
        setFormData({
          slug: data.slug,
          category: data.category,
          tags: data.tags || [data.category], // Use tags array or fallback to category
          priceCents: (data.priceCents / 100).toString(),
          status: data.status,
          size: data.size || "",
          finish: data.finish || "",
          imageOrientation: data.imageOrientation || "square",
          featured: data.featured || false,
          translations: {
            sk: {
              title: data.translations.find((t: any) => t.locale === "sk")?.title || "",
              descriptionShort:
                data.translations.find((t: any) => t.locale === "sk")?.descriptionShort || "",
            },
            en: {
              title: data.translations.find((t: any) => t.locale === "en")?.title || "",
              descriptionShort:
                data.translations.find((t: any) => t.locale === "en")?.descriptionShort || "",
            },
          },
        });
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        slug: formData.slug,
        category: formData.category,
        tags: formData.tags.length > 0 ? formData.tags : [formData.category], // Send tags array
        priceCents: parseInt(formData.priceCents) * 100,
        status: formData.status,
        size: formData.size || null,
        finish: formData.finish || null,
        imageOrientation: formData.imageOrientation || null,
        featured: formData.featured,
        translations: [
          {
            locale: "sk",
            title: formData.translations.sk.title,
            descriptionShort: formData.translations.sk.descriptionShort,
          },
          {
            locale: "en",
            title: formData.translations.en.title,
            descriptionShort: formData.translations.en.descriptionShort,
          },
        ],
      };

      const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Product updated successfully!");
        router.push("/admin");
      } else {
        const error = await response.json();
        alert(`Error: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Error updating product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sortOrder", "1");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/products/${productId}/images`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        alert("Image uploaded successfully!");
        fetchProduct();
      } else {
        alert("Error uploading image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error uploading image");
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/products/${productId}/images/${imageId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        alert("Image deleted successfully!");
        fetchProduct();
      } else {
        alert("Error deleting image");
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("Error deleting image");
    }
  };

  const handleProcessImage = async (imageId: string) => {
    const userPrompt = window.prompt("Enter AI processing instructions (e.g., 'Remove background and enhance quality', 'Create interior photo with this art', 'Remove bg and enhance quality'):\n\nLeave empty for default: Remove background and enhance quality");
    
    if (userPrompt === null) return; // User cancelled

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/ai/process-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          productId, 
          imageId,
          prompt: userPrompt.trim() || "Remove background and enhance quality"
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Image processing started! Job ID: ${data.jobId}\n\nThis will run in the background and create a new ENHANCED variant image when complete.`);
        fetchProduct(); // Refresh to show the new image when done
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to start image processing"}`);
      }
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Error starting image processing");
    }
  };

  const handleGenerateTitleAndDescription = async (locale: 'sk' | 'en') => {
    if (!product || !product.images || product.images.length === 0) {
      alert("Please upload at least one image first!");
      return;
    }

    const mainImageId = product.images[0]?.id;
    if (!mainImageId) {
      alert("No main image found!");
      return;
    }

    if (!confirm(`Generate title and description from main image for ${locale.toUpperCase()}?`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/ai/generate-title-description`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          productId, 
          imageId: mainImageId,
          locale 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.title && data.description) {
          // Update form data with generated content
          setFormData({
            ...formData,
            translations: {
              ...formData.translations,
              [locale]: {
                title: data.title,
                descriptionShort: data.description,
              },
            },
          });
          alert(`Title and description generated!\n\nTitle: ${data.title}\n\nDescription: ${data.description.substring(0, 100)}...\n\nPlease review and adjust before saving.`);
        } else {
          alert(`Generation started! Job ID: ${data.jobId}\n\nThis will run in the background. Check job status later.`);
        }
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to generate title and description"}`);
      }
    } catch (error) {
      console.error("Error generating title/description:", error);
      alert("Error generating title and description");
    }
  };

  const handleGenerateDescription = async (locale: 'sk' | 'en', hints: string = '') => {
    if (!confirm(`Generate AI description for ${locale.toUpperCase()}?`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/ai/generate-description`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, hints: hints || null }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Description generation started! Job ID: ${data.jobId}\n\nThis will run in the background. Check job status later.`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to start description generation"}`);
      }
    } catch (error) {
      console.error("Error generating description:", error);
      alert("Error starting description generation");
    }
  };

  const handleGenerateSocialCopy = async (locale: 'sk' | 'en', platform: 'facebook' | 'tiktok') => {
    if (!product) return;

    try {
      const translation = product.translations.find(t => t.locale === locale);
      if (!translation) {
        alert(`No ${locale.toUpperCase()} translation found. Please add translations first.`);
        return;
      }

      const productUrl = `${window.location.origin}/${locale}/p/${product.slug}`;
      
      const response = await fetch(`${API_BASE_URL}/api/admin/social/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          locale,
          platform,
          title: translation.title,
          price: product.priceCents,
          url: productUrl,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const fullText = `${data.caption}\n\n${data.hashtags}`;
        navigator.clipboard.writeText(fullText).then(() => {
          alert(`Social copy generated and copied to clipboard!\n\n${fullText}`);
        }).catch(() => {
          alert(`Social copy generated:\n\n${fullText}`);
        });
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to generate social copy"}`);
      }
    } catch (error) {
      console.error("Error generating social copy:", error);
      alert("Error generating social copy");
    }
  };

  const handleGenerateShareImage = async (locale: 'sk' | 'en') => {
    if (!confirm(`Generate share image for ${locale.toUpperCase()}?`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/share-image/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, locale }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Share image generation started! Job ID: ${data.jobId}\n\nThis will run in the background. Check job status later.`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to start share image generation"}`);
      }
    } catch (error) {
      console.error("Error generating share image:", error);
      alert("Error starting share image generation");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
        <div className="max-w-4xl mx-auto">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
        <div className="max-w-4xl mx-auto">
          <p>Product not found</p>
          <Link href="/admin" className="text-blue-600 hover:underline">
            Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Admin
          </Link>
          <h1 className="text-3xl font-bold">Edit Product</h1>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Product Images</h2>
          <div className="mb-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {product.images?.map((image) => (
              <div key={image.id} className="relative group border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                <img
                  src={(() => {
                    if (image.path.startsWith('http')) return image.path;
                    let imagePath = image.path;
                    if (!imagePath.startsWith('/uploads')) {
                      imagePath = `/uploads${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
                    }
                    return `${API_BASE_URL}${imagePath}`;
                  })()}
                  alt="Product"
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    console.error('Image load error:', image.path, 'URL:', target.src);
                    target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3EImage%3C/text%3E%3C/svg%3E`;
                  }}
                />
                {/* Always visible X button for delete */}
                <button
                  onClick={() => handleDeleteImage(image.id)}
                  className="absolute top-1 right-1 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-700 shadow-lg text-xs font-bold"
                  title="Delete Image"
                >
                  ×
                </button>
                {/* Always visible AI enhance button */}
                <button
                  onClick={() => handleProcessImage(image.id)}
                  className="absolute top-1 left-1 bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-purple-700 shadow-lg"
                  title="AI Enhance Image"
                >
                  ✨ AI
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md dark:bg-neutral-700 dark:border-neutral-600"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md dark:bg-neutral-700 dark:border-neutral-600"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as typeof formData.category })
                  }
                >
                  <option value="PAINTINGS">Paintings</option>
                  <option value="SCULPTURES">Sculptures</option>
                  <option value="WALL_CARVINGS">Wall Carvings</option>
                  <option value="FREE_STANDING">Free-Standing Sculptures</option>
                  <option value="NATURE_INSPIRED">Nature-Inspired</option>
                  <option value="FANTASY_MYTH">Fantasy & Myth</option>
                  <option value="CUSTOM">Custom Orders</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Price (EUR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md dark:bg-neutral-700 dark:border-neutral-600"
                  value={formData.priceCents}
                  onChange={(e) => setFormData({ ...formData, priceCents: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md dark:bg-neutral-700 dark:border-neutral-600"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as "AVAILABLE" | "SOLD" | "HIDDEN" | "RESERVED",
                    })
                  }
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="SOLD">Sold</option>
                  <option value="HIDDEN">Hidden</option>
                </select>
              </div>
              <div className="flex items-center">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        featured: e.target.checked,
                      })
                    }
                    className="rounded border-neutral-300"
                  />
                  <span className="text-sm font-medium">Featured</span>
                </label>
                <span className="ml-2 text-xs text-neutral-500">
                  (Shown on top)
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Categories/Tags (Multiple Selection)</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'WALL_CARVINGS', label: 'Wall Carvings' },
                  { value: 'FREE_STANDING', label: 'Free-Standing Sculptures' },
                  { value: 'NATURE_INSPIRED', label: 'Nature-Inspired' },
                  { value: 'FANTASY_MYTH', label: 'Fantasy & Myth' },
                  { value: 'CUSTOM', label: 'Custom Orders' },
                  { value: 'PAINTINGS', label: 'Paintings' },
                  { value: 'SCULPTURES', label: 'Sculptures' },
                ].map((cat) => (
                  <label key={cat.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.tags.includes(cat.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            tags: [...formData.tags, cat.value],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            tags: formData.tags.filter(t => t !== cat.value),
                          });
                        }
                      }}
                      className="rounded border-neutral-300"
                    />
                    <span className="text-sm">{cat.label}</span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                Select multiple categories/tags. Products will appear in all selected categories.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Size / Veľkosť</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md dark:bg-neutral-700 dark:border-neutral-600"
                  placeholder="e.g., 30x30 cm"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Finish / Povrchová úprava</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md dark:bg-neutral-700 dark:border-neutral-600"
                  placeholder="e.g., Natural / Light Oil"
                  value={formData.finish}
                  onChange={(e) => setFormData({ ...formData, finish: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Image Orientation / Orientácia obrázka</label>
              <select
                className="w-full px-3 py-2 border border-neutral-300 rounded-md dark:bg-neutral-700 dark:border-neutral-600"
                value={formData.imageOrientation}
                onChange={(e) => setFormData({ ...formData, imageOrientation: e.target.value as "square" | "landscape" | "portrait" })}
              >
                <option value="square">Square (Štvorcový)</option>
                <option value="landscape">Landscape (Ležatý) - for wall carvings</option>
                <option value="portrait">Portrait (Stojatý) - for sculptures</option>
              </select>
            </div>

            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Slovak Translation</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleGenerateTitleAndDescription('sk')}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    title="Generate title and description from main image"
                  >
                    🖼️ Generate from Image
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateDescription('sk')}
                    className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    ✨ AI Generate Description
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title (SK)</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md dark:bg-neutral-700 dark:border-neutral-600"
                    value={formData.translations.sk.title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        translations: {
                          ...formData.translations,
                          sk: { ...formData.translations.sk, title: e.target.value },
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description (SK)</label>
                  <textarea
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md dark:bg-neutral-700 dark:border-neutral-600"
                    value={formData.translations.sk.descriptionShort}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        translations: {
                          ...formData.translations,
                          sk: { ...formData.translations.sk, descriptionShort: e.target.value },
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">English Translation</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleGenerateTitleAndDescription('en')}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    title="Generate title and description from main image"
                  >
                    🖼️ Generate from Image
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateDescription('en')}
                    className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    ✨ AI Generate Description
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title (EN)</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md dark:bg-neutral-700 dark:border-neutral-600"
                    value={formData.translations.en.title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        translations: {
                          ...formData.translations,
                          en: { ...formData.translations.en, title: e.target.value },
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description (EN)</label>
                  <textarea
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md dark:bg-neutral-700 dark:border-neutral-600"
                    value={formData.translations.en.descriptionShort}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        translations: {
                          ...formData.translations,
                          en: { ...formData.translations.en, descriptionShort: e.target.value },
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Link
                href="/admin"
                className="px-6 py-2 border border-neutral-300 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* AI Features Section */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">AI Features</h2>
          
          {/* Social Copy Generator */}
          <div className="mb-6 pb-6 border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="text-lg font-medium mb-3">Social Media Copy Generator</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Slovak (SK)</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerateSocialCopy('sk', 'facebook')}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Facebook Copy
                  </button>
                  <button
                    onClick={() => handleGenerateSocialCopy('sk', 'tiktok')}
                    className="px-4 py-2 bg-black text-white rounded hover:bg-neutral-800 text-sm"
                  >
                    TikTok Copy
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">English (EN)</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerateSocialCopy('en', 'facebook')}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Facebook Copy
                  </button>
                  <button
                    onClick={() => handleGenerateSocialCopy('en', 'tiktok')}
                    className="px-4 py-2 bg-black text-white rounded hover:bg-neutral-800 text-sm"
                  >
                    TikTok Copy
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-2">Generated copy will be copied to your clipboard</p>
          </div>

          {/* Share Image Generator */}
          <div>
            <h3 className="text-lg font-medium mb-3">Share Image Generator</h3>
            <div className="flex gap-4">
              <button
                onClick={() => handleGenerateShareImage('sk')}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
              >
                Generate SK Share Image
              </button>
              <button
                onClick={() => handleGenerateShareImage('en')}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
              >
                Generate EN Share Image
              </button>
            </div>
            <p className="text-xs text-neutral-500 mt-2">Generates optimized share images for social media (runs in background)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Determine API base URL - works for both local and live environments
// For local: uses NEXT_PUBLIC_EXPRESS_API_URL (http://localhost:3000)
// For live: uses NEXT_PUBLIC_EXPRESS_API_URL (https://igormraz.com) 
// Both work because the env var is set correctly in each environment
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

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"products" | "create" | "orders" | "requests" | "settings">("products");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/products`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        setError(`Failed to fetch products: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      console.error("Error fetching products:", error);
      if (error.message?.includes('fetch failed') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        setError(`❌ Backend server is not running or not accessible at ${API_BASE_URL}\n\nPlease start the backend server:\n  1. cd /workspaces/simple-ai-shop\n  2. ./run-local.sh (or ./run-all-local.sh)\n  3. Or: npx pnpm dev`);
      } else {
        setError(`Error fetching products: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/products/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error deleting product");
    }
  };

  if (loading && !error) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
        <div className="max-w-7xl mx-auto">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to Store
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            <h3 className="mb-2 font-semibold">Connection Error</h3>
            <pre className="whitespace-pre-wrap text-sm">{error}</pre>
            <button
              onClick={fetchProducts}
              className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        <div className="border-b border-neutral-200 dark:border-neutral-700 mb-6">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 font-medium ${
              activeTab === "products"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400"
            }`}
          >
            Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`px-4 py-2 font-medium ${
              activeTab === "create"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400"
            }`}
          >
            Create Product
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 font-medium ${
              activeTab === "orders"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400"
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 font-medium ${
              activeTab === "requests"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400"
            }`}
          >
            Custom Requests
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 font-medium ${
              activeTab === "settings"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400"
            }`}
          >
            Settings
          </button>
        </div>

        {activeTab === "products" && (
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Products</h2>
              <button
                onClick={async () => {
                  if (!confirm("Sync all available products to Stripe? This may take a moment.")) return;
                  try {
                    const response = await fetch(`${API_BASE_URL}/api/admin/products/sync-stripe-all`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ locale: 'en' }),
                    });
                    const data = await response.json();
                    if (response.ok) {
                      alert(`✅ Synced ${data.synced} products to Stripe${data.errors?.length > 0 ? `\n⚠️ ${data.errors.length} errors` : ''}`);
                      if (data.errors && data.errors.length > 0) {
                        console.error('Sync errors:', data.errors);
                      }
                    } else {
                      alert(`❌ Error: ${data.error || 'Failed to sync products'}`);
                    }
                  } catch (error) {
                    console.error("Error syncing products:", error);
                    alert("❌ Error syncing products to Stripe");
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Sync All to Stripe
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-100 dark:bg-neutral-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-neutral-500">
                        No products found. Create your first product!
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-neutral-900 dark:text-white">
                            {product.translations?.[0]?.title || product.slug}
                          </div>
                          <div className="text-sm text-neutral-500">{product.slug}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {product.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                          €{(product.priceCents / 100).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              product.status === "AVAILABLE"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : product.status === "SOLD"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                            }`}
                          >
                            {product.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={async () => {
                              if (!confirm(`Sync "${product.translations?.[0]?.title || product.slug}" to Stripe?`)) return;
                              try {
                                const response = await fetch(`${API_BASE_URL}/api/admin/products/${product.id}/sync-stripe`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ locale: 'en' }),
                                });
                                const data = await response.json();
                                if (response.ok) {
                                  alert(`✅ Product synced to Stripe!\nProduct ID: ${data.stripeProductId}\nPrice ID: ${data.stripePriceId}`);
                                } else {
                                  alert(`❌ Error: ${data.error || 'Failed to sync product'}`);
                                }
                              } catch (error) {
                                console.error("Error syncing product:", error);
                                alert("❌ Error syncing product to Stripe");
                              }
                            }}
                            className="text-green-600 hover:text-green-900 mr-4"
                            disabled={product.status !== "AVAILABLE" && product.status !== "RESERVED"}
                            title={product.status !== "AVAILABLE" && product.status !== "RESERVED" ? "Only available or reserved products can be synced" : "Sync to Stripe"}
                          >
                            Sync Stripe
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "create" && <CreateProductForm onSuccess={() => {
          setActiveTab("products");
          fetchProducts();
        }} />}

        {activeTab === "orders" && <OrdersTab />}
        {activeTab === "requests" && <RequestsTab />}
        {activeTab === "settings" && <SettingsTab />}
      </div>
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/admin/orders`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        setOrders(data.orders || []);
        setError(null);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching orders:", err);
        if (err.message?.includes('fetch failed') || err.message?.includes('ERR_CONNECTION_REFUSED')) {
          setError(`Backend server is not running at ${API_BASE_URL}`);
        } else {
          setError(`Error: ${err.message || 'Unknown error'}`);
        }
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-6">Loading orders...</div>;
  
  if (error) {
    return (
      <div className="p-6 rounded-lg border border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
        <p className="font-semibold mb-2">Connection Error</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-100 dark:bg-neutral-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-neutral-500">No orders found</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 text-sm">{order.id.slice(0, 8)}...</td>
                  <td className="px-6 py-4 text-sm">{order.productTitle || order.productSlug}</td>
                  <td className="px-6 py-4 text-sm">€{(order.amountCents / 100).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      order.status === "PAID" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RequestsTab() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/admin/requests`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        setRequests(data.requests || []);
        setError(null);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching requests:", err);
        if (err.message?.includes('fetch failed') || err.message?.includes('ERR_CONNECTION_REFUSED')) {
          setError(`Backend server is not running at ${API_BASE_URL}`);
        } else {
          setError(`Error: ${err.message || 'Unknown error'}`);
        }
        setLoading(false);
      });
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/requests/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setRequests(requests.map(r => r.id === id ? { ...r, status } : r));
      } else {
        alert(`Error updating status: ${res.status} ${res.statusText}`);
      }
    } catch (err: any) {
      console.error("Error updating status:", err);
      alert(`Error: ${err.message || 'Failed to update status'}`);
    }
  };

  if (loading) return <div className="p-6">Loading requests...</div>;
  
  if (error) {
    return (
      <div className="p-6 rounded-lg border border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
        <p className="font-semibold mb-2">Connection Error</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-100 dark:bg-neutral-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Message</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-neutral-500">No requests found</td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 text-sm">{request.name}</td>
                  <td className="px-6 py-4 text-sm">{request.email}</td>
                  <td className="px-6 py-4 text-sm max-w-xs truncate">{request.message}</td>
                  <td className="px-6 py-4 text-sm">
                    <select
                      value={request.status}
                      onChange={(e) => updateStatus(request.id, e.target.value)}
                      className="px-2 py-1 text-xs border rounded"
                    >
                      <option value="NEW">New</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm">{new Date(request.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm">
                    <Link href={`mailto:${request.email}`} className="text-blue-600 hover:underline">Email</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsTab() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    paypalMode: 'sandbox',
    paypalClientId: '',
    paypalClientSecret: '',
    stripeSecretKey: '',
    stripePublishableKey: '',
    googleApiKey: '',
    bankTransferDetails: '',
  });

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/admin/settings/integrations`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        setSettings(data.configured || {});
        // Load bank transfer details if configured
        const bankTransfer = data.configured?.['bank_transfer.details'];
        if (bankTransfer?.value) {
          setFormData(prev => ({ ...prev, bankTransferDetails: bankTransfer.value }));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching settings:", err);
        alert(`Failed to load settings: ${err.message}. Make sure the backend is running on ${API_BASE_URL}`);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const values: any = {};
      
      if (formData.paypalClientId) {
        values['paypal.sandbox.client_id'] = formData.paypalClientId;
      }
      if (formData.paypalClientSecret) {
        values['paypal.sandbox.client_secret'] = formData.paypalClientSecret;
      }
      if (formData.stripeSecretKey) {
        values['stripe.secret_key'] = formData.stripeSecretKey;
      }
      if (formData.stripePublishableKey) {
        values['stripe.publishable_key'] = formData.stripePublishableKey;
      }
      if (formData.googleApiKey) {
        values['google.api_key'] = formData.googleApiKey;
      }
      if (formData.bankTransferDetails) {
        values['bank_transfer.details'] = formData.bankTransferDetails;
      }

      const payload = {
        values,
        updatedBy: 'admin',
      };

      const response = await fetch(`${API_BASE_URL}/api/admin/settings/integrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Settings saved successfully!");
        setFormData({ paypalMode: 'sandbox', paypalClientId: '', paypalClientSecret: '', stripeSecretKey: '', stripePublishableKey: '', googleApiKey: '', bankTransferDetails: formData.bankTransferDetails });
        // Reload settings
        const res = await fetch(`${API_BASE_URL}/api/admin/settings/integrations`);
        const data = await res.json();
        setSettings(data.configured || {});
      } else {
        const error = await response.json();
        alert(`Error saving settings: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading settings...</div>;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Integration Settings</h2>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">PayPal</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mode</label>
              <select className="w-full px-3 py-2 border rounded dark:bg-neutral-700">
                <option value="sandbox">Sandbox</option>
                <option value="live">Live</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Client ID (Last 4: {settings['paypal.sandbox.client_id']?.last4 || 'N/A'})</label>
              <input 
                type="password" 
                className="w-full px-3 py-2 border rounded dark:bg-neutral-700"
                placeholder={settings['paypal.sandbox.client_id']?.last4 ? `Update Client ID (current ends with: ${settings['paypal.sandbox.client_id'].last4})` : "Enter PayPal Client ID"}
                value={formData.paypalClientId}
                onChange={(e) => setFormData({ ...formData, paypalClientId: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Client Secret (Last 4: {settings['paypal.sandbox.client_secret']?.last4 || 'N/A'})</label>
              <input 
                type="password" 
                className="w-full px-3 py-2 border rounded dark:bg-neutral-700"
                placeholder={settings['paypal.sandbox.client_secret']?.last4 ? `Update Client Secret (current ends with: ${settings['paypal.sandbox.client_secret'].last4})` : "Enter PayPal Client Secret"}
                value={formData.paypalClientSecret}
                onChange={(e) => setFormData({ ...formData, paypalClientSecret: e.target.value })}
              />
            </div>
            <button onClick={() => {
              fetch(`${API_BASE_URL}/api/admin/settings/integrations/test-paypal`, { method: 'POST' })
                .then(res => res.json())
                .then(data => alert(data.message || data.error))
                .catch(err => alert('Test failed'));
            }} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Test PayPal Connection
            </button>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">Stripe</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Secret Key (Last 4: {settings['stripe.secret_key']?.last4 || 'N/A'})</label>
              <input 
                type="password" 
                className="w-full px-3 py-2 border rounded dark:bg-neutral-700"
                placeholder={settings['stripe.secret_key']?.last4 ? `Update Secret Key (current ends with: ${settings['stripe.secret_key'].last4})` : "Enter Stripe Secret Key (sk_...)"}
                value={formData.stripeSecretKey}
                onChange={(e) => setFormData({ ...formData, stripeSecretKey: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Publishable Key (Last 4: {settings['stripe.publishable_key']?.last4 || 'N/A'})</label>
              <input 
                type="password" 
                className="w-full px-3 py-2 border rounded dark:bg-neutral-700"
                placeholder={settings['stripe.publishable_key']?.last4 ? `Update Publishable Key (current ends with: ${settings['stripe.publishable_key'].last4})` : "Enter Stripe Publishable Key (pk_...)"}
                value={formData.stripePublishableKey}
                onChange={(e) => setFormData({ ...formData, stripePublishableKey: e.target.value })}
              />
            </div>
            <button onClick={async () => {
              const secretKeyToTest = formData.stripeSecretKey;
              const publishableKeyToTest = formData.stripePublishableKey;
              
              if (!secretKeyToTest && !settings['stripe.secret_key']?.configured) {
                alert('Please enter a Secret Key in the field above first');
                return;
              }
              if (!publishableKeyToTest && !settings['stripe.publishable_key']?.configured) {
                alert('Please enter a Publishable Key in the field above first');
                return;
              }

              try {
                const res = await fetch(`${API_BASE_URL}/api/admin/settings/integrations/test-stripe`, { 
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    secretKey: secretKeyToTest || undefined,
                    publishableKey: publishableKeyToTest || undefined
                  })
                });
                const data = await res.json();
                if (data.ok) {
                  alert('✅ ' + (data.message || 'Stripe credentials are valid'));
                } else {
                  alert('❌ ' + (data.error || 'Test failed'));
                }
              } catch (err) {
                alert('❌ Test failed: ' + String(err));
              }
            }} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Test Stripe Connection
            </button>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">Google Gemini API</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">API Key (Last 4: {settings['google.api_key']?.last4 || 'N/A'})</label>
              <input 
                type="password" 
                className="w-full px-3 py-2 border rounded dark:bg-neutral-700"
                placeholder={settings['google.api_key']?.last4 ? `Update API key (current ends with: ${settings['google.api_key'].last4})` : "Enter Google Gemini API key"}
                value={formData.googleApiKey}
                onChange={(e) => setFormData({ ...formData, googleApiKey: e.target.value })}
              />
            </div>
            <button onClick={async () => {
              // Use form data if available (for testing before saving), otherwise it will use saved settings from backend
              const apiKeyToTest = formData.googleApiKey;
              
              if (!apiKeyToTest && !settings['google.api_key']?.isSet) {
                alert('Please enter an API key in the field above first');
                return;
              }

              try {
                const res = await fetch(`${API_BASE_URL}/api/admin/settings/integrations/test-google`, { 
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ apiKey: apiKeyToTest || undefined })
                });
                const data = await res.json();
                if (data.ok) {
                  alert('✅ ' + (data.message || 'Google API key is valid'));
                } else {
                  alert('❌ ' + (data.error || 'Test failed'));
                }
              } catch (err) {
                alert('❌ Test failed: ' + String(err));
              }
            }} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Test Google API Connection
            </button>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">Bank Transfer</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Bank Transfer Details</label>
              <textarea
                className="w-full px-3 py-2 border rounded dark:bg-neutral-700 min-h-[120px]"
                placeholder="Enter bank transfer details (account number, IBAN, bank name, etc.)"
                value={formData.bankTransferDetails}
                onChange={(e) => setFormData({ ...formData, bankTransferDetails: e.target.value })}
              />
              <p className="mt-2 text-sm text-neutral-500">
                This information will be displayed to customers after they place an order.
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateProductForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    slug: "",
    category: "PAINTINGS" as "PAINTINGS" | "SCULPTURES",
    priceCents: "",
    status: "AVAILABLE" as "AVAILABLE" | "SOLD" | "HIDDEN",
    translations: {
      sk: { title: "", descriptionShort: "" },
      en: { title: "", descriptionShort: "" },
    },
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        slug: formData.slug,
        category: formData.category,
        priceCents: parseInt(formData.priceCents) * 100,
        status: formData.status,
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

      const response = await fetch(`${API_BASE_URL}/api/admin/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Product created successfully!");
        setFormData({
          slug: "",
          category: "PAINTINGS",
          priceCents: "",
          status: "AVAILABLE",
          translations: {
            sk: { title: "", descriptionShort: "" },
            en: { title: "", descriptionShort: "" },
          },
        });
        onSuccess();
      } else {
        const error = await response.json();
        alert(`Error: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Error creating product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Create New Product</h2>
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
              placeholder="my-product-slug"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              className="w-full px-3 py-2 border border-neutral-300 rounded-md dark:bg-neutral-700 dark:border-neutral-600"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value as "PAINTINGS" | "SCULPTURES" })
              }
            >
              <option value="PAINTINGS">Paintings</option>
              <option value="SCULPTURES">Sculptures</option>
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
              placeholder="50.00"
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
                  status: e.target.value as "AVAILABLE" | "SOLD" | "HIDDEN",
                })
              }
            >
              <option value="AVAILABLE">Available</option>
              <option value="SOLD">Sold</option>
              <option value="HIDDEN">Hidden</option>
            </select>
          </div>
        </div>

        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6">
          <h3 className="text-lg font-semibold mb-4">Slovak Translation</h3>
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
          <h3 className="text-lg font-semibold mb-4">English Translation</h3>
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

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}

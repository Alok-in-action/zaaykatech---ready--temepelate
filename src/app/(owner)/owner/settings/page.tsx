'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getOwnerRestaurant,
  updateRestaurantDetails,
  publishRestaurantAction,
  unpublishRestaurantAction,
} from '@/actions/restaurant';

export default function SettingsPage() {
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [street, setStreet] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [pincode, setPincode] = useState<string>('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState<string>('');
  const [instagram, setInstagram] = useState<string>('');
  const [googleReview, setGoogleReview] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    async function loadRestaurant() {
      try {
        setInitialLoading(true);
        const res = await getOwnerRestaurant();
        if (res.success && res.restaurant) {
          const r = res.restaurant;
          setRestaurantId(r.id);
          setSlug(r.slug);
          setStatus((r.status === 'published' ? 'published' : 'draft'));
          setName(r.name || '');
          setPhone(r.contact?.phone || '');
          setWhatsapp(r.contact?.whatsapp || '');
          setStreet(r.address?.street || '');
          setCity(r.address?.city || '');
          setState(r.address?.state || '');
          setPincode(r.address?.pincode || '');
          setGoogleMapsUrl(r.address?.google_maps_url || '');
          setInstagram(r.social_links?.instagram || '');
          setGoogleReview(r.social_links?.google_review || '');
        } else {
          setFeedback({
            text: res.error || 'No restaurant found. Please create one in Setup Wizard.',
            type: 'error',
          });
        }
      } catch (err: unknown) {
        setFeedback({ text: (err as Error).message, type: 'error' });
      } finally {
        setInitialLoading(false);
      }
    }

    loadRestaurant();
  }, []);

  const handleSaveDetails = async () => {
    if (!restaurantId) {
      setFeedback({ text: 'Please wait until restaurant details are loaded.', type: 'error' });
      return;
    }
    setFeedback(null);
    setLoading(true);
    try {
      const res = await updateRestaurantDetails(restaurantId, {
        name,
        contact: { phone, whatsapp, email: null },
        address: { street, city, state, pincode, google_maps_url: googleMapsUrl },
        social_links: { instagram, facebook: null, google_review: googleReview },
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to save changes');
      }
      setFeedback({ text: 'Settings updated successfully!', type: 'success' });
    } catch (err: unknown) {
      setFeedback({ text: (err as Error).message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!restaurantId) {
      setFeedback({ text: 'Please wait until restaurant details are loaded.', type: 'error' });
      return;
    }
    setFeedback(null);
    setLoading(true);

    try {
      if (status === 'published') {
        // Unpublish
        const res = await unpublishRestaurantAction(restaurantId);
        if (!res.success) throw new Error(res.error || 'Failed to unpublish');
        setStatus('draft');
        setFeedback({
          text: 'Menu unpublished. Your public link is now offline while all your dishes and QR code are preserved.',
          type: 'success',
        });
      } else {
        // Publish
        const res = await publishRestaurantAction(restaurantId);
        if (!res.success) throw new Error(res.error || 'Failed to publish');
        setStatus('published');
        setFeedback({
          text: 'Menu published successfully! Your public QR menu is now live.',
          type: 'success',
        });
      }
    } catch (err: unknown) {
      setFeedback({ text: (err as Error).message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Header with Publish/Unpublish Status */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-serif text-2xl font-bold text-stone-900">Restaurant Settings</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                status === 'published'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-stone-100 text-stone-700'
              }`}
            >
              {status}
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Manage your public availability, contact channels, and restaurant profile details.
          </p>
        </div>

        <button
          onClick={handleTogglePublish}
          disabled={loading}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold shadow-sm transition-all disabled:opacity-60 ${
            status === 'published'
              ? 'bg-stone-900 hover:bg-stone-800 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {loading
            ? 'Processing...'
            : status === 'published'
            ? 'Unpublish Menu'
            : 'Publish Menu Live →'}
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 text-xs rounded-2xl border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* 2. Subscription & Plan Summary */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-stone-900">Subscription &amp; Billing</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Yearly Pro Plan is ₹2,999/year. Manual renewal only, zero recurring surprise debits.
          </p>
        </div>
        <Link
          href="/owner/billing"
          className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0"
        >
          <span>💳 Manage Plan &amp; Billing</span>
        </Link>
      </div>

      {/* 3. Permanent Public Slug Card (Correction 7) */}
      <div className="bg-stone-50 border border-stone-200/90 rounded-3xl p-6 sm:p-8 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
            <span>🔒 Permanent Restaurant Slug</span>
            <span className="text-[10px] bg-stone-200/80 text-stone-600 px-2 py-0.5 rounded-full uppercase">
              Immutable
            </span>
          </label>
        </div>
        <p className="text-xs font-mono bg-white p-3 rounded-2xl border border-stone-200 text-stone-700">
          /r/{slug}
        </p>
        <p className="text-[11px] text-stone-500 leading-relaxed">
          Your slug is permanent and cannot be modified after restaurant creation because physical QR code stickers, counter standees, and customer bookmarks point directly to this link.
        </p>
      </div>

      {/* 3. Profile & Contact Editor */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-4">
        <h2 className="font-serif text-lg font-bold text-stone-900">Profile &amp; Contact Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Restaurant Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-2xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-xs px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-2xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">WhatsApp Orders</label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full text-xs px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-2xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full text-xs px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-2xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Street Address</label>
            <input
              type="text"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className="w-full text-xs px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-2xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Google Maps URL</label>
            <input
              type="url"
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
              className="w-full text-xs px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-2xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Instagram URL</label>
            <input
              type="url"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="w-full text-xs px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-2xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Google Review URL</label>
            <input
              type="url"
              value={googleReview}
              onChange={(e) => setGoogleReview(e.target.value)}
              className="w-full text-xs px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-2xl"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={handleSaveDetails}
            disabled={loading}
            className="px-6 py-2.5 bg-[#8B4A27] hover:bg-[#723b1f] text-white text-xs font-bold rounded-2xl shadow-sm transition-all"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

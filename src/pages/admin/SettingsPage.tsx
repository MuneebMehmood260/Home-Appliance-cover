import React, { useState } from 'react';
import {
  Save,
  Store,
  MessageSquare,
  Truck,
  Shield,
  KeyRound,
  FileText,
  UploadCloud,
  CheckCircle2,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../lib/supabase';
import { SEO } from '../../components/common/SEO';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { changePassword } = useAuth();

  const [formData, setFormData] = useState({ ...settings });
  const [isSaving, setIsSaving] = useState(false);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'standard_delivery_fee' || name === 'free_delivery_threshold'
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings(formData);
      toast.success('Store settings saved! Changes are live on storefront.');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsChangingPass(true);
    try {
      const ok = await changePassword(newPassword);
      if (ok) {
        setNewPassword('');
        setConfirmPassword('');
      }
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await dbService.uploadImage(file, 'site-assets');
      setFormData((prev) => ({ ...prev, logo_url: url }));
      toast.success('Logo uploaded');
    } catch {
      toast.error('Failed to upload logo');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <SEO title="Store Settings" description="Configure shop name, currency, WhatsApp, and delivery fees." />

      {/* Header */}
      <div className="pb-4 border-b border-neutral-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
          Store & Commerce Settings
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Updates here reflect immediately across the customer storefront and WhatsApp order links.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-8 text-xs">
        {/* Section 1: General Brand Info */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-neutral-900 pb-2 border-b border-neutral-100">
            <Store className="w-4 h-4 text-neutral-800" />
            <span>Store Identity & Branding</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-700">Shop Brand Name</label>
              <input
                type="text"
                name="shop_name"
                value={formData.shop_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-hidden focus:border-neutral-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-700">Currency Symbol & Code</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="currency_symbol"
                  value={formData.currency_symbol}
                  onChange={handleInputChange}
                  placeholder="e.g. Rs."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-center font-bold"
                />
                <input
                  type="text"
                  name="currency_code"
                  value={formData.currency_code}
                  onChange={handleInputChange}
                  placeholder="e.g. PKR"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-center font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-neutral-700">Top Announcement Banner Text</label>
            <input
              type="text"
              name="announcement_text"
              value={formData.announcement_text}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-hidden"
            />
          </div>
        </div>

        {/* Section 2: Hero Presentation Copy */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-neutral-900 pb-2 border-b border-neutral-100">
            <FileText className="w-4 h-4 text-neutral-800" />
            <span>Homepage Hero Banner Copy</span>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-neutral-700">Hero Main Headline</label>
            <input
              type="text"
              name="hero_title"
              value={formData.hero_title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-hidden"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-neutral-700">Hero Subtitle Paragraph</label>
            <textarea
              name="hero_subtitle"
              rows={2}
              value={formData.hero_subtitle}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-hidden"
            />
          </div>
        </div>

        {/* Section 3: WhatsApp & Contact Details */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-neutral-900 pb-2 border-b border-neutral-100">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp & Contact Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-700">
                WhatsApp Number (with country code)
              </label>
              <input
                type="text"
                name="whatsapp_number"
                placeholder="923001234567"
                value={formData.whatsapp_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-mono focus:outline-hidden"
              />
              <span className="text-[10px] text-neutral-400">e.g. 923001234567 (no + or spaces)</span>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-700">Display Phone Number</label>
              <input
                type="text"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-700">Support Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-neutral-700">Physical Workshop / Shop Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-hidden"
            />
          </div>
        </div>

        {/* Section 4: Delivery Charges (Cash on Delivery) */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-neutral-900 pb-2 border-b border-neutral-100">
            <Truck className="w-4 h-4 text-neutral-800" />
            <span>Delivery & Courier Charges</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-700">
                Standard Nationwide Delivery Fee (PKR)
              </label>
              <input
                type="number"
                name="standard_delivery_fee"
                min="0"
                value={formData.standard_delivery_fee}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-bold tabular-nums"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-700">
                Free Delivery Order Threshold (PKR)
              </label>
              <input
                type="number"
                name="free_delivery_threshold"
                min="0"
                value={formData.free_delivery_threshold}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-bold tabular-nums"
              />
              <span className="text-[10px] text-neutral-400">Cart subtotal at which shipping becomes Rs. 0</span>
            </div>
          </div>
        </div>

        {/* Section 5: Footer & Social Links */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-neutral-900 pb-2 border-b border-neutral-100">
            <FileText className="w-4 h-4 text-neutral-800" />
            <span>Footer Text & Social Links</span>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-neutral-700">Footer Tagline</label>
            <textarea
              name="footer_text"
              rows={2}
              value={formData.footer_text}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-700">Facebook URL</label>
              <input
                type="url"
                name="facebook_url"
                value={formData.facebook_url || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-hidden"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-700">Instagram URL</label>
              <input
                type="url"
                name="instagram_url"
                value={formData.instagram_url || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Password Change Form */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-sm font-bold text-neutral-900 pb-2 border-b border-neutral-100">
          <KeyRound className="w-4 h-4 text-neutral-800" />
          <span>Change Administrator Password</span>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs max-w-md">
          <div className="space-y-1.5">
            <label className="font-semibold text-neutral-700">New Password (min 6 characters)</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-hidden focus:border-neutral-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-neutral-700">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-hidden focus:border-neutral-900"
            />
          </div>

          <button
            type="submit"
            disabled={isChangingPass}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-900 text-white rounded-lg text-xs font-semibold"
          >
            {isChangingPass ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

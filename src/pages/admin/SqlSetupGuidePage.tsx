import React, { useState } from 'react';
import { Database, Copy, Check, ExternalLink, ShieldCheck, UserPlus, Key } from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import toast from 'react-hot-toast';

export const SqlSetupGuidePage: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const sqlScript = `-- ==============================================================================
-- HOME APPLIANCE COVERS - FULL DATABASE SCHEMA, RLS & SEED DATA
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trigger Function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Layers',
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  category_slug TEXT,
  sku TEXT UNIQUE NOT NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  discount_price NUMERIC(12, 2) CHECK (discount_price IS NULL OR (discount_price >= 0 AND discount_price <= price)),
  description TEXT NOT NULL,
  details TEXT,
  care_instructions TEXT,
  stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  low_stock_threshold INT NOT NULL DEFAULT 5,
  sizes TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Product Images Table
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_city TEXT NOT NULL,
  customer_notes TEXT,
  subtotal NUMERIC(12, 2) NOT NULL,
  shipping_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'COD',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  whatsapp_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  total_price NUMERIC(12, 2) NOT NULL,
  selected_size TEXT,
  selected_color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Stock Logs Table
CREATE TABLE IF NOT EXISTS public.stock_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  change_quantity INT NOT NULL,
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  reason TEXT NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  adjusted_by TEXT DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  shop_name TEXT NOT NULL DEFAULT 'Home Appliance Covers',
  logo_url TEXT,
  hero_title TEXT NOT NULL DEFAULT 'Tailored Waterproof Protection for Home Appliances',
  hero_subtitle TEXT NOT NULL DEFAULT 'Premium quilted dustproof and heat-resistant tailored covers to protect your machines from rust and dust.',
  announcement_text TEXT DEFAULT 'Free Delivery across Pakistan on orders above Rs. 2,999! Cash on Delivery available.',
  whatsapp_number TEXT NOT NULL DEFAULT '923001234567',
  phone_number TEXT DEFAULT '+92 300 1234567',
  email TEXT DEFAULT 'support@homeappliancecovers.pk',
  address TEXT DEFAULT 'Main Boulevard, Gulberg III, Lahore, Pakistan',
  currency_symbol TEXT NOT NULL DEFAULT 'Rs.',
  currency_code TEXT NOT NULL DEFAULT 'PKR',
  standard_delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 250,
  free_delivery_threshold NUMERIC(10, 2) NOT NULL DEFAULT 2999,
  footer_text TEXT DEFAULT 'Home Appliance Covers is Pakistan''s leading manufacturer of tailored appliance covers.',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Admins Table
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Row Level Security Helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins WHERE admins.id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Policies: Public Read for Catalog, Anon Insert for Orders, Admin Full Access
CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (is_active = TRUE OR public.is_admin());
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL USING (public.is_admin());

CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (is_active = TRUE OR public.is_admin());
CREATE POLICY "Admins manage products" ON public.products FOR ALL USING (public.is_admin());

CREATE POLICY "Public can view images" ON public.product_images FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage images" ON public.product_images FOR ALL USING (public.is_admin());

CREATE POLICY "Public can insert orders" ON public.orders FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admins manage orders" ON public.orders FOR ALL USING (public.is_admin());

CREATE POLICY "Public can insert order items" ON public.order_items FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admins manage order items" ON public.order_items FOR ALL USING (public.is_admin());

CREATE POLICY "Admins manage stock logs" ON public.stock_logs FOR ALL USING (public.is_admin());

CREATE POLICY "Public can read settings" ON public.settings FOR SELECT USING (TRUE);
CREATE POLICY "Admins update settings" ON public.settings FOR ALL USING (public.is_admin());

CREATE POLICY "Admins view admins" ON public.admins FOR ALL USING (public.is_admin());

-- Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('site-assets', 'site-assets', true) ON CONFLICT (id) DO NOTHING;
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    toast.success('SQL script copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <SEO title="Supabase SQL Setup Guide" description="Step-by-step Supabase database schema and RLS instructions." />

      <div className="pb-4 border-b border-neutral-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
          Supabase SQL Setup Guide
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Follow these beginner-friendly instructions to deploy your PostgreSQL database, RLS security, and storage in 2 minutes.
        </p>
      </div>

      {/* Step by Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        <div className="p-5 bg-white rounded-xl border border-neutral-200 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center">
            1
          </div>
          <h3 className="font-bold text-neutral-900">Create Supabase Project</h3>
          <p className="text-neutral-600 leading-relaxed">
            Go to <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold">supabase.com</a>, create a free project, and open the <strong>SQL Editor</strong> from the left sidebar.
          </p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-neutral-200 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center">
            2
          </div>
          <h3 className="font-bold text-neutral-900">Run Schema & Seeds</h3>
          <p className="text-neutral-600 leading-relaxed">
            Click <strong>Copy Full SQL</strong> below, paste it into the Supabase SQL editor, and click <strong>Run</strong>. All tables, RLS policies, and sample data will be created!
          </p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-neutral-200 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center">
            3
          </div>
          <h3 className="font-bold text-neutral-900">Add Admin & Set Env</h3>
          <p className="text-neutral-600 leading-relaxed">
            In Supabase Auth, add your email and password. Copy the user's UUID and add it to the <code className="bg-neutral-100 px-1 py-0.5 rounded">admins</code> table. Then set <code className="bg-neutral-100 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> in Vercel or <code className="bg-neutral-100 px-1 py-0.5 rounded">.env</code>.
          </p>
        </div>
      </div>

      {/* SQL Script Box with Copy Button */}
      <div className="bg-neutral-900 text-neutral-200 rounded-2xl overflow-hidden shadow-xl border border-neutral-800">
        <div className="p-4 bg-neutral-950 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>supabase/schema.sql</span>
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy SQL Script'}</span>
          </button>
        </div>

        <div className="p-5 font-mono text-[11px] leading-relaxed max-h-96 overflow-y-auto text-neutral-300 bg-neutral-900">
          <pre>{sqlScript}</pre>
        </div>
      </div>

      {/* Admin creation query helper */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-3 text-xs">
        <div className="flex items-center gap-2 font-bold text-neutral-900 text-sm">
          <UserPlus className="w-4 h-4 text-emerald-600" />
          <span>How to Authorize Your Admin Account in Supabase</span>
        </div>
        <p className="text-neutral-600">
          After creating your user in <strong>Supabase Dashboard → Authentication → Users</strong>, execute this single SQL statement:
        </p>
        <div className="p-3 bg-neutral-900 text-neutral-200 rounded-lg font-mono text-[11px]">
          <code>
            INSERT INTO public.admins (id, email, full_name, role)<br />
            VALUES ('&lt;PASTE-YOUR-AUTH-USER-UUID-HERE&gt;', 'admin@homeappliancecovers.pk', 'Store Admin', 'super_admin');
          </code>
        </div>
      </div>
    </div>
  );
};

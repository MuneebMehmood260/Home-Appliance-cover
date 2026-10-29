-- ==============================================================================
-- HOME APPLIANCE COVERS - FULL DATABASE SCHEMA, RLS & SEED DATA
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing triggers and functions if re-running
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- 3. Trigger Function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 4. TABLES CREATION
-- ------------------------------------------------------------------------------

-- Categories Table
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

-- Products Table
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

-- Product Images Table
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders Table
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

-- Order Items Table
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

-- Stock Logs Table
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

-- Settings Table (Single-row configuration)
CREATE TABLE IF NOT EXISTS public.settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  shop_name TEXT NOT NULL DEFAULT 'Home Appliance Covers',
  logo_url TEXT,
  hero_title TEXT NOT NULL DEFAULT 'Tailored Waterproof Protection for Home Appliances',
  hero_subtitle TEXT NOT NULL DEFAULT 'Premium quilted dustproof and heat-resistant covers engineered to protect and prolong the lifespan of your washing machines, refrigerators, ACs, and ovens.',
  hero_banner_url TEXT,
  announcement_text TEXT DEFAULT 'Free Shipping across Pakistan on orders above Rs. 2,999! Cash on Delivery available nationwide.',
  whatsapp_number TEXT NOT NULL DEFAULT '923001234567',
  phone_number TEXT DEFAULT '+92 300 1234567',
  email TEXT DEFAULT 'support@homeappliancecovers.pk',
  address TEXT DEFAULT 'Main Boulevard, Gulberg III, Lahore, Pakistan',
  currency_symbol TEXT NOT NULL DEFAULT 'Rs.',
  currency_code TEXT NOT NULL DEFAULT 'PKR',
  standard_delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 250,
  free_delivery_threshold NUMERIC(10, 2) NOT NULL DEFAULT 2999,
  facebook_url TEXT DEFAULT 'https://facebook.com',
  instagram_url TEXT DEFAULT 'https://instagram.com',
  footer_text TEXT DEFAULT 'Home Appliance Covers is Pakistan''s trusted specialist in waterproof, scratch-proof, and aesthetic covers for modern home electronics and furniture.',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admins Table (Links to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. INDEXES FOR PERFORMANCE
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_logs_product_id ON public.stock_logs(product_id);

-- ------------------------------------------------------------------------------
-- 6. TRIGGERS FOR UPDATED_AT
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_categories_updated_at ON public.categories;
CREATE TRIGGER trigger_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;
CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_orders_updated_at ON public.orders;
CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_settings_updated_at ON public.settings;
CREATE TRIGGER trigger_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 7. SECURITY & ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins WHERE admins.id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- CATEGORIES POLICIES
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public can view active categories" ON public.categories
  FOR SELECT USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins full access to categories" ON public.categories;
CREATE POLICY "Admins full access to categories" ON public.categories
  FOR ALL USING (public.is_admin());

-- PRODUCTS POLICIES
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" ON public.products
  FOR SELECT USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins full access to products" ON public.products;
CREATE POLICY "Admins full access to products" ON public.products
  FOR ALL USING (public.is_admin());

-- PRODUCT IMAGES POLICIES
DROP POLICY IF EXISTS "Public can view product images" ON public.product_images;
CREATE POLICY "Public can view product images" ON public.product_images
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins full access to product images" ON public.product_images;
CREATE POLICY "Admins full access to product images" ON public.product_images
  FOR ALL USING (public.is_admin());

-- ORDERS POLICIES
-- Public (anonymous customers) can insert new orders during checkout
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
CREATE POLICY "Public can insert orders" ON public.orders
  FOR INSERT WITH CHECK (TRUE);

-- Only admins can read, update or delete orders
DROP POLICY IF EXISTS "Admins manage orders" ON public.orders;
CREATE POLICY "Admins manage orders" ON public.orders
  FOR ALL USING (public.is_admin());

-- ORDER ITEMS POLICIES
DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;
CREATE POLICY "Public can insert order items" ON public.order_items
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins manage order items" ON public.order_items;
CREATE POLICY "Admins manage order items" ON public.order_items
  FOR ALL USING (public.is_admin());

-- STOCK LOGS POLICIES
DROP POLICY IF EXISTS "Admins manage stock logs" ON public.stock_logs;
CREATE POLICY "Admins manage stock logs" ON public.stock_logs
  FOR ALL USING (public.is_admin());

-- SETTINGS POLICIES
DROP POLICY IF EXISTS "Public can read settings" ON public.settings;
CREATE POLICY "Public can read settings" ON public.settings
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins update settings" ON public.settings;
CREATE POLICY "Admins update settings" ON public.settings
  FOR ALL USING (public.is_admin());

-- ADMINS POLICIES
DROP POLICY IF EXISTS "Admins can view and manage admins" ON public.admins;
CREATE POLICY "Admins can view and manage admins" ON public.admins
  FOR ALL USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8. STORAGE BUCKETS (Product Images & Site Assets)
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS: Public can view images
DROP POLICY IF EXISTS "Public view product images" ON storage.objects;
CREATE POLICY "Public view product images" ON storage.objects
  FOR SELECT USING (bucket_id IN ('product-images', 'site-assets'));

-- Storage RLS: Admins can upload, update, delete
DROP POLICY IF EXISTS "Admins manage storage files" ON storage.objects;
CREATE POLICY "Admins manage storage files" ON storage.objects
  FOR ALL USING (
    bucket_id IN ('product-images', 'site-assets') AND
    public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- 9. SEED DATA (Default Settings, Categories, Products & Images)
-- ------------------------------------------------------------------------------

-- Insert default single-row settings
INSERT INTO public.settings (id, shop_name, hero_title, hero_subtitle, whatsapp_number, phone_number, email, address, currency_symbol, currency_code, standard_delivery_fee, free_delivery_threshold)
VALUES (
  1,
  'Home Appliance Covers',
  'Tailored Waterproof Protection for Home Appliances',
  'Premium quilted, waterproof and heat-resistant tailored covers to protect your valuable machines from dust, rust, and water stains.',
  '923001234567',
  '+92 300 1234567',
  'support@homeappliancecovers.pk',
  'Main Boulevard, Gulberg III, Lahore, Pakistan',
  'Rs.',
  'PKR',
  250,
  2999
) ON CONFLICT (id) DO UPDATE SET
  shop_name = EXCLUDED.shop_name,
  currency_symbol = EXCLUDED.currency_symbol;

-- Seed Categories
INSERT INTO public.categories (id, name, slug, description, icon, display_order)
VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Washing Machine Covers', 'washing-machine-covers', 'Top-load and front-load waterproof, zipper-fitted washing machine covers', 'Disc', 1),
  ('c2222222-2222-2222-2222-222222222222', 'Refrigerator Covers', 'refrigerator-covers', 'Single & double door fridge top protectors with utility side organizer pockets', 'Refrigerator', 2),
  ('c3333333-3333-3333-3333-333333333333', 'Air Conditioner Covers', 'air-conditioner-covers', 'Heavy-duty indoor and outdoor split AC weather protection sets', 'Wind', 3),
  ('c4444444-4444-4444-4444-444444444444', 'Microwave & Oven Covers', 'microwave-oven-covers', 'Heat-resistant dust covers with side glove and cutlery storage pouches', 'Flame', 4),
  ('c5555555-5555-5555-5555-555555555555', 'Living & Furniture Covers', 'living-furniture-covers', 'Protective quilted covers for sofas, LED TV screens, and water dispensers', 'Tv', 5),
  ('c6666666-6666-6666-6666-666666666666', 'Appliance Care & Cleaning', 'appliance-care-cleaning', 'Specialist microfiber machine wipes, anti-vibration rubber pads & cleaning packs', 'Sparkles', 6)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Seed Products
INSERT INTO public.products (
  id, name, slug, category_id, category_slug, sku, price, discount_price,
  description, details, care_instructions, stock_quantity, low_stock_threshold,
  sizes, colors, is_featured, is_active
) VALUES
(
  '91000000-0000-0000-0000-000000000001',
  'Automatic Top-Load Washing Machine Cover (Waterproof Quilted)',
  'automatic-top-load-washing-machine-cover',
  'c1111111-1111-1111-1111-111111111111',
  'washing-machine-covers',
  'WMC-TOP-01',
  2450,
  1950,
  'Tailored premium quilted waterproof cover engineered for automatic top-load washing machines. Features dual rust-proof zippers for hassle-free lid opening without removing the cover, plus dedicated water inlet hose cutouts.',
  'Compatible with Haier, Dawlance, Samsung, Kenwood, LG 6kg to 12kg models. Triple-layer fabric with water repellent outer surface and scratch-proof inner lining.',
  'Wipe clean with damp cloth. Do not bleach or iron. Mild soap solution recommended for tough spots.',
  42,
  5,
  ARRAY['6kg - 8kg Standard', '9kg - 12kg Jumbo'],
  ARRAY['Slate Grey', 'Midnight Navy', 'Warm Beige'],
  TRUE,
  TRUE
),
(
  '91000000-0000-0000-0000-000000000002',
  'Front-Load Washing Machine Heavy-Duty Zipper Cover',
  'front-load-washing-machine-heavy-duty-cover',
  'c1111111-1111-1111-1111-111111111111',
  'washing-machine-covers',
  'WMC-FRONT-02',
  2650,
  2150,
  'Fitted front-loader protector with full transparent or opaque zippered front flap. Protects the glass door, control panel, and body from detergent splashes, water dampness, and sun fading.',
  'Features back ventilation panel to allow motor heat dissipation while keeping rain and dust out.',
  'Hand sponge wash only. Dry in shade.',
  28,
  6,
  ARRAY['7kg Standard', '8.5kg - 10.5kg Heavy Duty'],
  ARRAY['Charcoal Dark', 'Graphite Silver'],
  TRUE,
  TRUE
),
(
  '91000000-0000-0000-0000-000000000003',
  'Double Door Refrigerator Cover with 6 Utility Pockets',
  'double-door-refrigerator-cover-utility-pockets',
  'c2222222-2222-2222-2222-222222222222',
  'refrigerator-covers',
  'RFC-DBL-01',
  1650,
  1350,
  'Multipurpose refrigerator top protector mat crafted with heavy polyester quilted weave. Includes 6 deep side pockets (3 on each side) to hold recipes, note pads, bottle openers, and kitchen utensils conveniently.',
  'Size: 52 x 130 cm. Anti-skid textured backing prevents sliding during door opening.',
  'Gentle hand wash in cold water or wipe clean.',
  65,
  8,
  ARRAY['Standard Double Door (12-16 cu.ft)', 'Large Inverter (18-22 cu.ft)'],
  ARRAY['Moroccan Geometric', 'Navy Floral', 'Classic Grey Plaid'],
  TRUE,
  TRUE
),
(
  '91000000-0000-0000-0000-000000000004',
  'Full Refrigerator Protective Dust & Scratch Body Cover',
  'full-refrigerator-protective-body-cover',
  'c2222222-2222-2222-2222-222222222222',
  'refrigerator-covers',
  'RFC-FULL-02',
  2950,
  2450,
  'Complete 360-degree tailored refrigerator body cover designed for seasonal dust protection and home relocation safety. Features side access zippers so you can open doors freely.',
  'Crafted from waterproof PVC-coated Oxford parachute fabric with reinforced stress points.',
  'Spot clean with wet cloth.',
  18,
  4,
  ARRAY['Medium 12-14 cu.ft', 'Large 16-18 cu.ft'],
  ARRAY['Dark Grey', 'Beige Sand'],
  FALSE,
  TRUE
),
(
  '91000000-0000-0000-0000-000000000005',
  'All-Weather Split AC Outdoor + Indoor 2-in-1 Cover Set',
  'all-weather-split-ac-cover-set',
  'c3333333-3333-3333-3333-333333333333',
  'air-conditioner-covers',
  'ACC-SET-01',
  2800,
  2250,
  'Complete dual protection kit: 1 waterproof outdoor compressor cover with elastic toggle cords to protect against rain, dust, and rust, plus 1 elegant quilted indoor blower cover for winter shutdown.',
  'Heavyweight 600D weatherproof woven fabric with UV resistance coating prevents color fading.',
  'Wipe clean. Store folded in the provided pouch during summer operations.',
  35,
  5,
  ARRAY['1.0 Ton', '1.5 Ton', '2.0 Ton'],
  ARRAY['Military Khaki', 'Silver Metallic', 'Muted Grey'],
  TRUE,
  TRUE
),
(
  '91000000-0000-0000-0000-000000000006',
  'Microwave Oven Heat-Resistant Cover with Storage Pouch',
  'microwave-oven-heat-resistant-cover',
  'c4444444-4444-4444-4444-444444444444',
  'microwave-oven-covers',
  'MOC-STD-01',
  1250,
  950,
  'Tailored microwave oven protector mat with heat-resistant quilted top layer and side pockets for cooking gloves and timers. Keeps kitchen grease, steam, and airborne dust away from appliance vents.',
  'Dimensions: 35 x 90 cm. Soft cotton piping edges.',
  'Machine wash cold gentle cycle. Air dry flat.',
  50,
  10,
  ARRAY['Standard 20L - 25L', 'Large Convection 30L+'],
  ARRAY['Beige Linen', 'Coffee Brown', 'Charcoal Grid'],
  FALSE,
  TRUE
),
(
  '91000000-0000-0000-0000-000000000007',
  'Electric Baking Oven Dust & Oil Proof Fitted Shield',
  'electric-baking-oven-dust-oil-shield',
  'c4444444-4444-4444-4444-444444444444',
  'microwave-oven-covers',
  'EBO-FIT-02',
  1450,
  1150,
  'Form-fitting cover for standalone electric toaster ovens and rotisseries. High-grade oil-resistant parachute exterior prevents grease stains on countertop appliances.',
  'Universal fit for brands like Anex, Westpoint, Dawlance, Black & Decker.',
  'Hand wash with dishwashing liquid and warm water.',
  24,
  5,
  ARRAY['28L - 35L', '45L - 60L Jumbo'],
  ARRAY['Matte Black', 'Steel Grey'],
  FALSE,
  TRUE
),
(
  '91000000-0000-0000-0000-000000000008',
  'LED TV Screen & Frame Velvet Protective Dust Cover',
  'led-tv-screen-velvet-dust-cover',
  'c5555555-5555-5555-5555-555555555555',
  'living-furniture-covers',
  'TVC-VEL-01',
  1850,
  1450,
  'Ultra-soft stretch velvet TV cover that guards your LED/OLED television display against accidental scratches, pet hair, and airborne dust particles. Bottom elastic band stays securely fitted.',
  'Does not cause static buildup on fragile screen panels.',
  'Hand wash cold only. Do not wring.',
  30,
  4,
  ARRAY['43 Inch', '50-55 Inch', '65 Inch Ultra'],
  ARRAY['Royal Emerald', 'Deep Navy', 'Smoke Grey'],
  TRUE,
  TRUE
),
(
  '91000000-0000-0000-0000-000000000009',
  'Anti-Vibration Silent Rubber Pads for Washing Machines (4 Pcs)',
  'anti-vibration-silent-rubber-pads-washing-machine',
  'c6666666-6666-6666-6666-666666666666',
  'appliance-care-cleaning',
  'ACP-PAD-01',
  950,
  750,
  'Industrial-grade shock absorbing rubber pads designed to eliminate loud shaking, spin-cycle walking, and floor scratches under washing machines and refrigerators.',
  'Pack of 4 heavy duty suction pads with honeycomb vibration absorption core.',
  'Simply wipe with soap and water.',
  85,
  15,
  ARRAY['Universal 4-Pack Set'],
  ARRAY['Industrial Black'],
  TRUE,
  TRUE
),
(
  '91000000-0000-0000-0000-000000000010',
  'Ultimate Appliance Care & Stainless Steel Microfiber Kit',
  'appliance-care-stainless-steel-microfiber-kit',
  'c6666666-6666-6666-6666-666666666666',
  'appliance-care-cleaning',
  'ACP-KIT-02',
  1200,
  890,
  'Lint-free dual-weave microfiber cloth bundle with anti-static cleaner spray nozzle. Ideal for buffing chrome, refrigerator doors, washing machine panels, and microwave glass without streaks.',
  'Kit contains 3 ultra-dense 400GSM microfiber towels + 1 specialized detailing brush.',
  'Machine wash towels without fabric softener.',
  40,
  8,
  ARRAY['Deluxe Cleaning Bundle'],
  ARRAY['Assorted Duo-Tone'],
  FALSE,
  TRUE
)
ON CONFLICT (sku) DO UPDATE SET
  price = EXCLUDED.price,
  discount_price = EXCLUDED.discount_price,
  stock_quantity = EXCLUDED.stock_quantity;

-- Seed Images for products
INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary)
VALUES
  ('91000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=800&q=80', 'Automatic Top Load Washing Machine Cover', 1, TRUE),
  ('91000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=800&q=80', 'Front Load Washing Machine Zipper Cover', 1, TRUE),
  ('91000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80', 'Double Door Refrigerator Cover with Pockets', 1, TRUE),
  ('91000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80', 'Full Refrigerator Protective Dust Cover', 1, TRUE),
  ('91000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1614633837775-81232ceb4d52?auto=format&fit=crop&w=800&q=80', 'All Weather Split AC Cover Set', 1, TRUE),
  ('91000000-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=800&q=80', 'Microwave Oven Heat Resistant Dust Cover', 1, TRUE),
  ('91000000-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?auto=format&fit=crop&w=800&q=80', 'Electric Baking Oven Dust & Oil Proof Fitted Shield', 1, TRUE),
  ('91000000-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=800&q=80', 'LED TV Screen Velvet Dust Cover', 1, TRUE),
  ('91000000-0000-0000-0000-000000000009', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80', 'Anti Vibration Rubber Pads for Washing Machines', 1, TRUE),
  ('91000000-0000-0000-0000-000000000010', 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=800&q=80', 'Appliance Care & Stainless Steel Microfiber Kit', 1, TRUE)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------------------------
-- 10. HOW TO CREATE YOUR FIRST ADMIN USER IN SUPABASE
-- ------------------------------------------------------------------------------
-- Step 1: Sign up a user in your Supabase Auth dashboard (Authentication -> Users -> Add User)
--         e.g. Email: admin@homeappliancecovers.pk, Password: YourSecurePassword
-- Step 2: Copy the user UUID generated by Supabase Auth and execute the statement below:
--
-- INSERT INTO public.admins (id, email, full_name, role)
-- VALUES ('<PASTE-USER-UUID-HERE>', 'admin@homeappliancecovers.pk', 'Store Administrator', 'super_admin')
-- ON CONFLICT (id) DO NOTHING;
-- ==============================================================================

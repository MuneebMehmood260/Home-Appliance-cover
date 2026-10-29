# Home Appliance Covers (E-Commerce Storefront & Admin Portal)

A complete, production-ready e-commerce catalog and management application built for **Home Appliance Covers**. Features tailored waterproof & dustproof appliance protectors, customer cart & checkout with **Cash on Delivery (COD)** and **WhatsApp order integration**, plus a secure, full-featured **Admin Console** powered by Supabase.

---

## 🛠 Tech Stack

- **Frontend**: Vite + React 18/19 + TypeScript + React Router v7 + Tailwind CSS v4
- **Backend & Database**: [Supabase](https://supabase.com) (PostgreSQL database, Supabase Auth, Storage Buckets, and Row Level Security)
- **Libraries**:
  - `@supabase/supabase-js`: Official Supabase client for queries and authentication
  - `papaparse`: CSV parser for bulk catalog imports and exports
  - `xlsx`: Excel spreadsheet parser and exporter
  - `lucide-react`: Clean icons
  - `react-hot-toast`: Fast notifications
- **Zero Express / Node Server Required**: Pure client-side SPA ready for instant deployment on **Vercel**, Cloudflare Pages, Netlify, or AI Studio.

---

## 📁 Code Organization

```
/
├── supabase/
│   └── schema.sql                # Complete PostgreSQL tables, RLS policies, buckets, triggers & seeds
├── src/
│   ├── types/
│   │   └── index.ts              # TypeScript domain interfaces (Product, Category, Order, Settings, etc.)
│   ├── lib/
│   │   ├── constants.ts          # Default seed catalog (10 detailed products, Pakistan cities, PKR defaults)
│   │   └── supabase.ts           # Supabase client + resilient data service with fallback storage
│   ├── context/
│   │   ├── AuthContext.tsx       # Supabase Auth, admin verification, demo sandbox mode & password updater
│   │   ├── CartContext.tsx       # Persistent shopping cart, variant selection, steppers & calculations
│   │   └── SettingsContext.tsx   # Live store settings (currency, delivery fees, WhatsApp number, hero text)
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.tsx        # 3-Zone Top Bar Contract with mobile drawer & WhatsApp order trigger
│   │   │   ├── Footer.tsx        # Storefront footer with trust badges, address & quick links
│   │   │   ├── ProductCard.tsx   # Product card with price in PKR tabular nums & WhatsApp fast ordering
│   │   │   ├── CartDrawer.tsx    # Slide-over cart with free shipping bar & checkout trigger
│   │   │   ├── ImageWithFallback.tsx # Resilient image component adhering to Zero-Broken-Image policy
│   │   │   ├── SEO.tsx           # Dynamic title & meta description sync
│   │   │   └── SupabaseStatusBanner.tsx # Connection status indicator & quick setup guide link
│   │   └── admin/
│   │       ├── AdminLayout.tsx   # Admin dashboard shell with responsive sidebar & logout
│   │       ├── ProtectedRoute.tsx # Route guard checking user role in public.admins table
│   │       └── ImageUploader.tsx # Multi-image uploader (Supabase Storage / URL / previews)
│   ├── pages/
│   │   ├── public/
│   │   │   ├── HomePage.tsx      # Hero banner, category cards, featured products & quality guarantee
│   │   │   ├── ShopPage.tsx      # Search, category filter, in-stock filter, price sort & pagination
│   │   │   ├── ProductDetailPage.tsx # Contiguous purchase module, variant options & WhatsApp pre-filled order
│   │   │   ├── CheckoutPage.tsx  # Customer COD address form, order submission & printable receipt
│   │   │   ├── CategoriesPage.tsx # Appliance category index
│   │   │   ├── AboutPage.tsx     # Craftsmanship, fabric durability & workshop standards
│   │   │   ├── ContactPage.tsx   # Showroom address, phone hotline, and interactive inquiry form
│   │   │   └── NotFoundPage.tsx  # 404 recovery view
│   │   └── admin/
│   │       ├── AdminLoginPage.tsx # Supabase Auth login + quick demo fallback
│   │       ├── AdminDashboardPage.tsx # KPI metrics, low-stock warnings & recent orders
│   │       ├── ProductsManagerPage.tsx # Full CRUD, variant tags, image manager, active & featured switches
│   │       ├── CategoriesManagerPage.tsx # Category manager with reordering and active toggle
│   │       ├── InventoryPage.tsx # Inline quick stock updater, alerts, and stock audit history log
│   │       ├── OrdersManagerPage.tsx # Order processing, status updates, auto-stock deduction & print slips
│   │       ├── BulkImportPage.tsx # CSV / Excel browser parsing, row validator, sample download & export
│   │       ├── SettingsPage.tsx  # Live store settings editor & admin password change form
│   │       └── SqlSetupGuidePage.tsx # In-app copyable SQL script & instructions
│   ├── App.tsx                   # Master router assembling public & protected routes
│   ├── main.tsx                  # React entry point
│   └── index.css                 # Tailwind CSS v4 import, fonts & print slip styles
├── .env.example                  # Environment variable reference
├── vercel.json                   # SPA routing rewrite rule for Vercel
├── package.json
└── README.md
```

---

## 🚀 Beginner-Friendly Deployment Guide

Follow these simple steps to set up your own live database and deploy your storefront.

### Step 1: Create a Supabase Project

1. Visit [supabase.com](https://supabase.com) and sign in (or create a free account).
2. Click **"New Project"**, name it (e.g. `home-appliance-covers`), set a database password, and select your nearest region.
3. Once the project is provisioned (approx. 1–2 minutes), navigate to **Project Settings** (gear icon) → **API**.
4. Copy the two keys:
   - **Project URL** (e.g., `https://xyzcompany.supabase.co`)
   - **anon / public key** (e.g., `eyJhbGciOi...`)

### Step 2: Run Database Schema & Security Policies

1. In your Supabase Dashboard, click on **SQL Editor** in the left navigation.
2. Click **"New Query"**.
3. Open the file `supabase/schema.sql` from this codebase (or copy it directly from `/admin/sql-setup` inside the app).
4. Paste the entire SQL content into the Supabase SQL editor and click **Run**.
5. This automatically:
   - Creates all tables: `categories`, `products`, `product_images`, `orders`, `order_items`, `stock_logs`, `settings`, `admins`.
   - Enables **Row Level Security (RLS)** on all tables.
   - Creates public storage buckets: `product-images` and `site-assets`.
   - Sets triggers to automatically update `updated_at`.
   - Inserts default categories and 10 detailed starter products with realistic PKR prices.

### Step 3: Create the First Admin User

1. In Supabase Dashboard, go to **Authentication** → **Users**.
2. Click **"Add user"** → **"Create user"**.
3. Enter an email and password (e.g., `admin@homeappliancecovers.pk` and a secure password). Toggle **"Auto Confirm User?"** to `ON`, then click **Create user**.
4. After creating the user, copy their generated **User UID** (a UUID like `e4b09c21-9988-4444-...`).
5. Go back to the **SQL Editor** and run this single command (replace `<YOUR-USER-UID>` with the copied ID):

```sql
INSERT INTO public.admins (id, email, full_name, role)
VALUES ('<YOUR-USER-UID>', 'admin@homeappliancecovers.pk', 'Store Administrator', 'super_admin');
```

Only users listed in this `admins` table can access `/admin`. Any other logged-in user or anonymous visitor will be blocked by both the React route guard and Supabase Row Level Security.

### Step 4: Run Locally

1. Create a local `.env` file in the project root:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
2. Start the Vite dev server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` to view the customer storefront.
4. Open `http://localhost:3000/admin` to sign in to the Admin Panel!

> **Note**: If you run the app without Supabase keys, it automatically runs in **Local Sandbox Demo Mode** with persistent browser storage, seeded products, and test admin credentials (`admin@homeappliancecovers.pk` / `admin123`).

### Step 5: Deploy on Vercel

1. Push your repository to **GitHub**.
2. Go to [vercel.com](https://vercel.com) and click **"Add New..."** → **"Project"**.
3. Import your GitHub repository.
4. Keep the default build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon public key
6. Click **Deploy**. Vercel will build and deploy the app in under 1 minute.
7. The included `vercel.json` ensures that direct navigation and page reloads on routes like `/admin/products` or `/checkout` work seamlessly without 404 errors.

---

## 🧪 Final Verification Checklist

After deployment, verify all features:

- [x] **Storefront Browsing**: Visit homepage, view hero banner, check category filters, view product grid.
- [x] **Product Detail Page**: Test image gallery, select sizes/colors, adjust quantity, and click **"Order on WhatsApp"** to see pre-filled text.
- [x] **Shopping Cart & COD Checkout**: Add products to cart, view free delivery bar, enter shipping address and phone, and place order.
- [x] **Order Receipt & WhatsApp Sync**: Confirm receipt screen appears with order number and WhatsApp confirmation link.
- [x] **Admin Login**: Sign in with Supabase admin credentials at `/admin/login`.
- [x] **Product Management**: Add a new cover with multiple images and edit existing items.
- [x] **Inventory Quick Update & Audit Log**: Change stock levels inline on `/admin/inventory` and review the logged change in the audit trail.
- [x] **Order Fulfillment**: Change an order's status to **Confirmed** (stock is automatically reduced), and click **"Print Slip"** to preview the courier invoice.
- [x] **Bulk Import / Export**: Download the sample CSV, upload and test validation errors, or export the catalog to Excel.
- [x] **Store Settings**: Change shop name or WhatsApp number on `/admin/settings` and verify the storefront updates immediately.

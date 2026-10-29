import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Droplets, Wind, Sparkles, MessageSquare, CheckCircle2 } from 'lucide-react';
import { Product, Category } from '../../types';
import { dbService } from '../../lib/supabase';
import { useSettings } from '../../context/SettingsContext';
import { ProductCard } from '../../components/common/ProductCard';
import { SEO } from '../../components/common/SEO';

export const HomePage: React.FC = () => {
  const { settings, formatCurrency, getWhatsAppOrderUrl } = useSettings();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      setIsLoading(true);
      try {
        const [cats, prods] = await Promise.all([
          dbService.getCategories(),
          dbService.getProducts(),
        ]);
        setCategories(cats.filter((c) => c.is_active));
        setFeaturedProducts(prods.filter((p) => p.is_active && p.is_featured).slice(0, 6));
      } catch (err) {
        console.warn('Error loading home data', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadHomeData();
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      <SEO
        title="Home"
        description={settings.hero_subtitle}
      />

      {/* Hero Section */}
      <section className="relative bg-neutral-900 text-white overflow-hidden">
        {/* Subtle geometric grid background */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-3 py-1.5 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Pakistan's #1 Tailored Appliance Covers</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                {settings.hero_title}
              </h1>

              <p className="text-base sm:text-lg text-neutral-300 max-w-2xl leading-relaxed">
                {settings.hero_subtitle}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-neutral-900 rounded-lg text-sm font-bold hover:bg-neutral-100 transition-colors shadow-sm"
                >
                  <span>Explore Covers Catalog</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href={getWhatsAppOrderUrl('Hello! I would like to order a custom appliance cover.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-500 transition-colors"
                >
                  <MessageSquare className="w-4 h-4 fill-white" />
                  <span>WhatsApp Inquiry</span>
                </a>
              </div>

              {/* Trust markers row */}
              <div className="pt-6 border-t border-neutral-800 grid grid-cols-3 gap-4 text-xs text-neutral-400">
                <div>
                  <span className="block text-white font-bold text-sm">100% Waterproof</span>
                  <span>Quilted parachute & PVC</span>
                </div>
                <div>
                  <span className="block text-white font-bold text-sm">Cash on Delivery</span>
                  <span>Pay upon arrival</span>
                </div>
                <div>
                  <span className="block text-white font-bold text-sm">Custom Sizing</span>
                  <span>For all brand models</span>
                </div>
              </div>
            </div>

            {/* Visual Hero Feature Showcase Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl bg-neutral-800/80 border border-neutral-700 p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xs">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-700">
                  <div>
                    <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Top Recommendation</span>
                    <h3 className="text-base font-bold text-white mt-0.5">Automatic Top Load Cover</h3>
                  </div>
                  <span className="text-lg font-bold text-white tabular-nums">
                    {formatCurrency(1950)}
                  </span>
                </div>

                <div className="space-y-3 text-xs text-neutral-300">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Dual rust-free zippers allow instant lid opening without taking off the cover.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Waterproof quilted coating protects against wash-area splashes & motor dampness.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Compatible with Haier, Dawlance, Kenwood, LG, and Samsung 6kg to 12kg machines.</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to="/product/automatic-top-load-washing-machine-cover"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    <span>View Product Details & Order</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Tailored Collections</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight mt-1">
              Shop by Appliance
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-xs font-semibold text-neutral-900 hover:text-neutral-600 flex items-center gap-1.5 transition-colors"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="group p-4 bg-white rounded-xl border border-neutral-200 hover:border-neutral-900 hover:shadow-sm transition-all duration-200 flex flex-col justify-between text-center"
            >
              <div className="w-12 h-12 mx-auto rounded-lg bg-neutral-100 group-hover:bg-neutral-900 text-neutral-800 group-hover:text-white flex items-center justify-center transition-colors mb-3">
                <ShieldCheck className="w-6 h-6 stroke-[1.75]" />
              </div>
              <h3 className="text-xs font-bold text-neutral-900 group-hover:text-neutral-950 line-clamp-2 leading-tight">
                {cat.name}
              </h3>
              <span className="text-[11px] text-neutral-400 mt-2 font-medium">
                View Covers →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Handcrafted & Proven</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight mt-1">
              Featured Appliance Covers
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-xs font-semibold text-neutral-900 hover:text-neutral-600 flex items-center gap-1.5 transition-colors"
          >
            <span>Browse Full Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-neutral-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Why Choose Us Section */}
      <section className="bg-neutral-100 py-16 sm:py-20 border-y border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Built to Last</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
              Why Home Appliance Covers?
            </h2>
            <p className="text-sm text-neutral-600">
              Unlike cheap plastic sheets that tear and trap moisture, our covers are engineered with premium materials for maximum protection and ventilation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-xl border border-neutral-200 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Droplets className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-neutral-900">Triple-Layer Waterproof</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Repels continuous water drips, tap splashes, and dampness to eliminate rust formation on appliance metal bodies.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-neutral-200 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Wind className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-neutral-900">Motor Heat Dissipation</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Smart rear cutouts and mesh panels prevent motor overheating while blocking dust from settling in vents.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-neutral-200 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-neutral-900">Heavy-Duty Zippers</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Rust-proof nylon teeth zippers that glide smoothly for years, enabling instant appliance use without taking off the cover.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-neutral-200 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-neutral-900">7-Day Fit Guarantee</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                If the cover doesn't fit your appliance model properly, our team exchanges it with custom dimensions at no hassle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Custom Sizing CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-neutral-900 text-white p-8 sm:p-12 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Custom Sizing Available</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Have a Unique Appliance Size or Model?
            </h2>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Send us a photo or model number of your washing machine, refrigerator, or furniture on WhatsApp. Our master craftsmen tailor custom covers to your exact inch measurements.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <a
                href={getWhatsAppOrderUrl('Hello! I want a custom sized cover for my appliance. Here are the dimensions:')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors"
              >
                <MessageSquare className="w-4 h-4 fill-white" />
                <span>Message Custom Dimensions</span>
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold transition-colors"
              >
                <span>View Contact Details</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

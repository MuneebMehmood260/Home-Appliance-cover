import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles, Award, HeartHandshake, ArrowRight } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { SEO } from '../../components/common/SEO';

export const AboutPage: React.FC = () => {
  const { settings } = useSettings();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
      <SEO
        title="About Us"
        description="Learn about Home Appliance Covers, our craftsmanship, waterproof fabric testing, and commitment to household electronics protection."
      />

      {/* Hero section */}
      <div className="max-w-3xl space-y-4">
        <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Our Heritage</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-neutral-900 tracking-tight leading-tight">
          Crafting Tailored Protection for Everyday Modern Living
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
          Founded with a clear mission: to replace brittle, ill-fitting plastic sheets with durable, waterproof, and aesthetically tailored protective covers that safeguard valuable household machines from moisture, dust, sun bleaching, and rust.
        </p>
      </div>

      {/* 3 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 bg-white rounded-2xl border border-neutral-200 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900">Tailored Precision</h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Every pattern is cut to match the exact dimensional contours of Pakistani household appliances—including Haier, Dawlance, Samsung, Kenwood, and Orient models.
          </p>
        </div>

        <div className="p-8 bg-white rounded-2xl border border-neutral-200 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900">Triple-Layer Fabric</h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            We use high-grade 600D water-repellent oxford weave, internal scratch-free batting, and heavy PVC laminates designed to withstand humid balconies and washrooms.
          </p>
        </div>

        <div className="p-8 bg-white rounded-2xl border border-neutral-200 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900">Rust-Proof Hardware</h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            All zippers, pull toggles, and piping trims are selected for high moisture environments to ensure zero rust stains and smooth operation.
          </p>
        </div>
      </div>

      {/* Workshop & Standards */}
      <div className="bg-neutral-900 text-white rounded-2xl p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Quality Standards</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Designed for Humid Pakistani Climates & Dust Seasons
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            Dust storms and humid monsoon air are the primary causes of electrical board malfunctions and body rust in outdoor washing machines and split AC compressors. Our tailored covers protect internal components while allowing adequate motor heat dissipation through ventilation cutouts.
          </p>
          <div className="pt-2">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white text-neutral-900 rounded-lg text-xs font-bold hover:bg-neutral-100 transition-colors"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="space-y-4 text-xs text-neutral-300 border-l border-neutral-800 lg:pl-8">
          <div className="flex items-start gap-3">
            <HeartHandshake className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-white font-bold">50,000+ Happy Homes Protected</h4>
              <p className="text-neutral-400">Delivering nationwide across Karachi, Lahore, Islamabad, and 100+ cities.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <HeartHandshake className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-white font-bold">Custom Dimensions on Request</h4>
              <p className="text-neutral-400">Can't find your model? Our master tailors cut custom sizes with zero extra delays.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

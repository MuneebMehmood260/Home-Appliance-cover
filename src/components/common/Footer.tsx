import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, Phone, Mail, MapPin, MessageSquare, Lock } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export const Footer: React.FC = () => {
  const { settings, getWhatsAppOrderUrl } = useSettings();

  return (
    <footer className="bg-neutral-900 text-neutral-300 pt-16 pb-12 border-t border-neutral-800">
      {/* Trust Highlights Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 rounded-2xl bg-neutral-800/60 border border-neutral-800">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-neutral-700/50 text-white shrink-0">
              <Truck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Cash on Delivery</h4>
              <p className="text-xs text-neutral-400 mt-0.5">Pay upon inspection at your doorstep nationwide.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-neutral-700/50 text-white shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Waterproof Fabric</h4>
              <p className="text-xs text-neutral-400 mt-0.5">Heavy-duty quilted parachute & PVC protection.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-neutral-700/50 text-white shrink-0">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">WhatsApp Ordering</h4>
              <p className="text-xs text-neutral-400 mt-0.5">Instant size confirmation & order tracking.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-neutral-700/50 text-white shrink-0">
              <Lock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Tailored Fit Guarantee</h4>
              <p className="text-xs text-neutral-400 mt-0.5">Custom dimensions for all major appliance brands.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-neutral-800">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-white text-neutral-900 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5 text-neutral-900" />
              </span>
              <span className="text-lg font-bold text-white tracking-tight">
                {settings.shop_name}
              </span>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-sm">
              {settings.footer_text}
            </p>
            <div className="pt-2">
              <a
                href={getWhatsAppOrderUrl('Hello! I would like help choosing the right size cover.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 fill-white" />
                <span>Chat on WhatsApp ({settings.whatsapp_number})</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-white">Navigation</h5>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-white transition-colors">Shop All Covers</Link>
              </li>
              <li>
                <Link to="/categories" className="hover:text-white transition-colors">Categories</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">Contact & Location</Link>
              </li>
            </ul>
          </div>

          {/* Popular Categories */}
          <div className="space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-white">Categories</h5>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>
                <Link to="/shop?category=washing-machine-covers" className="hover:text-white transition-colors">Washing Machines</Link>
              </li>
              <li>
                <Link to="/shop?category=refrigerator-covers" className="hover:text-white transition-colors">Refrigerator Covers</Link>
              </li>
              <li>
                <Link to="/shop?category=air-conditioner-covers" className="hover:text-white transition-colors">Split AC Covers</Link>
              </li>
              <li>
                <Link to="/shop?category=microwave-oven-covers" className="hover:text-white transition-colors">Microwave & Ovens</Link>
              </li>
              <li>
                <Link to="/shop?category=appliance-care-cleaning" className="hover:text-white transition-colors">Care & Cleaning</Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-white">Store Address</h5>
            <div className="space-y-2.5 text-xs text-neutral-400">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                <span>{settings.address}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-neutral-400 shrink-0" />
                <span>{settings.phone_number}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-neutral-400 shrink-0" />
                <span>{settings.email}</span>
              </p>
              <div className="pt-2">
                <Link
                  to="/admin"
                  className="text-neutral-500 hover:text-neutral-300 text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Lock className="w-3 h-3" />
                  <span>Admin Login</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
          <p>© {new Date().getFullYear()} {settings.shop_name}. All rights reserved. Cash on Delivery across Pakistan.</p>
          <div className="flex items-center gap-6">
            <span>Waterproof Guarantee</span>
            <span>·</span>
            <span>Easy 7-Day Exchange</span>
            <span>·</span>
            <Link to="/admin/sql-setup" className="hover:text-neutral-300 underline">
              Supabase SQL Guide
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

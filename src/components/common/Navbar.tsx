import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, MessageSquare, Menu, X, Shield, Phone } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';

export const Navbar: React.FC = () => {
  const { itemCount, setIsCartOpen } = useCart();
  const { settings, getWhatsAppOrderUrl } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const location = useLocation();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Shop All', path: '/shop' },
    { label: 'Categories', path: '/categories' },
    { label: 'About Us', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      {/* Optional Slim Announcement Bar */}
      {showAnnouncement && settings.announcement_text && (
        <div className="bg-neutral-900 text-white text-xs py-2 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <p className="text-center w-full sm:text-left text-neutral-200 font-medium tracking-tight">
              {settings.announcement_text}
            </p>
            <button
              onClick={() => setShowAnnouncement(false)}
              className="text-neutral-400 hover:text-white transition-colors ml-4 hidden sm:inline"
              aria-label="Dismiss announcement"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 3-Zone Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Brand Wordmark (Single Text Element) */}
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-neutral-900 whitespace-nowrap shrink-0 group"
          >
            <span className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center transition-transform group-hover:scale-105">
              <Shield className="w-4 h-4 fill-white" />
            </span>
            <span>{settings.shop_name || 'Home Appliance Covers'}</span>
          </Link>

          {/* Zone 2: 4-5 Concise Single-Line Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-600">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                  isActive(link.path)
                    ? 'text-neutral-900 font-semibold border-b-2 border-neutral-900'
                    : 'hover:text-neutral-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Zone 3: Primary Action & Quick WhatsApp & Cart Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            {/* WhatsApp Quick Order button */}
            <a
              href={getWhatsAppOrderUrl('Hello! I would like to inquire about home appliance covers.')}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors whitespace-nowrap"
              title="Chat on WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
              <span>WhatsApp Help</span>
            </a>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 text-neutral-800 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors flex items-center justify-center"
              aria-label={`Cart with ${itemCount} items`}
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-neutral-900 text-white text-[11px] font-bold rounded-full flex items-center justify-center tabular-nums shadow-xs">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden text-neutral-700 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive(link.path)
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="pt-3 border-t border-neutral-100 flex flex-col gap-2">
            <a
              href={getWhatsAppOrderUrl('Hello! I would like to inquire about home appliance covers.')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>Order via WhatsApp</span>
            </a>

            {settings.phone_number && (
              <a
                href={`tel:${settings.phone_number.replace(/\s+/g, '')}`}
                className="flex items-center justify-center gap-2 w-full py-2 px-4 text-xs text-neutral-600 hover:text-neutral-900"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Us: {settings.phone_number}</span>
              </a>
            )}

            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center text-xs text-neutral-400 hover:text-neutral-600 py-1"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

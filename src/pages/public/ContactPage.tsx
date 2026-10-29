import React, { useState } from 'react';
import { MessageSquare, Phone, Mail, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { SEO } from '../../components/common/SEO';
import toast from 'react-hot-toast';

export const ContactPage: React.FC = () => {
  const { settings, getWhatsAppOrderUrl } = useSettings();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    subject: 'Size Inquiry',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.message.trim()) {
      toast.error('Please complete all required fields.');
      return;
    }

    const waText = `*NEW CONTACT INQUIRY - ${settings.shop_name}*\n\n` +
      `*Name:* ${formData.name}\n` +
      `*Phone:* ${formData.phone}\n` +
      `*Subject:* ${formData.subject}\n` +
      `*Message:* ${formData.message}\n`;

    window.open(getWhatsAppOrderUrl(waText), '_blank');
    setSubmitted(true);
    toast.success('Opening WhatsApp to send your inquiry...');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-14">
      <SEO
        title="Contact & Support"
        description="Get in touch with Home Appliance Covers for orders, custom measurements, and wholesale inquiries."
      />

      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Customer Support</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
          We're Here to Help You Find the Perfect Fit
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
          Need sizing recommendations, custom measurements, or order tracking updates? Contact our team directly via WhatsApp, phone, or visit our showroom.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Contact Details Cards */}
        <div className="lg:col-span-5 space-y-4">
          {/* WhatsApp Primary Card */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <MessageSquare className="w-5 h-5 fill-emerald-600 text-emerald-600" />
              <span>WhatsApp Instant Support (Fastest)</span>
            </div>
            <p className="text-xs text-emerald-900/80 leading-relaxed">
              Send appliance photos or dimensions directly to our master tailor team for instant guidance.
            </p>
            <a
              href={getWhatsAppOrderUrl('Hello! I need assistance with appliance covers.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors"
            >
              <span>Chat on WhatsApp: {settings.whatsapp_number}</span>
            </a>
          </div>

          {/* Details list */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4 text-xs text-neutral-700">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
              <div>
                <span className="block font-bold text-neutral-900">Showroom & Workshop</span>
                <span className="text-neutral-500">{settings.address}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
              <div>
                <span className="block font-bold text-neutral-900">Phone Hotline</span>
                <span className="text-neutral-500">{settings.phone_number}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
              <div>
                <span className="block font-bold text-neutral-900">Email Address</span>
                <span className="text-neutral-500">{settings.email}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
              <div>
                <span className="block font-bold text-neutral-900">Operating Hours</span>
                <span className="text-neutral-500">Mon - Sat: 9:00 AM - 8:00 PM (PKT)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Interactive Inquiry Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200 space-y-6">
          <div>
            <h2 className="text-base font-bold text-neutral-900">Send an Online Inquiry</h2>
            <p className="text-xs text-neutral-500">Fill in the details below and we will connect with you promptly.</p>
          </div>

          {submitted ? (
            <div className="p-8 text-center space-y-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600" />
              <h3 className="text-sm font-bold text-neutral-900">Inquiry Prepared</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Your message has been formatted. If WhatsApp did not open automatically, click the button below:
              </p>
              <a
                href={getWhatsAppOrderUrl(`Inquiry from ${formData.name}: ${formData.message}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
              >
                Send via WhatsApp
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-neutral-700">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tariq Mehmood"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:border-neutral-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-neutral-700">Phone / WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0321 9876543"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:border-neutral-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-700">Inquiry Subject</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:border-neutral-900 cursor-pointer"
                >
                  <option value="Size Inquiry">Appliance Sizing / Fit Inquiry</option>
                  <option value="Custom Size Order">Custom Dimensions Request</option>
                  <option value="Order Tracking">Existing Order Status</option>
                  <option value="Wholesale">Wholesale & Reseller Inquiries</option>
                  <option value="Other">Other Question</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-700">Appliance Model & Message *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your machine model (e.g. Dawlance 9kg Top-load washing machine) and your requirement..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:border-neutral-900"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Inquiry</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

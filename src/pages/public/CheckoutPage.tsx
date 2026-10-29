import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  MessageSquare,
  Printer,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { MAJOR_CITIES_PAKISTAN } from '../../lib/constants';
import { dbService } from '../../lib/supabase';
import { Order, OrderItem } from '../../types';
import { SEO } from '../../components/common/SEO';
import toast from 'react-hot-toast';

export const CheckoutPage: React.FC = () => {
  const { cart, subtotal, clearCart } = useCart();
  const { formatCurrency, calculateShipping, settings, getWhatsAppOrderUrl } = useSettings();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: 'Lahore',
    customCity: '',
    address: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const shippingFee = calculateShipping(subtotal);
  const grandTotal = subtotal + shippingFee;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    const cleanPhone = formData.phone.trim();
    if (cleanPhone.length < 10) {
      toast.error('Please enter a valid phone number for courier delivery');
      return;
    }

    if (!formData.address.trim()) {
      toast.error('Please provide your complete delivery street address');
      return;
    }

    const finalCity = formData.city === 'Other City' ? formData.customCity : formData.city;
    if (!finalCity.trim()) {
      toast.error('Please provide your city');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderItems: OrderItem[] = cart.map((item) => {
        const price = item.product.discount_price ?? item.product.price;
        return {
          product_id: item.product.id,
          product_name: item.product.name,
          product_sku: item.product.sku,
          unit_price: price,
          quantity: item.quantity,
          total_price: price * item.quantity,
          selected_size: item.selected_size,
          selected_color: item.selected_color,
        };
      });

      const orderPayload = {
        customer_name: formData.name.trim(),
        customer_phone: cleanPhone,
        customer_address: formData.address.trim(),
        customer_city: finalCity.trim(),
        customer_notes: formData.notes.trim() || undefined,
        subtotal,
        shipping_fee: shippingFee,
        discount_amount: 0,
        total_amount: grandTotal,
        payment_method: 'Cash on Delivery (COD)',
      };

      const result = await dbService.createOrder(orderPayload, orderItems);
      setCreatedOrder(result);
      clearCart();
      toast.success('Order placed successfully!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Order creation error:', err);
      toast.error('Failed to submit order. Please try again or order directly via WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateWhatsAppConfirmationMessage = (order: Order) => {
    let msg = `*ORDER CONFIRMATION - ${settings.shop_name}*\n\n`;
    msg += `*Order Number:* ${order.order_number}\n`;
    msg += `*Customer:* ${order.customer_name}\n`;
    msg += `*Phone:* ${order.customer_phone}\n`;
    msg += `*Delivery Address:* ${order.customer_address}, ${order.customer_city}\n\n`;
    msg += `*Ordered Items:*\n`;
    order.items?.forEach((item, idx) => {
      msg += `${idx + 1}. ${item.product_name}\n`;
      msg += `   Qty: ${item.quantity} | SKU: ${item.product_sku}`;
      if (item.selected_size) msg += ` | Size: ${item.selected_size}`;
      if (item.selected_color) msg += ` | Color: ${item.selected_color}`;
      msg += ` | Price: ${formatCurrency(item.total_price)}\n`;
    });
    msg += `\n*Subtotal:* ${formatCurrency(order.subtotal)}`;
    msg += `\n*Delivery Fee:* ${order.shipping_fee === 0 ? 'FREE' : formatCurrency(order.shipping_fee)}`;
    msg += `\n*Grand Total:* ${formatCurrency(order.total_amount)}`;
    msg += `\n*Payment Mode:* Cash on Delivery (COD)\n`;
    if (order.customer_notes) msg += `*Notes:* ${order.customer_notes}\n`;
    msg += `\nPlease process and dispatch my order!`;

    return msg;
  };

  // SUCCESS SCREEN
  if (createdOrder) {
    const waMessage = generateWhatsAppConfirmationMessage(createdOrder);
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 sm:py-20 space-y-8">
        <SEO title="Order Received" description="Your appliance cover order has been placed successfully." />

        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-10 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Thank you for your order!</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
              Order #{createdOrder.order_number} Received
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-lg mx-auto">
              Our fulfillment team in Lahore will verify your address and dispatch your covers via courier service. You can pay cash upon delivery.
            </p>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={getWhatsAppOrderUrl(waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>Confirm Order on WhatsApp</span>
            </a>

            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
          </div>

          {/* Order Summary Receipt Box */}
          <div className="text-left bg-neutral-50 rounded-xl p-5 border border-neutral-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
              <div>
                <span className="text-neutral-500 font-medium">Customer:</span>
                <p className="font-bold text-neutral-900">{createdOrder.customer_name}</p>
                <p className="text-neutral-600">{createdOrder.customer_phone}</p>
              </div>
              <div className="text-right">
                <span className="text-neutral-500 font-medium">Delivery Destination:</span>
                <p className="font-bold text-neutral-900">{createdOrder.customer_city}</p>
                <p className="text-neutral-600 max-w-xs">{createdOrder.customer_address}</p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-neutral-800">Items Ordered:</span>
              {createdOrder.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between text-neutral-700 py-1 border-b border-neutral-100 last:border-0">
                  <div>
                    <span className="font-medium text-neutral-900">{item.product_name}</span>
                    <span className="text-neutral-400 ml-2">× {item.quantity}</span>
                    {(item.selected_size || item.selected_color) && (
                      <p className="text-[11px] text-neutral-500">
                        {item.selected_size} {item.selected_size && item.selected_color && '·'} {item.selected_color}
                      </p>
                    )}
                  </div>
                  <span className="font-semibold text-neutral-900 tabular-nums">
                    {formatCurrency(item.total_price)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-neutral-200 space-y-1">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span className="tabular-nums font-medium">{formatCurrency(createdOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Delivery Charge</span>
                <span className="tabular-nums font-medium">
                  {createdOrder.shipping_fee === 0 ? 'FREE' : formatCurrency(createdOrder.shipping_fee)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-neutral-900 pt-1">
                <span>Total Due on Delivery</span>
                <span className="tabular-nums text-emerald-800 text-base">
                  {formatCurrency(createdOrder.total_amount)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/shop"
              className="text-xs font-semibold text-neutral-900 hover:text-neutral-600 underline"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // EMPTY CART GUARD
  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <SEO title="Checkout" description="Order appliance covers with Cash on Delivery." />
        <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900">Your Cart is Empty</h2>
        <p className="text-xs text-neutral-500">
          Please add tailored appliance covers to your cart before proceeding to checkout.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition-colors"
        >
          <span>Browse Covers Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      <SEO title="Checkout" description="Fast Cash on Delivery checkout across Pakistan." />

      <div className="border-b border-neutral-200 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
          Checkout & Delivery Details
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Pay with Cash on Delivery (COD) upon inspection at your doorstep.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Customer Address Form */}
        <form onSubmit={handleSubmitOrder} className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200 space-y-6">
          <div>
            <h2 className="text-base font-bold text-neutral-900">1. Customer Information</h2>
            <p className="text-xs text-neutral-500">Please provide accurate contact details for courier dispatch.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Muhammad Ali"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:border-neutral-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700">
                WhatsApp / Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                required
                placeholder="e.g. 0300 1234567"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:border-neutral-900"
              />
            </div>
          </div>

          <div>
            <h2 className="text-base font-bold text-neutral-900 pt-2">2. Delivery Address</h2>
            <p className="text-xs text-neutral-500">Where should we deliver your covers package?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700">
                City <span className="text-rose-500">*</span>
              </label>
              <select
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:border-neutral-900 cursor-pointer"
              >
                {MAJOR_CITIES_PAKISTAN.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {formData.city === 'Other City' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-700">
                  Specify City Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="customCity"
                  required
                  placeholder="Enter your town / city"
                  value={formData.customCity}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:border-neutral-900"
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700">
              Street Address, House #, Area <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="address"
              required
              placeholder="e.g. House 14-B, Street 3, Sector G-9/2"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:border-neutral-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700">
              Appliance Model Notes / Delivery Instructions (Optional)
            </label>
            <textarea
              name="notes"
              rows={2}
              placeholder="e.g. Haier 8.5kg Automatic model, or call before arriving"
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:border-neutral-900"
            />
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-2 pt-2">
            <h2 className="text-base font-bold text-neutral-900">3. Payment Mode</h2>
            <div className="p-4 rounded-xl border-2 border-neutral-900 bg-neutral-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">Cash on Delivery (COD)</h4>
                  <p className="text-[11px] text-neutral-500">Pay cash upon delivery. Inspect before paying.</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 uppercase">Selected</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Confirming Order...' : `Place Cash on Delivery Order (${formatCurrency(grandTotal)})`}</span>
            </button>
          </div>
        </form>

        {/* Right: Order Summary */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-neutral-200 space-y-5 sticky top-24">
          <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider pb-3 border-b border-neutral-200">
            Order Summary ({cart.length} items)
          </h3>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {cart.map((item) => {
              const price = item.product.discount_price ?? item.product.price;
              return (
                <div key={item.id} className="flex justify-between items-start text-xs">
                  <div className="pr-3">
                    <p className="font-semibold text-neutral-900 line-clamp-1">{item.product.name}</p>
                    <p className="text-[11px] text-neutral-400">
                      Qty: {item.quantity} {item.selected_size && `· ${item.selected_size}`}
                    </p>
                  </div>
                  <span className="font-bold text-neutral-900 tabular-nums whitespace-nowrap">
                    {formatCurrency(price * item.quantity)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="space-y-2 pt-3 border-t border-neutral-200 text-xs text-neutral-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-neutral-900 tabular-nums">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping Fee</span>
              <span className="tabular-nums font-semibold">
                {shippingFee === 0 ? <span className="text-emerald-700">FREE</span> : formatCurrency(shippingFee)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-neutral-900 pt-2 border-t border-neutral-100">
              <span>Total Payable</span>
              <span className="tabular-nums text-base">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-[11px] text-neutral-500 space-y-1">
            <p className="font-semibold text-neutral-800">📦 Delivery Timeline:</p>
            <p>Lahore: 24-48 Hours. Other Pakistan Cities: 2-4 Business Days via courier.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

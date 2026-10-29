import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, MessageSquare, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { ImageWithFallback } from './ImageWithFallback';

export const CartDrawer: React.FC = () => {
  const { cart, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, subtotal, totalSavings } = useCart();
  const { formatCurrency, calculateShipping, settings, getWhatsAppOrderUrl } = useSettings();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const shippingFee = calculateShipping(subtotal);
  const grandTotal = subtotal + shippingFee;
  const freeShippingThreshold = settings.free_delivery_threshold || 2999;
  const amountForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  const handleWhatsAppCheckout = () => {
    let message = `*NEW ORDER INQUIRY - ${settings.shop_name}*\n\n`;
    message += `*Items Ordered:*\n`;
    cart.forEach((item, index) => {
      const price = item.product.discount_price ?? item.product.price;
      message += `${index + 1}. ${item.product.name}\n`;
      message += `   Qty: ${item.quantity} | SKU: ${item.product.sku}`;
      if (item.selected_size) message += ` | Size: ${item.selected_size}`;
      if (item.selected_color) message += ` | Color: ${item.selected_color}`;
      message += ` | Price: ${formatCurrency(price * item.quantity)}\n`;
    });
    message += `\n*Subtotal:* ${formatCurrency(subtotal)}`;
    message += `\n*Delivery Fee:* ${shippingFee === 0 ? 'FREE' : formatCurrency(shippingFee)}`;
    message += `\n*Total Amount:* ${formatCurrency(grandTotal)}`;
    message += `\n*Payment Mode:* Cash on Delivery (COD)\n\nPlease confirm availability and dispatch!`;

    window.open(getWhatsAppOrderUrl(message), '_blank');
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-neutral-900" />
              <h2 className="text-base font-bold text-neutral-900 tracking-tight">Your Cart</h2>
              <span className="text-xs text-neutral-500 font-medium">({cart.length} items)</span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          {cart.length > 0 && (
            <div className="bg-neutral-50 p-3 sm:px-5 border-b border-neutral-200 text-xs">
              {amountForFreeShipping > 0 ? (
                <p className="text-neutral-700 font-medium mb-1.5">
                  Add <span className="font-bold text-neutral-900">{formatCurrency(amountForFreeShipping)}</span> more for <span className="text-emerald-700 font-semibold">FREE Delivery</span>!
                </p>
              ) : (
                <p className="text-emerald-700 font-semibold flex items-center gap-1.5 mb-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Congratulations! You unlocked FREE Delivery.
                </p>
              )}
              <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-neutral-900">Your cart is empty</h3>
                  <p className="text-xs text-neutral-500 max-w-xs">
                    Protect your appliances from dust, moisture, and scratches today.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/shop');
                  }}
                  className="px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition-colors"
                >
                  Browse Covers Catalog
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const primaryImage =
                  item.product.images?.find((img) => img.is_primary)?.image_url ||
                  item.product.images?.[0]?.image_url ||
                  '';
                const itemPrice = item.product.discount_price ?? item.product.price;

                return (
                  <div
                    key={item.id}
                    className="flex gap-3.5 p-3 rounded-xl border border-neutral-200 bg-white"
                  >
                    {/* Item Image */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                      <ImageWithFallback
                        src={primaryImage}
                        alt={item.product.name}
                        fallbackTitle={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-semibold text-neutral-900 line-clamp-1 leading-snug">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-neutral-400 hover:text-rose-600 transition-colors p-0.5"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Variants */}
                        {(item.selected_size || item.selected_color) && (
                          <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                            {item.selected_size && <span>{item.selected_size}</span>}
                            {item.selected_size && item.selected_color && <span>·</span>}
                            {item.selected_color && <span>{item.selected_color}</span>}
                          </div>
                        )}
                      </div>

                      {/* Price and Quantity Stepper */}
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-neutral-100">
                        <span className="text-xs font-bold text-neutral-900 tabular-nums">
                          {formatCurrency(itemPrice * item.quantity)}
                        </span>

                        <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 text-neutral-600 hover:bg-neutral-200 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-semibold text-neutral-800 tabular-nums select-none">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 text-neutral-600 hover:bg-neutral-200 transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Totals & Checkout Actions */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-neutral-200 bg-neutral-50 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-neutral-900 tabular-nums">{formatCurrency(subtotal)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount Savings</span>
                    <span className="tabular-nums">- {formatCurrency(totalSavings)}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-600">
                  <span>Delivery (Cash on Delivery)</span>
                  <span className="tabular-nums font-semibold">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-700 uppercase text-[11px] font-bold">Free</span>
                    ) : (
                      formatCurrency(shippingFee)
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t border-neutral-200 flex justify-between text-sm font-bold text-neutral-900">
                  <span>Estimated Total</span>
                  <span className="tabular-nums text-base">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleProceedToCheckout}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleWhatsAppCheckout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  <MessageSquare className="w-4 h-4 fill-white" />
                  <span>Order Directly via WhatsApp</span>
                </button>
              </div>

              <p className="text-[11px] text-center text-neutral-500">
                🔒 Safe & secure Cash on Delivery checkout.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

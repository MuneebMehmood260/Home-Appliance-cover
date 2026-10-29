import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, MessageSquare } from 'lucide-react';
import { Product } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { useCart } from '../../context/CartContext';
import { ImageWithFallback } from './ImageWithFallback';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { formatCurrency, getWhatsAppOrderUrl } = useSettings();
  const { addToCart } = useCart();

  const primaryImage = product.images?.find((img) => img.is_primary)?.image_url ||
    product.images?.[0]?.image_url ||
    '';

  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= product.low_stock_threshold;
  const hasDiscount = Boolean(product.discount_price && product.discount_price < product.price);
  const activePrice = hasDiscount ? (product.discount_price as number) : product.price;

  const handleWhatsAppQuickOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const productUrl = `${window.location.origin}/product/${product.slug}`;
    const text = `Hello! I would like to order *${product.name}* (SKU: ${product.sku}) for ${formatCurrency(activePrice)}.\nLink: ${productUrl}`;
    window.open(getWhatsAppOrderUrl(text), '_blank');
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  return (
    <div className="group relative flex flex-col bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Product Image Frame */}
      <Link to={`/product/${product.slug}`} className="block relative aspect-4/3 overflow-hidden bg-neutral-100">
        <ImageWithFallback
          src={primaryImage}
          alt={product.name}
          fallbackTitle={product.name}
          className="w-full h-full group-hover:scale-105 transition-transform duration-300"
        />

        {/* Quiet Discount or Low Stock Tag */}
        {hasDiscount && (
          <div className="absolute top-2.5 left-2.5 bg-neutral-900 text-white text-[11px] font-bold px-2 py-0.5 rounded tracking-wide">
            Save {formatCurrency(product.price - (product.discount_price as number))}
          </div>
        )}

        {isOutOfStock ? (
          <div className="absolute top-2.5 right-2.5 bg-neutral-800/90 text-white text-[11px] font-medium px-2 py-0.5 rounded">
            Out of Stock
          </div>
        ) : isLowStock ? (
          <div className="absolute top-2.5 right-2.5 bg-amber-600/90 text-white text-[11px] font-medium px-2 py-0.5 rounded">
            Only {product.stock_quantity} Left
          </div>
        ) : null}
      </Link>

      {/* Product Details */}
      <div className="flex flex-col flex-1 p-4">
        {/* Category & SKU Unboxed Metadata */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium mb-1.5 uppercase tracking-wider">
          <span>{product.category?.name || product.category_slug?.replace(/-/g, ' ') || 'Covers'}</span>
          <span aria-hidden="true">·</span>
          <span>{product.sku}</span>
        </div>

        {/* Title */}
        <Link
          to={`/product/${product.slug}`}
          className="text-sm font-semibold text-neutral-900 hover:text-neutral-700 transition-colors line-clamp-2 leading-snug mb-3 flex-1"
          title={product.name}
        >
          {product.name}
        </Link>

        {/* Price & Actions Row */}
        <div className="mt-auto pt-2 border-t border-neutral-100">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-base font-bold text-neutral-900 tabular-nums">
              {formatCurrency(activePrice)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-neutral-400 line-through tabular-nums">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleQuickAdd}
              disabled={isOutOfStock}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                isOutOfStock
                  ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                  : 'bg-neutral-900 text-white hover:bg-neutral-800'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
            </button>

            <button
              onClick={handleWhatsAppQuickOrder}
              className="flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap"
              title="Quick WhatsApp Order"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

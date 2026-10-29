import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShoppingBag,
  MessageSquare,
  ShieldCheck,
  Truck,
  RotateCcw,
  Plus,
  Minus,
  Check,
  Share2,
  Package,
} from 'lucide-react';
import { Product } from '../../types';
import { dbService } from '../../lib/supabase';
import { useSettings } from '../../context/SettingsContext';
import { useCart } from '../../context/CartContext';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import { ProductCard } from '../../components/common/ProductCard';
import { SEO } from '../../components/common/SEO';
import toast from 'react-hot-toast';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { formatCurrency, getWhatsAppOrderUrl, settings } = useSettings();
  const { addToCart, setIsCartOpen } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      setIsLoading(true);
      try {
        const item = await dbService.getProductBySlug(slug);
        if (item) {
          setProduct(item);
          const primary =
            item.images?.find((img) => img.is_primary)?.image_url ||
            item.images?.[0]?.image_url ||
            '';
          setSelectedImage(primary);
          setSelectedSize(item.sizes?.[0] || '');
          setSelectedColor(item.colors?.[0] || '');
          setQuantity(1);

          // Fetch related products
          const allProducts = await dbService.getProducts();
          const related = allProducts
            .filter((p) => p.id !== item.id && (p.category_id === item.category_id || p.category_slug === item.category_slug))
            .slice(0, 3);
          setRelatedProducts(related);
        }
      } catch (err) {
        console.warn('Error fetching product', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-pulse space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-4/3 bg-neutral-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-6 w-32 bg-neutral-200 rounded" />
            <div className="h-10 w-3/4 bg-neutral-200 rounded" />
            <div className="h-6 w-24 bg-neutral-200 rounded" />
            <div className="h-24 bg-neutral-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <Package className="w-12 h-12 mx-auto text-neutral-400" />
        <h2 className="text-xl font-bold text-neutral-900">Product Not Found</h2>
        <p className="text-xs text-neutral-500">The appliance cover you are looking for is unavailable.</p>
        <Link
          to="/shop"
          className="inline-block px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-xs font-semibold"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= product.low_stock_threshold;
  const hasDiscount = Boolean(product.discount_price && product.discount_price < product.price);
  const activePrice = hasDiscount ? (product.discount_price as number) : product.price;

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedSize, selectedColor);
    setIsCartOpen(true);
  };

  const handleWhatsAppOrder = () => {
    const pageUrl = window.location.href;
    let text = `*ORDER REQUEST - ${settings.shop_name}*\n\n`;
    text += `*Product:* ${product.name}\n`;
    text += `*SKU:* ${product.sku}\n`;
    if (selectedSize) text += `*Selected Size:* ${selectedSize}\n`;
    if (selectedColor) text += `*Selected Color:* ${selectedColor}\n`;
    text += `*Quantity:* ${quantity}\n`;
    text += `*Unit Price:* ${formatCurrency(activePrice)}\n`;
    text += `*Subtotal:* ${formatCurrency(activePrice * quantity)}\n`;
    text += `*Payment:* Cash on Delivery (COD)\n\n`;
    text += `*Product Link:* ${pageUrl}\n\nPlease confirm availability and delivery timeframe!`;

    window.open(getWhatsAppOrderUrl(text), '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on ${settings.shop_name}`,
          url: window.location.href,
        });
      } catch {
        // cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Product link copied to clipboard!');
    }
  };

  const imagesList = product.images && product.images.length > 0 ? product.images : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-16">
      <SEO
        title={product.name}
        description={product.description.slice(0, 160)}
      />

      {/* Breadcrumbs */}
      <nav className="text-xs text-neutral-500 flex items-center gap-2">
        <Link to="/" className="hover:text-neutral-900 transition-colors">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-neutral-900 transition-colors">Shop</Link>
        <span>/</span>
        <Link
          to={`/shop?category=${product.category_slug}`}
          className="hover:text-neutral-900 transition-colors"
        >
          {product.category?.name || product.category_slug?.replace(/-/g, ' ')}
        </Link>
        <span>/</span>
        <span className="text-neutral-900 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Contiguous Purchase Module Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left: Gallery Module */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-4/3 rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 shadow-xs">
            <ImageWithFallback
              src={selectedImage}
              alt={product.name}
              fallbackTitle={product.name}
              className="w-full h-full object-cover"
            />

            {hasDiscount && (
              <span className="absolute top-4 left-4 bg-neutral-900 text-white text-xs font-bold px-2.5 py-1 rounded tracking-wide">
                Save {formatCurrency(product.price - (product.discount_price as number))}
              </span>
            )}
          </div>

          {/* Thumbnails row */}
          {imagesList.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {imagesList.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.image_url)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    selectedImage === img.image_url
                      ? 'border-neutral-900 shadow-sm'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.image_url}
                    alt={img.alt_text || 'Thumbnail'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Purchase Controls Module */}
        <div className="lg:col-span-5 space-y-6">
          {/* Header metadata */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold tracking-wider uppercase">
              <span>{product.category?.name || product.category_slug} · {product.sku}</span>
              <button
                onClick={handleShare}
                className="flex items-center gap-1 text-neutral-500 hover:text-neutral-900 transition-colors"
                title="Share link"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Price display */}
            <div className="flex items-baseline gap-3 pt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tabular-nums">
                {formatCurrency(activePrice)}
              </span>
              {hasDiscount && (
                <span className="text-base text-neutral-400 line-through tabular-nums">
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>

            {/* Stock status indicator */}
            <div className="pt-1">
              {isOutOfStock ? (
                <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded">
                  Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded">
                  Only {product.stock_quantity} remaining in stock
                </span>
              ) : (
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded inline-flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  In Stock & Ready for Same-Day Dispatch
                </span>
              )}
            </div>
          </div>

          <hr className="border-neutral-200" />

          {/* Size Options */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800">
                Select Size / Model
              </label>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      selectedSize === size
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                        : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Options */}
          {product.colors && product.colors.length > 0 && (
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800">
                Select Color / Pattern
              </label>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      selectedColor === color
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                        : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Stepper */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-800">
              Quantity
            </label>
            <div className="flex items-center border border-neutral-300 rounded-lg w-32 bg-white">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2.5 text-neutral-600 hover:bg-neutral-100 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="flex-1 text-center font-bold text-sm text-neutral-900 tabular-nums">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                disabled={quantity >= product.stock_quantity}
                className="p-2.5 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                isOutOfStock
                  ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{isOutOfStock ? 'Sold Out' : 'Add to Shopping Cart'}</span>
            </button>

            <button
              onClick={handleWhatsAppOrder}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors"
            >
              <MessageSquare className="w-4 h-4 fill-emerald-600 text-emerald-600" />
              <span>Order Instantly on WhatsApp</span>
            </button>
          </div>

          {/* Trust Highlights Checklist */}
          <div className="pt-4 border-t border-neutral-200 space-y-3 text-xs text-neutral-600">
            <div className="flex items-center gap-3">
              <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Cash on Delivery available nationwide across Pakistan.</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>100% Waterproof coated outer shell with scratch-proof lining.</span>
            </div>
            <div className="flex items-center gap-3">
              <RotateCcw className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>7-Day Hassle-free size replacement guarantee.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications & Description Tabs/Cards */}
      <div className="pt-10 border-t border-neutral-200 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-neutral-900">Product Overview & Features</h3>
            <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {product.details && (
            <div className="space-y-3 pt-4 border-t border-neutral-100">
              <h4 className="text-sm font-bold text-neutral-900">Technical Fit & Compatibility</h4>
              <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-line">
                {product.details}
              </p>
            </div>
          )}
        </div>

        {/* Care & Maintenance Card */}
        <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-200 space-y-4">
          <h4 className="text-sm font-bold text-neutral-900">Care & Maintenance Instructions</h4>
          <p className="text-xs text-neutral-600 leading-relaxed">
            {product.care_instructions || 'Wipe clean with a damp towel or sponge using mild liquid soap. Do not tumble dry, bleach, or iron directly on the waterproof PVC coating.'}
          </p>
          <div className="pt-2 border-t border-neutral-200">
            <span className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Fabric Type</span>
            <span className="text-xs font-bold text-neutral-800">Triple-Layer Quilted Oxford Polyester</span>
          </div>
        </div>
      </div>

      {/* Related Products Grid */}
      {relatedProducts.length > 0 && (
        <div className="pt-12 border-t border-neutral-200 space-y-6">
          <div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Recommended Protectors</span>
            <h3 className="text-xl font-extrabold text-neutral-900 tracking-tight mt-0.5">
              Similar Appliance Covers
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

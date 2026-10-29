export type OrderStatus = 'new' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text?: string;
  display_order: number;
  is_primary: boolean;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category_id?: string;
  category_slug?: string;
  sku: string;
  price: number;
  discount_price?: number | null;
  description: string;
  details?: string;
  care_instructions?: string;
  stock_quantity: number;
  low_stock_threshold: number;
  sizes: string[];
  colors: string[];
  is_featured: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  images?: ProductImage[];
  category?: Category;
}

export interface CartItem {
  id: string; // product_id + (size or '') + (color or '')
  product: Product;
  quantity: number;
  selected_size?: string;
  selected_color?: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id?: string;
  product_name: string;
  product_sku: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  selected_size?: string;
  selected_color?: string;
  created_at?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  customer_notes?: string;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total_amount: number;
  payment_method: string;
  status: OrderStatus;
  whatsapp_sent: boolean;
  created_at: string;
  updated_at?: string;
  items?: OrderItem[];
}

export interface StockLog {
  id: string;
  product_id: string;
  product_sku: string;
  product_name: string;
  change_quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  order_id?: string;
  adjusted_by?: string;
  created_at: string;
}

export interface ShopSettings {
  id: number;
  shop_name: string;
  logo_url?: string;
  hero_title: string;
  hero_subtitle: string;
  hero_banner_url?: string;
  announcement_text: string;
  whatsapp_number: string;
  phone_number: string;
  email: string;
  address: string;
  currency_symbol: string;
  currency_code: string;
  standard_delivery_fee: number;
  free_delivery_threshold: number;
  facebook_url?: string;
  instagram_url?: string;
  footer_text: string;
  updated_at?: string;
}

export interface AdminProfile {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  created_at?: string;
}

export interface FilterOptions {
  categorySlug?: string;
  searchQuery?: string;
  priceSort?: 'asc' | 'desc' | 'featured' | 'newest';
  stockFilter?: 'all' | 'in_stock' | 'out_of_stock';
  priceRange?: [number, number];
}

export interface BulkImportRow {
  rowNumber: number;
  sku: string;
  name: string;
  category: string;
  price: number;
  discount_price?: number;
  stock_quantity: number;
  low_stock_threshold?: number;
  description: string;
  sizes?: string;
  colors?: string;
  image_url?: string;
  is_featured?: boolean;
  is_active?: boolean;
  errors: string[];
  status: 'valid' | 'invalid';
}

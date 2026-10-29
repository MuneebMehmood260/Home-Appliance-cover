import { createClient } from '@supabase/supabase-js';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_SETTINGS } from './constants';
import { Category, Order, OrderItem, Product, ShopSettings, StockLog } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project-id')
  );
};

// Create the Supabase client
// If keys are missing, we provide a placeholder to prevent initialization crashes
export const supabase = createClient(
  isSupabaseConfigured() ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-anon-key'
);

// -----------------------------------------------------------------------------
// LOCAL REPOSITORY (FALLBACK / SANDBOX DATA LAYER)
// Ensures full functionality even before the user inputs their Supabase credentials
// -----------------------------------------------------------------------------

const STORAGE_KEYS = {
  PRODUCTS: 'hac_products_v1',
  CATEGORIES: 'hac_categories_v1',
  ORDERS: 'hac_orders_v1',
  SETTINGS: 'hac_settings_v1',
  STOCK_LOGS: 'hac_stock_logs_v1',
  LOCAL_ADMIN: 'hac_local_admin_v1',
};

// Initialize localStorage fallback database
function getLocalItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('LocalStorage error:', err);
  }
}

// -----------------------------------------------------------------------------
// UNIFIED DATA SERVICE (SUPABASE WITH LOCAL STORAGE FALLBACK)
// -----------------------------------------------------------------------------

export const dbService = {
  // --- CATEGORIES ---
  async getCategories(): Promise<Category[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('display_order', { ascending: true });
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        console.warn('Supabase getCategories failed, falling back to local storage', err);
      }
    }
    return getLocalItem<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  },

  async upsertCategory(category: Partial<Category>): Promise<Category> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .upsert(category)
          .select()
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase upsertCategory failed, using local storage', err);
      }
    }

    const categories = getLocalItem<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    const id = category.id || `c-${Date.now()}`;
    const newCategory: Category = {
      id,
      name: category.name || 'New Category',
      slug: category.slug || category.name?.toLowerCase().replace(/\s+/g, '-') || `cat-${Date.now()}`,
      description: category.description || '',
      icon: category.icon || 'Layers',
      display_order: category.display_order ?? categories.length + 1,
      is_active: category.is_active ?? true,
      updated_at: new Date().toISOString(),
    };

    const index = categories.findIndex((c) => c.id === id);
    if (index >= 0) {
      categories[index] = { ...categories[index], ...newCategory };
    } else {
      categories.push(newCategory);
    }
    setLocalItem(STORAGE_KEYS.CATEGORIES, categories);
    return newCategory;
  },

  async deleteCategory(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase deleteCategory failed, using local storage', err);
      }
    }
    const categories = getLocalItem<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    const filtered = categories.filter((c) => c.id !== id);
    setLocalItem(STORAGE_KEYS.CATEGORIES, filtered);
    return true;
  },

  // --- PRODUCTS ---
  async getProducts(): Promise<Product[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            images:product_images(*),
            category:categories(*)
          `)
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        console.warn('Supabase getProducts failed, falling back to local storage', err);
      }
    }
    return getLocalItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    const products = await this.getProducts();
    return products.find((p) => p.slug === slug) || null;
  },

  async upsertProduct(product: Partial<Product>): Promise<Product> {
    if (isSupabaseConfigured()) {
      try {
        const payload = {
          name: product.name,
          slug: product.slug,
          category_id: product.category_id,
          category_slug: product.category_slug,
          sku: product.sku,
          price: product.price,
          discount_price: product.discount_price ?? null,
          description: product.description,
          details: product.details,
          care_instructions: product.care_instructions,
          stock_quantity: product.stock_quantity,
          low_stock_threshold: product.low_stock_threshold ?? 5,
          sizes: product.sizes ?? [],
          colors: product.colors ?? [],
          is_featured: product.is_featured ?? false,
          is_active: product.is_active ?? true,
        };

        const { data, error } = product.id
          ? await supabase.from('products').update(payload).eq('id', product.id).select().single()
          : await supabase.from('products').insert(payload).select().single();

        if (!error && data) {
          // If images exist, handle them
          if (product.images && product.images.length > 0) {
            await supabase.from('product_images').delete().eq('product_id', data.id);
            const imagePayloads = product.images.map((img, idx) => ({
              product_id: data.id,
              image_url: img.image_url,
              alt_text: img.alt_text || data.name,
              display_order: idx + 1,
              is_primary: idx === 0,
            }));
            await supabase.from('product_images').insert(imagePayloads);
          }
          return data;
        }
      } catch (err) {
        console.warn('Supabase upsertProduct failed, using local storage', err);
      }
    }

    const products = getLocalItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const id = product.id || `p-${Date.now()}`;
    const newProduct: Product = {
      id,
      name: product.name || 'New Product',
      slug: product.slug || (product.name ? product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `prod-${Date.now()}`),
      category_id: product.category_id,
      category_slug: product.category_slug,
      sku: product.sku || `SKU-${Date.now().toString().slice(-6)}`,
      price: Number(product.price) || 0,
      discount_price: product.discount_price ? Number(product.discount_price) : null,
      description: product.description || '',
      details: product.details || '',
      care_instructions: product.care_instructions || '',
      stock_quantity: Number(product.stock_quantity) || 0,
      low_stock_threshold: Number(product.low_stock_threshold) || 5,
      sizes: product.sizes || [],
      colors: product.colors || [],
      is_featured: product.is_featured ?? false,
      is_active: product.is_active ?? true,
      images: product.images || [
        {
          id: `img-${Date.now()}`,
          product_id: id,
          image_url: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=800&q=80',
          alt_text: product.name || 'Product Image',
          display_order: 1,
          is_primary: true,
        },
      ],
      updated_at: new Date().toISOString(),
    };

    const index = products.findIndex((p) => p.id === id || p.sku === newProduct.sku);
    if (index >= 0) {
      products[index] = { ...products[index], ...newProduct };
    } else {
      products.unshift(newProduct);
    }
    setLocalItem(STORAGE_KEYS.PRODUCTS, products);
    return newProduct;
  },

  async deleteProduct(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase deleteProduct failed, using local storage', err);
      }
    }
    const products = getLocalItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const filtered = products.filter((p) => p.id !== id);
    setLocalItem(STORAGE_KEYS.PRODUCTS, filtered);
    return true;
  },

  // --- ORDERS ---
  async getOrders(): Promise<Order[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            items:order_items(*)
          `)
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase getOrders failed, using local storage', err);
      }
    }
    return getLocalItem<Order[]>(STORAGE_KEYS.ORDERS, []);
  },

  async createOrder(
    orderData: Omit<Order, 'id' | 'order_number' | 'created_at' | 'status' | 'whatsapp_sent'>,
    items: OrderItem[]
  ): Promise<Order> {
    const orderNumber = `HAC-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      try {
        const { data: orderResult, error: orderError } = await supabase
          .from('orders')
          .insert({
            order_number: orderNumber,
            customer_name: orderData.customer_name,
            customer_phone: orderData.customer_phone,
            customer_address: orderData.customer_address,
            customer_city: orderData.customer_city,
            customer_notes: orderData.customer_notes || '',
            subtotal: orderData.subtotal,
            shipping_fee: orderData.shipping_fee,
            discount_amount: orderData.discount_amount || 0,
            total_amount: orderData.total_amount,
            payment_method: orderData.payment_method || 'COD',
            status: 'new',
            whatsapp_sent: false,
          })
          .select()
          .single();

        if (!orderError && orderResult) {
          const itemPayloads = items.map((item) => ({
            order_id: orderResult.id,
            product_id: item.product_id,
            product_name: item.product_name,
            product_sku: item.product_sku,
            unit_price: item.unit_price,
            quantity: item.quantity,
            total_price: item.total_price,
            selected_size: item.selected_size,
            selected_color: item.selected_color,
          }));
          await supabase.from('order_items').insert(itemPayloads);
          return { ...orderResult, items };
        }
      } catch (err) {
        console.warn('Supabase createOrder failed, using local storage', err);
      }
    }

    const orders = getLocalItem<Order[]>(STORAGE_KEYS.ORDERS, []);
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      order_number: orderNumber,
      status: 'new',
      whatsapp_sent: false,
      created_at: now,
      items,
    };
    orders.unshift(newOrder);
    setLocalItem(STORAGE_KEYS.ORDERS, orders);
    return newOrder;
  },

  async updateOrderStatus(orderId: string, newStatus: Order['status'], adminEmail = 'Admin'): Promise<boolean> {
    const orders = await this.getOrders();
    const target = orders.find((o) => o.id === orderId);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
        if (!error && newStatus === 'confirmed' && target && target.status !== 'confirmed') {
          // Deduct stock for each item in the order
          for (const item of target.items || []) {
            if (item.product_id) {
              await this.adjustStock(item.product_id, -item.quantity, `Order #${target.order_number} confirmed`, orderId, adminEmail);
            }
          }
        }
        return !error;
      } catch (err) {
        console.warn('Supabase updateOrderStatus failed, using local storage', err);
      }
    }

    // Local fallback update
    const orderIndex = orders.findIndex((o) => o.id === orderId);
    if (orderIndex >= 0) {
      const prevStatus = orders[orderIndex].status;
      orders[orderIndex].status = newStatus;
      orders[orderIndex].updated_at = new Date().toISOString();
      setLocalItem(STORAGE_KEYS.ORDERS, orders);

      // Auto-reduce stock on confirm
      if (newStatus === 'confirmed' && prevStatus !== 'confirmed') {
        for (const item of orders[orderIndex].items || []) {
          if (item.product_id) {
            await this.adjustStock(item.product_id, -item.quantity, `Order #${orders[orderIndex].order_number} confirmed`, orderId, adminEmail);
          }
        }
      }
      return true;
    }
    return false;
  },

  // --- STOCK & INVENTORY LOGS ---
  async getStockLogs(): Promise<StockLog[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('stock_logs')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase getStockLogs failed, using local storage', err);
      }
    }
    return getLocalItem<StockLog[]>(STORAGE_KEYS.STOCK_LOGS, []);
  },

  async adjustStock(
    productId: string,
    changeDelta: number,
    reason: string,
    orderId?: string,
    adjustedBy = 'Admin'
  ): Promise<boolean> {
    const products = await this.getProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) return false;

    const previousStock = product.stock_quantity;
    const newStock = Math.max(0, previousStock + changeDelta);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('products').update({ stock_quantity: newStock }).eq('id', productId);
        await supabase.from('stock_logs').insert({
          product_id: productId,
          product_sku: product.sku,
          product_name: product.name,
          change_quantity: changeDelta,
          previous_stock: previousStock,
          new_stock: newStock,
          reason,
          order_id: orderId,
          adjusted_by: adjustedBy,
        });
        return true;
      } catch (err) {
        console.warn('Supabase adjustStock failed, using local storage', err);
      }
    }

    // Local update
    product.stock_quantity = newStock;
    product.updated_at = new Date().toISOString();
    const index = products.findIndex((p) => p.id === productId);
    if (index >= 0) products[index] = product;
    setLocalItem(STORAGE_KEYS.PRODUCTS, products);

    const logs = getLocalItem<StockLog[]>(STORAGE_KEYS.STOCK_LOGS, []);
    logs.unshift({
      id: `log-${Date.now()}`,
      product_id: productId,
      product_sku: product.sku,
      product_name: product.name,
      change_quantity: changeDelta,
      previous_stock: previousStock,
      new_stock: newStock,
      reason,
      order_id: orderId,
      adjusted_by: adjustedBy,
      created_at: new Date().toISOString(),
    });
    setLocalItem(STORAGE_KEYS.STOCK_LOGS, logs);
    return true;
  },

  // --- SHOP SETTINGS ---
  async getSettings(): Promise<ShopSettings> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase getSettings failed, using local storage', err);
      }
    }
    return getLocalItem<ShopSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  },

  async updateSettings(settings: Partial<ShopSettings>): Promise<ShopSettings> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('settings')
          .update({ ...settings, updated_at: new Date().toISOString() })
          .eq('id', 1)
          .select()
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase updateSettings failed, using local storage', err);
      }
    }
    const current = getLocalItem<ShopSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    const updated = { ...current, ...settings, updated_at: new Date().toISOString() };
    setLocalItem(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  },

  // --- IMAGE UPLOADS ---
  async uploadImage(file: File, bucket = 'product-images'): Promise<string> {
    if (isSupabaseConfigured()) {
      try {
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from(bucket).upload(fileName, file);
        if (!error) {
          const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
          return data.publicUrl;
        }
      } catch (err) {
        console.warn('Supabase storage upload failed, using FileReader fallback', err);
      }
    }

    // Local fallback: convert file to data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  },

  // --- BULK PRODUCT IMPORT (UPSERT BY SKU) ---
  async bulkImportProducts(productsToImport: Array<Partial<Product>>): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const item of productsToImport) {
      try {
        await this.upsertProduct(item);
        success++;
      } catch {
        failed++;
      }
    }
    return { success, failed };
  },
};

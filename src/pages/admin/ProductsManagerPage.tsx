import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Check,
  X,
  Filter,
  Image as ImageIcon,
  Save,
  AlertCircle,
} from 'lucide-react';
import { Product, Category, ProductImage } from '../../types';
import { dbService } from '../../lib/supabase';
import { useSettings } from '../../context/SettingsContext';
import { ImageUploader } from '../../components/admin/ImageUploader';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import { SEO } from '../../components/common/SEO';
import toast from 'react-hot-toast';

export const ProductsManagerPage: React.FC = () => {
  const { formatCurrency } = useSettings();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [sizesInput, setSizesInput] = useState('');
  const [colorsInput, setColorsInput] = useState('');
  const [imagesList, setImagesList] = useState<ProductImage[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cats, prods] = await Promise.all([
        dbService.getCategories(),
        dbService.getProducts(),
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch (err) {
      console.warn('Error loading products', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (searchParams.get('action') === 'new') {
      openAddModal();
    }
  }, [searchParams]);

  const openAddModal = () => {
    setEditingProduct({
      name: '',
      slug: '',
      sku: `HAC-${Date.now().toString().slice(-4)}`,
      category_id: categories[0]?.id || '',
      category_slug: categories[0]?.slug || '',
      price: 1500,
      discount_price: null,
      description: '',
      details: '',
      care_instructions: '',
      stock_quantity: 25,
      low_stock_threshold: 5,
      sizes: ['Standard Fit'],
      colors: ['Grey'],
      is_featured: false,
      is_active: true,
    });
    setSizesInput('Standard Fit');
    setColorsInput('Grey');
    setImagesList([]);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct({ ...product });
    setSizesInput((product.sizes || []).join(', '));
    setColorsInput((product.colors || []).join(', '));
    setImagesList(product.images || []);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    if (searchParams.get('action')) {
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name || !editingProduct.sku) {
      toast.error('Product name and SKU are required');
      return;
    }

    const targetCategory = categories.find((c) => c.id === editingProduct.category_id);

    const parsedSizes = sizesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedColors = colorsInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const payload: Partial<Product> = {
      ...editingProduct,
      category_slug: targetCategory?.slug || editingProduct.category_slug,
      sizes: parsedSizes,
      colors: parsedColors,
      images: imagesList,
    };

    try {
      await dbService.upsertProduct(payload);
      toast.success(editingProduct.id ? 'Product updated!' : 'Product added successfully!');
      closeModal();
      loadData();
    } catch (err) {
      console.error('Error saving product', err);
      toast.error('Failed to save product.');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await dbService.deleteProduct(id);
      toast.success('Product deleted.');
      loadData();
    } catch {
      toast.error('Failed to delete product.');
    }
  };

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' ||
      p.category_id === selectedCategory ||
      p.category_slug === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <SEO title="Products Manager" description="Manage appliance covers catalog, pricing, and stock." />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Products Catalog Manager
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Add, edit, or adjust covers specifications, pricing, and media.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by product name, appliance, or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-300 rounded-lg text-xs focus:outline-hidden focus:border-neutral-900"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Filter by category"
          className="px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs text-neutral-700 font-medium focus:outline-hidden cursor-pointer"
        >
          <option value="all">All Categories ({products.length})</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-neutral-400">Loading products catalog...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-neutral-400 mx-auto" />
            <h3 className="text-sm font-bold text-neutral-900">No products found</h3>
            <p className="text-xs text-neutral-500">Try adjusting your search criteria or add a new cover.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-600">
              <thead className="bg-neutral-50 text-neutral-700 font-semibold uppercase text-[11px] border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredProducts.map((p) => {
                  const primaryImage =
                    p.images?.find((img) => img.is_primary)?.image_url ||
                    p.images?.[0]?.image_url ||
                    '';

                  const isOut = p.stock_quantity <= 0;
                  const isLow = p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold;

                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="px-4 py-3 font-medium text-neutral-900">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200">
                            <ImageWithFallback
                              src={primaryImage}
                              alt={p.name}
                              fallbackTitle={p.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-semibold text-neutral-900 line-clamp-1">{p.name}</span>
                            {p.is_featured && (
                              <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-neutral-500">
                        {p.category?.name || p.category_slug}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap font-mono font-medium text-neutral-700">
                        {p.sku}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-neutral-900 tabular-nums">
                          {formatCurrency(p.discount_price ?? p.price)}
                        </span>
                        {p.discount_price && (
                          <span className="block text-[11px] text-neutral-400 line-through tabular-nums">
                            {formatCurrency(p.price)}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`font-bold tabular-nums ${
                            isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-neutral-800'
                          }`}
                        >
                          {p.stock_quantity}
                        </span>
                        {isOut && <span className="block text-[10px] text-rose-500">Out of Stock</span>}
                        {isLow && <span className="block text-[10px] text-amber-500">Low Stock</span>}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {p.is_active ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-200 text-neutral-600">
                            Draft
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                        <a
                          href={`/product/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 inline-block text-neutral-400 hover:text-neutral-900 rounded"
                          title="View on Storefront"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  {editingProduct.id ? 'Edit Appliance Cover' : 'Add New Appliance Cover'}
                </h3>
                <p className="text-xs text-neutral-500">Configure catalog information, images, and inventory.</p>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-5 text-xs">
              {/* Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-neutral-700">Product Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Automatic Top Load Cover"
                    value={editingProduct.name || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        name: e.target.value,
                        slug:
                          editingProduct.slug ||
                          e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-hidden focus:border-neutral-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-neutral-700">Slug (URL)</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.slug || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-mono focus:outline-hidden focus:border-neutral-900"
                  />
                </div>
              </div>

              {/* Category & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-neutral-700">Category *</label>
                  <select
                    value={editingProduct.category_id || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs cursor-pointer focus:outline-hidden"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-neutral-700">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-neutral-700">Regular Price (PKR) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingProduct.price ?? ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs tabular-nums focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-neutral-700">Discount Price (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Leave empty if none"
                    value={editingProduct.discount_price ?? ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        discount_price: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs tabular-nums focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-neutral-700">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingProduct.stock_quantity ?? 0}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        stock_quantity: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs tabular-nums focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-neutral-700">Low Stock Alert at</label>
                  <input
                    type="number"
                    min="1"
                    value={editingProduct.low_stock_threshold ?? 5}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        low_stock_threshold: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs tabular-nums focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Sizes and Colors (comma-separated) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-neutral-700">
                    Sizes / Machine Capacities (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 6kg - 8kg Standard, 9kg - 12kg Jumbo"
                    value={sizesInput}
                    onChange={(e) => setSizesInput(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-neutral-700">
                    Colors / Patterns (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Slate Grey, Navy Blue, Beige Sand"
                    value={colorsInput}
                    onChange={(e) => setColorsInput(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-700">Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Key features, waterproof benefits, zipper design..."
                  value={editingProduct.description || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-700">
                  Technical Fit & Brand Compatibility (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Compatible with Haier, Dawlance, Samsung, LG models"
                  value={editingProduct.details || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, details: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-hidden"
                />
              </div>

              {/* Multiple Images Upload & Management */}
              <div className="space-y-2 pt-2 border-t border-neutral-200">
                <label className="font-bold text-neutral-900 block">
                  Product Images (Storage Bucket: product-images)
                </label>
                <ImageUploader
                  images={imagesList}
                  onChange={setImagesList}
                  productId={editingProduct.id || 'new'}
                />
              </div>

              {/* Toggles: Featured and Active */}
              <div className="flex items-center gap-6 pt-2 border-t border-neutral-200">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_featured ?? false}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, is_featured: e.target.checked })
                    }
                    className="rounded border-neutral-300 text-neutral-900 focus:ring-0"
                  />
                  <span className="font-semibold text-neutral-800">Feature on Homepage</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_active ?? true}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, is_active: e.target.checked })
                    }
                    className="rounded border-neutral-300 text-neutral-900 focus:ring-0"
                  />
                  <span className="font-semibold text-neutral-800">Active (Visible in Store)</span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-100 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Product</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

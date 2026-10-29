import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ArrowUpDown } from 'lucide-react';
import { Product, Category } from '../../types';
import { dbService } from '../../lib/supabase';
import { ProductCard } from '../../components/common/ProductCard';
import { SEO } from '../../components/common/SEO';

const ITEMS_PER_PAGE = 9;

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const currentCategorySlug = searchParams.get('category') || 'all';
  const currentSort = searchParams.get('sort') || 'featured';
  const currentSearch = searchParams.get('q') || '';
  const currentStockOnly = searchParams.get('in_stock') === 'true';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(currentSearch);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [cats, prods] = await Promise.all([
          dbService.getCategories(),
          dbService.getProducts(),
        ]);
        setCategories(cats.filter((c) => c.is_active));
        setProducts(prods.filter((p) => p.is_active));
      } catch (err) {
        console.warn('Error fetching shop data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Update query params helper
  const updateFilter = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'all') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    // Reset to page 1 on filter changes unless page is explicitly changed
    if (!('page' in updates)) {
      newParams.delete('page');
    }
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter({ q: searchInput.trim() || null });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  // Filter and sort items
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (currentCategorySlug !== 'all') {
      result = result.filter(
        (p) => p.category_slug === currentCategorySlug || p.category?.slug === currentCategorySlug
      );
    }

    // Search query
    if (currentSearch.trim()) {
      const q = currentSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    // In-stock only
    if (currentStockOnly) {
      result = result.filter((p) => p.stock_quantity > 0);
    }

    // Sort
    if (currentSort === 'price_asc') {
      result.sort((a, b) => (a.discount_price ?? a.price) - (b.discount_price ?? b.price));
    } else if (currentSort === 'price_desc') {
      result.sort((a, b) => (b.discount_price ?? b.price) - (a.discount_price ?? a.price));
    } else if (currentSort === 'newest') {
      result.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
    } else {
      // Featured
      result.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    }

    return result;
  }, [products, currentCategorySlug, currentSearch, currentStockOnly, currentSort]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const activeCategory = categories.find((c) => c.slug === currentCategorySlug);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      <SEO
        title={activeCategory ? `${activeCategory.name} Catalog` : 'Shop Home Appliance Covers'}
        description="Browse waterproof and dustproof covers for washing machines, fridges, split ACs, and ovens with Cash on Delivery."
      />

      {/* Header & Page Title */}
      <div className="border-b border-neutral-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            {activeCategory ? activeCategory.name : 'Catalog'}
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight mt-1">
            {activeCategory ? activeCategory.name : 'All Protective Appliance Covers'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-2xl">
            {activeCategory?.description || 'Tailored waterproof and scratch-proof protective jackets for home appliances.'}
          </p>
        </div>

        {/* Results counter */}
        <div className="text-xs text-neutral-500 font-medium whitespace-nowrap">
          Showing <span className="text-neutral-900 font-bold tabular-nums">{filteredProducts.length}</span> products
        </div>
      </div>

      {/* Controls Bar: Search, Category Tabs, Sort & Filter */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by appliance, brand, or SKU..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-white border border-neutral-300 rounded-lg text-xs placeholder:text-neutral-400 focus:outline-hidden focus:border-neutral-900 transition-colors"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  updateFilter({ q: null });
                }}
                className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Sort & In-Stock Switch */}
          <div className="flex flex-wrap items-center gap-3">
            {/* In stock toggle */}
            <label className="flex items-center gap-2 text-xs font-medium text-neutral-700 select-none cursor-pointer px-3 py-2 bg-white border border-neutral-300 rounded-lg">
              <input
                type="checkbox"
                checked={currentStockOnly}
                onChange={(e) => updateFilter({ in_stock: e.target.checked ? 'true' : null })}
                className="rounded border-neutral-300 text-neutral-900 focus:ring-0"
              />
              <span>In Stock Only</span>
            </label>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
              <select
                value={currentSort}
                onChange={(e) => updateFilter({ sort: e.target.value })}
                aria-label="Sort products by"
                className="bg-transparent border-0 text-neutral-800 text-xs font-semibold focus:outline-hidden cursor-pointer"
              >
                <option value="featured">Featured First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest Arrivals</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Horizontal Filter Segment */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
          <button
            onClick={() => updateFilter({ category: 'all' })}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              currentCategorySlug === 'all'
                ? 'bg-neutral-900 text-white'
                : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            All Appliances
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateFilter({ category: cat.slug })}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                currentCategorySlug === cat.slug
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Active Filters Summary Strip */}
      {(currentCategorySlug !== 'all' || currentSearch || currentStockOnly || currentSort !== 'featured') && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-neutral-400 font-medium">Active Filters:</span>
          {currentCategorySlug !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-200 text-neutral-800 rounded-md font-medium">
              Category: {activeCategory?.name || currentCategorySlug}
              <button onClick={() => updateFilter({ category: 'all' })}>
                <X className="w-3 h-3 text-neutral-500 hover:text-neutral-900" />
              </button>
            </span>
          )}
          {currentSearch && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-200 text-neutral-800 rounded-md font-medium">
              Search: "{currentSearch}"
              <button onClick={() => updateFilter({ q: null })}>
                <X className="w-3 h-3 text-neutral-500 hover:text-neutral-900" />
              </button>
            </span>
          )}
          {currentStockOnly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-200 text-neutral-800 rounded-md font-medium">
              In Stock Only
              <button onClick={() => updateFilter({ in_stock: null })}>
                <X className="w-3 h-3 text-neutral-500 hover:text-neutral-900" />
              </button>
            </span>
          )}
          <button
            onClick={handleClearFilters}
            className="text-xs text-neutral-600 hover:text-neutral-900 underline ml-2 font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-96 bg-neutral-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-neutral-200 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
            <SlidersHorizontal className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-neutral-900">No matching appliance covers found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              We couldn't find any products matching your selected criteria. Try adjusting your search term or category filter.
            </p>
          </div>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pt-8 border-t border-neutral-200 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => updateFilter({ page: pageNum.toString() })}
              className={`w-9 h-9 rounded-lg text-xs font-bold transition-colors ${
                currentPage === pageNum
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

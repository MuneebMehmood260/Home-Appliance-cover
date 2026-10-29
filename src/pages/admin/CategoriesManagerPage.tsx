import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, Layers, Save, X } from 'lucide-react';
import { Category } from '../../types';
import { dbService } from '../../lib/supabase';
import { SEO } from '../../components/common/SEO';
import toast from 'react-hot-toast';

export const CategoriesManagerPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit / Add Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await dbService.getCategories();
      setCategories(data);
    } catch (err) {
      console.warn('Error loading categories', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory({
      name: '',
      slug: '',
      description: '',
      icon: 'Shield',
      display_order: categories.length + 1,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory({ ...cat });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name) {
      toast.error('Category name is required');
      return;
    }

    try {
      await dbService.upsertCategory(editingCategory);
      toast.success(editingCategory.id ? 'Category updated!' : 'Category created!');
      setIsModalOpen(false);
      setEditingCategory(null);
      loadCategories();
    } catch {
      toast.error('Failed to save category');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete category "${name}"? Products in this category will become unassigned.`)) {
      return;
    }

    try {
      await dbService.deleteCategory(id);
      toast.success('Category removed');
      loadCategories();
    } catch {
      toast.error('Failed to delete category');
    }
  };

  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === categories.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newCategories = [...categories];
    const temp = newCategories[index];
    newCategories[index] = newCategories[targetIndex];
    newCategories[targetIndex] = temp;

    // Update display orders
    newCategories[index].display_order = index + 1;
    newCategories[targetIndex].display_order = targetIndex + 1;

    setCategories(newCategories);

    await Promise.all([
      dbService.upsertCategory(newCategories[index]),
      dbService.upsertCategory(newCategories[targetIndex]),
    ]);
    toast.success('Order updated');
  };

  return (
    <div className="space-y-6">
      <SEO title="Categories Manager" description="Organize appliance categories and order." />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Categories & Collections
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage appliance groups (Washing machines, fridges, air conditioners, etc.)
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-neutral-400">Loading categories...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-600">
              <thead className="bg-neutral-50 text-neutral-700 font-semibold uppercase text-[11px] border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Category Name</th>
                  <th className="px-4 py-3">Slug (Identifier)</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {categories.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveOrder(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded text-neutral-400 hover:text-neutral-900 disabled:opacity-20"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-bold text-neutral-800 tabular-nums">
                          {cat.display_order}
                        </span>
                        <button
                          onClick={() => moveOrder(idx, 'down')}
                          disabled={idx === categories.length - 1}
                          className="p-1 rounded text-neutral-400 hover:text-neutral-900 disabled:opacity-20"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-bold text-neutral-900 whitespace-nowrap">
                      {cat.name}
                    </td>

                    <td className="px-4 py-3 font-mono text-neutral-500 whitespace-nowrap">
                      {cat.slug}
                    </td>

                    <td className="px-4 py-3 text-neutral-500 max-w-sm truncate">
                      {cat.description || '—'}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {cat.is_active ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-200 text-neutral-600">
                          Hidden
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="p-1.5 text-neutral-600 hover:text-neutral-900 rounded hover:bg-neutral-100 transition-colors"
                        title="Edit category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="text-base font-bold text-neutral-900">
                {editingCategory.id ? 'Edit Category' : 'Create Category'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-700">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Washing Machine Covers"
                  value={editingCategory.name || ''}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      name: e.target.value,
                      slug:
                        editingCategory.slug ||
                        e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-hidden focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-700">Slug *</label>
                <input
                  type="text"
                  required
                  value={editingCategory.slug || ''}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, slug: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-mono focus:outline-hidden focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-700">Short Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief description for catalog browsing..."
                  value={editingCategory.description || ''}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:outline-hidden focus:border-neutral-900"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={editingCategory.is_active ?? true}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, is_active: e.target.checked })
                  }
                  className="rounded border-neutral-300 text-neutral-900 focus:ring-0"
                />
                <span className="font-semibold text-neutral-800">Active (Visible in Storefront)</span>
              </label>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

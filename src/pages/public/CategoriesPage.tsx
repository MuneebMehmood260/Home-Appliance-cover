import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Category } from '../../types';
import { dbService } from '../../lib/supabase';
import { SEO } from '../../components/common/SEO';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoading(true);
      try {
        const data = await dbService.getCategories();
        setCategories(data.filter((c) => c.is_active));
      } catch (err) {
        console.warn('Error fetching categories', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadCategories();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
      <SEO
        title="Appliance Categories"
        description="Explore tailored protective covers by home appliance category: washing machines, fridges, air conditioners, microwaves, and furniture."
      />

      <div className="border-b border-neutral-200 pb-5">
        <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Protective Solutions</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight mt-1">
          Appliance Cover Categories
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-2xl">
          Browse our precision tailored waterproof and dustproof covers crafted specifically for every household appliance.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-neutral-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="group p-6 bg-white rounded-2xl border border-neutral-200 hover:border-neutral-900 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-neutral-100 group-hover:bg-neutral-900 text-neutral-800 group-hover:text-white flex items-center justify-center transition-colors">
                  <ShieldCheck className="w-6 h-6 stroke-[1.75]" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 group-hover:text-neutral-950">
                  {cat.name}
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  {cat.description || 'Premium protective covers designed for durability and tailored fit.'}
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-100 mt-4 flex items-center justify-between text-xs font-semibold text-neutral-900">
                <span>View Products</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

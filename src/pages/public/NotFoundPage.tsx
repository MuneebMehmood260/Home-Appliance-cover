import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { SEO } from '../../components/common/SEO';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6">
      <SEO title="Page Not Found" description="The page you are looking for does not exist." />
      <span className="text-4xl font-extrabold text-neutral-900 tabular-nums">404</span>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Page Not Found</h1>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto">
          The page or product link you followed may have moved or no longer exists.
        </p>
      </div>
      <div className="pt-2 flex items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Go to Homepage</span>
        </Link>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-100 text-neutral-800 rounded-lg text-xs font-semibold hover:bg-neutral-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse Covers Catalog</span>
        </Link>
      </div>
    </div>
  );
};

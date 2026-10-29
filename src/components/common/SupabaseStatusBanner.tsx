import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Database, X, ExternalLink } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';

export const SupabaseStatusBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);
  const isConnected = isSupabaseConfigured();

  if (dismissed || isConnected) return null;

  return (
    <div className="bg-neutral-800 text-neutral-200 text-xs py-2 px-4 border-b border-neutral-700">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            <strong className="text-white font-medium">Demo Sandbox Mode:</strong> Storefront, cart, WhatsApp orders, and Admin panel are fully functional locally.
          </span>
          <Link
            to="/admin/sql-setup"
            className="text-amber-300 hover:text-white underline inline-flex items-center gap-1 font-medium ml-1"
          >
            <span>Supabase Setup Guide & SQL</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-neutral-400 hover:text-white p-1 rounded transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

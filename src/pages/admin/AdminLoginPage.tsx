import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, Database } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { SEO } from '../../components/common/SEO';

export const AdminLoginPage: React.FC = () => {
  const { login, isDemoMode, isLoading } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const success = await login(email, password);
    setSubmitting(false);
    if (success) {
      navigate(from, { replace: true });
    }
  };

  const handleFillDemoCredentials = () => {
    setEmail('admin@homeappliancecovers.pk');
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <SEO title="Admin Login" description="Secure administrator portal access." />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-xl bg-neutral-800 border border-neutral-700 text-emerald-400 flex items-center justify-center">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Admin Portal Login
        </h2>
        <p className="text-xs text-neutral-400">
          {settings.shop_name} Management Console
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-neutral-800/90 border border-neutral-700 py-8 px-6 sm:px-10 rounded-2xl shadow-xl space-y-6">
          {/* Demo Sandbox Alert if Supabase is not connected */}
          {isDemoMode && (
            <div className="p-3.5 bg-neutral-900/80 border border-amber-500/40 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <Database className="w-4 h-4 shrink-0" />
                <span>Running in Demo Sandbox Mode</span>
              </div>
              <p className="text-neutral-300 text-[11px] leading-relaxed">
                Supabase credentials not configured in <code className="text-amber-300">.env</code>. You can sign in immediately using demo credentials to test all product management and order workflows!
              </p>
              <button
                type="button"
                onClick={handleFillDemoCredentials}
                className="w-full py-1.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[11px] font-semibold transition-colors"
              >
                Click to Auto-fill Demo Credentials
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-300">
                Admin Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="admin@homeappliancecovers.pk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-300">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 shadow-sm"
            >
              <span>{submitting ? 'Verifying...' : 'Sign In to Admin Panel'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 border-t border-neutral-700 flex items-center justify-between text-xs text-neutral-400">
            <Link to="/" className="hover:text-white transition-colors">
              ← Back to Storefront
            </Link>
            <Link to="/admin/sql-setup" className="hover:text-amber-400 text-neutral-400 underline">
              Supabase SQL Guide
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

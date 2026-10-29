import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  ClipboardList,
  UploadCloud,
  Settings,
  Database,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

export const AdminLayout: React.FC = () => {
  const { user, logout, isDemoMode } = useAuth();
  const { settings } = useSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Products', path: '/admin/products', icon: Package },
    { label: 'Categories', path: '/admin/categories', icon: Layers },
    { label: 'Inventory & Logs', path: '/admin/inventory', icon: Boxes },
    { label: 'Orders', path: '/admin/orders', icon: ClipboardList },
    { label: 'Bulk Import / Export', path: '/admin/import', icon: UploadCloud },
    { label: 'Store Settings', path: '/admin/settings', icon: Settings },
    { label: 'Supabase SQL Guide', path: '/admin/sql-setup', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col md:flex-row antialiased">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-neutral-900 text-white px-4 py-3 flex items-center justify-between border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          <span className="font-bold text-sm tracking-tight">Admin Console</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-neutral-900 text-neutral-300 flex flex-col justify-between border-r border-neutral-800 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-5 space-y-6">
          {/* Brand header */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <Link to="/admin" className="flex items-center gap-2.5 text-white font-bold text-sm">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </span>
              <span className="truncate max-w-[150px]">{settings.shop_name}</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-neutral-800 text-white font-bold'
                      : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200'
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-neutral-800 space-y-3 bg-neutral-950/40">
          {/* Status mode badge */}
          <div className="flex items-center justify-between text-[11px] px-2 py-1.5 rounded bg-neutral-800/80 border border-neutral-700">
            <span className="text-neutral-400">Database:</span>
            <span className={`font-semibold ${isDemoMode ? 'text-amber-400' : 'text-emerald-400'}`}>
              {isDemoMode ? 'Demo Sandbox' : 'Supabase Live'}
            </span>
          </div>

          <div className="space-y-1">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-2.5 py-1.5 text-xs text-neutral-400 hover:text-white rounded transition-colors"
            >
              <span>View Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out ({user?.email?.split('@')[0]})</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

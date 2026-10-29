import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  XCircle,
  ClipboardList,
  TrendingUp,
  ArrowRight,
  Plus,
  Boxes,
  Truck,
} from 'lucide-react';
import { Product, Order } from '../../types';
import { dbService } from '../../lib/supabase';
import { useSettings } from '../../context/SettingsContext';
import { SEO } from '../../components/common/SEO';
import toast from 'react-hot-toast';

export const AdminDashboardPage: React.FC = () => {
  const { formatCurrency } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [prods, ords] = await Promise.all([
        dbService.getProducts(),
        dbService.getOrders(),
      ]);
      setProducts(prods);
      setOrders(ords);
    } catch (err) {
      console.warn('Dashboard load error', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const totalProducts = products.length;
  const outOfStockCount = products.filter((p) => p.stock_quantity <= 0).length;
  const lowStockCount = products.filter(
    (p) => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold
  ).length;

  const newOrdersCount = orders.filter((o) => o.status === 'new').length;
  const totalOrdersCount = orders.length;
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((acc, o) => acc + Number(o.total_amount), 0);

  const recentOrders = orders.slice(0, 5);

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      const success = await dbService.updateOrderStatus(orderId, newStatus);
      if (success) {
        toast.success(`Order status updated to ${newStatus}`);
        loadDashboardData();
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'new':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wide">New</span>;
      case 'confirmed':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wide">Confirmed</span>;
      case 'shipped':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 uppercase tracking-wide">Shipped</span>;
      case 'delivered':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide">Delivered</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-200 text-neutral-600 uppercase tracking-wide">Cancelled</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-100 text-neutral-800 uppercase tracking-wide">{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      <SEO title="Admin Dashboard" description="Overview of orders, products, and inventory." />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Store Overview & Analytics
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Real-time catalog metrics and incoming orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/products?action=new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Product</span>
          </Link>
          <Link
            to="/admin/inventory"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Quick Stock Edit</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Revenue */}
        <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Total Sales</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-neutral-900 tabular-nums">
            {formatCurrency(totalRevenue)}
          </p>
          <span className="text-[11px] text-neutral-400">Excluding cancelled orders</span>
        </div>

        {/* New Orders */}
        <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">New Orders</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-neutral-900 tabular-nums">
            {newOrdersCount}
          </p>
          <span className="text-[11px] text-blue-700 font-medium">
            {totalOrdersCount} total orders in history
          </span>
        </div>

        {/* Total Products */}
        <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Active Catalog</span>
            <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-neutral-900 tabular-nums">
            {totalProducts}
          </p>
          <span className="text-[11px] text-neutral-400">Covers & Care Products</span>
        </div>

        {/* Inventory Alerts */}
        <div className="p-5 bg-white rounded-xl border border-neutral-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Stock Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-amber-700 tabular-nums">{lowStockCount}</p>
            <span className="text-xs text-neutral-500 font-medium">low stock</span>
            <span className="text-xs text-neutral-300">/</span>
            <p className="text-xl font-bold text-rose-600 tabular-nums">{outOfStockCount}</p>
            <span className="text-xs text-neutral-500 font-medium">out</span>
          </div>
          <Link to="/admin/inventory" className="text-[11px] text-amber-800 font-semibold hover:underline block">
            Inspect inventory →
          </Link>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs space-y-4">
        <div className="p-5 pb-3 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-900">Recent Customer Orders</h2>
            <p className="text-xs text-neutral-500">Latest orders placed via storefront.</p>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs font-semibold text-neutral-900 hover:text-neutral-600 flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-neutral-400">Loading orders...</div>
        ) : recentOrders.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500">
            No orders placed yet. Place a test order from the storefront!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-600">
              <thead className="bg-neutral-50 text-neutral-700 font-semibold uppercase text-[11px] border-b border-neutral-200">
                <tr>
                  <th className="px-5 py-3">Order #</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">City</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-neutral-900 whitespace-nowrap">
                      {ord.order_number}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-neutral-900">{ord.customer_name}</p>
                      <p className="text-[11px] text-neutral-400">{ord.customer_phone}</p>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {ord.customer_city}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-neutral-900 tabular-nums whitespace-nowrap">
                      {formatCurrency(ord.total_amount)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {getStatusBadge(ord.status)}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <select
                        value={ord.status}
                        onChange={(e) => handleStatusChange(ord.id, e.target.value as Order['status'])}
                        className="text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-medium py-1 px-2 rounded-md border border-neutral-300 focus:outline-hidden cursor-pointer"
                      >
                        <option value="new">New</option>
                        <option value="confirmed">Confirm (Deduct Stock)</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

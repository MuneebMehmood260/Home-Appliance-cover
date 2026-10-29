import React, { useEffect, useState } from 'react';
import {
  ClipboardList,
  Search,
  Printer,
  Eye,
  MessageSquare,
  ShieldCheck,
  Truck,
  CheckCircle,
  X,
  Phone,
  MapPin,
  Calendar,
} from 'lucide-react';
import { Order } from '../../types';
import { dbService } from '../../lib/supabase';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { SEO } from '../../components/common/SEO';
import toast from 'react-hot-toast';

export const OrdersManagerPage: React.FC = () => {
  const { formatCurrency, settings, getWhatsAppOrderUrl } = useSettings();
  const { user } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Selected Order Drawer / Modal & Printable Slip
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await dbService.getOrders();
      setOrders(data);
    } catch (err) {
      console.warn('Error loading orders', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      const success = await dbService.updateOrderStatus(orderId, newStatus, user?.email || 'Store Admin');
      if (success) {
        toast.success(`Order updated to "${newStatus}"`);
        if (newStatus === 'confirmed') {
          toast.success('Stock deducted for confirmed order items!');
        }
        loadOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handlePrintSlip = (order: Order) => {
    setPrintingOrder(order);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleWhatsAppCustomer = (order: Order) => {
    const cleanPhone = order.customer_phone.replace(/[^0-9]/g, '');
    let text = `Salam ${order.customer_name}!\n\nThis is ${settings.shop_name} regarding your appliance cover order *#${order.order_number}*.\n`;
    text += `Total COD Amount: ${formatCurrency(order.total_amount)}\nStatus: ${order.status.toUpperCase()}\n\n`;
    text += `Your package is being processed for dispatch to ${order.customer_city}. Please let us know if you need any adjustments!`;

    const encoded = encodeURIComponent(text);
    const waUrl = cleanPhone.startsWith('92') || cleanPhone.startsWith('03')
      ? `https://wa.me/${cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  const filteredOrders = orders.filter((o) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      o.order_number.toLowerCase().includes(query) ||
      o.customer_name.toLowerCase().includes(query) ||
      o.customer_phone.toLowerCase().includes(query) ||
      o.customer_city.toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'new':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 uppercase">New</span>;
      case 'confirmed':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 uppercase">Confirmed</span>;
      case 'shipped':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 uppercase">Shipped</span>;
      case 'delivered':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase">Delivered</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-200 text-neutral-600 uppercase">Cancelled</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-100 text-neutral-800 uppercase">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="Orders Manager" description="Process orders, print packing slips, and track shipments." />

      {/* Screen View */}
      <div className="no-print space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
              Customer Orders Management
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Review incoming WhatsApp and Cash on Delivery orders, manage fulfillment, and generate slips.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-500">
              Total Orders: <strong className="text-neutral-900">{orders.length}</strong>
            </span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by order #, phone, customer name, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-300 rounded-lg text-xs focus:outline-hidden focus:border-neutral-900"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {['all', 'new', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-neutral-400">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <ClipboardList className="w-8 h-8 text-neutral-400 mx-auto" />
              <h3 className="text-sm font-bold text-neutral-900">No matching orders</h3>
              <p className="text-xs text-neutral-500">
                {orders.length === 0
                  ? 'No orders in database yet. Place a test order from the storefront.'
                  : 'No orders match your filter criteria.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-600">
                <thead className="bg-neutral-50 text-neutral-700 font-semibold uppercase text-[11px] border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3">Order #</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">City / Address</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Total Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="px-4 py-3 font-bold text-neutral-900 whitespace-nowrap">
                        {ord.order_number}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-neutral-500 font-mono text-[11px]">
                        {new Date(ord.created_at).toLocaleDateString('en-PK')}
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-semibold text-neutral-900">{ord.customer_name}</p>
                        <p className="text-[11px] text-neutral-400">{ord.customer_phone}</p>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-semibold text-neutral-800">{ord.customer_city}</span>
                        <p className="text-[11px] text-neutral-500 truncate max-w-xs">{ord.customer_address}</p>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap font-medium text-neutral-700">
                        {ord.items?.length || 1} item(s)
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap font-bold text-neutral-900 tabular-nums">
                        {formatCurrency(ord.total_amount)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(ord.status)}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                          title="View Order Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleWhatsAppCustomer(ord)}
                          className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                          title="Message Customer on WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handlePrintSlip(ord)}
                          className="p-1.5 text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
                          title="Print Courier Order Slip"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Drawer / Modal */}
      {selectedOrder && (
        <div className="no-print fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Order Details
                </span>
                <h3 className="text-xl font-extrabold text-neutral-900 mt-0.5">
                  Order #{selectedOrder.order_number}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Change Strip */}
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-neutral-700">Update Order Status:</span>
              <div className="flex items-center gap-2">
                <select
                  value={selectedOrder.status}
                  onChange={(e) =>
                    handleStatusUpdate(selectedOrder.id, e.target.value as Order['status'])
                  }
                  className="px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-semibold cursor-pointer focus:outline-hidden"
                >
                  <option value="new">New</option>
                  <option value="confirmed">Confirmed (Auto-reduces inventory)</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <button
                  onClick={() => handlePrintSlip(selectedOrder)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
              </div>
            </div>

            {/* Customer & Destination */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-neutral-200 bg-neutral-50 text-xs">
              <div className="space-y-1">
                <span className="text-neutral-400 uppercase tracking-wider font-semibold text-[10px]">
                  Customer Contact
                </span>
                <p className="font-bold text-neutral-900 text-sm">{selectedOrder.customer_name}</p>
                <p className="text-neutral-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{selectedOrder.customer_phone}</span>
                </p>
                <button
                  onClick={() => handleWhatsAppCustomer(selectedOrder)}
                  className="inline-flex items-center gap-1 text-emerald-700 hover:underline pt-1 font-semibold"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Send WhatsApp Message</span>
                </button>
              </div>

              <div className="space-y-1">
                <span className="text-neutral-400 uppercase tracking-wider font-semibold text-[10px]">
                  Shipping Destination
                </span>
                <p className="font-bold text-neutral-900 text-sm">{selectedOrder.customer_city}</p>
                <p className="text-neutral-600 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                  <span>{selectedOrder.customer_address}</span>
                </p>
                {selectedOrder.customer_notes && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded mt-1">
                    <strong>Note:</strong> {selectedOrder.customer_notes}
                  </p>
                )}
              </div>
            </div>

            {/* Itemized Table */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-neutral-900 uppercase tracking-wider text-[11px]">
                Ordered Items
              </span>
              <div className="border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-100">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between bg-white">
                    <div>
                      <p className="font-semibold text-neutral-900">{item.product_name}</p>
                      <p className="text-[11px] text-neutral-400">
                        SKU: {item.product_sku} {item.selected_size && `· Size: ${item.selected_size}`}{' '}
                        {item.selected_color && `· Color: ${item.selected_color}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-neutral-500 mr-3">Qty: {item.quantity}</span>
                      <span className="font-bold text-neutral-900 tabular-nums">
                        {formatCurrency(item.total_price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Totals */}
            <div className="pt-2 border-t border-neutral-200 space-y-1.5 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-neutral-900 tabular-nums">
                  {formatCurrency(selectedOrder.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span className="tabular-nums font-semibold">
                  {selectedOrder.shipping_fee === 0 ? 'FREE' : formatCurrency(selectedOrder.shipping_fee)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-neutral-900 pt-2 border-t border-neutral-100">
                <span>Total Amount Due (COD)</span>
                <span className="tabular-nums text-base">{formatCurrency(selectedOrder.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY ORDER / PACKING SLIP */}
      {printingOrder && (
        <div className="print-only p-8 max-w-2xl mx-auto space-y-6 text-black bg-white">
          {/* Slip Header */}
          <div className="flex justify-between items-start border-b-2 border-black pb-4">
            <div>
              <h1 className="text-2xl font-black">{settings.shop_name}</h1>
              <p className="text-xs">{settings.address}</p>
              <p className="text-xs">Phone: {settings.phone_number} | WhatsApp: {settings.whatsapp_number}</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold uppercase tracking-wider">DELIVERY SLIP</h2>
              <p className="text-sm font-mono font-bold">#{printingOrder.order_number}</p>
              <p className="text-xs text-neutral-600">{new Date(printingOrder.created_at).toLocaleDateString('en-PK')}</p>
            </div>
          </div>

          {/* Consignee Info */}
          <div className="grid grid-cols-2 gap-6 p-4 border border-black rounded-lg text-xs">
            <div>
              <p className="font-bold uppercase text-[10px] text-neutral-600">CONSIGNEE / CUSTOMER</p>
              <p className="text-sm font-bold mt-1">{printingOrder.customer_name}</p>
              <p className="font-semibold text-sm">{printingOrder.customer_phone}</p>
            </div>
            <div>
              <p className="font-bold uppercase text-[10px] text-neutral-600">DELIVERY DESTINATION</p>
              <p className="font-bold text-sm mt-1">{printingOrder.customer_city}</p>
              <p>{printingOrder.customer_address}</p>
              {printingOrder.customer_notes && (
                <p className="mt-1 italic">Notes: {printingOrder.customer_notes}</p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left text-xs border border-black border-collapse">
            <thead>
              <tr className="border-b border-black bg-neutral-100 font-bold">
                <th className="p-2 border-r border-black">Sr.</th>
                <th className="p-2 border-r border-black">Item Description / Model</th>
                <th className="p-2 border-r border-black">SKU</th>
                <th className="p-2 border-r border-black text-center">Qty</th>
                <th className="p-2 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {printingOrder.items?.map((it, i) => (
                <tr key={i} className="border-b border-black">
                  <td className="p-2 border-r border-black text-center">{i + 1}</td>
                  <td className="p-2 border-r border-black">
                    <strong>{it.product_name}</strong>
                    {(it.selected_size || it.selected_color) && (
                      <span className="block text-[10px]">
                        {it.selected_size} {it.selected_color && `| ${it.selected_color}`}
                      </span>
                    )}
                  </td>
                  <td className="p-2 border-r border-black font-mono">{it.product_sku}</td>
                  <td className="p-2 border-r border-black text-center font-bold">{it.quantity}</td>
                  <td className="p-2 text-right font-bold tabular-nums">
                    {formatCurrency(it.total_price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Payment Total */}
          <div className="flex justify-between items-end pt-4 border-t-2 border-black">
            <div>
              <p className="text-xs font-bold uppercase">PAYMENT TERMS</p>
              <p className="text-sm font-bold text-black">Cash on Delivery (COD)</p>
              <p className="text-[11px] text-neutral-600">Please inspect package before payment.</p>
            </div>
            <div className="text-right space-y-1 text-xs">
              <p>Subtotal: {formatCurrency(printingOrder.subtotal)}</p>
              <p>Delivery Fee: {printingOrder.shipping_fee === 0 ? 'FREE' : formatCurrency(printingOrder.shipping_fee)}</p>
              <p className="text-lg font-black border-t border-black pt-1">
                COD TOTAL: {formatCurrency(printingOrder.total_amount)}
              </p>
            </div>
          </div>

          <div className="pt-8 text-center text-[10px] text-neutral-500 border-t border-neutral-300">
            Thank you for shopping with {settings.shop_name}! For assistance, contact {settings.phone_number}.
          </div>
        </div>
      )}
    </div>
  );
};

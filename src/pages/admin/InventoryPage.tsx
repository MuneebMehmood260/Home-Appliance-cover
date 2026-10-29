import React, { useEffect, useState } from 'react';
import {
  Boxes,
  Plus,
  Minus,
  Save,
  AlertTriangle,
  History,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { Product, StockLog } from '../../types';
import { dbService } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { SEO } from '../../components/common/SEO';
import toast from 'react-hot-toast';

export const InventoryPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Local editable stock inputs state
  const [editableStock, setEditableStock] = useState<Record<string, number>>({});
  const [adjustmentReasons, setAdjustmentReasons] = useState<Record<string, string>>({});

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const [prods, stockLogs] = await Promise.all([
        dbService.getProducts(),
        dbService.getStockLogs(),
      ]);
      setProducts(prods);
      setLogs(stockLogs);

      const initialStockMap: Record<string, number> = {};
      const initialReasonMap: Record<string, string> = {};
      prods.forEach((p) => {
        initialStockMap[p.id] = p.stock_quantity;
        initialReasonMap[p.id] = 'Restock / Inventory count';
      });
      setEditableStock(initialStockMap);
      setAdjustmentReasons(initialReasonMap);
    } catch (err) {
      console.warn('Error loading inventory', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleQuickAdjust = (productId: string, delta: number) => {
    setEditableStock((prev) => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] ?? 0) + delta),
    }));
  };

  const handleSaveStock = async (product: Product) => {
    const newStock = editableStock[product.id];
    if (newStock === undefined || newStock === product.stock_quantity) {
      toast('No change to save');
      return;
    }

    const delta = newStock - product.stock_quantity;
    const reason = adjustmentReasons[product.id] || 'Manual inventory update';

    try {
      await dbService.adjustStock(
        product.id,
        delta,
        reason,
        undefined,
        user?.email || 'Store Admin'
      );
      toast.success(`Updated stock for ${product.sku} to ${newStock}`);
      loadInventory();
    } catch {
      toast.error('Failed to update inventory');
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <SEO title="Inventory & Stock Logs" description="Quick stock editor and inventory audit history." />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Inventory & Stock Audit
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Quick-edit unit quantities and review automated deduction history.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search cover SKU or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs focus:outline-hidden focus:border-neutral-900"
          />
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Stock Levels Quick Editor */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs space-y-3">
        <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-neutral-800" />
            <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              Live Stock Level Controls
            </h2>
          </div>
          <span className="text-[11px] text-neutral-500 font-medium">
            Changes are logged automatically to audit history
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-neutral-400">Loading inventory...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-600">
              <thead className="bg-neutral-50 text-neutral-700 font-semibold uppercase text-[11px] border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Current Stock</th>
                  <th className="px-4 py-3">Quick Adjust</th>
                  <th className="px-4 py-3">New Level</th>
                  <th className="px-4 py-3">Reason / Memo</th>
                  <th className="px-4 py-3 text-right">Commit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredProducts.map((p) => {
                  const currentQty = p.stock_quantity;
                  const targetQty = editableStock[p.id] ?? currentQty;
                  const isLow = currentQty > 0 && currentQty <= p.low_stock_threshold;
                  const isOut = currentQty <= 0;
                  const hasChanged = targetQty !== currentQty;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-neutral-50/80 transition-colors ${
                        isOut ? 'bg-rose-50/40' : isLow ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-neutral-900">
                        <div className="flex items-center gap-2">
                          {isOut && <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                          {isLow && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                          <span className="line-clamp-1">{p.name}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono font-medium text-neutral-700 whitespace-nowrap">
                        {p.sku}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`font-bold tabular-nums ${
                            isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-neutral-900'
                          }`}
                        >
                          {currentQty} units
                        </span>
                        {isOut && <span className="block text-[10px] text-rose-500 font-semibold">OUT OF STOCK</span>}
                        {isLow && <span className="block text-[10px] text-amber-600 font-semibold">LOW (Alert: {p.low_stock_threshold})</span>}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleQuickAdjust(p.id, -5)}
                            className="px-1.5 py-1 text-[10px] font-bold bg-neutral-100 hover:bg-neutral-200 rounded text-neutral-700"
                            title="Subtract 5"
                          >
                            -5
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAdjust(p.id, -1)}
                            className="p-1 bg-neutral-100 hover:bg-neutral-200 rounded text-neutral-700"
                            title="Subtract 1"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAdjust(p.id, 1)}
                            className="p-1 bg-neutral-100 hover:bg-neutral-200 rounded text-neutral-700"
                            title="Add 1"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAdjust(p.id, 10)}
                            className="px-1.5 py-1 text-[10px] font-bold bg-neutral-100 hover:bg-neutral-200 rounded text-neutral-700"
                            title="Add 10"
                          >
                            +10
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          value={targetQty}
                          onChange={(e) =>
                            setEditableStock({
                              ...editableStock,
                              [p.id]: Math.max(0, parseInt(e.target.value, 10) || 0),
                            })
                          }
                          className={`w-20 px-2 py-1 border rounded text-xs font-bold tabular-nums text-center focus:outline-hidden ${
                            hasChanged
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                              : 'border-neutral-300 bg-white text-neutral-900'
                          }`}
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={adjustmentReasons[p.id] || ''}
                          onChange={(e) =>
                            setAdjustmentReasons({
                              ...adjustmentReasons,
                              [p.id]: e.target.value,
                            })
                          }
                          placeholder="Reason (e.g. supplier batch received)"
                          className="w-full px-2 py-1 border border-neutral-300 rounded text-xs focus:outline-hidden"
                        />
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleSaveStock(p)}
                          disabled={!hasChanged}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            hasChanged
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                          }`}
                        >
                          <Save className="w-3 h-3" />
                          <span>Update</span>
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

      {/* Stock Adjustment History / Audit Log */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs space-y-3">
        <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-neutral-800" />
            <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              Stock Adjustment Log (Audit Trail)
            </h2>
          </div>
          <span className="text-[11px] text-neutral-500">
            {logs.length} logged events
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400">
            No stock adjustments recorded yet. Changes made above or orders confirmed will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs text-neutral-600">
              <thead className="bg-neutral-50 text-neutral-700 font-semibold uppercase text-[11px] border-b border-neutral-200 sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">Date & Time</th>
                  <th className="px-4 py-2.5">Product / SKU</th>
                  <th className="px-4 py-2.5">Change</th>
                  <th className="px-4 py-2.5">Previous → New</th>
                  <th className="px-4 py-2.5">Reason</th>
                  <th className="px-4 py-2.5">Adjusted By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="px-4 py-2.5 text-neutral-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-PK')}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-semibold text-neutral-900">{log.product_name}</span>
                      <span className="text-[11px] text-neutral-400 ml-1.5 font-mono">({log.product_sku})</span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap font-bold tabular-nums">
                      {log.change_quantity > 0 ? (
                        <span className="text-emerald-700">+{log.change_quantity}</span>
                      ) : (
                        <span className="text-rose-600">{log.change_quantity}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap tabular-nums text-neutral-700">
                      {log.previous_stock} → <strong className="text-neutral-900">{log.new_stock}</strong>
                    </td>
                    <td className="px-4 py-2.5 text-neutral-700">
                      {log.reason}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-500 whitespace-nowrap">
                      {log.adjusted_by || 'Admin'}
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

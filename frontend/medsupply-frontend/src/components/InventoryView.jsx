import { useMemo, useState } from 'react';
import {
  Warehouse,
  Plus,
  Edit3,
  AlertTriangle,
  CheckCircle2,
  PackagePlus,
  X,
} from 'lucide-react';
import { inventoryApi } from '../api/medsupplyApi';

export default function InventoryView({
  products,
  inventoryList,
  role,
  onDataChanged,
  notify,
}) {
  const canManage = role === 'ADMIN' || role === 'INVENTORY_MANAGER';

  const [initModalOpen, setInitModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantityInput, setQuantityInput] = useState(100);
  const [submitting, setSubmitting] = useState(false);

  const productLookup = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [products]);

  const unstockedProducts = useMemo(() => {
    const stockedIds = new Set(inventoryList.map((i) => i.productId));
    return products.filter((p) => !stockedIds.has(p.id));
  }, [products, inventoryList]);

  const stats = useMemo(() => {
    const totalUnits = inventoryList.reduce((sum, i) => sum + (i.availableQuantity || 0), 0);
    const lowStock = inventoryList.filter(
      (i) => i.availableQuantity > 0 && i.availableQuantity <= 10
    ).length;
    const outOfStock = inventoryList.filter((i) => i.availableQuantity === 0).length;
    return { totalUnits, lowStock, outOfStock, trackedItems: inventoryList.length };
  }, [inventoryList]);

  const handleOpenInit = () => {
    setSelectedProductId(unstockedProducts[0]?.id || '');
    setQuantityInput(100);
    setInitModalOpen(true);
  };

  const handleInitializeStock = async (e) => {
    e.preventDefault();
    if (!selectedProductId) return;
    setSubmitting(true);
    try {
      await inventoryApi.initialize({
        productId: selectedProductId,
        quantity: Number(quantityInput),
      });
      notify('success', 'Initial stock added to warehouse');
      setInitModalOpen(false);
      await onDataChanged();
    } catch (err) {
      notify('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenUpdate = (invItem) => {
    setEditTarget(invItem);
    setQuantityInput(invItem.availableQuantity);
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!editTarget) return;
    setSubmitting(true);
    try {
      await inventoryApi.updateStock(editTarget.productId, Number(quantityInput));
      notify('success', 'Warehouse stock updated');
      setEditTarget(null);
      await onDataChanged();
    } catch (err) {
      notify('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Warehouse Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {canManage
              ? 'Monitor stock health, add newly listed supplies, and replenish warehouse quantities.'
              : 'Live stock availability across all medical distribution items.'}
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenInit}
            disabled={unstockedProducts.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold shadow-xs transition cursor-pointer disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4 text-teal-400" />
            <span>
              {unstockedProducts.length > 0
                ? `Add Stock (${unstockedProducts.length} Pending)`
                : 'All Products Stocked'}
            </span>
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">Stocked Items</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
            {stats.trackedItems}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">Total Units Ready</p>
          <p className="text-2xl font-extrabold text-teal-600 mt-1 tabular-nums">
            {stats.totalUnits.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">Low Stock Warnings</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1 tabular-nums">
            {stats.lowStock}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">Out of Stock</p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1 tabular-nums">
            {stats.outOfStock}
          </p>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {inventoryList.length === 0 ? (
          <div className="p-14 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Warehouse className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No inventory tracked yet</h3>
            <p className="text-sm text-slate-500 mt-1">
              Add initial warehouse quantities for your catalog items to begin fulfilling orders.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">Product</th>
                  <th className="py-3.5 px-5">Category</th>
                  <th className="py-3.5 px-5">Stock Level</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Last Updated</th>
                  {canManage && <th className="py-3.5 px-5 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {inventoryList.map((item) => {
                  const prod = productLookup[item.productId];
                  const qty = item.availableQuantity ?? 0;
                  const fillPercent = Math.min(100, Math.round((qty / 100) * 100));

                  return (
                    <tr key={item.id || item.productId} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-5">
                        <p className="font-semibold text-slate-900">
                          {prod?.productName || 'Medical Supply Item'}
                        </p>
                        {prod?.sku && (
                          <p className="text-xs text-slate-400 mt-0.5">Code: {prod.sku}</p>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                          {prod?.category || 'General'}
                        </span>
                      </td>
                      <td className="py-4 px-5 min-w-[160px]">
                        <div className="flex items-baseline justify-between mb-1.5">
                          <span className="font-bold text-slate-900 tabular-nums">{qty}</span>
                          <span className="text-[11px] text-slate-400">
                            {prod?.unitOfMeasurement || 'Units'}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              qty > 10
                                ? 'bg-teal-500'
                                : qty > 0
                                ? 'bg-amber-500'
                                : 'bg-rose-400'
                            }`}
                            style={{ width: `${qty === 0 ? 0 : Math.max(8, fillPercent)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        {qty > 10 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <CheckCircle2 className="w-3.5 h-3.5" /> In Stock
                          </span>
                        ) : qty > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
                            <AlertTriangle className="w-3.5 h-3.5" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80">
                            Out of Stock
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-xs text-slate-500">
                        {item.updatedAt
                          ? new Date(item.updatedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      {canManage && (
                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={() => handleOpenUpdate(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-teal-400 hover:text-teal-700 text-xs font-semibold text-slate-700 transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Restock</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Initialize Stock Modal */}
      {initModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-teal-600" />
                <h2 className="text-lg font-bold text-slate-900">Add Initial Stock</h2>
              </div>
              <button
                onClick={() => setInitModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInitializeStock} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product *
                </label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-600"
                >
                  {unstockedProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.productName} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Opening Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInitModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Update Stock Quantity</h2>
              <button
                onClick={() => setEditTarget(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStock} className="space-y-4 mt-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <p className="text-sm font-bold text-slate-900">
                  {productLookup[editTarget.productId]?.productName || 'Medical Supply Item'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Current available stock: <strong>{editTarget.availableQuantity}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Updated Total Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-600"
                />
                <div className="flex gap-2 mt-2.5">
                  {[25, 50, 100].map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => setQuantityInput(Number(quantityInput || 0) + inc)}
                      className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      +{inc} units
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold cursor-pointer"
                >
                  {submitting ? 'Updating...' : 'Save Quantity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
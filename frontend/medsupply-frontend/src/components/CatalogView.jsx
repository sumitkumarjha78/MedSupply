import { useMemo, useState } from 'react';
import {
  Search,
  Plus,
  ShoppingBag,
  Pencil,
  Trash2,
  Package,
  X,
  CheckCircle2,
  Ban,
} from 'lucide-react';
import { productApi } from '../api/medsupplyApi';

const EMPTY_FORM = {
  productName: '',
  sku: '',
  description: '',
  category: 'PPE',
  unitPrice: '',
  unitOfMeasurement: 'BOX',
  active: true,
};

export default function CatalogView({
  products,
  inventoryMap,
  role,
  cart,
  onAddToCart,
  onDataChanged,
  notify,
}) {
  const isAdmin = role === 'ADMIN';
  const canOrder = role === 'HOSPITAL_BUYER' || role === 'ADMIN';

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showDiscontinued, setShowDiscontinued] = useState(isAdmin);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!showDiscontinued && !p.active) return false;
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        p.productName?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    });
  }, [products, search, selectedCategory, showDiscontinued]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setForm({
      productName: product.productName,
      sku: product.sku,
      description: product.description || '',
      category: product.category,
      unitPrice: product.unitPrice,
      unitOfMeasurement: product.unitOfMeasurement,
      active: product.active,
    });
    setModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        unitPrice: Number(form.unitPrice),
      };
      if (editingProduct) {
        await productApi.update(editingProduct.id, payload);
        notify('success', `Saved changes to ${payload.productName}`);
      } else {
        await productApi.create(payload);
        notify('success', `Added ${payload.productName} to catalog`);
      }
      setModalOpen(false);
      await onDataChanged();
    } catch (err) {
      notify('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Remove "${product.productName}" from the catalog?`)) return;
    try {
      await productApi.remove(product.id);
      notify('success', `Removed ${product.productName}`);
      await onDataChanged();
    } catch (err) {
      notify('error', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Medical Supply Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse certified clinical supplies with live warehouse availability.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-teal-400" />
            <span>Add Product</span>
          </button>
        )}
      </div>

      {/* Search & Category Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search medical supplies or item codes..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-600 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {cat === 'ALL' ? 'All Supplies' : cat}
            </button>
          ))}

          {isAdmin && (
            <label className="ml-2 inline-flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showDiscontinued}
                onChange={(e) => setShowDiscontinued(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              Show Inactive
            </label>
          )}
        </div>
      </div>

      {/* Catalog Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <Package className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No matching medical supplies</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {isAdmin
              ? 'Add your first medical product to make it available for hospital orders.'
              : 'Try adjusting your search or category filter.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => {
            const inv = inventoryMap[product.id];
            const available = inv ? inv.availableQuantity : 0;
            const inCartQty = cart.find((c) => c.product.id === product.id)?.quantity || 0;
            const remainingToAdd = Math.max(0, available - inCartQty);

            return (
              <div
                key={product.id}
                className={`group bg-white rounded-2xl border transition flex flex-col justify-between p-5 shadow-2xs ${
                  product.active
                    ? 'border-slate-200/80 hover:border-teal-300 hover:shadow-md hover:shadow-slate-900/5'
                    : 'border-slate-200 bg-slate-50/70 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                      {product.category}
                    </span>

                    {!product.active ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80">
                        <Ban className="w-3 h-3" /> Unavailable
                      </span>
                    ) : available > 10 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        <CheckCircle2 className="w-3 h-3" /> {available} available
                      </span>
                    ) : available > 0 ? (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
                        Only {available} left
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200/80">
                        Out of stock
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mt-3.5 leading-snug group-hover:text-teal-700 transition">
                    {product.productName}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Item Code: {product.sku}
                  </p>

                  <p className="text-sm text-slate-600 mt-3 line-clamp-2 min-h-[2.5rem] leading-relaxed">
                    {product.description || 'Certified clinical-grade medical supply.'}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xl font-extrabold text-slate-900 tabular-nums">
                      ${Number(product.unitPrice).toFixed(2)}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      per {product.unitOfMeasurement}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => openEditModal(product)}
                          title="Edit product"
                          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          title="Delete product"
                          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {canOrder && (
                      <button
                        disabled={!product.active || remainingToAdd === 0}
                        onClick={() => onAddToCart(product)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-100 disabled:text-slate-400 text-white text-xs font-semibold shadow-2xs transition cursor-pointer disabled:cursor-not-allowed"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{inCartQty > 0 ? `In Cart (${inCartQty})` : 'Add to Cart'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingProduct ? 'Edit Product' : 'Add New Medical Product'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 mt-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    required
                    value={form.productName}
                    onChange={(e) => setForm({ ...form, productName: e.target.value })}
                    placeholder="Surgical Gloves"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Item Code (SKU) *
                  </label>
                  <input
                    required
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="MED-GLV-001"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <input
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="PPE"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit Price ($) *
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.unitPrice}
                    onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                    placeholder="15.50"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit *
                  </label>
                  <input
                    required
                    value={form.unitOfMeasurement}
                    onChange={(e) => setForm({ ...form, unitOfMeasurement: e.target.value })}
                    placeholder="BOX"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Sterile powder-free latex surgical gloves"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-600"
                />
              </div>

              {editingProduct && (
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="rounded border-slate-300 text-teal-600"
                  />
                  Available for hospital orders
                </label>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold cursor-pointer"
                >
                  {saving ? 'Saving...' : editingProduct ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
import { useEffect, useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, Building2, ArrowRight } from 'lucide-react';
import { orderApi } from '../api/medsupplyApi';
import { useAuth } from '../context/AuthContext';

export default function CartDrawer({
  open,
  onClose,
  cart,
  inventoryMap,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onOrderSuccess,
  notify,
}) {
  const { user } = useAuth();
  const isHospitalBuyer = user?.role === 'HOSPITAL_BUYER';
  const [facilityName, setFacilityName] = useState(user?.hospitalName || '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.hospitalName) {
      setFacilityName(user.hospitalName);
    }
  }, [user?.hospitalName]);

  if (!open) return null;

  const grandTotal = cart.reduce(
    (sum, item) => sum + Number(item.product.unitPrice) * item.quantity,
    0
  );

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const resolvedFacility = isHospitalBuyer
      ? (user?.hospitalName || '').trim()
      : facilityName.trim();

    setSubmitting(true);
    try {
      await orderApi.create({
        facilityName: resolvedFacility,
        items: cart.map((c) => ({
          productId: c.product.id,
          quantity: c.quantity,
        })),
      });
      onClearCart();
      onClose();
      notify('success', `Order confirmed for ${resolvedFacility || 'your hospital'}`);
      await onOrderSuccess();
    } catch (err) {
      notify('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-teal-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Order Cart</h2>
              <p className="text-xs text-slate-500">Review supplies before dispatch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Line Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <ShoppingBag className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-900">Your cart is empty</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Browse the medical supply catalog and add items to create a facility order.
              </p>
            </div>
          ) : (
            cart.map(({ product, quantity }) => {
              const maxStock = inventoryMap[product.id]?.availableQuantity ?? quantity;
              return (
                <div
                  key={product.id}
                  className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {product.productName}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ${Number(product.unitPrice).toFixed(2)} / {product.unitOfMeasurement}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onUpdateQty(product.id, quantity - 1)}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center text-sm font-bold tabular-nums">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      disabled={quantity >= maxStock}
                      onClick={() => onUpdateQty(product.id, quantity + 1)}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(product.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Checkout Footer */}
        {cart.length > 0 && (
          <form onSubmit={handlePlaceOrder} className="p-5 border-t border-slate-200/80 space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                {isHospitalBuyer ? 'Registered Hospital' : 'Receiving Hospital or Facility *'}
              </label>
              <input
                type="text"
                required={!isHospitalBuyer}
                readOnly={isHospitalBuyer}
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                placeholder="Enter hospital or clinic name"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none ${
                  isHospitalBuyer
                    ? 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
                    : 'border-slate-300 bg-white focus:ring-2 focus:ring-teal-500/25 focus:border-teal-600'
                }`}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600">Total Amount</span>
              <span className="text-xl font-extrabold text-slate-900 tabular-nums">
                ${grandTotal.toFixed(2)}
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
            >
              <span>{submitting ? 'Confirming Order...' : 'Place Facility Order'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
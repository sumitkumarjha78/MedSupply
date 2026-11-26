import { useEffect, useState } from 'react';
import {
  X,
  Trash2,
  ShoppingBag,
  Building2,
  ArrowRight,
  CreditCard,
} from 'lucide-react';
import { orderApi, paymentApi } from '../api/medsupplyApi';
import { useAuth } from '../context/AuthContext';
import QuantityControl from './QuantityControl';

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
  const [submittingMode, setSubmittingMode] = useState(null); // null | 'coindrop' | 'later'

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

  const submitOrder = async (payImmediately) => {
    if (cart.length === 0 || submittingMode) return;

    const resolvedFacility = isHospitalBuyer
      ? (user?.hospitalName || '').trim()
      : facilityName.trim();

    if (!isHospitalBuyer && !resolvedFacility) {
      notify('error', 'Please enter a receiving hospital or facility name.');
      return;
    }

    setSubmittingMode(payImmediately ? 'coindrop' : 'later');
    let createdOrder = null;

    try {
      createdOrder = await orderApi.create({
        facilityName: resolvedFacility,
        items: cart.map((c) => ({
          productId: c.product.id,
          quantity: c.quantity,
        })),
      });

      onClearCart();

      if (payImmediately) {
        const session = await paymentApi.createCoinDropCheckout(createdOrder.id);
        onClose();
        window.location.assign(session.checkoutUrl);
        return;
      }

      onClose();
      notify('success', `Order ${createdOrder.orderNumber} placed. Complete payment from Orders.`);
      await onOrderSuccess();
    } catch (err) {
      if (createdOrder) {
        onClose();
        notify(
          'error',
          `Order ${createdOrder.orderNumber} was saved, but CoinDrop checkout failed: ${err.message}. You can retry payment from Orders.`
        );
        await onOrderSuccess();
      } else {
        notify('error', err.message);
      }
    } finally {
      setSubmittingMode(null);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !submittingMode) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white w-full max-w-2xl max-h-[88vh] rounded-3xl flex flex-col shadow-2xl border border-slate-200/80 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-teal-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Order Cart</h2>
              <p className="text-xs text-slate-500">Review quantities before dispatch</p>
            </div>
          </div>
          <button
            type="button"
            disabled={Boolean(submittingMode)}
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Line Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-14">
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
              const maxStock = Math.max(
                inventoryMap[product.id]?.availableQuantity ?? quantity,
                1
              );
              const lineTotal = Number(product.unitPrice) * quantity;

              return (
                <div
                  key={product.id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {product.productName}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ${Number(product.unitPrice).toFixed(2)} / {product.unitOfMeasurement}
                      <span className="mx-1.5">&bull;</span>
                      <span>{maxStock} in stock</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <QuantityControl
                      value={quantity}
                      min={1}
                      max={maxStock}
                      allowRemoveOnDecrement
                      onChange={(nextQty) => onUpdateQty(product.id, nextQty)}
                      onMaxExceeded={(limit) =>
                        notify('error', `Only ${limit} units available for ${product.productName}`)
                      }
                    />

                    <p className="w-20 text-right text-sm font-extrabold text-slate-900 tabular-nums">
                      ${lineTotal.toFixed(2)}
                    </p>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(product.id)}
                      aria-label={`Remove ${product.productName}`}
                      className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Checkout Footer */}
        {cart.length > 0 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitOrder(true);
            }}
            className="px-6 py-5 border-t border-slate-200/80 bg-white space-y-4"
          >
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={Boolean(submittingMode)}
                onClick={() => submitOrder(false)}
                className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-60 text-slate-700 font-semibold text-sm transition cursor-pointer"
              >
                {submittingMode === 'later' ? 'Placing Order...' : 'Place Order & Pay Later'}
              </button>

              <button
                type="submit"
                disabled={Boolean(submittingMode)}
                className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>
                  {submittingMode === 'coindrop'
                    ? 'Redirecting to CoinDrop...'
                    : 'Pay with CoinDrop'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
import { useState } from 'react';
import {
  ClipboardList,
  Building2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { orderApi, paymentApi } from '../api/medsupplyApi';

const formatOrderNumber = (id) => {
  if (!id) return 'MS-ORDER';
  return `MS-${String(id).replace(/-/g, '').slice(0, 8).toUpperCase()}`;
};

const PAYMENT_BADGE = {
  PAID: {
    label: 'Paid',
    style: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  },
  FAILED: {
    label: 'Payment Failed',
    style: 'bg-rose-50 text-rose-700 border-rose-200/80',
  },
  INITIATED: {
    label: 'Payment Pending',
    style: 'bg-sky-50 text-sky-700 border-sky-200/80',
  },
  PENDING: {
    label: 'Unpaid',
    style: 'bg-amber-50 text-amber-700 border-amber-200/80',
  },
};

export default function OrdersView({ orders, productLookup, onDataChanged, notify }) {
  const [expandedId, setExpandedId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [payingId, setPayingId] = useState(null);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Cancel this order and release reserved stock?')) return;
    setCancellingId(orderId);
    try {
      await orderApi.cancel(orderId);
      notify('success', 'Order cancelled and stock released');
      await onDataChanged();
    } catch (err) {
      notify('error', err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const handlePayWithCoinDrop = async (order) => {
    setPayingId(order.id);
    try {
      const session = await paymentApi.createCoinDropCheckout(order.id);
      window.location.assign(session.checkoutUrl);
    } catch (err) {
      notify('error', err.message);
      setPayingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Facility Orders
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review submitted hospital requisitions, payment status, and itemized totals.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <ClipboardList className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No orders placed yet</h3>
          <p className="text-sm text-slate-500 mt-1">
            Add medical supplies from the catalog to submit your first facility order.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isCancelled = order.status === 'CANCELLED';
            const paymentStatus = order.paymentStatus || 'PENDING';
            const isPaid = paymentStatus === 'PAID';
            const isFailed = paymentStatus === 'FAILED';
            const paymentMeta = PAYMENT_BADGE[paymentStatus] || PAYMENT_BADGE.PENDING;
            const isExpanded = expandedId === order.id;
            const facility =
              order.facilityName || order.healthcareFacilityName || 'Healthcare Facility';
            const items = order.items || order.orderItems || [];
            const total = order.totalAmount ?? order.totalPrice ?? 0;

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden transition hover:border-slate-300"
              >
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 font-bold text-slate-900 text-base">
                        <Building2 className="w-4 h-4 text-teal-600" />
                        {facility}
                      </span>

                      <span
                        className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full border ${
                          isCancelled
                            ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                            : order.status === 'CONFIRMED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                            : 'bg-slate-100 text-slate-700 border-slate-200/80'
                        }`}
                      >
                        {order.status}
                      </span>

                      {!isCancelled && (
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full border ${paymentMeta.style}`}
                        >
                          {isPaid && <CheckCircle2 className="w-3 h-3" />}
                          {isFailed && <AlertCircle className="w-3 h-3" />}
                          <span>{paymentMeta.label}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">
                        Order #{order.orderNumber || formatOrderNumber(order.id)}
                      </span>
                      <span>&bull;</span>
                      <span>
                        {items.length} {items.length === 1 ? 'item' : 'items'}
                      </span>
                      {order.createdAt && (
                        <>
                          <span>&bull;</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(order.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-center">
                    <div className="text-right mr-1">
                      <p className="text-[11px] text-slate-400 font-medium">
                        Order Total ({order.currency || 'USD'})
                      </p>
                      <p className="text-lg font-extrabold text-slate-900 tabular-nums">
                        ${Number(total).toFixed(2)}
                      </p>
                    </div>

                    {!isCancelled && !isPaid && (
                      <button
                        disabled={payingId === order.id}
                        onClick={() => handlePayWithCoinDrop(order)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>
                          {payingId === order.id
                            ? 'Redirecting...'
                            : isFailed
                            ? 'Retry Payment'
                            : 'Pay with CoinDrop'}
                        </span>
                      </button>
                    )}

                    {!isCancelled && !isPaid && (
                      <button
                        disabled={cancellingId === order.id}
                        onClick={() => handleCancelOrder(order.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{cancellingId === order.id ? 'Cancelling...' : 'Cancel'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                      title="View order summary"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="bg-slate-50/80 border-t border-slate-100 px-5 py-4 space-y-4">
                    {isPaid && (order.paymentReference || order.paidAt) && (
                      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-xs text-emerald-900">
                        <span className="font-semibold">
                          Payment Reference: {order.paymentReference || 'Verified via CoinDrop'}
                        </span>
                        {order.paidAt && (
                          <span className="text-emerald-700">
                            Paid on{' '}
                            {new Date(order.paidAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                    )}

                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                        Itemized Summary
                      </p>
                      <div className="divide-y divide-slate-200/70">
                        {items.map((item, idx) => {
                          const prod = productLookup[item.productId];
                          const name =
                            item.productNameSnapshot ||
                            item.productName ||
                            prod?.productName ||
                            'Medical Supply Item';
                          const unitPrice =
                            item.unitPriceSnapshot ?? item.unitPrice ?? prod?.unitPrice ?? 0;
                          const subtotal = item.subtotal ?? Number(unitPrice) * item.quantity;

                          return (
                            <div
                              key={item.id || idx}
                              className="py-2.5 flex items-center justify-between text-sm"
                            >
                              <div>
                                <p className="font-semibold text-slate-800">{name}</p>
                                <p className="text-xs text-slate-500">
                                  Qty {item.quantity} &times; ${Number(unitPrice).toFixed(2)}
                                </p>
                              </div>
                              <p className="font-bold text-slate-900 tabular-nums">
                                ${Number(subtotal).toFixed(2)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
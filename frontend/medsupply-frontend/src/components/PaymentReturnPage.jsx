import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ArrowLeft,
  CreditCard,
} from 'lucide-react';
import { orderApi, paymentApi } from '../api/medsupplyApi';

const MAX_POLL_ATTEMPTS = 12;
const POLL_INTERVAL_MS = 2500;

export default function PaymentReturnPage({ onPaymentUpdated, notify }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const externalOrderId =
    searchParams.get('externalOrderId') || searchParams.get('orderNumber');
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState('');

  const fetchAuthoritativeOrder = useCallback(async () => {
    if (externalOrderId) {
      return orderApi.getByOrderNumber(externalOrderId);
    }
    if (orderId) {
      return orderApi.getById(orderId);
    }
    throw new Error('Missing order reference in return URL.');
  }, [externalOrderId, orderId]);

  useEffect(() => {
    let cancelled = false;
    let timerId = null;

    const pollStatus = async (attempt) => {
      try {
        const data = await fetchAuthoritativeOrder();
        if (cancelled) return;

        setOrder(data);
        setError('');
        setLoading(false);

        const isPending =
          data.status !== 'CANCELLED' &&
          (data.paymentStatus === 'PENDING' || data.paymentStatus === 'INITIATED');

        if (isPending && attempt < MAX_POLL_ATTEMPTS) {
          setPolling(true);
          timerId = setTimeout(() => pollStatus(attempt + 1), POLL_INTERVAL_MS);
        } else {
          setPolling(false);
          if (onPaymentUpdated) {
            onPaymentUpdated();
          }
        }
      } catch (err) {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
        setPolling(false);
      }
    };

    pollStatus(0);

    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [fetchAuthoritativeOrder, onPaymentUpdated]);

  const handleManualRefresh = async () => {
    setLoading(true);
    try {
      const data = await fetchAuthoritativeOrder();
      setOrder(data);
      setError('');
      if (onPaymentUpdated) {
        onPaymentUpdated();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!order?.id) return;
    setRetrying(true);
    try {
      const session = await paymentApi.createCoinDropCheckout(order.id);
      window.location.assign(session.checkoutUrl);
    } catch (err) {
      notify('error', err.message);
      setRetrying(false);
    }
  };

  if (loading && !order) {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-3xl border border-slate-200/80 p-10 text-center space-y-4 shadow-2xs">
        <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
        <h2 className="text-xl font-extrabold text-slate-900">Verifying Payment Status</h2>
        <p className="text-sm text-slate-500">
          Confirming authoritative payment confirmation from MedSupply...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-3xl border border-slate-200/80 p-10 text-center space-y-5 shadow-2xs">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto">
          <XCircle className="w-7 h-7 text-rose-600" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-extrabold text-slate-900">Could Not Verify Order</h2>
          <p className="text-sm text-slate-600">{error}</p>
        </div>
        <button
          onClick={() => navigate('/orders')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Orders</span>
        </button>
      </div>
    );
  }

  const paymentStatus = order?.paymentStatus || 'PENDING';
  const isPaid = paymentStatus === 'PAID';
  const isFailed = paymentStatus === 'FAILED';

  return (
    <div className="max-w-lg mx-auto bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 text-center space-y-6 shadow-2xs">
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
          isPaid ? 'bg-emerald-50' : isFailed ? 'bg-rose-50' : 'bg-amber-50'
        }`}
      >
        {isPaid ? (
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
        ) : isFailed ? (
          <XCircle className="w-7 h-7 text-rose-600" />
        ) : (
          <Clock className={`w-7 h-7 text-amber-600 ${polling ? 'animate-pulse' : ''}`} />
        )}
      </div>

      <div className="space-y-1.5">
        <h1 className="text-2xl font-extrabold text-slate-900">
          {isPaid
            ? 'Payment Confirmed'
            : isFailed
            ? 'Payment Failed'
            : 'Payment Verification Pending'}
        </h1>
        <p className="text-sm text-slate-600">
          {isPaid
            ? 'CoinDrop has verified your payment and your hospital order is now confirmed.'
            : isFailed
            ? 'Your payment did not complete. Your order is still saved and you can retry below.'
            : polling
            ? 'Waiting for CoinDrop to finalize payment verification. This updates automatically.'
            : 'We have not received final confirmation from CoinDrop yet. Refresh in a moment or check Orders.'}
        </p>
      </div>

      <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 text-left space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Order Number</span>
          <span className="font-bold text-slate-900">{order.orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Facility</span>
          <span className="font-semibold text-slate-900">{order.facilityName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Amount</span>
          <span className="font-extrabold text-slate-900 tabular-nums">
            ${Number(order.totalAmount).toFixed(2)} {order.currency || 'USD'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Payment Status</span>
          <span className="font-bold text-slate-900">{paymentStatus}</span>
        </div>
        {order.paymentReference && (
          <div className="flex justify-between">
            <span className="text-slate-500">Reference</span>
            <span className="font-semibold text-slate-800">{order.paymentReference}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
        {isFailed && order.status !== 'CANCELLED' && (
          <button
            onClick={handleRetryPayment}
            disabled={retrying}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>{retrying ? 'Redirecting...' : 'Retry Payment'}</span>
          </button>
        )}

        {!isPaid && !isFailed && (
          <button
            onClick={handleManualRefresh}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${polling ? 'animate-spin' : ''}`} />
            <span>Check Status Again</span>
          </button>
        )}

        <button
          onClick={() => navigate('/orders')}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>View All Orders</span>
        </button>
      </div>
    </div>
  );
}
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { authApi, productApi, inventoryApi, orderApi } from './api/medsupplyApi';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import Navbar from './components/Navbar';
import CatalogView from './components/CatalogView';
import InventoryView from './components/InventoryView';
import OrdersView from './components/OrdersView';
import CartDrawer from './components/CartDrawer';
import PaymentReturnPage from './components/PaymentReturnPage';

const EMPTY_STAFF_FORM = {
  name: '',
  email: '',
  password: '',
  role: 'INVENTORY_MANAGER',
};

function DashboardShell() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState(EMPTY_STAFF_FORM);
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const syncAllData = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const canReadOrders = user.role === 'HOSPITAL_BUYER' || user.role === 'ADMIN';
      const [prodData, invData, ordData] = await Promise.all([
        productApi.getAll(),
        inventoryApi.getAll(),
        canReadOrders ? orderApi.getAll() : Promise.resolve([]),
      ]);
      setProducts(Array.isArray(prodData) ? prodData : []);
      setInventoryList(Array.isArray(invData) ? invData : []);
      setOrders(Array.isArray(ordData) ? ordData : []);
    } catch (err) {
      notify('error', `Could not refresh data: ${err.message}`);
    } finally {
      setRefreshing(false);
    }
  }, [user, notify]);

  useEffect(() => {
    if (user) {
      syncAllData();
    } else {
      setCart([]);
      setProducts([]);
      setInventoryList([]);
      setOrders([]);
      setStaffModalOpen(false);
      setStaffForm(EMPTY_STAFF_FORM);
    }
  }, [user, syncAllData]);

  const inventoryMap = useMemo(() => {
    const map = {};
    inventoryList.forEach((item) => {
      map[item.productId] = item;
    });
    return map;
  }, [inventoryList]);

  const productLookup = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [products]);

 const handleAddToCart = (product, quantityToAdd = 1) => {
    const maxStock = inventoryMap[product.id]?.availableQuantity ?? 0;
    const requested = Math.max(1, parseInt(quantityToAdd, 10) || 1);

    if (maxStock <= 0) {
      notify('error', `${product.productName} is currently out of stock`);
      return;
    }

    const existing = cart.find((c) => c.product.id === product.id);
    const currentQty = existing ? existing.quantity : 0;
    const remaining = maxStock - currentQty;

    if (remaining <= 0) {
      notify(
        'error',
        `Maximum available stock (${maxStock}) for ${product.productName} is already in your cart`
      );
      return;
    }

    const addedQty = Math.min(requested, remaining);

    setCart((prev) => {
      const found = prev.find((c) => c.product.id === product.id);
      if (found) {
        return prev.map((c) =>
          c.product.id === product.id
            ? { ...c, quantity: Math.min(maxStock, c.quantity + addedQty) }
            : c
        );
      }
      return [...prev, { product, quantity: addedQty }];
    });

    if (addedQty < requested) {
      notify(
        'success',
        `Added ${addedQty} of ${product.productName} (max stock ${maxStock} reached)`
      );
    } else {
      notify('success', `Added ${addedQty} × ${product.productName} to cart`);
    }
  };

  const handleUpdateQty = (productId, newQty) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((c) => c.product.id !== productId));
      return;
    }
    const maxStock = inventoryMap[productId]?.availableQuantity;
    const clampedQty =
      typeof maxStock === 'number' && maxStock > 0
        ? Math.min(newQty, maxStock)
        : newQty;

    setCart((prev) =>
      prev.map((c) => (c.product.id === productId ? { ...c, quantity: clampedQty } : c))
    );
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setCreatingStaff(true);
    try {
      await authApi.createStaff(staffForm);
      notify('success', `Created ${staffForm.role.replace('_', ' ')} account for ${staffForm.name}`);
      setStaffForm(EMPTY_STAFF_FORM);
      setStaffModalOpen(false);
    } catch (err) {
      notify('error', err.message);
    } finally {
      setCreatingStaff(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] text-slate-500 text-sm font-medium">
        Loading your workspace...
      </div>
    );
  }

  // Unauthenticated Routes
  if (!user) {
    return (
      <Routes>
        <Route
          path="/"
          element={<LandingPage onNavigateAuth={(mode) => navigate(`/${mode}`)} />}
        />
        <Route
          path="/login"
          element={
            <AuthPage
              key="login"
              initialMode="login"
              onBack={() => navigate('/')}
            />
          }
        />
        <Route
          path="/register"
          element={
            <AuthPage
              key="register"
              initialMode="register"
              onBack={() => navigate('/')}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Authenticated Routes
  const isInternalStaff = user.role === 'ADMIN' || user.role === 'INVENTORY_MANAGER';
  const canOrder = user.role === 'HOSPITAL_BUYER' || user.role === 'ADMIN';
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const activeTab = location.pathname.replace('/', '') || 'catalog';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => navigate(`/${tab}`)}
        cartCount={totalCartItems}
        onOpenCart={() => setCartOpen(true)}
        onOpenAddStaff={() => setStaffModalOpen(true)}
        onRefresh={syncAllData}
        refreshing={refreshing}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-slate-900 text-white border-slate-800'
                : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-white shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="opacity-70 hover:opacity-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route
            path="/catalog"
            element={
              <CatalogView
                products={products}
                inventoryMap={inventoryMap}
                role={user.role}
                cart={cart}
                onAddToCart={handleAddToCart}
                onDataChanged={syncAllData}
                notify={notify}
              />
            }
          />
          <Route
            path="/inventory"
            element={
              isInternalStaff ? (
                <InventoryView
                  products={products}
                  inventoryList={inventoryList}
                  role={user.role}
                  onDataChanged={syncAllData}
                  notify={notify}
                />
              ) : (
                <Navigate to="/catalog" replace />
              )
            }
          />
          <Route
            path="/orders"
            element={
              canOrder ? (
                <OrdersView
                  orders={orders}
                  productLookup={productLookup}
                  onDataChanged={syncAllData}
                  notify={notify}
                />
              ) : (
                <Navigate to="/catalog" replace />
              )
            }
          />
          <Route
            path="/payments/coindrop/return"
            element={
              canOrder ? (
                <PaymentReturnPage
                  onPaymentUpdated={syncAllData}
                  notify={notify}
                />
              ) : (
                <Navigate to="/catalog" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/catalog" replace />} />
        </Routes>
      </main>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        inventoryMap={inventoryMap}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={(id) => setCart((prev) => prev.filter((c) => c.product.id !== id))}
        onClearCart={() => setCart([])}
        onOrderSuccess={async () => {
          await syncAllData();
          navigate('/orders');
        }}
        notify={notify}
      />

      {/* Admin Add Staff Modal */}
      {staffModalOpen && user.role === 'ADMIN' && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Add Staff Account</h2>
              <button
                type="button"
                onClick={() => setStaffModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="Rohan Kulkarni"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Email *
                </label>
                <input
                  type="email"
                  required
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  placeholder="rohan@medsupply.io"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role *</label>
                <select
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-600"
                >
                  <option value="INVENTORY_MANAGER">Inventory Manager</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Temporary Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingStaff}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
                >
                  {creatingStaff ? 'Creating...' : 'Create Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardShell />
    </AuthProvider>
  );
}
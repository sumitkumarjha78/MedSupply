import {
  HeartPulse,
  LayoutGrid,
  Warehouse,
  ClipboardList,
  ShoppingCart,
  LogOut,
  RefreshCw,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLE_META = {
  ADMIN: {
    label: 'Administrator',
    style: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  },
  INVENTORY_MANAGER: {
    label: 'Inventory Manager',
    style: 'bg-amber-50 text-amber-700 border-amber-200/80',
  },
  HOSPITAL_BUYER: {
    label: 'Hospital Account',
    style: 'bg-teal-50 text-teal-700 border-teal-200/80',
  },
};

export default function Navbar({
  activeTab,
  setActiveTab,
  cartCount,
  onOpenCart,
  onOpenAddStaff,
  onRefresh,
  refreshing,
}) {
  const { user, logout } = useAuth();
  const canOrder = user?.role === 'HOSPITAL_BUYER' || user?.role === 'ADMIN';
  const isInternalStaff = user?.role === 'ADMIN' || user?.role === 'INVENTORY_MANAGER';

  const roleInfo = ROLE_META[user?.role] || {
    label: 'Hospital Account',
    style: 'bg-teal-50 text-teal-700 border-teal-200/80',
  };

  const navItems = [
    { id: 'catalog', label: 'Catalog', icon: LayoutGrid, show: true },
    { id: 'inventory', label: 'Inventory', icon: Warehouse, show: isInternalStaff },
    { id: 'orders', label: 'Orders', icon: ClipboardList, show: canOrder },
  ].filter((item) => item.show);

  const initials = (user?.name || user?.email || 'H')
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('');

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shadow-xs">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-extrabold text-slate-900 tracking-tight text-lg">
              MedSupply
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm transition cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-teal-400' : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          {user?.role === 'ADMIN' && (
            <button
              type="button"
              onClick={onOpenAddStaff}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-teal-600" />
              <span>Add Staff</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            title="Refresh live data"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
          </button>

          {canOrder && (
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-xs transition cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-white text-teal-700 tabular-nums leading-none">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

          <div className="hidden sm:flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
              {initials}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-900 leading-tight max-w-[160px] truncate">
                {user?.name || user?.email}
              </span>
              <span
                title={user?.hospitalName || roleInfo.label}
                className={`mt-0.5 self-start text-[10px] font-semibold px-2 py-0.5 rounded-full border leading-none max-w-[160px] truncate ${roleInfo.style}`}
              >
                {user?.hospitalName || roleInfo.label}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            title="Sign out"
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="flex md:hidden border-t border-slate-100 px-4 py-2 gap-1.5 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                active ? 'bg-slate-900 text-white' : 'text-slate-600 bg-slate-100/70'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}

        {user?.role === 'ADMIN' && (
          <button
            type="button"
            onClick={onOpenAddStaff}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap text-teal-700 bg-teal-50 border border-teal-200/80"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Staff</span>
          </button>
        )}
      </div>
    </header>
  );
}
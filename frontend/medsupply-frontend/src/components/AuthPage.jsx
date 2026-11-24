import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartPulse,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage({ initialMode = 'login', onBack }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    hospitalName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const passwordsMismatch =
    mode === 'register' &&
    form.confirmPassword.length > 0 &&
    form.password !== form.confirmPassword;

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    navigate(`/${nextMode}`, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (form.password !== form.confirmPassword) {
        setError('Password and Confirm Password do not match.');
        return;
      }
      if (!form.hospitalName.trim()) {
        setError('Hospital name is required.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          hospitalName: form.hospitalName.trim(),
          email: form.email.trim(),
          password: form.password,
          confirmPassword: form.confirmPassword,
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-[#F8FAFC]">
      {/* Left Brand Story Panel */}
      <div className="hidden lg:flex lg:col-span-5 bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-teal-500/15 blur-3xl" />
        <div className="absolute -left-24 -bottom-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/25">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-xl font-extrabold tracking-tight">MedSupply</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight">
              Reliable medical supplies for every department.
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Order certified clinical supplies with live warehouse availability, locked-in facility
              pricing, and effortless requisition tracking.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {[
              'Real-time stock counts on every catalog item',
              'Verified hospital registration and procurement routing',
              'Instant order cancellation whenever care plans change',
            ].map((point) => (
              <div key={point} className="flex items-center gap-2.5 text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>{point}</span>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/70 space-y-2">
            <p className="text-sm text-slate-200 leading-relaxed">
              &ldquo;Our procurement team cut weekly restock ordering from hours to minutes—with
              full visibility into what is ready to ship.&rdquo;
            </p>
            <p className="text-xs font-semibold text-teal-400">
              Procurement Lead &bull; Regional Medical Center
            </p>
          </div>
        </div>

        <p className="relative z-10 text-xs text-slate-500">
          &copy; {new Date().getFullYear()} MedSupply Healthcare Logistics
        </p>
      </div>

      {/* Right Auth Form */}
      <div className="lg:col-span-7 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
          )}

          <div className="flex lg:hidden items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-extrabold text-slate-900">MedSupply</span>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {mode === 'login' ? 'Sign in to MedSupply' : 'Register your hospital account'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {mode === 'login'
                ? 'Enter your work credentials to access your procurement portal.'
                : 'Enter the representative and hospital details to register your account.'}
            </p>
          </div>

          {/* Segmented Toggle */}
          <div className="grid grid-cols-2 p-1 bg-slate-200/70 rounded-xl">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`py-2 text-sm font-semibold rounded-lg transition cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`py-2 text-sm font-semibold rounded-lg transition cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ananya"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-600 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Second Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Rao"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-600 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                    <Building2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>Hospital Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="City General Hospital"
                    value={form.hospitalName}
                    onChange={(e) => setForm({ ...form, hospitalName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-600 transition"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email
              </label>
              <input
                type="email"
                required
                placeholder="procurement@cityhospital.org"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Re-enter your password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className={`w-full pl-3.5 pr-11 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 transition ${
                      passwordsMismatch
                        ? 'border-rose-400 focus:ring-rose-500/25 focus:border-rose-500'
                        : 'border-slate-300 focus:ring-teal-500/25 focus:border-teal-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {passwordsMismatch && (
                  <p className="mt-1 text-xs font-medium text-rose-600">
                    Passwords do not match.
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || passwordsMismatch}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:cursor-not-allowed"
            >
              <span>
                {submitting
                  ? mode === 'login'
                    ? 'Signing in...'
                    : 'Creating account...'
                  : mode === 'login'
                  ? 'Sign In'
                  : 'Create Hospital Account'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
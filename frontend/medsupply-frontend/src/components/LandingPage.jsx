import { useState } from 'react';
import {
  HeartPulse,
  ArrowRight,
  Building2,
  CheckCircle2,
  Truck,
  Clock,
  RotateCcw,
  FileCheck2,
  Boxes,
  Stethoscope,
  ShoppingBag,
  ShieldCheck,
  Syringe,
  Activity,
} from 'lucide-react';

const DEPARTMENTS = {
  SURGICAL: {
    eyebrow: 'Operating Rooms & Sterile Supply',
    title: 'Certified PPE and surgical essentials ready for immediate dispatch.',
    description:
      'Keep operating theaters stocked with sterile gloves, respirators, drapes, and surgical consumables without chasing suppliers or risking last-minute backorders.',
    highlights: [
      'Real-time warehouse availability shown on every catalog item',
      'Standardized item codes for error-free ward requisitions',
      'Locked-in unit pricing captured on every confirmed order',
    ],
    stats: [
      { label: 'Catalog Readiness', value: 'Live Stock' },
      { label: 'Requisition Checkout', value: '< 60 sec' },
      { label: 'Order Cancellations', value: 'Instant' },
    ],
    icon: ShieldCheck,
  },
  CRITICAL_CARE: {
    eyebrow: 'Emergency & Intensive Care',
    title: 'Fast replenishment for high-turnover ER and ICU departments.',
    description:
      'Respond rapidly to patient surges with multi-item cart ordering, transparent totals, and instant cancellation if clinical allocation changes.',
    highlights: [
      'Stock is reserved the moment your requisition is submitted',
      'Clear low-stock indicators before you finalize checkout',
      'Full itemized order history for departmental audits',
    ],
    stats: [
      { label: 'Stock Reservation', value: 'Immediate' },
      { label: 'Audit Visibility', value: '100%' },
      { label: 'Supply Availability', value: '24/7' },
    ],
    icon: Activity,
  },
  CLINICS: {
    eyebrow: 'Outpatient Clinics & Diagnostics',
    title: 'Supply every satellite clinic from a single hospital account.',
    description:
      'Specify the exact receiving clinic, lab, or hospital wing at checkout so one procurement lead can manage restocking across an entire healthcare network.',
    highlights: [
      'Route deliveries to any branch or clinic name at checkout',
      'Search and filter medical supplies by category in seconds',
      'Consolidated order tracking across all facility deliveries',
    ],
    stats: [
      { label: 'Multi-Branch Dispatch', value: 'Unlimited' },
      { label: 'Invoice Clarity', value: 'Itemized' },
      { label: 'Account Setup', value: '1 Minute' },
    ],
    icon: Syringe,
  },
};

export default function LandingPage({ onNavigateAuth }) {
  const [activeDept, setActiveDept] = useState('SURGICAL');
  const current = DEPARTMENTS[activeDept];
  const DeptIcon = current.icon;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 overflow-x-hidden">
      {/* Sticky Navigation */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-lg border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shadow-sm shadow-teal-600/20">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-extrabold tracking-tight text-slate-900">
              MedSupply
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#benefits" className="hover:text-slate-900 transition">
              Why MedSupply
            </a>
            <a href="#departments" className="hover:text-slate-900 transition">
              Departments
            </a>
            <a href="#how-it-works" className="hover:text-slate-900 transition">
              How It Works
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigateAuth('login')}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 transition cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => onNavigateAuth('register')}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Register Hospital</span>
              <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-14 pb-20 lg:pt-24 lg:pb-28">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 right-0 w-[640px] h-[640px] rounded-full bg-teal-100/60 blur-3xl" />
          <div className="absolute top-20 -left-32 w-[480px] h-[480px] rounded-full bg-sky-100/50 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            {/* Hero Copy */}
            <div className="lg:col-span-6 space-y-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs text-xs font-semibold text-slate-700">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                <span>Direct Medical Supply Procurement for Hospitals</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-[-0.03em] text-slate-900 leading-[1.08]">
                Medical supplies,{' '}
                <span className="text-teal-600">always in stock</span> when care can&apos;t wait.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Order certified PPE, surgical consumables, and clinical essentials with real-time
                availability, transparent unit pricing, and direct delivery to every ward or clinic.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-1">
                <button
                  onClick={() => onNavigateAuth('register')}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Create Hospital Account</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigateAuth('login')}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold text-sm shadow-2xs transition cursor-pointer"
                >
                  Sign In to Portal
                </button>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-xs font-medium text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" /> Live Stock Counts
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" /> Multi-Facility Delivery
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" /> Free Order Cancellation
                </span>
              </div>
            </div>

            {/* Hospital Procurement Workspace Preview */}
            <div className="lg:col-span-6">
              <div className="relative mx-auto max-w-xl">
                <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xl shadow-slate-900/5 p-5 sm:p-6 space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center">
                        <Stethoscope className="w-5 h-5 text-teal-700" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">City General Hospital</p>
                        <p className="text-xs text-slate-500">Central Procurement Desk</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Ready to Order
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-[11px] font-medium text-slate-500">In-Stock Catalog</p>
                      <p className="text-lg font-extrabold text-slate-900 mt-0.5 tabular-nums">
                        1,420+
                      </p>
                      <p className="text-[10px] font-semibold text-emerald-600 mt-0.5">
                        Units ready now
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-[11px] font-medium text-slate-500">Active Orders</p>
                      <p className="text-lg font-extrabold text-slate-900 mt-0.5 tabular-nums">
                        12
                      </p>
                      <p className="text-[10px] font-semibold text-teal-600 mt-0.5">
                        Confirmed today
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-[11px] font-medium text-slate-500">Facilities</p>
                      <p className="text-lg font-extrabold text-slate-900 mt-0.5 tabular-nums">
                        4
                      </p>
                      <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                        Wings &amp; clinics
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Recent Hospital Requisitions
                    </p>

                    {[
                      {
                        name: 'Sterile Surgical Gloves (Latex)',
                        meta: 'PPE • 20 Boxes • Wing B Surgery',
                        price: '$310.00',
                        status: 'Confirmed',
                        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      },
                      {
                        name: 'N95 Particulate Respirator Masks',
                        meta: 'PPE • 15 Boxes • ICU Ward',
                        price: '$360.00',
                        status: 'Reserved',
                        badge: 'bg-teal-50 text-teal-700 border-teal-200',
                      },
                      {
                        name: 'Sterile IV Infusion Administration Sets',
                        meta: 'Consumables • 40 Packs • ER Trauma',
                        price: '$480.00',
                        status: 'Dispatched',
                        badge: 'bg-sky-50 text-sky-700 border-sky-200',
                      },
                    ].map((row) => (
                      <div
                        key={row.name}
                        className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {row.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{row.meta}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-slate-900 tabular-nums">
                            {row.price}
                          </p>
                          <span
                            className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${row.badge}`}
                          >
                            {row.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-3 absolute -bottom-5 -left-6 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-lg">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/20 flex items-center justify-center">
                    <Truck className="w-4 h-4 text-teal-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">Instant Stock Reservation</p>
                    <p className="text-[11px] text-slate-400">
                      Every confirmed order locks in your supplies immediately
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Healthcare Environments Strip */}
      <section className="border-y border-slate-200/70 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400 mb-5">
            Trusted Across Healthcare Environments
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center text-sm font-semibold text-slate-600">
            <span>Acute Care Hospitals</span>
            <span>Surgical Centers</span>
            <span>Diagnostic Labs</span>
            <span>Outpatient Clinics</span>
            <span>Specialty Wards</span>
          </div>
        </div>
      </section>

      {/* Benefits Bento Grid */}
      <section id="benefits" className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-600">
            Why MedSupply
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Built to keep clinical teams supplied without delays.
          </h2>
          <p className="text-slate-600 text-base">
            Replace phone calls, outdated price lists, and backorder surprises with one fast,
            dependable hospital procurement portal.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-12 gap-6">
          <div className="md:col-span-7 rounded-3xl bg-white border border-slate-200/80 p-8 shadow-2xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center">
                <Boxes className="w-5 h-5 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Real-Time Supply Availability
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed max-w-lg">
                Know exactly how many boxes, kits, or packs are ready to ship before you place an
                order. Quantities update immediately upon confirmation so your facility never faces
                unexpected fulfillment gaps.
              </p>
            </div>
            <div className="mt-8 pt-5 border-t border-slate-100 grid grid-cols-3 gap-4">
              <div>
                <p className="text-lg font-extrabold text-slate-900">Live</p>
                <p className="text-xs text-slate-500">Availability counts</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-teal-600">Instant</p>
                <p className="text-xs text-slate-500">Supply reservation</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-slate-900">Zero</p>
                <p className="text-xs text-slate-500">Hidden surcharges</p>
              </div>
            </div>
          </div>

          <div className="md:col-span-5 rounded-3xl bg-slate-900 text-white p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-12 -bottom-12 w-52 h-52 rounded-full bg-teal-500/20 blur-2xl" />
            <div className="space-y-4 relative z-10">
              <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-teal-300" />
              </div>
              <h3 className="text-xl font-bold">One-Click Order Cancellation</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Hospital needs shift quickly. Cancel any active order directly from your order
                history whenever plans change, with zero paperwork or phone queues.
              </p>
            </div>
            <p className="relative z-10 mt-8 text-xs font-semibold text-teal-300">
              Instant confirmation on every status update
            </p>
          </div>

          <div className="md:col-span-5 rounded-3xl bg-white border border-slate-200/80 p-8 shadow-2xs space-y-4">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Locked-In Order Pricing</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Every confirmed requisition saves exact product descriptions and unit prices at the
              moment of checkout, making hospital billing and audits effortless.
            </p>
          </div>

          <div className="md:col-span-7 rounded-3xl bg-gradient-to-br from-teal-50/90 to-white border border-teal-200/70 p-8 space-y-4">
            <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Multi-Facility Ordering From One Account
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed max-w-lg">
              Managing procurement for a main hospital plus satellite clinics? Enter the receiving
              facility name directly in your cart to dispatch orders wherever they are needed most.
            </p>
          </div>
        </div>
      </section>

      {/* Clinical Departments Showcase */}
      <section id="departments" className="py-20 bg-white border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-600">
              Built For Every Care Unit
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Tailored procurement for every hospital department.
            </h2>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-2.5">
            {[
              { id: 'SURGICAL', label: 'Surgical & PPE', icon: ShieldCheck },
              { id: 'CRITICAL_CARE', label: 'Emergency & ICU', icon: Activity },
              { id: 'CLINICS', label: 'Outpatient Clinics', icon: Syringe },
            ].map((tab) => {
              const Icon = tab.icon;
              const selected = activeDept === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveDept(tab.id)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                    selected
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${selected ? 'text-teal-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 rounded-3xl bg-[#F8FAFC] border border-slate-200/90 p-8 sm:p-10 grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold">
                <DeptIcon className="w-3.5 h-3.5" />
                <span>{current.eyebrow}</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
                {current.title}
              </h3>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                {current.description}
              </p>

              <ul className="space-y-2.5 pt-1">
                {current.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2">
                <button
                  onClick={() => onNavigateAuth('register')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-sm transition cursor-pointer"
                >
                  <span>Start Ordering Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 grid gap-3.5">
              {current.stats.map((m) => (
                <div
                  key={m.label}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center justify-between shadow-2xs"
                >
                  <span className="text-sm font-medium text-slate-600">{m.label}</span>
                  <span className="text-xl font-extrabold text-slate-900 tabular-nums">
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-600">
            Simple Workflow
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            From requisition to delivery in three steps
          </h2>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            {
              num: '01',
              title: 'Browse Live Medical Catalog',
              desc: 'Search verified medical supplies by category or item code and see exact available quantities right on every card.',
              icon: ShoppingBag,
            },
            {
              num: '02',
              title: 'Enter Receiving Facility',
              desc: 'Build a multi-item order cart, enter your hospital or clinic name, and review locked-in unit totals.',
              icon: Building2,
            },
            {
              num: '03',
              title: 'Track & Manage Orders',
              desc: 'Monitor active requisitions with full itemized breakdowns and cancel any order anytime if clinical plans change.',
              icon: Clock,
            },
          ].map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="bg-white rounded-3xl border border-slate-200/80 p-7 shadow-2xs space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg">
                    Step {step.num}
                  </span>
                  <Icon className="w-5 h-5 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-7xl mx-auto rounded-3xl bg-slate-900 text-white p-10 sm:p-14 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-teal-500/20 blur-3xl" />

          <div className="relative z-10 space-y-3 text-center lg:text-left max-w-xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to streamline your hospital supply ordering?
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Create your hospital buyer account in under a minute and get immediate access to our
              live medical catalog.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={() => onNavigateAuth('register')}
              className="px-6 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Register Hospital</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateAuth('login')}
              className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-semibold text-sm transition cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <HeartPulse className="w-4 h-4 text-teal-600" />
            <span>MedSupply</span>
          </div>
          <p>
            &copy; {new Date().getFullYear()} MedSupply Healthcare Logistics. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
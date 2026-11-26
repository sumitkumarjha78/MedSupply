import { useEffect, useState } from 'react';
import { Plus, Minus } from 'lucide-react';

export default function QuantityControl({
  value,
  min = 1,
  max = 9999,
  allowRemoveOnDecrement = false,
  onChange,
  onMaxExceeded,
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const handleInputChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '');
    if (digitsOnly === '') {
      setDraft('');
      return;
    }

    const parsed = parseInt(digitsOnly, 10);
    if (parsed > max) {
      setDraft(String(max));
      onChange(max);
      if (onMaxExceeded) onMaxExceeded(max);
      return;
    }

    setDraft(String(parsed));
    if (parsed >= min) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parseInt(draft, 10);
    if (!parsed || parsed < min) {
      setDraft(String(min));
      if (value !== min) onChange(min);
      return;
    }
    const clamped = Math.min(parsed, max);
    setDraft(String(clamped));
    if (clamped !== value) onChange(clamped);
  };

  const handleDecrement = () => {
    if (value <= min) {
      if (allowRemoveOnDecrement) {
        onChange(0);
      }
      return;
    }
    onChange(value - 1);
  };

  const handleIncrement = () => {
    if (value >= max) {
      if (onMaxExceeded) onMaxExceeded(max);
      return;
    }
    onChange(value + 1);
  };

  return (
    <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        disabled={!allowRemoveOnDecrement && value <= min}
        onClick={handleDecrement}
        aria-label="Decrease quantity"
        className="p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer disabled:cursor-not-allowed"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <input
        type="text"
        inputMode="numeric"
        value={draft}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
        aria-label="Quantity"
        className="w-14 text-center text-sm font-bold text-slate-900 tabular-nums border-x border-slate-200 py-1.5 focus:outline-none focus:bg-teal-50/40"
      />

      <button
        type="button"
        disabled={value >= max}
        onClick={handleIncrement}
        aria-label="Increase quantity"
        className="p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer disabled:cursor-not-allowed"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
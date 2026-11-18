import React, { useState } from 'react';
import { Lock, RotateCcw } from 'lucide-react';
import { CardHeader, PageHeader } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { resetDemoData } from '../../services/api';
import { getActiveUser } from '../../utils/authStorage';
import { useTheme } from '../../utils/hooks';
import { DEFAULT_WEIGHTS, FACTOR_LABELS, getWeights } from '../../utils/priority';

const read = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };

export default function Settings() {
  const toast = useToast();
  const user = getActiveUser();
  const [dark, setDark] = useTheme();
  const [threshold, setThreshold] = useState(+read('cs_threshold', 75));
  const [raw, setRaw] = useState(() => { const w = getWeights(); return { S: Math.round(w.S * 100), D: Math.round(w.D * 100), T: Math.round(w.T * 100), R: Math.round(w.R * 100) }; });
  const sum = raw.S + raw.D + raw.T + raw.R || 1;

  const saveAI = () => { try { localStorage.setItem('cs_threshold', String(threshold)); } catch { /* ignore */ } toast('Review threshold saved.'); };
  const saveWeights = () => {
    try { localStorage.setItem('cs_weights', JSON.stringify({ S: raw.S / sum, D: raw.D / sum, T: raw.T / sum, R: raw.R / sum })); } catch { /* ignore */ }
    toast('Priority weights saved. Scores update across the dashboard.');
  };
  const resetWeights = () => {
    setRaw({ S: DEFAULT_WEIGHTS.S * 100, D: DEFAULT_WEIGHTS.D * 100, T: DEFAULT_WEIGHTS.T * 100, R: DEFAULT_WEIGHTS.R * 100 });
    try { localStorage.removeItem('cs_weights'); } catch { /* ignore */ }
    toast('Weights reset to defaults.');
  };

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Settings" subtitle="Review thresholds, priority weights and appearance." />

      <div className="card p-5">
        <CardHeader title="Profile" />
        <dl className="grid sm:grid-cols-3 gap-4 text-sm">
          <div><dt className="text-xs text-muted">Name</dt><dd className="font-semibold text-ink">{user?.name}</dd></div>
          <div><dt className="text-xs text-muted">Email</dt><dd className="font-semibold text-ink break-all">{user?.email}</dd></div>
          <div><dt className="text-xs text-muted">Department</dt><dd className="font-semibold text-ink">{user?.department || 'Central Dispatch'}</dd></div>
        </dl>
      </div>

      <div className="card p-5 space-y-4">
        <CardHeader title="AI review rules" />
        <div>
          <div className="flex justify-between text-sm mb-1"><label htmlFor="thr" className="font-semibold text-ink">Flag predictions below</label><b className="text-brand-700 dark:text-brand-200">{threshold}% confidence</b></div>
          <input id="thr" type="range" min="50" max="95" value={threshold} onChange={(e) => setThreshold(+e.target.value)} className="w-full accent-teal-600" />
          <p className="text-xs text-muted mt-1">Choose this from validation data once the real model exists. It is not a universal value.</p>
        </div>
        <label className="flex items-center gap-3 text-sm text-ink opacity-80"><input type="checkbox" checked disabled /> <Lock className="h-3.5 w-3.5" /> Always send predicted Critical complaints to human review (cannot be turned off)</label>
        <button className="btn-primary" onClick={saveAI}>Save</button>
      </div>

      <div className="card p-5 space-y-4">
        <CardHeader title="Priority score weights" />
        <p className="text-xs text-muted">P = weighted sum of four factors (each 0-100). Weights are normalised so they always add up to 100%.</p>
        {['S', 'D', 'T', 'R'].map((k) => (
          <div key={k}>
            <div className="flex justify-between text-sm mb-1"><label htmlFor={`w${k}`} className="font-semibold text-ink">{FACTOR_LABELS[k]}</label><b className="text-brand-700 dark:text-brand-200">{Math.round((raw[k] / sum) * 100)}%</b></div>
            <input id={`w${k}`} type="range" min="0" max="100" value={raw[k]} onChange={(e) => setRaw({ ...raw, [k]: +e.target.value })} className="w-full accent-teal-600" />
          </div>
        ))}
        <div className="flex gap-2">
          <button className="btn-primary" onClick={saveWeights}>Save weights</button>
          <button className="btn-ghost border border-line" onClick={resetWeights}><RotateCcw className="h-4 w-4" /> Reset</button>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <CardHeader title="Appearance & data" />
        <label className="flex items-center justify-between text-sm text-ink">Dark mode
          <button role="switch" aria-checked={dark} onClick={() => setDark(!dark)} className={`h-6 w-11 rounded-full p-0.5 transition-colors ${dark ? 'bg-brand-600' : 'bg-slate-300'}`}>
            <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${dark ? 'translate-x-5' : ''}`} />
          </button>
        </label>
        <div className="border-t border-line pt-4">
          <p className="text-sm text-ink font-semibold">Reset demo data</p>
          <p className="text-xs text-muted mt-0.5 mb-3">Restores the sample complaints and removes anything you submitted or edited in this browser.</p>
          <button className="btn-danger" onClick={() => { resetDemoData(); window.location.reload(); }}>Reset sample data</button>
        </div>
      </div>
    </div>
  );
}

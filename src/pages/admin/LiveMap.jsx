import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Flame, X, ArrowRight } from 'lucide-react';
import CityMap from '../../components/CityMap';
import { PageHeader, SeverityBadge, StatusBadge, CardHeader } from '../../components/ui';
import { CATEGORY_NAMES, SEVERITIES, SEVERITY_STYLE } from '../../data/taxonomy';
import { useComplaints, timeAgo } from '../../utils/hooks';
import { byArea, catOf, isOpen, sevOf, subOf } from '../../utils/stats';

export default function LiveMap() {
  const { complaints } = useComplaints();
  const [mode, setMode] = useState('markers');
  const [category, setCategory] = useState('');
  const [sevs, setSevs] = useState(SEVERITIES);
  const [scope, setScope] = useState('open');
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => complaints.filter((c) =>
    (!category || catOf(c) === category) &&
    sevs.includes(sevOf(c)) &&
    (scope === 'all' || (scope === 'open' ? isOpen(c) : c.adminState.status === 'Resolved'))
  ), [complaints, category, sevs, scope]);

  const areas = useMemo(() => byArea(filtered.filter(isOpen)).slice(0, 6), [filtered]);
  const toggleSev = (s) => setSevs((l) => (l.includes(s) ? l.filter((x) => x !== s) : [...l, s]));
  const sel = selected ? complaints.find((c) => c.id === selected) : null;

  return (
    <div className="max-w-[1400px] space-y-5">
      <PageHeader title="Live City Map" subtitle="Complaint locations, clusters and hotspots."
        actions={
          <div className="inline-flex rounded-full border border-line bg-surface p-1" role="group" aria-label="Map mode">
            {[['markers', 'Pins & clusters', MapPin], ['hotspots', 'Hotspots', Flame]].map(([k, label, Icon]) => (
              <button key={k} onClick={() => setMode(k)} aria-pressed={mode === k}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold ${mode === k ? 'bg-brand-600 text-white' : 'text-muted hover:text-ink'}`}>
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        } />

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <select className="input !w-auto" aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>{CATEGORY_NAMES.map((n) => <option key={n}>{n}</option>)}
        </select>
        <select className="input !w-auto" aria-label="Scope" value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="open">Open complaints</option><option value="resolved">Resolved</option><option value="all">All</option>
        </select>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Severity filter">
          {SEVERITIES.map((s) => (
            <button key={s} onClick={() => toggleSev(s)} aria-pressed={sevs.includes(s)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${sevs.includes(s) ? 'border-transparent bg-soft text-ink' : 'border-line text-muted opacity-60'}`}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: SEVERITY_STYLE[s].hex }} /> {s}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-muted">{filtered.length} complaints shown</span>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        <div className="card p-2 h-[560px]">
          <CityMap complaints={filtered} mode={mode} selectedId={selected} onSelect={(c) => setSelected(c.id)} className="h-full w-full" />
        </div>

        <div className="space-y-5">
          {sel ? (
            <div className="card p-4">
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-brand-700 dark:text-brand-200">{sel.id}</p>
                <button onClick={() => setSelected(null)} aria-label="Close" className="text-muted hover:text-ink"><X className="h-4 w-4" /></button>
              </div>
              <h2 className="font-bold text-ink mt-1">{sel.citizenInput.title}</h2>
              <p className="text-xs text-muted mt-1">{subOf(sel)} · {sel.citizenInput.location.address} · {timeAgo(sel.citizenInput.createdAt)}</p>
              <div className="flex gap-2 mt-3"><SeverityBadge severity={sevOf(sel)} /><StatusBadge status={sel.adminState.status} /></div>
              <p className="text-sm text-muted mt-3 line-clamp-3">{sel.citizenInput.description}</p>
              <Link to={`/admin/complaints/${sel.id}`} className="btn-primary w-full mt-4 !py-2">Open complaint <ArrowRight className="h-4 w-4" /></Link>
            </div>
          ) : (
            <div className="card p-4">
              <CardHeader title="Legend" />
              <ul className="space-y-2 text-sm text-muted">
                {mode === 'markers' ? (
                  <>
                    {SEVERITIES.slice().reverse().map((s) => <li key={s} className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: SEVERITY_STYLE[s].hex }} /> {s}</li>)}
                    <li className="flex items-center gap-2"><span className="h-5 w-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">12</span> Cluster (click to zoom)</li>
                  </>
                ) : (
                  [['#dc2626', '5+ open complaints'], ['#f97316', '3-4'], ['#f59e0b', '2'], ['#facc15', '1']].map(([c, l]) => <li key={l} className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: c }} /> {l}</li>)
                )}
              </ul>
              <p className="text-xs text-muted mt-3">Click a pin to see details.</p>
            </div>
          )}

          <div className="card p-4">
            <CardHeader title="Busiest areas (open)" />
            <ul className="space-y-2.5">
              {areas.map((a) => (
                <li key={a.name}>
                  <div className="flex justify-between text-sm"><span className="text-ink font-medium">{a.name}</span><span className="text-muted">{a.open}</span></div>
                  <div className="h-1.5 rounded-full bg-soft mt-1"><div className="h-full rounded-full bg-brand-500" style={{ width: `${(a.open / (areas[0]?.open || 1)) * 100}%` }} /></div>
                </li>
              ))}
              {areas.length === 0 && <li className="text-sm text-muted">No open complaints match.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Download, Search, Filter, X, Flag, Users, Inbox } from 'lucide-react';
import { PageHeader, SeverityBadge, StatusBadge, Pagination, EmptyState, Skeleton } from '../../components/ui';
import { CATEGORY_NAMES, SEVERITIES, STATUSES, DEPARTMENTS } from '../../data/taxonomy';
import { useComplaints } from '../../utils/hooks';
import { catOf, subOf, sevOf, isOpen, flaggedForReview, toCSV, downloadText } from '../../utils/stats';
import { priorityBand } from '../../utils/priority';

const PAGE_SIZE = 12;
const getThreshold = () => { try { return +localStorage.getItem('cs_threshold') || 75; } catch { return 75; } };

export default function Complaints() {
  const { complaints, loading } = useComplaints();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('priority');
  const [threshold, setThreshold] = useState(getThreshold());

  const f = {
    q: params.get('q') || '',
    status: params.get('status') || '',
    category: params.get('category') || '',
    severity: params.get('severity') || '',
    dept: params.get('dept') || '',
    review: params.get('review') === '1',
    open: params.get('open') === '1',
  };
  const setF = (patch) => {
    const next = { ...f, ...patch };
    const p = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => { if (v && v !== false) p.set(k, v === true ? '1' : v); });
    setParams(p, { replace: true });
    setPage(1);
  };
  useEffect(() => { setPage(1); }, [params]);
  useEffect(() => { try { localStorage.setItem('cs_threshold', String(threshold)); } catch { /* ignore */ } }, [threshold]);

  const filtered = useMemo(() => {
    const q = f.q.toLowerCase();
    const list = complaints.filter((c) => {
      if (q && !(c.id.toLowerCase().includes(q) || c.citizenInput.title.toLowerCase().includes(q) || c.citizenInput.location.area.toLowerCase().includes(q) || subOf(c).toLowerCase().includes(q))) return false;
      if (f.status && c.adminState.status !== f.status) return false;
      if (f.category && catOf(c) !== f.category) return false;
      if (f.severity && sevOf(c) !== f.severity) return false;
      if (f.dept && (c.adminState.assignedDepartment || c.adminState.suggestedDepartment) !== f.dept) return false;
      if (f.open && !isOpen(c)) return false;
      if (f.review && !flaggedForReview(c, threshold)) return false;
      return true;
    });
    const sorters = {
      priority: (a, b) => b.derived.priority.score - a.derived.priority.score,
      newest: (a, b) => new Date(b.citizenInput.createdAt) - new Date(a.citizenInput.createdAt),
      oldest: (a, b) => new Date(a.citizenInput.createdAt) - new Date(b.citizenInput.createdAt),
      confidence: (a, b) => a.aiPredictions.confidenceScore - b.aiPredictions.confidenceScore,
    };
    return list.sort(sorters[sort]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaints, params, sort, threshold]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeFilters = ['q', 'status', 'category', 'severity', 'dept'].filter((k) => f[k]).length + (f.review ? 1 : 0) + (f.open ? 1 : 0);

  return (
    <div className="space-y-5 max-w-[1400px]">
      <PageHeader
        title="Complaints"
        subtitle="Inspect AI predictions, review flagged cases and manage assignments."
        actions={<button className="btn-outline !py-2" onClick={() => downloadText(`complaints-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(filtered))}><Download className="h-4 w-4" /> Export CSV ({filtered.length})</button>}
      />

      <div className="card p-4 space-y-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="h-4 w-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input className="input !pl-10" placeholder="Search by ID, title, area or issue type" aria-label="Search complaints" value={f.q} onChange={(e) => setF({ q: e.target.value })} />
          </div>
          <select className="input" aria-label="Status" value={f.status} onChange={(e) => setF({ status: e.target.value })}>
            <option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select className="input" aria-label="Category" value={f.category} onChange={(e) => setF({ category: e.target.value })}>
            <option value="">All categories</option>{CATEGORY_NAMES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select className="input" aria-label="Severity" value={f.severity} onChange={(e) => setF({ severity: e.target.value })}>
            <option value="">All severities</option>{SEVERITIES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select className="input" aria-label="Department" value={f.dept} onChange={(e) => setF({ dept: e.target.value })}>
            <option value="">All departments</option>{DEPARTMENTS.map((d) => <option key={d.name}>{d.name}</option>)}
          </select>
          <select className="input" aria-label="Sort by" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="priority">Sort: Highest priority</option>
            <option value="newest">Sort: Newest first</option>
            <option value="oldest">Sort: Oldest first</option>
            <option value="confidence">Sort: Lowest AI confidence</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-ink rounded-xl border border-line px-3.5 py-2.5 cursor-pointer">
            <input type="checkbox" checked={f.open} onChange={(e) => setF({ open: e.target.checked })} className="accent-teal-600" /> Open only
          </label>
          <label className="flex items-center gap-2 text-sm text-ink rounded-xl border border-line px-3.5 py-2.5 cursor-pointer">
            <input type="checkbox" checked={f.review} onChange={(e) => setF({ review: e.target.checked })} className="accent-teal-600" /> <Flag className="h-3.5 w-3.5 text-red-500" /> Needs review
          </label>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl bg-brand-50/70 dark:bg-brand-500/10 px-4 py-3">
          <div className="flex-1">
            <div className="flex justify-between text-xs font-semibold text-brand-700 dark:text-brand-200 mb-1">
              <label htmlFor="thr">AI confidence threshold for review flag</label><span>{threshold}%</span>
            </div>
            <input id="thr" type="range" min="50" max="95" step="1" value={threshold} onChange={(e) => setThreshold(+e.target.value)} className="w-full accent-teal-600" />
          </div>
          <p className="text-[11px] text-muted sm:max-w-[220px]">Predictions below this score, unclassifiable text and predicted Critical cases are flagged. Tune it on real validation data later.</p>
        </div>

        {activeFilters > 0 && (
          <button onClick={() => setParams({}, { replace: true })} className="text-xs font-semibold text-brand-600 inline-flex items-center gap-1"><X className="h-3.5 w-3.5" /> Clear {activeFilters} filter{activeFilters > 1 ? 's' : ''}</button>
        )}
      </div>

      <div className="card overflow-hidden">
        {loading ? <Skeleton className="h-64" /> : rows.length === 0 ? (
          <EmptyState icon={Inbox} title="No complaints match these filters" text="Try clearing a filter or searching for something else." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[980px]">
              <thead className="bg-soft text-xs text-muted">
                <tr className="text-left">
                  {['ID', 'Complaint', 'AI classification', 'Severity', 'Confidence', 'Priority', 'Status', ''].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const band = priorityBand(c.derived.priority.score);
                  const flagged = flaggedForReview(c, threshold);
                  return (
                    <tr key={c.id} onClick={() => navigate(`/admin/complaints/${c.id}`)} className={`border-t border-line hover:bg-soft cursor-pointer ${flagged ? 'bg-red-50/40 dark:bg-red-500/5' : ''}`}>
                      <td className="px-4 py-3.5 font-semibold text-brand-700 dark:text-brand-200 whitespace-nowrap">{c.id}</td>
                      <td className="px-4 py-3.5 max-w-[320px]">
                        <p className="font-semibold text-ink truncate">{c.citizenInput.title}</p>
                        <p className="text-xs text-muted truncate">{c.citizenInput.location.area} · {new Date(c.citizenInput.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          {c.derived.groupSize > 1 && <span className="ml-2 inline-flex items-center gap-1 text-amber-700 dark:text-amber-300"><Users className="h-3 w-3" />{c.aiPredictions.duplicateGroupId} ({c.derived.groupSize})</span>}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-ink">{c.aiPredictions.category}</p>
                        <p className="text-xs text-muted">{c.aiPredictions.subcategory}</p>
                      </td>
                      <td className="px-4 py-3.5"><SeverityBadge severity={sevOf(c)} /></td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`font-semibold ${c.aiPredictions.confidenceScore < threshold ? 'text-amber-600' : 'text-emerald-600'}`}>{c.aiPredictions.confidenceScore}%</span>
                        {flagged && <span className="ml-2 inline-flex items-center gap-1 rounded bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 text-[10px] font-bold px-1.5 py-0.5"><Flag className="h-3 w-3" />REVIEW</span>}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap"><span className={`font-bold ${band.cls}`}>{c.derived.priority.score}</span> <span className="text-xs text-muted">{band.label}</span></td>
                      <td className="px-4 py-3.5"><StatusBadge status={c.adminState.status} /></td>
                      <td className="px-4 py-3.5 text-right">
                        <Link to={`/admin/complaints/${c.id}`} onClick={(e) => e.stopPropagation()} className="btn-primary !py-1.5 !px-4 !text-xs">Review</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 pb-4"><Pagination page={page} pages={pages} onChange={setPage} /></div>
      </div>
      <p className="text-xs text-muted flex items-center gap-1.5"><Filter className="h-3.5 w-3.5" /> Showing {rows.length} of {filtered.length} matching complaints ({complaints.length} total).</p>
    </div>
  );
}

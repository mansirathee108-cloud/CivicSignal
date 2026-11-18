import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Check, MapPin, Building2, Calendar, Clock, Users, Image as ImageIcon, Star } from 'lucide-react';
import { StatusBadge, SeverityBadge, EmptyState } from '../components/ui';
import { getComplaint } from '../services/api';
import { fmtDate, fmtDateTime, timeAgo, useActiveUser, useComplaints } from '../utils/hooks';

const STEPS = ['Submitted', 'Assigned', 'In Progress', 'Resolved'];
const stepIndex = { Pending: 0, Assigned: 1, 'In Progress': 2, Resolved: 3 };

export default function TrackComplaint() {
  const [params, setParams] = useSearchParams();
  const user = useActiveUser();
  const { complaints } = useComplaints();
  const [input, setInput] = useState(params.get('id') || '');
  const [result, setResult] = useState(null);
  const [state, setState] = useState('idle'); // idle | loading | found | missing

  const lookup = async (id) => {
    const key = id.trim();
    if (!key) return;
    setState('loading');
    const c = await getComplaint(key);
    setResult(c);
    setState(c ? 'found' : 'missing');
  };

  useEffect(() => {
    const id = params.get('id');
    if (id) { setInput(id); lookup(id); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const submit = (e) => { e.preventDefault(); setParams(input.trim() ? { id: input.trim() } : {}); };

  const samples = useMemo(() => {
    const pick = (s) => complaints.find((c) => c.adminState.status === s)?.id;
    return [pick('Pending'), pick('In Progress'), pick('Resolved')].filter(Boolean);
  }, [complaints]);

  const mine = useMemo(
    () => (user ? complaints.filter((c) => c.citizenInput.submittedBy === user.id) : []),
    [user, complaints]
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-extrabold text-ink">Track a Complaint</h1>
      <p className="text-muted mt-1">Enter the complaint ID you received when you submitted your report.</p>

      <form onSubmit={submit} className="card p-3 mt-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g., CS-2026-1048" aria-label="Complaint ID" className="input !pl-10 !border-0 bg-soft" />
        </div>
        <button className="btn-primary" type="submit">Track</button>
      </form>
      {samples.length > 0 && (
        <p className="text-xs text-muted mt-2 flex flex-wrap items-center gap-2">
          Try a sample ID:
          {samples.map((id) => <button key={id} onClick={() => setParams({ id })} className="rounded-full bg-surface border border-line px-2.5 py-0.5 font-semibold text-brand-700 dark:text-brand-200 hover:bg-brand-50 dark:hover:bg-brand-500/10">{id}</button>)}
        </p>
      )}

      {state === 'loading' && <div className="card h-48 mt-6 animate-pulse" />}

      {state === 'missing' && (
        <div className="card mt-6"><EmptyState icon={Search} title="No complaint found with that ID" text="Check the ID for typos. It looks like CS-2026-1048." /></div>
      )}

      {state === 'found' && result && <Result c={result} />}

      {user?.role === 'citizen' && (
        <section className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-ink">My complaints</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-200 text-xs font-semibold px-3 py-1"><Star className="h-3.5 w-3.5" /> Civic Score: {user.civicScore ?? 0}</span>
          </div>
          {mine.length === 0 ? (
            <div className="card"><EmptyState title="You have not submitted any complaints yet" text="Reports you file while logged in appear here." /></div>
          ) : (
            <div className="space-y-2">
              {mine.map((c) => (
                <button key={c.id} onClick={() => { setParams({ id: c.id }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="card w-full text-left p-4 flex items-center gap-4 hover:shadow-lift transition-shadow">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-brand-700 dark:text-brand-200">{c.id}</p>
                    <p className="font-semibold text-ink truncate">{c.citizenInput.title}</p>
                    <p className="text-xs text-muted">{fmtDate(c.citizenInput.createdAt)} · {c.citizenInput.location.area}</p>
                  </div>
                  <StatusBadge status={c.adminState.status} />
                </button>
              ))}
            </div>
          )}
        </section>
      )}
      {!user && (
        <p className="text-sm text-muted mt-8 text-center"><Link to="/login" className="text-brand-600 font-semibold hover:underline">Log in</Link> to see every complaint you have filed in one place.</p>
      )}
    </div>
  );
}

function Result({ c }) {
  const idx = stepIndex[c.adminState.status] ?? 0;
  const latest = c.adminState.history[c.adminState.history.length - 1];
  const cat = c.adminState.confirmed?.category || c.aiPredictions.category;
  const sev = c.adminState.confirmed?.severity || c.aiPredictions.severity;
  return (
    <div className="card mt-6 overflow-hidden">
      <div className="p-6 border-b border-line">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-extrabold text-brand-700 dark:text-brand-200">{c.id}</span>
          <StatusBadge status={c.adminState.status} />
          {c.adminState.reviewState !== 'Pending Review' && <SeverityBadge severity={sev} />}
        </div>
        <h2 className="text-xl font-bold text-ink mt-2">{c.citizenInput.title}</h2>
        <p className="text-sm text-muted mt-1">{c.citizenInput.description}</p>
      </div>

      <div className="p-6 border-b border-line">
        <ol className="grid grid-cols-4 gap-2" aria-label="Progress">
          {STEPS.map((s, i) => (
            <li key={s} className="text-center">
              <div className="flex items-center">
                <span className={`h-0.5 flex-1 ${i === 0 ? 'opacity-0' : i <= idx ? 'bg-brand-500' : 'bg-line'}`} />
                <span className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${i < idx ? 'bg-brand-600 text-white' : i === idx ? 'bg-brand-600 text-white ring-4 ring-brand-500/25' : 'bg-soft text-muted'}`}>
                  {i < idx ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span className={`h-0.5 flex-1 ${i === STEPS.length - 1 ? 'opacity-0' : i < idx ? 'bg-brand-500' : 'bg-line'}`} />
              </div>
              <p className={`text-xs mt-2 font-medium ${i <= idx ? 'text-ink' : 'text-muted'}`}>{s}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid sm:grid-cols-2 gap-px bg-line">
        {[
          [Calendar, 'Submitted on', fmtDate(c.citizenInput.createdAt)],
          [Building2, 'Assigned department', c.adminState.assignedDepartment || 'Awaiting assignment'],
          [MapPin, 'Location', c.citizenInput.location.address],
          [Clock, 'Latest update', `${latest.note} (${timeAgo(latest.at)})`],
        ].map(([Icon, label, value]) => (
          <div key={label} className="bg-surface p-4 flex gap-3">
            <Icon className="h-4 w-4 text-brand-600 mt-0.5 shrink-0" />
            <div><p className="text-xs text-muted">{label}</p><p className="text-sm font-semibold text-ink">{value}</p></div>
          </div>
        ))}
      </div>

      {c.derived.groupSize > 1 && (
        <p className="px-6 py-3 text-sm bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <Users className="h-4 w-4" /> {c.derived.groupSize - 1} other report{c.derived.groupSize > 2 ? 's' : ''} describe the same issue, so it is being handled together.
        </p>
      )}

      <div className="p-6 grid md:grid-cols-[1fr_200px] gap-6">
        <div>
          <h3 className="font-bold text-ink text-sm mb-3">Status history</h3>
          <ol className="relative border-l-2 border-line ml-2 space-y-4">
            {[...c.adminState.history].reverse().map((h, i) => (
              <li key={`${h.at}-${i}`} className="pl-5 relative">
                <span className={`absolute -left-[7px] top-1.5 h-3 w-3 rounded-full ${i === 0 ? 'bg-brand-600' : 'bg-line'}`} />
                <p className="text-sm font-semibold text-ink">{h.status} <span className="font-normal text-muted">· {fmtDateTime(h.at)}</span></p>
                <p className="text-xs text-muted">{h.note}</p>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h3 className="font-bold text-ink text-sm mb-3">Category</h3>
          <p className="text-sm text-ink">{c.adminState.reviewState === 'Pending Review' || c.adminState.reviewState === 'Unable to Classify' ? 'Awaiting staff review' : cat}</p>
          {c.citizenInput.photoUrl ? (
            <img src={c.citizenInput.photoUrl} alt="Submitted by citizen" className="mt-4 rounded-xl border border-line w-full" />
          ) : (
            <div className="mt-4 rounded-xl bg-soft h-24 flex items-center justify-center text-muted text-xs gap-1.5"><ImageIcon className="h-4 w-4" /> No photo attached</div>
          )}
        </div>
      </div>
    </div>
  );
}

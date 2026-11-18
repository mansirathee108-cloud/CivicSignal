import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, MapPin, Calendar, User, Image as ImageIcon, Sparkles, GitMerge, Send, CheckCircle2, Layers } from 'lucide-react';
import CityMap from '../../components/CityMap';
import { AiTag, CardHeader, ConfidenceBar, EmptyState, SeverityBadge, Skeleton, StatusBadge } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { CATEGORIES, CATEGORY_NAMES, DEPARTMENTS, SEVERITIES, STATUSES } from '../../data/taxonomy';
import { addNote, assignDepartment, confirmClassification, dismissDuplicate, mergeDuplicate, setStatus } from '../../services/api';
import { getActiveUser } from '../../utils/authStorage';
import { fmtDateTime, timeAgo, useComplaints } from '../../utils/hooks';
import { distanceMeters } from '../../utils/mockAI';
import { FACTOR_LABELS, getWeights, priorityBand } from '../../utils/priority';
import { isOpen } from '../../utils/stats';

export default function ComplaintDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { complaints, loading, refresh } = useComplaints();
  const c = complaints.find((x) => x.id === id);
  const me = getActiveUser()?.name || 'Admin';

  const [cat, setCat] = useState('');
  const [sub, setSub] = useState('');
  const [sev, setSev] = useState('');
  const [dept, setDept] = useState('');
  const [status, setStatusVal] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!c) return;
    const src = c.adminState.confirmed || c.aiPredictions;
    setCat(src.category); setSub(src.subcategory); setSev(src.severity);
    setDept(c.adminState.assignedDepartment || c.adminState.suggestedDepartment);
    setStatusVal(c.adminState.status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c?.id, c?.adminState.reviewState, c?.adminState.status, c?.adminState.assignedDepartment]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-96" /></div>;
  if (!c) return <div className="card"><EmptyState title="Complaint not found" text={`There is no complaint with ID ${id}.`} /><div className="text-center pb-8"><Link to="/admin/complaints" className="btn-outline">Back to complaints</Link></div></div>;

  const ai = c.aiPredictions;
  const weights = getWeights();
  const band = priorityBand(c.derived.priority.score);
  const currentSev = c.adminState.confirmed?.severity || ai.severity;
  const reviewed = c.adminState.reviewState === 'Confirmed' || c.adminState.reviewState === 'Corrected';
  const unchanged = cat === ai.category && sub === ai.subcategory && sev === ai.severity;

  const act = async (fn, okMsg) => {
    try { await fn(); await refresh(); toast(okMsg); } catch (e) { toast(e.message || 'Something went wrong.', 'error'); }
  };

  const candidates = ai.duplicateCandidates
    .map((cid) => complaints.find((x) => x.id === cid))
    .filter(Boolean)
    .map((o) => ({
      o,
      d: Math.round(distanceMeters(c.citizenInput.location.lat, c.citizenInput.location.lng, o.citizenInput.location.lat, o.citizenInput.location.lng)),
      grouped: !!ai.duplicateGroupId && ai.duplicateGroupId === o.aiPredictions.duplicateGroupId,
    }));

  return (
    <div className="space-y-6 max-w-[1400px]">
      <Link to="/admin/complaints" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600"><ArrowLeft className="h-4 w-4" /> Back to complaints</Link>

      {currentSev === 'Critical' && isOpen(c) && (
        <div role="alert" className="rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-800 dark:text-red-200 text-sm">Critical complaint - urgent human assessment required</p>
            <p className="text-xs text-red-700/80 dark:text-red-300/80 mt-0.5">The AI only recommends severity. Verify on the ground and follow your emergency procedures. CivicSignal is not an emergency response service.</p>
          </div>
        </div>
      )}

      <div className="card p-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-extrabold text-brand-700 dark:text-brand-200">{c.id}</span>
            <StatusBadge status={c.adminState.status} />
            <SeverityBadge severity={currentSev} />
            {ai.duplicateGroupId && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-semibold px-2.5 py-0.5"><Layers className="h-3 w-3" />{ai.duplicateGroupId} · {c.derived.groupSize} reports</span>}
          </div>
          <h1 className="text-2xl font-extrabold text-ink mt-2">{c.citizenInput.title}</h1>
          <p className="text-sm text-muted mt-1.5 flex flex-wrap gap-x-5 gap-y-1">
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{c.citizenInput.location.address}</span>
            <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{fmtDateTime(c.citizenInput.createdAt)} ({timeAgo(c.citizenInput.createdAt)})</span>
            <span className="inline-flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{c.citizenInput.submitterName}</span>
          </p>
        </div>
        <div className="text-center rounded-2xl bg-soft px-6 py-3 shrink-0">
          <p className="text-xs text-muted font-semibold">Priority score</p>
          <p className={`text-4xl font-extrabold ${band.cls}`}>{c.derived.priority.score}</p>
          <p className={`text-xs font-bold ${band.cls}`}>{band.label}</p>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1.5fr_1fr] gap-6 items-start">
        <div className="space-y-6">
          <div className="card p-5">
            <CardHeader title="Citizen report" />
            <p className="text-sm text-ink leading-relaxed">{c.citizenInput.description}</p>
            <div className="flex flex-wrap gap-2 mt-3 text-xs">
              <span className="rounded-full bg-soft px-3 py-1 text-muted">Citizen category: <b className="text-ink">{c.citizenInput.citizenCategory || 'not chosen'}</b></span>
              <span className="rounded-full bg-soft px-3 py-1 text-muted">Citizen severity: <b className="text-ink">{c.citizenInput.citizenSeverity || 'not chosen'}</b></span>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="h-56 rounded-xl overflow-hidden"><CityMap complaints={[c]} fitMaxZoom={16} /></div>
              {c.citizenInput.photoUrl
                ? <img src={c.citizenInput.photoUrl} alt="Complaint evidence" className="h-56 w-full object-cover rounded-xl border border-line" />
                : <div className="h-56 rounded-xl bg-soft flex flex-col items-center justify-center text-muted text-sm gap-2"><ImageIcon className="h-8 w-8" />No photo attached</div>}
            </div>
          </div>

          <div className="card p-5">
            <CardHeader icon={Layers} title={`Possible duplicates (${candidates.length})`} action={<AiTag>Text + location match</AiTag>} />
            {candidates.length === 0 ? (
              <p className="text-sm text-muted">No similar nearby complaints were suggested.</p>
            ) : (
              <ul className="space-y-3">
                {candidates.map(({ o, d, grouped }) => (
                  <li key={o.id} className="rounded-xl border border-line p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm"><Link to={`/admin/complaints/${o.id}`} className="font-bold text-brand-700 dark:text-brand-200 hover:underline">{o.id}</Link> <span className="text-muted">· {d} m away · {o.citizenInput.location.area}</span></p>
                      <p className="text-sm text-ink truncate">{o.citizenInput.title}</p>
                      <p className="text-xs text-muted">Reason: same issue type ({o.aiPredictions.subcategory}), nearby, reported within 14 days.</p>
                    </div>
                    {grouped ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Grouped</span>
                    ) : (
                      <div className="flex gap-2 shrink-0">
                        <button className="btn-primary !py-1.5 !px-3 !text-xs" onClick={() => act(() => mergeDuplicate(c.id, o.id), 'Reports grouped. Each original complaint is kept.')}><GitMerge className="h-3.5 w-3.5" /> Group</button>
                        <button className="btn-ghost border border-line !py-1.5 !px-3 !text-xs" onClick={() => act(() => dismissDuplicate(c.id, o.id), 'Marked as a separate issue.')}>Separate issue</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card p-5">
            <CardHeader title="Status history" />
            <ol className="relative border-l-2 border-line ml-2 space-y-4">
              {[...c.adminState.history].reverse().map((h, i) => (
                <li key={`${h.at}-${i}`} className="pl-5 relative">
                  <span className={`absolute -left-[7px] top-1.5 h-3 w-3 rounded-full ${i === 0 ? 'bg-brand-600' : 'bg-line'}`} />
                  <p className="text-sm font-semibold text-ink">{h.status} <span className="font-normal text-muted">· {fmtDateTime(h.at)} · {h.by}</span></p>
                  <p className="text-xs text-muted">{h.note}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="card p-5">
            <CardHeader title="Internal notes" />
            {c.adminState.notes.length === 0 && <p className="text-sm text-muted mb-3">No notes yet. Notes are visible to administrators only.</p>}
            <ul className="space-y-2 mb-3">
              {c.adminState.notes.map((n, i) => (
                <li key={i} className="rounded-xl bg-soft p-3 text-sm"><p className="text-ink">{n.text}</p><p className="text-xs text-muted mt-1">{n.by} · {fmtDateTime(n.at)}</p></li>
              ))}
            </ul>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!note.trim()) return; act(() => addNote(c.id, note.trim(), me), 'Note added.').then(() => setNote('')); }}>
              <input className="input" aria-label="Add a note" placeholder="Add a note for the team..." value={note} onChange={(e) => setNote(e.target.value)} />
              <button className="btn-primary" type="submit" aria-label="Add note"><Send className="h-4 w-4" /></button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <CardHeader icon={Sparkles} title="AI analysis" action={<AiTag>Prototype output</AiTag>} />
            {ai.reviewReason && <p className="text-xs rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 p-2.5 mb-3">{ai.reviewReason}</p>}
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-muted">Category</dt><dd className="font-semibold text-ink">{ai.category}</dd></div>
              <div><dt className="text-xs text-muted">Subcategory</dt><dd className="font-semibold text-ink">{ai.subcategory}</dd></div>
              <div><dt className="text-xs text-muted">Severity</dt><dd><SeverityBadge severity={ai.severity} /></dd></div>
              <div><dt className="text-xs text-muted">Suggested dept.</dt><dd className="font-semibold text-ink">{c.adminState.suggestedDepartment}</dd></div>
            </dl>
            <div className="space-y-2.5 mt-4">
              <ConfidenceBar value={ai.confidence.category} label="Category confidence" />
              <ConfidenceBar value={ai.confidence.subcategory} label="Subcategory confidence" />
              <ConfidenceBar value={ai.confidence.severity} label="Severity confidence" />
            </div>
            {ai.cues.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-muted mb-1.5">Reason cues</p>
                <div className="flex flex-wrap gap-1.5">{ai.cues.map((w) => <span key={w} className="rounded-md bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-200 text-xs font-medium px-2 py-0.5">{w}</span>)}</div>
              </div>
            )}
            <p className="text-xs text-muted mt-4"><b className="text-ink">Summary:</b> {ai.summary}</p>
            <p className="text-[11px] text-muted mt-2">Model: {ai.modelVersion} (simulated)</p>
          </div>

          <div className="card p-5">
            <CardHeader title="Human review" action={<span className="text-xs font-semibold text-muted">{c.adminState.reviewState}</span>} />
            <div className="space-y-3">
              <div>
                <label className="label" htmlFor="rc">Category</label>
                <select id="rc" className="input" value={cat} onChange={(e) => { setCat(e.target.value); setSub(CATEGORIES[e.target.value].subcategories[0]); }}>
                  {CATEGORY_NAMES.map((n) => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="rs">Subcategory</label>
                <select id="rs" className="input" value={sub} onChange={(e) => setSub(e.target.value)}>
                  {(CATEGORIES[cat]?.subcategories || []).map((n) => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="rv">Severity</label>
                <select id="rv" className="input" value={sev} onChange={(e) => setSev(e.target.value)}>
                  {SEVERITIES.map((n) => <option key={n}>{n}</option>)}
                </select>
              </div>
              <button className="btn-primary w-full" onClick={() => act(() => confirmClassification(c.id, { category: cat, subcategory: sub, severity: sev }, me), unchanged ? 'AI classification confirmed.' : 'Correction saved. The original AI prediction is kept for audit.')}>
                {reviewed ? 'Update classification' : unchanged ? 'Confirm AI classification' : 'Save correction'}
              </button>
              <p className="text-[11px] text-muted">Your confirmed values are stored separately from the AI prediction and the citizen&apos;s input.</p>
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <CardHeader title="Assignment & status" />
            <div>
              <label className="label" htmlFor="dp">Department {dept !== c.adminState.suggestedDepartment && <span className="text-muted font-normal">(suggested: {c.adminState.suggestedDepartment})</span>}</label>
              <div className="flex gap-2">
                <select id="dp" className="input" value={dept} onChange={(e) => setDept(e.target.value)}>
                  {DEPARTMENTS.map((d) => <option key={d.name}>{d.name}</option>)}
                </select>
                <button className="btn-outline" onClick={() => act(() => assignDepartment(c.id, dept, me), `Assigned to ${dept}.`)}>Assign</button>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="st">Status</label>
              <select id="st" className="input" value={status} onChange={(e) => setStatusVal(e.target.value)}>
                {STATUSES.map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
            <input className="input" aria-label="Update note" placeholder="Public update for the citizen (optional)" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} />
            <button className="btn-primary w-full" disabled={status === c.adminState.status && !statusNote.trim()}
              onClick={() => act(() => setStatus(c.id, status, me, statusNote.trim()), 'Status updated.').then(() => setStatusNote(''))}>Update status</button>
          </div>

          <div className="card p-5">
            <CardHeader title="Why this priority?" />
            <ul className="space-y-3">
              {['S', 'D', 'T', 'R'].map((k) => {
                const raw = c.derived.priority.factors[k];
                return (
                  <li key={k}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-ink font-semibold">{FACTOR_LABELS[k]} <span className="text-muted font-normal">({Math.round(weights[k] * 100)}% weight)</span></span>
                      <span className="text-muted">{raw}/100 → <b className="text-ink">{(raw * weights[k]).toFixed(1)}</b> pts</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-soft overflow-hidden"><div className="h-full bg-brand-500 rounded-full" style={{ width: `${raw}%` }} /></div>
                  </li>
                );
              })}
            </ul>
            <p className="text-[11px] text-muted mt-3">Weights are demonstration values, not municipal standards. The score never overrides emergency procedures or human judgement.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

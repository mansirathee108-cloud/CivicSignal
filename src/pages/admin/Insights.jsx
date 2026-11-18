import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Layers, Repeat, ListOrdered, Gauge, UserCheck, HelpCircle, ShieldAlert } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { AiTag, CardHeader, ConfidenceBar, PageHeader, SeverityBadge, StatCard, StatusBadge } from '../../components/ui';
import { axisTick, gridStroke, tooltipStyle } from '../../components/chartStyle';
import { CATEGORIES } from '../../data/taxonomy';
import { useComplaints } from '../../utils/hooks';
import { awaitingReview, catOf, duplicateGroups, isOpen, monthlyByCategory, recurringIssues, sevOf, subOf } from '../../utils/stats';
import { priorityBand, getWeights } from '../../utils/priority';

const TABS = [
  ['overview', 'Model overview', Gauge],
  ['priority', 'Priority ranking', ListOrdered],
  ['duplicates', 'Duplicate groups', Layers],
  ['recurring', 'Recurring issues', Repeat],
];

export default function Insights() {
  const { complaints } = useComplaints();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');

  const d = useMemo(() => {
    const reviewed = complaints.filter((c) => c.adminState.reviewState === 'Confirmed' || c.adminState.reviewState === 'Corrected');
    const corrected = reviewed.filter((c) => c.adminState.reviewState === 'Corrected').length;
    const accepted = reviewed.length - corrected;
    const avgConf = complaints.length ? complaints.reduce((s, c) => s + c.aiPredictions.confidenceScore, 0) / complaints.length : 0;
    const catConf = Object.keys(CATEGORIES).filter((k) => k !== 'Other').map((k) => {
      const list = complaints.filter((c) => c.aiPredictions.category === k);
      return { name: k, conf: list.length ? Math.round(list.reduce((s, c) => s + c.aiPredictions.confidenceScore, 0) / list.length) : 0, color: CATEGORIES[k].color };
    });
    return {
      accepted, corrected, reviewedCount: reviewed.length,
      acceptRate: reviewed.length ? Math.round((accepted / reviewed.length) * 100) : 0,
      avgConf: Math.round(avgConf), catConf,
      queue: complaints.filter((c) => isOpen(c) && awaitingReview(c)).length,
      unable: complaints.filter((c) => c.adminState.reviewState === 'Unable to Classify').length,
      criticalOpen: complaints.filter((c) => isOpen(c) && c.aiPredictions.severity === 'Critical').length,
      ranking: complaints.filter(isOpen).sort((a, b) => b.derived.priority.score - a.derived.priority.score).slice(0, 10),
      groups: duplicateGroups(complaints),
      recurring: recurringIssues(complaints, 3),
      monthly: monthlyByCategory(complaints, 6),
    };
  }, [complaints]);

  const w = getWeights();

  return (
    <div className="max-w-[1400px] space-y-6">
      <PageHeader title="AI Insights & Analytics" subtitle="Classification quality, priority ranking, duplicate groups and recurring problems."
        actions={<AiTag>Simulated - not real model metrics</AiTag>} />

      <div role="tablist" aria-label="Insight sections" className="flex flex-wrap gap-2">
        {TABS.map(([k, label, Icon]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border ${tab === k ? 'bg-brand-600 border-brand-600 text-white' : 'bg-surface border-line text-muted hover:text-ink'}`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard icon={UserCheck} tone="green" label="AI suggestions accepted" value={`${d.acceptRate}%`} hint={`${d.accepted} accepted · ${d.corrected} corrected`} />
            <StatCard icon={Gauge} tone="blue" label="Average confidence" value={`${d.avgConf}%`} hint="Across all predictions" />
            <StatCard icon={HelpCircle} tone="amber" label="In review queue" value={d.queue} hint={`${d.unable} unable to classify`} onClick={() => navigate('/admin/complaints?review=1')} />
            <StatCard icon={ShieldAlert} tone="red" label="Critical flagged" value={d.criticalOpen} hint="Always reviewed by a human" onClick={() => navigate('/admin/complaints?severity=Critical&open=1')} />
          </div>

          <div className="grid xl:grid-cols-2 gap-6">
            <div className="card p-4">
              <CardHeader title="Average confidence by category" />
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.catConf} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid stroke={gridStroke} horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={axisTick} axisLine={false} tickLine={false} unit="%" />
                    <YAxis type="category" dataKey="name" width={130} tick={axisTick} axisLine={false} tickLine={false} />
                    <Tooltip {...tooltipStyle} formatter={(v) => `${v}%`} cursor={{ fill: 'rgba(148,163,184,.12)' }} />
                    <Bar dataKey="conf" name="Avg confidence" radius={[0, 6, 6, 0]}>{d.catConf.map((c) => <Cell key={c.name} fill={c.color} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card p-4">
              <CardHeader title="Accepted vs corrected by staff" />
              <div className="h-64 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{ name: 'Accepted', value: d.accepted }, { name: 'Corrected', value: d.corrected }]} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="none">
                      <Cell fill="#10b981" /><Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip {...tooltipStyle} /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-muted">Corrections are stored separately and become candidate training examples after quality checks.</p>
            </div>
          </div>

          <div className="card p-4">
            <CardHeader title="Monthly complaints by category" />
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.monthly} margin={{ left: -20 }}>
                  <CartesianGrid stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(148,163,184,.12)' }} /><Legend wrapperStyle={{ fontSize: 12 }} />
                  {Object.keys(CATEGORIES).filter((k) => k !== 'Other').map((k) => <Bar key={k} dataKey={k} stackId="a" fill={CATEGORIES[k].color} />)}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {tab === 'priority' && (
        <div className="card p-4">
          <CardHeader icon={Sparkles} title="Top 10 open complaints by priority" />
          <p className="text-xs text-muted mb-4">P = {Math.round(w.S * 100)}% severity + {Math.round(w.D * 100)}% supporting reports + {Math.round(w.T * 100)}% days unresolved + {Math.round(w.R * 100)}% recurrence. Adjust weights in Settings.</p>
          <ol className="space-y-3">
            {d.ranking.map((c, i) => {
              const f = c.derived.priority.factors;
              const parts = [['S', 'Severity', '#dc2626'], ['D', 'Reports', '#f59e0b'], ['T', 'Time', '#2563eb'], ['R', 'Recurrence', '#7c3aed']];
              const band = priorityBand(c.derived.priority.score);
              return (
                <li key={c.id}>
                  <Link to={`/admin/complaints/${c.id}`} className="flex items-center gap-4 rounded-xl p-3 hover:bg-soft">
                    <span className="h-8 w-8 rounded-full bg-navy-900 text-white text-sm font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{c.citizenInput.title}</p>
                      <p className="text-xs text-muted">{c.id} · {c.citizenInput.location.area} · {subOf(c)}</p>
                      <div className="flex h-2 rounded-full overflow-hidden bg-soft mt-2" aria-label="Score contribution by factor">
                        {parts.map(([k, , color]) => <div key={k} style={{ width: `${(f[k] * w[k] / 100) * 100}%`, background: color }} title={`${k}: ${(f[k] * w[k]).toFixed(1)} pts`} />)}
                      </div>
                    </div>
                    <div className="text-right shrink-0"><p className={`text-xl font-extrabold ${band.cls}`}>{c.derived.priority.score}</p><SeverityBadge severity={sevOf(c)} /></div>
                  </Link>
                </li>
              );
            })}
          </ol>
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted">
            {[['Severity', '#dc2626'], ['Supporting reports', '#f59e0b'], ['Days unresolved', '#2563eb'], ['Recurrence', '#7c3aed']].map(([l, c]) => <span key={l} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: c }} />{l}</span>)}
          </div>
        </div>
      )}

      {tab === 'duplicates' && (
        <div className="card p-4">
          <CardHeader icon={Layers} title={`Duplicate-candidate groups (${d.groups.length})`} />
          <p className="text-xs text-muted mb-4">Groups are suggestions based on text similarity, location and time. Each citizen&apos;s original complaint is kept.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead><tr className="text-left text-xs text-muted border-b border-line">{['Group', 'Issue', 'Area', 'Reports', 'Open', 'Top priority', 'Status', ''].map((h) => <th key={h} className="py-2.5 pr-4 font-semibold">{h}</th>)}</tr></thead>
              <tbody>
                {d.groups.map((g) => (
                  <tr key={g.id} className="border-b border-line last:border-0 hover:bg-soft">
                    <td className="py-3 pr-4 font-bold text-amber-700 dark:text-amber-300">{g.id}</td>
                    <td className="py-3 pr-4 text-ink">{subOf(g.top)}<span className="block text-xs text-muted">{catOf(g.top)}</span></td>
                    <td className="py-3 pr-4 text-muted">{g.top.citizenInput.location.area}</td>
                    <td className="py-3 pr-4 font-semibold text-ink">{g.count}</td>
                    <td className="py-3 pr-4 text-ink">{g.open}</td>
                    <td className="py-3 pr-4 font-bold text-ink">{g.top.derived.priority.score}</td>
                    <td className="py-3 pr-4"><StatusBadge status={g.top.adminState.status} /></td>
                    <td className="py-3"><Link className="text-brand-600 font-semibold text-xs" to={`/admin/complaints/${g.top.id}`}>Review</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'recurring' && (
        <div className="card p-4">
          <CardHeader icon={Repeat} title="Recurring issues by area" />
          <p className="text-xs text-muted mb-4">Same issue type reported 3+ times in one neighbourhood. These may point to a root cause that needs a permanent fix, not another repair.</p>
          {d.recurring.length === 0 ? <p className="text-sm text-muted">No recurring issues found.</p> : (
            <ul className="grid md:grid-cols-2 gap-3">
              {d.recurring.slice(0, 12).map((r) => (
                <li key={`${r.area}-${r.sub}`} className="rounded-xl border border-line p-4">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-bold text-ink">{r.sub}</p>
                      <p className="text-xs text-muted">{r.area} · {r.cat}</p>
                    </div>
                    <div className="text-right"><p className="text-2xl font-extrabold text-navy-900 dark:text-white leading-none">{r.count}</p><p className="text-[11px] text-muted">reports</p></div>
                  </div>
                  <div className="mt-3"><ConfidenceBar value={r.open / r.count} label={`${r.open} still open`} /></div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

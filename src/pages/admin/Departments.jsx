import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, User, ArrowRight, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { CardHeader, PageHeader, SeverityBadge, StatusBadge } from '../../components/ui';
import { axisTick, gridStroke, tooltipStyle } from '../../components/chartStyle';
import { useComplaints, timeAgo } from '../../utils/hooks';
import { byDepartment, isOpen, sevOf } from '../../utils/stats';

export default function Departments() {
  const { complaints } = useComplaints();
  const depts = useMemo(() => byDepartment(complaints).filter((d) => d.total > 0 || d.name !== 'Central Dispatch'), [complaints]);
  const [active, setActive] = useState(null);
  const current = depts.find((d) => d.name === active) || depts[0];

  const queue = useMemo(() => complaints
    .filter((c) => c.adminState.assignedDepartment === current?.name && isOpen(c))
    .sort((a, b) => b.derived.priority.score - a.derived.priority.score)
    .slice(0, 8), [complaints, current]);

  const chart = depts.map((d) => ({ name: d.name.split(' & ')[0], Assigned: d.assignedOpen, 'In progress': d.inProgress, Resolved: d.resolved }));

  return (
    <div className="max-w-[1400px] space-y-6">
      <PageHeader title="Department Management" subtitle="Workload, pending cases and resolution performance by department." />

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {depts.map((d) => (
          <button key={d.name} onClick={() => setActive(d.name)} aria-pressed={current?.name === d.name}
            className={`card p-5 text-left transition-shadow hover:shadow-lift ${current?.name === d.name ? 'ring-2 ring-brand-500' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-block h-2.5 w-8 rounded-full mb-2" style={{ background: d.color }} />
                <h2 className="font-bold text-ink">{d.name}</h2>
                <p className="text-xs text-muted flex items-center gap-1.5 mt-1"><User className="h-3 w-3" />{d.head}<Phone className="h-3 w-3 ml-2" />{d.phone}</p>
              </div>
              {d.critical > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300 text-[11px] font-bold px-2 py-0.5"><AlertTriangle className="h-3 w-3" />{d.critical}</span>}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              {[['Open', d.open], ['In progress', d.inProgress], ['Resolved', d.resolved]].map(([l, v]) => (
                <div key={l} className="rounded-xl bg-soft py-2"><p className="text-lg font-extrabold text-ink">{v}</p><p className="text-[11px] text-muted">{l}</p></div>
              ))}
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1"><span className="text-muted">Resolution rate</span><span className="font-bold text-ink">{d.rate}%</span></div>
              <div className="h-1.5 rounded-full bg-soft"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${d.rate}%` }} /></div>
              <p className="text-xs text-muted mt-2">Avg. resolution: <b className="text-ink">{d.avgDays ? `${d.avgDays.toFixed(1)} days` : '-'}</b></p>
            </div>
          </button>
        ))}
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <div className="card p-4">
          <CardHeader title="Workload by department" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ left: -20 }}>
                <CartesianGrid stroke={gridStroke} vertical={false} />
                <XAxis dataKey="name" tick={{ ...axisTick, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(148,163,184,.12)' }} /><Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Assigned" stackId="a" fill="#6366f1" /><Bar dataKey="In progress" stackId="a" fill="#2563eb" /><Bar dataKey="Resolved" stackId="a" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-4">
          <CardHeader title={`${current?.name || ''} - open queue`}
            action={<Link to={`/admin/complaints?dept=${encodeURIComponent(current?.name || '')}&open=1`} className="text-xs font-semibold text-brand-600 flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>} />
          {queue.length === 0 ? <p className="text-sm text-muted py-8 text-center">No open complaints assigned to this department.</p> : (
            <ul className="divide-y divide-line">
              {queue.map((c) => (
                <li key={c.id}>
                  <Link to={`/admin/complaints/${c.id}`} className="flex items-center gap-3 py-2.5 hover:bg-soft rounded-xl px-2 -mx-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{c.citizenInput.title}</p>
                      <p className="text-xs text-muted">{c.id} · {timeAgo(c.citizenInput.createdAt)} · score {c.derived.priority.score}</p>
                    </div>
                    <SeverityBadge severity={sevOf(c)} /><StatusBadge status={c.adminState.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Clock, CheckCircle2, AlertTriangle, MapPin, Sparkles, List, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import CityMap from '../../components/CityMap';
import { StatCard, CardHeader, SeverityBadge, StatusBadge, Skeleton } from '../../components/ui';
import { axisTick, gridStroke, tooltipStyle, COLORS } from '../../components/chartStyle';
import { useComplaints, timeAgo } from '../../utils/hooks';
import { summarize, monthlyTrend, byCategory, sevOf, catOf, subOf, isOpen } from '../../utils/stats';
import { priorityBand } from '../../utils/priority';

export default function Overview() {
  const { complaints, loading } = useComplaints();
  const navigate = useNavigate();
  const [range, setRange] = useState(6);

  const s = useMemo(() => summarize(complaints), [complaints]);
  const trend = useMemo(() => monthlyTrend(complaints, range), [complaints, range]);
  const cats = useMemo(() => byCategory(complaints), [complaints]);
  const top = useMemo(
    () => complaints.filter(isOpen).sort((a, b) => b.derived.priority.score - a.derived.priority.score).slice(0, 4),
    [complaints]
  );
  const recent = complaints.slice(0, 6);

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-72" /><Skeleton className="h-24" /><Skeleton className="h-80" /></div>;

  return (
    <div className="space-y-6 max-w-[1400px]">
      <h1 className="text-2xl font-extrabold text-ink">City Operations Dashboard</h1>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={FileText} tone="blue" label="Total Complaints" value={s.total.toLocaleString()} onClick={() => navigate('/admin/complaints')} />
        <StatCard icon={Clock} tone="amber" label="Pending" value={s.pending} hint={`${s.assigned} assigned · ${s.inProgress} in progress`} onClick={() => navigate('/admin/complaints?status=Pending')} />
        <StatCard icon={CheckCircle2} tone="green" label="Resolved" value={s.resolved} hint={`Avg ${s.avgDays.toFixed(1)} days to resolve`} onClick={() => navigate('/admin/complaints?status=Resolved')} />
        <StatCard icon={AlertTriangle} tone="red" label="Critical (open)" value={s.critical} hint={`${s.needsReview} need human review`} onClick={() => navigate('/admin/complaints?severity=Critical&open=1')} />
      </div>

      <div className="grid xl:grid-cols-[1.6fr_1fr] gap-6">
        <div className="card p-4">
          <CardHeader icon={MapPin} title="City Complaints Map"
            action={<Link to="/admin/map" className="text-xs font-semibold text-brand-600 flex items-center gap-1">View Full Map <ArrowRight className="h-3 w-3" /></Link>} />
          <div className="h-72 rounded-xl overflow-hidden">
            <CityMap complaints={complaints.filter(isOpen)} onSelect={(c) => navigate(`/admin/complaints/${c.id}`)} />
          </div>
        </div>

        <div className="card p-4">
          <CardHeader icon={Sparkles} title="AI Priority Insights"
            action={<span className="text-[10px] font-semibold text-muted uppercase">Prototype</span>} />
          <ul className="divide-y divide-line">
            {top.map((c) => {
              const sev = sevOf(c);
              const band = priorityBand(c.derived.priority.score);
              return (
                <li key={c.id}>
                  <Link to={`/admin/complaints/${c.id}`} className="flex items-center gap-3 py-3 hover:bg-soft rounded-xl px-2 -mx-2">
                    <span className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${sev === 'Critical' ? 'bg-red-50 text-red-600 dark:bg-red-500/15' : sev === 'High' ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/15' : 'bg-sky-50 text-sky-600 dark:bg-sky-500/15'}`}>
                      <AlertTriangle className="h-5 w-5" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-ink truncate">{c.citizenInput.title}</span>
                      <span className="block text-xs text-muted">{timeAgo(c.citizenInput.createdAt)} · {c.citizenInput.location.area}</span>
                    </span>
                    <span className="text-right shrink-0">
                      <SeverityBadge severity={sev} />
                      <span className={`block text-[11px] font-bold mt-1 ${band.cls}`}>{c.derived.priority.score} · {band.label}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link to="/admin/insights" className="mt-2 block text-center text-sm font-semibold text-brand-600">See all AI insights</Link>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1.6fr_1fr] gap-6">
        <div className="card p-4">
          <CardHeader title="Complaints received vs resolved"
            action={
              <select aria-label="Trend range" value={range} onChange={(e) => setRange(+e.target.value)} className="input !w-auto !py-1 !text-xs">
                <option value={3}>Last 3 months</option><option value={6}>Last 6 months</option>
              </select>
            } />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={COLORS.received} stopOpacity={0.35} /><stop offset="1" stopColor={COLORS.received} stopOpacity={0} /></linearGradient>
                  <linearGradient id="gRes" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={COLORS.resolved} stopOpacity={0.35} /><stop offset="1" stopColor={COLORS.resolved} stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid stroke={gridStroke} vertical={false} />
                <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="received" name="Received" stroke={COLORS.received} strokeWidth={2} fill="url(#gRec)" />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke={COLORS.resolved} strokeWidth={2} fill="url(#gRes)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-4">
          <CardHeader title="By category" />
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={cats} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2} stroke="none"
                  onClick={(d) => navigate(`/admin/complaints?category=${encodeURIComponent(d.name)}`)} style={{ cursor: 'pointer' }}>
                  {cats.map((c) => <Cell key={c.name} fill={c.color} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
            {cats.map((c) => (
              <li key={c.name} className="flex items-center gap-2 text-xs text-muted">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                <span className="truncate flex-1">{c.name}</span><span className="font-semibold text-ink">{c.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card p-4">
        <CardHeader icon={List} title="Recent Complaints" action={<Link to="/admin/complaints" className="text-xs font-semibold text-brand-600 flex items-center gap-1">View All <ArrowRight className="h-3 w-3" /></Link>} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-left text-xs text-muted border-b border-line">
                {['ID', 'Category', 'Location', 'AI Classification', 'Priority', 'Status'].map((h) => <th key={h} className="py-2.5 pr-4 font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {recent.map((c) => {
                const band = priorityBand(c.derived.priority.score);
                return (
                  <tr key={c.id} onClick={() => navigate(`/admin/complaints/${c.id}`)} className="border-b border-line last:border-0 hover:bg-soft cursor-pointer">
                    <td className="py-3 pr-4 font-semibold text-brand-700 dark:text-brand-200">#{c.id.replace('CS-2026-', 'CS-')}</td>
                    <td className="py-3 pr-4 text-ink">{catOf(c)}</td>
                    <td className="py-3 pr-4 text-muted">{c.citizenInput.location.area}</td>
                    <td className="py-3 pr-4 text-ink">{subOf(c)}</td>
                    <td className="py-3 pr-4"><span className={`font-bold ${band.cls}`}>{band.label}</span> <span className="text-xs text-muted">({c.derived.priority.score})</span></td>
                    <td className="py-3"><StatusBadge status={c.adminState.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

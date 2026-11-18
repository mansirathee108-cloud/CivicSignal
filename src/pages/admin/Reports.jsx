import React, { useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { CardHeader, PageHeader, StatCard } from '../../components/ui';
import { FileText, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { CATEGORY_NAMES } from '../../data/taxonomy';
import { useComplaints } from '../../utils/hooks';
import { byArea, byDepartment, catOf, downloadText, resolutionDays, summarize, toCSV } from '../../utils/stats';

const RANGES = [['30', 'Last 30 days'], ['90', 'Last 90 days'], ['180', 'Last 6 months'], ['all', 'All time']];

export default function Reports() {
  const { complaints } = useComplaints();
  const [range, setRange] = useState('90');

  const list = useMemo(() => {
    if (range === 'all') return complaints;
    const cutoff = Date.now() - +range * 86400000;
    return complaints.filter((c) => new Date(c.citizenInput.createdAt).getTime() >= cutoff);
  }, [complaints, range]);

  const s = summarize(list);
  const rate = s.total ? Math.round((s.resolved / s.total) * 100) : 0;

  const catRows = CATEGORY_NAMES.map((name) => {
    const items = list.filter((c) => catOf(c) === name);
    const days = items.map(resolutionDays).filter((x) => x !== null && x >= 0);
    return { name, total: items.length, resolved: items.filter((c) => c.adminState.status === 'Resolved').length, avg: days.length ? days.reduce((a, b) => a + b, 0) / days.length : null };
  }).filter((r) => r.total > 0);
  const deptRows = byDepartment(list).filter((d) => d.total > 0);
  const areaRows = byArea(list).slice(0, 8);

  const Table = ({ title, head, rows }) => (
    <div className="card p-4 overflow-x-auto">
      <CardHeader title={title} />
      <table className="w-full text-sm min-w-[420px]">
        <thead><tr className="text-left text-xs text-muted border-b border-line">{head.map((h) => <th key={h} className="py-2 pr-3 font-semibold">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r) => <tr key={r[0]} className="border-b border-line last:border-0">{r.map((v, i) => <td key={i} className={`py-2.5 pr-3 ${i === 0 ? 'font-semibold text-ink' : 'text-muted'}`}>{v}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );

  return (
    <div className="max-w-[1400px] space-y-6">
      <PageHeader title="Reports" subtitle="Summary tables you can export or print for review meetings."
        actions={
          <>
            <select className="input !w-auto" aria-label="Date range" value={range} onChange={(e) => setRange(e.target.value)}>
              {RANGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <button className="btn-outline !py-2" onClick={() => downloadText(`civicsignal-report-${range}.csv`, toCSV(list))}><Download className="h-4 w-4" /> CSV</button>
            <button className="btn-outline !py-2" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</button>
          </>
        } />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={FileText} tone="blue" label="Complaints received" value={s.total} />
        <StatCard icon={CheckCircle2} tone="green" label="Resolution rate" value={`${rate}%`} hint={`${s.resolved} resolved`} />
        <StatCard icon={Clock} tone="amber" label="Avg. days to resolve" value={s.avgDays.toFixed(1)} />
        <StatCard icon={AlertTriangle} tone="red" label="Critical still open" value={s.critical} />
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <Table title="By category" head={['Category', 'Total', 'Resolved', 'Avg. days']} rows={catRows.map((r) => [r.name, r.total, r.resolved, r.avg === null ? '-' : r.avg.toFixed(1)])} />
        <Table title="By department" head={['Department', 'Assigned', 'Resolved', 'Rate']} rows={deptRows.map((r) => [r.name, r.total, r.resolved, `${r.rate}%`])} />
        <Table title="Top neighbourhoods" head={['Area', 'Total', 'Still open']} rows={areaRows.map((r) => [r.name, r.total, r.open])} />
      </div>
    </div>
  );
}

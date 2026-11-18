import { CATEGORIES, DEPARTMENTS } from '../data/taxonomy';

export const sevOf = (c) => c.adminState.confirmed?.severity || c.aiPredictions.severity;
export const catOf = (c) => c.adminState.confirmed?.category || c.aiPredictions.category;
export const subOf = (c) => c.adminState.confirmed?.subcategory || c.aiPredictions.subcategory;
export const isOpen = (c) => c.adminState.status !== 'Resolved';
export const awaitingReview = (c) => c.adminState.reviewState === 'Pending Review' || c.adminState.reviewState === 'Unable to Classify';

// Flag used on the complaints table / review queue
export const flaggedForReview = (c, threshold = 75) =>
  awaitingReview(c) && (c.aiPredictions.confidenceScore < threshold || c.aiPredictions.severity === 'Critical' || c.adminState.reviewState === 'Unable to Classify');

export const resolutionDays = (c) =>
  c.adminState.resolvedAt ? (new Date(c.adminState.resolvedAt) - new Date(c.citizenInput.createdAt)) / 86400000 : null;

export function summarize(list) {
  const by = (s) => list.filter((c) => c.adminState.status === s).length;
  const days = list.map(resolutionDays).filter((d) => d !== null && d >= 0);
  return {
    total: list.length,
    pending: by('Pending'),
    assigned: by('Assigned'),
    inProgress: by('In Progress'),
    resolved: by('Resolved'),
    critical: list.filter((c) => isOpen(c) && sevOf(c) === 'Critical').length,
    needsReview: list.filter((c) => isOpen(c) && flaggedForReview(c)).length,
    avgDays: days.length ? days.reduce((a, b) => a + b, 0) / days.length : 0,
  };
}

export function monthlyTrend(list, months = 6) {
  const now = new Date();
  const out = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleString('en-IN', { month: 'short' }), received: 0, resolved: 0 });
  }
  const idx = Object.fromEntries(out.map((m, i) => [m.key, i]));
  list.forEach((c) => {
    const d = new Date(c.citizenInput.createdAt);
    const k = idx[`${d.getFullYear()}-${d.getMonth()}`];
    if (k !== undefined) out[k].received += 1;
    if (c.adminState.resolvedAt) {
      const r = new Date(c.adminState.resolvedAt);
      const kr = idx[`${r.getFullYear()}-${r.getMonth()}`];
      if (kr !== undefined) out[kr].resolved += 1;
    }
  });
  return out;
}

export function monthlyByCategory(list, months = 6) {
  const base = monthlyTrend([], months).map((m) => ({ ...m, ...Object.fromEntries(Object.keys(CATEGORIES).map((k) => [k, 0])) }));
  const idx = Object.fromEntries(base.map((m, i) => [m.key, i]));
  list.forEach((c) => {
    const d = new Date(c.citizenInput.createdAt);
    const k = idx[`${d.getFullYear()}-${d.getMonth()}`];
    if (k !== undefined) base[k][catOf(c)] += 1;
  });
  return base;
}

export function byCategory(list) {
  return Object.keys(CATEGORIES)
    .map((name) => ({ name, value: list.filter((c) => catOf(c) === name).length, color: CATEGORIES[name].color }))
    .filter((x) => x.value > 0);
}

export function byArea(list) {
  const m = {};
  list.forEach((c) => {
    const a = c.citizenInput.location.area;
    m[a] = m[a] || { name: a, total: 0, open: 0 };
    m[a].total += 1;
    if (isOpen(c)) m[a].open += 1;
  });
  return Object.values(m).sort((a, b) => b.total - a.total);
}

export function byDepartment(list) {
  return DEPARTMENTS.map((d) => {
    const mine = list.filter((c) => (c.adminState.assignedDepartment || c.adminState.suggestedDepartment) === d.name);
    const assigned = mine.filter((c) => c.adminState.assignedDepartment === d.name);
    const s = summarize(assigned);
    return {
      ...d,
      all: mine.length,
      open: assigned.filter(isOpen).length,
      assignedOpen: s.assigned,
      inProgress: s.inProgress,
      resolved: s.resolved,
      critical: s.critical,
      avgDays: s.avgDays,
      total: assigned.length,
      rate: assigned.length ? Math.round((s.resolved / assigned.length) * 100) : 0,
    };
  });
}

export function duplicateGroups(list) {
  const g = {};
  list.forEach((c) => {
    const id = c.aiPredictions.duplicateGroupId;
    if (!id) return;
    (g[id] = g[id] || []).push(c);
  });
  return Object.entries(g)
    .map(([id, items]) => {
      const sorted = [...items].sort((a, b) => b.derived.priority.score - a.derived.priority.score);
      return { id, items: sorted, top: sorted[0], count: items.length, open: items.filter(isOpen).length };
    })
    .sort((a, b) => b.open - a.open || b.count - a.count);
}

export function recurringIssues(list, min = 3) {
  const m = {};
  list.forEach((c) => {
    const k = `${c.citizenInput.location.area}|${subOf(c)}`;
    (m[k] = m[k] || { area: c.citizenInput.location.area, sub: subOf(c), cat: catOf(c), items: [] }).items.push(c);
  });
  return Object.values(m)
    .filter((x) => x.items.length >= min)
    .map((x) => ({ ...x, count: x.items.length, open: x.items.filter(isOpen).length }))
    .sort((a, b) => b.count - a.count);
}

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
export function toCSV(list) {
  const head = ['ID', 'Title', 'Description', 'Area', 'Address', 'Lat', 'Lng', 'AI category', 'AI subcategory', 'AI severity', 'AI confidence %', 'Confirmed category', 'Confirmed severity', 'Review state', 'Department', 'Status', 'Priority', 'Duplicate group', 'Created', 'Resolved'];
  const rows = list.map((c) => [
    c.id, c.citizenInput.title, c.citizenInput.description, c.citizenInput.location.area, c.citizenInput.location.address,
    c.citizenInput.location.lat, c.citizenInput.location.lng, c.aiPredictions.category, c.aiPredictions.subcategory, c.aiPredictions.severity,
    c.aiPredictions.confidenceScore, c.adminState.confirmed?.category || '', c.adminState.confirmed?.severity || '', c.adminState.reviewState,
    c.adminState.assignedDepartment || '', c.adminState.status, c.derived?.priority.score ?? '', c.aiPredictions.duplicateGroupId || '',
    c.citizenInput.createdAt, c.adminState.resolvedAt || '',
  ]);
  return [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
}

export function downloadText(filename, text, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

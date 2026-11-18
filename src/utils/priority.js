import { SEVERITY_SCORE } from '../data/taxonomy';

// Report section 7.1:  P = 0.40*S + 0.25*D + 0.20*T + 0.15*R   (all factors 0-100)
// Weights are demonstration values, not official municipal standards.
export const DEFAULT_WEIGHTS = { S: 0.4, D: 0.25, T: 0.2, R: 0.15 };
export const WEIGHTS = DEFAULT_WEIGHTS;

// Admins can tune the weights on the Settings page (stored locally for the prototype).
export function getWeights() {
  try {
    const saved = JSON.parse(localStorage.getItem('cs_weights') || 'null');
    if (saved && ['S', 'D', 'T', 'R'].every((k) => typeof saved[k] === 'number' && saved[k] >= 0)) {
      const sum = saved.S + saved.D + saved.T + saved.R;
      if (sum > 0) return { S: saved.S / sum, D: saved.D / sum, T: saved.T / sum, R: saved.R / sum };
    }
  } catch { /* use defaults */ }
  return DEFAULT_WEIGHTS;
}

export const FACTOR_LABELS = {
  S: 'Severity',
  D: 'Supporting reports',
  T: 'Unresolved duration',
  R: 'Recurrence in area',
};

const clamp = (n) => Math.max(0, Math.min(100, n));

// ctx: { groupSize, recurrenceCount }
export function computePriority(complaint, ctx = {}, now = Date.now()) {
  const sev = complaint.adminState.confirmed?.severity || complaint.aiPredictions.severity;
  const S = SEVERITY_SCORE[sev] ?? 45;

  const groupSize = ctx.groupSize || 1;
  const D = clamp((groupSize - 1) * 30); // 1 report = 0, 4 reports = 90

  const resolved = complaint.adminState.status === 'Resolved';
  const ageDays = (now - new Date(complaint.citizenInput.createdAt).getTime()) / 86400000;
  const T = resolved ? 0 : clamp((ageDays / 14) * 100); // 14+ days unresolved = 100

  const R = clamp((ctx.recurrenceCount || 0) * 25); // 4+ earlier reports of same issue in area = 100

  const w = getWeights();
  const score = Math.round(w.S * S + w.D * D + w.T * T + w.R * R);
  return { score, factors: { S: Math.round(S), D: Math.round(D), T: Math.round(T), R: Math.round(R) } };
}

export const priorityBand = (score) =>
  score >= 75 ? { label: 'Urgent', cls: 'text-red-600 dark:text-red-400' }
  : score >= 55 ? { label: 'High', cls: 'text-orange-600 dark:text-orange-400' }
  : score >= 35 ? { label: 'Medium', cls: 'text-sky-600 dark:text-sky-400' }
  : { label: 'Low', cls: 'text-emerald-600 dark:text-emerald-400' };

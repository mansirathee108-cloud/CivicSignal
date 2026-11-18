// ---------------------------------------------------------------------------
// DATA ACCESS LAYER - the ONE file to rewrite when the real backend is ready.
// Every page talks to the "backend" only through these functions. Today they
// read/write localStorage; later each one becomes a fetch()/Supabase call that
// returns the same shapes. Keep the return shapes and nothing else needs to change.
// ---------------------------------------------------------------------------
import { generateComplaints } from '../data/seed';
import { departmentFor } from '../data/taxonomy';
import { classify, findDuplicateCandidates } from '../utils/mockAI';
import { computePriority } from '../utils/priority';

const KEY = 'cs_complaints_v2';

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fall through to seed */ }
  const seed = generateComplaints();
  write(seed);
  return seed;
}

function write(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); }
  catch (e) { console.warn('Could not persist complaints (storage full?)', e); }
}

// Attach computed fields (priority score + breakdown, group size) to every complaint.
function withDerived(list) {
  const now = Date.now();
  const groupSizes = {};
  list.forEach((c) => {
    const g = c.aiPredictions.duplicateGroupId;
    if (g) groupSizes[g] = (groupSizes[g] || 0) + 1;
  });
  const subOf = (c) => c.adminState.confirmed?.subcategory || c.aiPredictions.subcategory;
  return list.map((c) => {
    const t = new Date(c.citizenInput.createdAt).getTime();
    const recurrenceCount = list.filter((o) =>
      o.id !== c.id &&
      o.citizenInput.location.area === c.citizenInput.location.area &&
      subOf(o) === subOf(c) &&
      new Date(o.citizenInput.createdAt).getTime() < t &&
      t - new Date(o.citizenInput.createdAt).getTime() < 90 * 86400000
    ).length;
    const groupSize = groupSizes[c.aiPredictions.duplicateGroupId] || 1;
    const priority = computePriority(c, { groupSize, recurrenceCount }, now);
    return { ...c, derived: { priority, groupSize, recurrenceCount } };
  });
}

// ----------------------------- reads ---------------------------------------
export async function listComplaints() { return withDerived(read()); }

export async function getComplaint(id) {
  const key = String(id || '').trim().toUpperCase();
  return withDerived(read()).find((c) => c.id.toUpperCase() === key) || null;
}

// ----------------------------- writes --------------------------------------
function mutate(id, fn) {
  const list = read();
  const idx = list.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error(`Complaint ${id} not found`);
  list[idx] = fn(structuredClone(list[idx]));
  write(list);
  return list[idx];
}

const stamp = (status, by, note) => ({ status, at: new Date().toISOString(), by, note });

export async function createComplaint({ title, description, location, photoUrl, citizenCategory, citizenSeverity, user }) {
  const list = read();
  const maxNo = list.reduce((m, c) => Math.max(m, parseInt(c.id.split('-')[2], 10) || 0), 1000);
  const id = `CS-2026-${maxNo + 1}`;
  const ai = classify(title, description);
  const dupes = findDuplicateCandidates(list, { subcategory: ai.subcategory, lat: location.lat, lng: location.lng });
  const groupId = dupes[0]?.groupId || null;

  const complaint = {
    id,
    citizenInput: {
      submittedBy: user?.id || 'guest',
      submitterName: user?.name || 'Guest citizen',
      title, description, location, photoUrl: photoUrl || null,
      citizenCategory: citizenCategory || null,
      citizenSeverity: citizenSeverity || null,
      createdAt: new Date().toISOString(),
    },
    aiPredictions: {
      category: ai.category, subcategory: ai.subcategory, severity: ai.severity,
      confidence: ai.confidence, confidenceScore: ai.confidenceScore,
      needsHumanReview: ai.needsHumanReview, reviewReason: ai.reviewReason,
      duplicateGroupId: groupId, duplicateCandidates: dupes.map((d) => d.id),
      cues: ai.cues, summary: `${ai.subcategory} reported at ${location.address}.`,
      modelVersion: ai.modelVersion,
    },
    adminState: {
      status: 'Pending',
      reviewState: ai.unable ? 'Unable to Classify' : 'Pending Review',
      confirmed: null,
      suggestedDepartment: ai.suggestedDepartment,
      assignedDepartment: null, notes: [], resolvedAt: null,
      history: [stamp('Pending', 'System', 'Complaint received and analysed by AI (prototype)')],
    },
  };
  write([complaint, ...list]);
  return complaint;
}

export async function confirmClassification(id, { category, subcategory, severity }, by) {
  return mutate(id, (c) => {
    const ai = c.aiPredictions;
    const changed = ai.category !== category || ai.subcategory !== subcategory || ai.severity !== severity;
    c.adminState.confirmed = { category, subcategory, severity };
    c.adminState.reviewState = changed ? 'Corrected' : 'Confirmed';
    c.adminState.suggestedDepartment = departmentFor(category);
    c.adminState.history.push({ ...stamp(c.adminState.status, by, changed ? 'Classification corrected by reviewer' : 'AI classification confirmed by reviewer') });
    return c;
  });
}

export async function assignDepartment(id, department, by) {
  return mutate(id, (c) => {
    c.adminState.assignedDepartment = department;
    if (c.adminState.status === 'Pending') c.adminState.status = 'Assigned';
    c.adminState.history.push(stamp(c.adminState.status, by, `Assigned to ${department}`));
    return c;
  });
}

export async function setStatus(id, status, by, note) {
  return mutate(id, (c) => {
    c.adminState.status = status;
    c.adminState.resolvedAt = status === 'Resolved' ? new Date().toISOString() : null;
    c.adminState.history.push(stamp(status, by, note || `Status changed to ${status}`));
    return c;
  });
}

export async function addNote(id, text, by) {
  return mutate(id, (c) => {
    c.adminState.notes.push({ text, by, at: new Date().toISOString() });
    return c;
  });
}

export async function mergeDuplicate(id, otherId) {
  const list = read();
  const a = list.find((c) => c.id === id);
  const b = list.find((c) => c.id === otherId);
  if (!a || !b) return;
  const gid = a.aiPredictions.duplicateGroupId || b.aiPredictions.duplicateGroupId
    || `DG-${String(Math.floor(Math.random() * 900) + 100)}`;
  a.aiPredictions.duplicateGroupId = gid;
  b.aiPredictions.duplicateGroupId = gid;
  [a, b].forEach((c) => {
    const o = c === a ? b : a;
    if (!c.aiPredictions.duplicateCandidates.includes(o.id)) c.aiPredictions.duplicateCandidates.push(o.id);
  });
  write(list);
}

export async function dismissDuplicate(id, otherId) {
  return mutate(id, (c) => {
    c.aiPredictions.duplicateCandidates = c.aiPredictions.duplicateCandidates.filter((x) => x !== otherId);
    return c;
  });
}

export function resetDemoData() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

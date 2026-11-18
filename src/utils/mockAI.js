// PROTOTYPE ONLY. A keyword scorer that imitates the shape of the real AI response
// (see report section 8.2). Replace classify() with a call to POST /api/ai/classify.
import { CATEGORIES, departmentFor } from '../data/taxonomy';

const RULES = [
  { cat: 'Electricity', sub: 'Exposed electrical wire', sev: 'Critical', words: ['live wire', 'exposed wire', 'sparks', 'sparking', 'electric shock', 'hanging wire', 'wires are exposed', 'electrical box'] },
  { cat: 'Electricity', sub: 'Streetlight failure', sev: 'Medium', words: ['streetlight', 'street light', 'lamp post', 'dark at night', 'light not working', 'lights are off'] },
  { cat: 'Electricity', sub: 'Damaged public lighting', sev: 'Medium', words: ['light pole', 'lamp fixture', 'lamp cover'] },
  { cat: 'Drainage', sub: 'Sewage overflow', sev: 'High', words: ['sewage', 'manhole', 'sewer'] },
  { cat: 'Drainage', sub: 'Waterlogging', sev: 'High', words: ['waterlog', 'flooded', 'flooding', 'knee-deep'] },
  { cat: 'Drainage', sub: 'Blocked drain', sev: 'Medium', words: ['blocked drain', 'drain is blocked', 'choked', 'clogged drain', 'drain blocked'] },
  { cat: 'Drainage', sub: 'Damaged drain', sev: 'Medium', words: ['drain cover', 'drain wall', 'open drain'] },
  { cat: 'Water Supply', sub: 'Contaminated supply', sev: 'High', words: ['dirty water', 'smelly water', 'contaminated', 'yellow water', 'muddy water', 'tap water smells'] },
  { cat: 'Water Supply', sub: 'Pipeline damage', sev: 'High', words: ['pipeline', 'burst', 'pipe broken', 'broken pipe'] },
  { cat: 'Water Supply', sub: 'Water leakage', sev: 'Medium', words: ['leak', 'leaking', 'water flowing', 'dripping'] },
  { cat: 'Water Supply', sub: 'Water shortage', sev: 'Medium', words: ['no water', 'water shortage', 'low pressure', 'tanker', 'no tap water'] },
  { cat: 'Road Maintenance', sub: 'Pothole', sev: 'High', words: ['pothole', 'potholes', 'crater'] },
  { cat: 'Road Maintenance', sub: 'Road damage', sev: 'Medium', words: ['road damage', 'cracked road', 'road surface', 'tar', 'sunken road', 'road broken'] },
  { cat: 'Road Maintenance', sub: 'Broken footpath', sev: 'Low', words: ['footpath', 'pavement', 'sidewalk'] },
  { cat: 'Road Maintenance', sub: 'Road obstruction', sev: 'Medium', words: ['blocking the road', 'debris', 'fallen tree', 'tree fell', 'road blocked'] },
  { cat: 'Waste Management', sub: 'Illegal dumping', sev: 'Medium', words: ['dumping', 'dumped', 'dumps'] },
  { cat: 'Waste Management', sub: 'Missed collection', sev: 'Medium', words: ['not collected', 'collection', 'garbage truck', 'did not come'] },
  { cat: 'Waste Management', sub: 'Overflowing bin', sev: 'Medium', words: ['bin', 'dustbin', 'overflowing'] },
  { cat: 'Waste Management', sub: 'Garbage pile', sev: 'Medium', words: ['garbage', 'waste', 'trash', 'rubbish', 'litter'] },
  { cat: 'Public Infrastructure', sub: 'Damaged bench', sev: 'Low', words: ['bench', 'seating'] },
  { cat: 'Public Infrastructure', sub: 'Broken public facility', sev: 'Medium', words: ['toilet', 'play equipment', 'swing', 'slide', 'public facility'] },
  { cat: 'Public Infrastructure', sub: 'Damaged public property', sev: 'Low', words: ['vandal', 'bus shelter', 'noticeboard', 'public property'] },
];

const SEVERITY_UP = ['school', 'children', 'hospital', 'main road', 'highway', 'danger', 'dangerous', 'accident', 'fell', 'injur', 'sick', 'urgent', 'sparks', 'overflowing', 'since morning'];
const SEVERITY_DOWN = ['minor', 'small', 'slight', 'little'];
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

const round2 = (n) => Math.round(n * 100) / 100;

export function classify(title = '', description = '') {
  const text = `${title} ${description}`.toLowerCase().replace(/\s+/g, ' ').trim();
  const words = text.split(' ').filter(Boolean);

  if (words.length < 4) {
    return unable('Text is too short to classify. Please add more detail.');
  }

  let best = null;
  for (const rule of RULES) {
    const hits = rule.words.filter((w) => text.includes(w));
    if (hits.length && (!best || hits.length > best.hits.length)) best = { rule, hits };
  }
  if (!best) return unable('No known complaint pattern found in the text.');

  const { rule, hits } = best;
  let sevIdx = SEVERITIES.indexOf(rule.sev);
  const ups = SEVERITY_UP.filter((w) => text.includes(w)).length;
  const downs = SEVERITY_DOWN.filter((w) => text.includes(w)).length;
  if (rule.sev !== 'Critical') sevIdx = Math.max(0, Math.min(2, sevIdx + (ups >= 2 ? 1 : 0) - (downs ? 1 : 0)));

  const lenBoost = Math.min(0.12, words.length / 250);
  const category = round2(Math.min(0.97, 0.66 + hits.length * 0.08 + lenBoost));
  const subcategory = round2(Math.max(0.4, category - 0.05));
  const severity = round2(Math.min(0.93, 0.58 + ups * 0.04 + lenBoost));
  const severityLabel = SEVERITIES[sevIdx];
  const THRESH = 0.75;
  const minConf = Math.min(category, subcategory, severity);

  return {
    category: rule.cat,
    subcategory: rule.sub,
    severity: severityLabel,
    confidence: { category, subcategory, severity },
    confidenceScore: Math.round(minConf * 100),
    needsHumanReview: severityLabel === 'Critical' || minConf < THRESH,
    reviewReason: severityLabel === 'Critical' ? 'Predicted Critical - always reviewed by a human'
      : minConf < THRESH ? 'One or more confidence scores below threshold' : null,
    suggestedDepartment: departmentFor(rule.cat),
    cues: hits.slice(0, 4),
    modelVersion: 'prototype-mock-v0',
    unable: false,
  };
}

function unable(reason) {
  return {
    category: 'Other', subcategory: 'Unclassified', severity: 'Low',
    confidence: { category: 0.3, subcategory: 0.3, severity: 0.3 }, confidenceScore: 30,
    needsHumanReview: true, reviewReason: reason, suggestedDepartment: 'Central Dispatch',
    cues: [], modelVersion: 'prototype-mock-v0', unable: true,
  };
}

// Pretend similarity search: same subcategory within ~700 m in the last 14 days.
export function findDuplicateCandidates(complaints, { subcategory, lat, lng }, now = Date.now()) {
  if (!subcategory || lat == null) return [];
  return complaints
    .filter((c) => c.adminState.status !== 'Resolved')
    .filter((c) => (c.adminState.confirmed?.subcategory || c.aiPredictions.subcategory) === subcategory)
    .filter((c) => now - new Date(c.citizenInput.createdAt).getTime() < 14 * 86400000)
    .map((c) => ({ c, d: distanceMeters(lat, lng, c.citizenInput.location.lat, c.citizenInput.location.lng) }))
    .filter((x) => x.d < 700)
    .sort((a, b) => a.d - b.d)
    .slice(0, 3)
    .map((x) => ({ id: x.c.id, title: x.c.citizenInput.title, distance: Math.round(x.d), groupId: x.c.aiPredictions.duplicateGroupId }));
}

export function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export { CATEGORIES };

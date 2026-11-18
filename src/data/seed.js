// Deterministic sample data so every teammate sees the same demo.
// All AI fields below are PROTOTYPE values, not real model output.
import { AREAS, CATEGORIES, SEVERITIES, departmentFor } from './taxonomy';

const DAY = 86400000;
const HOUR = 3600000;

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STREETS = ['1st Main Road', '80 Feet Road', 'Church Street', 'Temple Road', 'Market Cross', '5th Cross', 'Ring Road Service Lane', 'Park Avenue', 'Station Road', 'Lake View Road', 'School Lane', 'Metro Pillar 45 stretch'];
const NAMES = ['Ravi Kumar', 'Anjali Mehta', 'Suresh Patil', 'Fatima Khan', 'Deepak Joshi', 'Lakshmi Iyer', 'Arjun Reddy', 'Sneha Kulkarni', 'Mohan Das', 'Pooja Verma', 'Karthik S', 'Nisha George'];

// [title, description] variants. {street}/{area} are filled in.
const TEMPLATES = {
  Pothole: [
    ['Large pothole on {street}', 'A deep pothole has formed in the middle of the lane near {street}, {area}. Two-wheelers are slipping, especially after dark.'],
    ['Pothole near bus stop, {area}', 'Big pothole right next to the bus stop on {street}. Water collects in it and people step into it while boarding.'],
  ],
  'Road damage': [
    ['Road surface broken at {street}', 'The tar has peeled off for about 20 metres on {street} in {area}. Loose gravel is making it risky for bikes.'],
    ['Cracked and sunken road, {area}', 'Road has cracked and sunk after the last rain near {street}. Cars slow down sharply and traffic builds up.'],
  ],
  'Broken footpath': [
    ['Broken footpath slabs on {street}', 'Footpath slabs are broken and uneven on {street}, {area}. Elderly people and children are walking on the road instead.'],
    ['Footpath collapsed near {area} market', 'Part of the footpath has caved in near the market. Pedestrians are forced onto the main road.'],
  ],
  'Road obstruction': [
    ['Construction debris blocking {street}', 'Heaps of construction debris have been left on {street} for a week, blocking half the road in {area}.'],
    ['Fallen tree blocking road, {area}', 'A tree branch has fallen across {street} and vehicles are squeezing past one at a time.'],
  ],
  'Garbage pile': [
    ['Garbage piling up on {street}', 'Waste has not been cleared for several days on {street}, {area}. Stray dogs are scattering it across the street and the smell is bad.'],
    ['Garbage overflowing behind {area} market', 'Large pile of garbage behind the market. Flies and a strong smell, it is affecting nearby shops.'],
  ],
  'Missed collection': [
    ['Garbage truck did not come this week', 'The collection vehicle has skipped our lane on {street}, {area} for the past 5 days. Bins are full.'],
    ['Door-to-door collection missed', 'No waste collection in our apartment cluster near {street} since Monday. Please arrange a pickup.'],
  ],
  'Overflowing bin': [
    ['Public bin overflowing at {area} junction', 'The community bin at the junction has been overflowing since the weekend. Waste is spilling onto the road.'],
    ['Dustbin overflowing near park', 'The public dustbin near {street} is overflowing and not emptied regularly.'],
  ],
  'Illegal dumping': [
    ['Illegal dumping of waste at empty plot', 'Trucks are dumping construction and household waste on the vacant plot near {street}, {area}, mostly at night.'],
    ['Waste dumped beside lake road', 'Someone is dumping mixed garbage along the lake boundary on {street}. It is attracting rats.'],
  ],
  'Water leakage': [
    ['Water leaking from pipe on {street}', 'Clean water has been flowing from a leaking pipe on {street}, {area} since morning. A lot of water is being wasted.'],
    ['Continuous leak near {area} entrance', 'There is a large leak near the entrance. Water keeps running onto the road and the surface is getting damaged.'],
  ],
  'Pipeline damage': [
    ['Main water pipeline damaged', 'The main pipeline on {street} seems burst after road digging. Supply in {area} is weak and water is gushing out.'],
    ['Pipe broken during excavation', 'A contractor damaged the water pipe on {street} and left it. Muddy water is flowing out.'],
  ],
  'Water shortage': [
    ['No water supply for 3 days', 'Our locality near {street}, {area} has had no tap water for three days. Tankers are not coming either.'],
    ['Very low water pressure', 'Water pressure has been very low in the mornings in {area} for two weeks.'],
  ],
  'Contaminated supply': [
    ['Dirty smelly tap water', 'Tap water in {area} near {street} is yellow and smells bad since yesterday. Children are falling sick, please test the supply.'],
    ['Muddy water in supply line', 'Brownish water is coming from the taps in our building. We suspect mixing with sewage.'],
  ],
  'Blocked drain': [
    ['Blocked drain at {street}', 'The roadside drain on {street}, {area} is choked with plastic and silt. Dirty water is standing on the road.'],
    ['Drain blocked near {area} school', 'Drain outside the school is blocked and mosquitoes are breeding. Needs cleaning urgently.'],
  ],
  Waterlogging: [
    ['Waterlogging after rain on {street}', 'Road is waterlogged after even light rain near {street}, {area}. Vehicles are stalling and shops are getting flooded.'],
    ['Knee-deep water at {area} underpass', 'The underpass fills up every time it rains and traffic has to turn back.'],
  ],
  'Damaged drain': [
    ['Drain cover broken on {street}', 'The concrete drain cover is broken near {street}, {area} and leaves an open gap. Someone could fall in.'],
    ['Collapsed side drain wall', 'The wall of the storm drain has collapsed and soil is falling into the channel.'],
  ],
  'Sewage overflow': [
    ['Sewage overflowing near homes', 'Sewage is overflowing from a manhole on {street}, {area} and entering the lane near houses. Terrible smell and health risk.'],
    ['Manhole overflowing on main road', 'Sewage water is flowing out of the manhole onto the road since last night.'],
  ],
  'Streetlight failure': [
    ['Streetlight not working on {street}', 'The streetlight near {street}, {area} has not worked for over a week. The stretch is completely dark at night.'],
    ['Row of streetlights off in {area}', 'Three consecutive streetlights are off. Women and elderly residents feel unsafe walking here.'],
  ],
  'Damaged public lighting': [
    ['Park light pole damaged', 'The light pole in the park near {street} is bent and the lamp cover is hanging loose.'],
    ['Broken lamp fixture at {area} crossing', 'The lamp fixture at the crossing is broken and dangling from the pole.'],
  ],
  'Exposed electrical wire': [
    ['Exposed live wire hanging from pole', 'Sparks are coming from a wire hanging low near {street}, {area}, close to a children\'s play area. Extremely dangerous.'],
    ['Open electrical box with exposed wires', 'The street electrical box door is missing and wires are exposed at {street}. It is raining and people walk past it.'],
  ],
  'Damaged bench': [
    ['Broken bench in {area} park', 'Two benches in the park are broken and have sharp edges.'],
    ['Public bench damaged at bus stop', 'The seating at the bus stop on {street} is broken and unusable.'],
  ],
  'Broken public facility': [
    ['Public toilet door broken', 'The community toilet near {street}, {area} has a broken door and no running water.'],
    ['Children\'s play equipment broken', 'The swing and slide in the {area} park are broken and unsafe for children.'],
  ],
  'Damaged public property': [
    ['Bus shelter vandalised', 'The bus shelter glass has been smashed and the board is hanging near {street}, {area}.'],
    ['Public noticeboard collapsed', 'The municipal noticeboard has fallen over and is lying on the pavement.'],
  ],
};

// Words the (mock) model would highlight as "reason cues"
export const SUB_CUES = {
  Pothole: ['pothole', 'deep', 'lane'],
  'Road damage': ['road', 'cracked', 'tar'],
  'Broken footpath': ['footpath', 'slabs', 'uneven'],
  'Road obstruction': ['blocking', 'debris', 'fallen'],
  'Garbage pile': ['garbage', 'waste', 'smell'],
  'Missed collection': ['collection', 'skipped', 'truck'],
  'Overflowing bin': ['bin', 'overflowing', 'dustbin'],
  'Illegal dumping': ['dumping', 'dumped', 'plot'],
  'Water leakage': ['leak', 'water', 'pipe'],
  'Pipeline damage': ['pipeline', 'burst', 'broken'],
  'Water shortage': ['no water', 'supply', 'tankers'],
  'Contaminated supply': ['smells', 'yellow', 'dirty water'],
  'Blocked drain': ['drain', 'choked', 'blocked'],
  Waterlogging: ['waterlogged', 'rain', 'flooded'],
  'Damaged drain': ['drain cover', 'collapsed', 'gap'],
  'Sewage overflow': ['sewage', 'manhole', 'overflowing'],
  'Streetlight failure': ['streetlight', 'dark', 'not working'],
  'Damaged public lighting': ['light pole', 'lamp', 'bent'],
  'Exposed electrical wire': ['live wire', 'sparks', 'exposed'],
  'Damaged bench': ['bench', 'broken', 'seating'],
  'Broken public facility': ['toilet', 'swing', 'broken'],
  'Damaged public property': ['vandalised', 'smashed', 'shelter'],
};

// severity weights [Low, Medium, High, Critical]
const SEV_WEIGHTS = {
  Pothole: [1, 4, 4, 0.4], 'Road damage': [1, 4, 3, 0.4], 'Broken footpath': [3, 4, 1, 0], 'Road obstruction': [1, 3, 3, 0.5],
  'Garbage pile': [2, 5, 2, 0], 'Missed collection': [3, 5, 1, 0], 'Overflowing bin': [3, 4, 1, 0], 'Illegal dumping': [2, 4, 2, 0],
  'Water leakage': [1, 4, 3, 0], 'Pipeline damage': [0, 2, 5, 1], 'Water shortage': [0, 3, 4, 1], 'Contaminated supply': [0, 1, 4, 3],
  'Blocked drain': [1, 4, 3, 0], Waterlogging: [0, 2, 5, 1], 'Damaged drain': [1, 3, 3, 1], 'Sewage overflow': [0, 1, 4, 3],
  'Streetlight failure': [2, 6, 1, 0], 'Damaged public lighting': [2, 4, 2, 0], 'Exposed electrical wire': [0, 0, 2, 6],
  'Damaged bench': [6, 2, 0, 0], 'Broken public facility': [3, 4, 1, 0], 'Damaged public property': [4, 3, 1, 0],
};

const CAT_WEIGHTS = [
  ['Road Maintenance', 28], ['Waste Management', 22], ['Water Supply', 14],
  ['Drainage', 14], ['Electricity', 14], ['Public Infrastructure', 8],
];

export function generateComplaints(count = 126, now = Date.now()) {
  const rnd = mulberry32(2026);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const weighted = (pairs) => {
    const total = pairs.reduce((s, p) => s + p[1], 0);
    let r = rnd() * total;
    for (const [v, w] of pairs) { r -= w; if (r <= 0) return v; }
    return pairs[pairs.length - 1][0];
  };
  const fill = (s, street, area) => s.replace(/\{street\}/g, street).replace(/\{area\}/g, area);

  const raw = [];
  let groupNo = 1;

  while (raw.length < count) {
    const category = weighted(CAT_WEIGHTS);
    const sub = pick(CATEGORIES[category].subcategories);
    const area = pick(AREAS);
    const street = pick(STREETS);
    const sevIdx = (() => {
      const w = SEV_WEIGHTS[sub];
      return SEVERITIES.indexOf(weighted(SEVERITIES.map((s, i) => [s, w[i]])));
    })();
    // Newer complaints are more common than older ones
    const ageDays = Math.floor(Math.pow(rnd(), 1.6) * 150);
    const baseTime = now - ageDays * DAY - Math.floor(rnd() * 20) * HOUR;
    const inGroup = rnd() < 0.2 && ageDays > 0;
    const n = inGroup ? 2 + Math.floor(rnd() * 3) : 1;
    const gid = inGroup ? `DG-${String(groupNo++).padStart(3, '0')}` : null;

    for (let i = 0; i < n && raw.length < count; i++) {
      const tpl = TEMPLATES[sub][i === 0 ? Math.floor(rnd() * 2) : i % 2];
      raw.push({
        category, sub, area, street, sev: SEVERITIES[sevIdx], gid, tpl,
        lat: area.lat + (rnd() - 0.5) * 0.012 + (i ? (rnd() - 0.5) * 0.0008 : 0),
        lng: area.lng + (rnd() - 0.5) * 0.012 + (i ? (rnd() - 0.5) * 0.0008 : 0),
        createdAt: baseTime + i * (3 + Math.floor(rnd() * 30)) * HOUR,
        rank: rnd(),
      });
    }
  }

  // Newest first, then number them (newest = highest ID)
  raw.sort((a, b) => b.createdAt - a.createdAt);
  const total = raw.length;
  const idOf = (i) => `CS-2026-${1000 + (total - i)}`;

  const groups = {};
  raw.forEach((r, i) => { if (r.gid) (groups[r.gid] = groups[r.gid] || []).push(idOf(i)); });

  // Make sure there are visible, unresolved Critical cases for the demo
  const criticalIdx = raw.map((r, i) => (r.sev === 'Critical' ? i : -1)).filter((i) => i >= 0);
  const keepOpen = new Set(criticalIdx.slice(0, 6));

  const complaints = raw.map((r, i) => {
    const id = idOf(i);
    const ageDaysExact = (now - r.createdAt) / DAY;
    const pResolved = Math.min(0.93, 0.05 + ageDaysExact * 0.014);

    let status = 'Pending';
    const roll = rnd();
    if (roll < pResolved) status = 'Resolved';
    else if (ageDaysExact > 1) status = rnd() < 0.45 ? 'In Progress' : rnd() < 0.5 ? 'Assigned' : 'Pending';
    if (keepOpen.has(i)) status = [...keepOpen].indexOf(i) === 2 ? 'In Progress' : 'Pending';

    // Pretend model output
    const aiWrong = rnd() < 0.08;
    const aiCategory = aiWrong ? pick(CATEGORIES_EXCEPT(r.category)) : r.category;
    const aiSub = aiWrong ? pick(CATEGORIES[aiCategory].subcategories) : r.sub;
    const sevShift = rnd() < 0.12 ? (rnd() < 0.5 ? -1 : 1) : 0;
    const aiSev = SEVERITIES[Math.max(0, Math.min(3, SEVERITIES.indexOf(r.sev) + sevShift))];
    const cCat = aiWrong ? 0.45 + rnd() * 0.25 : 0.7 + rnd() * 0.29;
    const cSub = Math.max(0.4, cCat - rnd() * 0.12);
    const cSev = aiWrong ? 0.5 + rnd() * 0.2 : 0.56 + rnd() * 0.4;
    const confidence = { category: round2(cCat), subcategory: round2(cSub), severity: round2(cSev) };
    const minConf = Math.min(cCat, cSub, cSev);
    const THRESH = 0.75;
    const needsHumanReview = minConf < THRESH || aiSev === 'Critical';
    const reviewReason = aiSev === 'Critical'
      ? 'Predicted Critical - always reviewed by a human'
      : cSev < THRESH && cSev === minConf ? 'Severity confidence below threshold'
      : cCat < THRESH && cCat === minConf ? 'Category confidence below threshold'
      : minConf < THRESH ? 'Subcategory confidence below threshold' : null;

    const [titleT, descT] = r.tpl;
    const title = fill(titleT, r.street, r.area.name);
    const description = fill(descT, r.street, r.area.name);
    const handled = status !== 'Pending';

    const reviewState = !handled ? 'Pending Review' : aiWrong ? 'Corrected' : 'Confirmed';
    const confirmed = handled
      ? { category: r.category, subcategory: r.sub, severity: r.sev }
      : null;

    const dept = departmentFor(handled ? r.category : aiCategory);
    const history = [{ status: 'Pending', at: new Date(r.createdAt).toISOString(), by: 'System', note: 'Complaint received and analysed by AI (prototype)' }];
    let t = r.createdAt;
    if (status !== 'Pending') { t += (2 + Math.floor(rnd() * 14)) * HOUR; history.push({ status: 'Assigned', at: new Date(t).toISOString(), by: 'Priya Sharma', note: `Assigned to ${dept}` }); }
    if (status === 'In Progress' || status === 'Resolved') { t += (6 + Math.floor(rnd() * 40)) * HOUR; history.push({ status: 'In Progress', at: new Date(t).toISOString(), by: dept, note: 'Field team dispatched' }); }
    let resolvedAt = null;
    if (status === 'Resolved') {
      t += (24 + Math.floor(rnd() * 24 * 8)) * HOUR;
      t = Math.min(t, now - HOUR);
      resolvedAt = new Date(t).toISOString();
      history.push({ status: 'Resolved', at: resolvedAt, by: dept, note: 'Work completed and verified' });
    }

    const members = r.gid ? groups[r.gid].filter((x) => x !== id) : [];
    const submitterIdx = Math.floor(rnd() * NAMES.length);
    const mine = i % 17 === 3 || i % 29 === 5;

    return {
      id,
      citizenInput: {
        submittedBy: mine ? 'usr_default1' : `usr_demo_${submitterIdx}`,
        submitterName: mine ? 'Ravi Kumar' : NAMES[submitterIdx],
        title, description,
        location: { lat: round5(r.lat), lng: round5(r.lng), address: `${r.street}, ${r.area.name}`, area: r.area.name, zone: r.area.zone },
        photoUrl: null,
        citizenCategory: rnd() < 0.7 ? r.category : null,
        citizenSeverity: null,
        createdAt: new Date(r.createdAt).toISOString(),
      },
      aiPredictions: {
        category: aiCategory, subcategory: aiSub, severity: aiSev,
        confidence, confidenceScore: Math.round(minConf * 100),
        needsHumanReview, reviewReason,
        duplicateGroupId: r.gid, duplicateCandidates: members,
        cues: SUB_CUES[aiSub] || [],
        summary: `${aiSub} reported at ${r.street}, ${r.area.name}.${members.length ? ` ${members.length + 1} similar reports nearby.` : ''}`,
        modelVersion: 'prototype-mock-v0',
      },
      adminState: {
        status, reviewState, confirmed,
        suggestedDepartment: departmentFor(aiCategory),
        assignedDepartment: handled ? dept : null,
        notes: [], history, resolvedAt,
      },
    };
  });

  // A few vague submissions the model should refuse to classify
  const vague = [
    ['Help, problem here', 'Please come fast.', 'Central', 'MG Road'],
    ['Issue near my house', 'Not working properly since yesterday.', 'North', 'Hebbal'],
    ['Complaint', 'Very bad situation, someone must look into it.', 'South', 'Jayanagar'],
  ];
  vague.forEach(([title, description, zone, areaName], k) => {
    const area = AREAS.find((a) => a.name === areaName);
    const created = now - (k * 2 + 1) * DAY - 5 * HOUR;
    complaints.unshift({
      id: `CS-2026-${1000 + total + vague.length - k}`,
      citizenInput: {
        submittedBy: `usr_demo_${k}`, submitterName: NAMES[k + 3], title, description,
        location: { lat: area.lat, lng: area.lng, address: areaName, area: areaName, zone },
        photoUrl: null, citizenCategory: null, citizenSeverity: null, createdAt: new Date(created).toISOString(),
      },
      aiPredictions: {
        category: 'Other', subcategory: 'Unclassified', severity: 'Low',
        confidence: { category: 0.31, subcategory: 0.28, severity: 0.33 }, confidenceScore: 28,
        needsHumanReview: true, reviewReason: 'Unable to classify confidently - text too short or unclear',
        duplicateGroupId: null, duplicateCandidates: [], cues: [],
        summary: 'Text too short to classify. Ask the citizen for more details.',
        modelVersion: 'prototype-mock-v0',
      },
      adminState: {
        status: 'Pending', reviewState: 'Unable to Classify', confirmed: null,
        suggestedDepartment: 'Central Dispatch', assignedDepartment: null, notes: [],
        history: [{ status: 'Pending', at: new Date(created).toISOString(), by: 'System', note: 'Complaint received - AI could not classify confidently' }],
        resolvedAt: null,
      },
    });
  });

  return complaints.sort((a, b) => new Date(b.citizenInput.createdAt) - new Date(a.citizenInput.createdAt));
}

function CATEGORIES_EXCEPT(cat) {
  return Object.keys(CATEGORIES).filter((c) => c !== cat && c !== 'Other');
}
const round2 = (n) => Math.round(n * 100) / 100;
const round5 = (n) => Math.round(n * 1e5) / 1e5;

// Controlled lists from the project report (sections 4.3, 4.4, 6.2).
// Keep these in sync with the backend/model once it exists.

export const CATEGORIES = {
  'Road Maintenance': {
    subcategories: ['Pothole', 'Road damage', 'Broken footpath', 'Road obstruction'],
    department: 'Roads & Public Works',
    color: '#f59e0b',
  },
  'Waste Management': {
    subcategories: ['Garbage pile', 'Missed collection', 'Overflowing bin', 'Illegal dumping'],
    department: 'Sanitation & Solid Waste',
    color: '#16a34a',
  },
  'Water Supply': {
    subcategories: ['Water leakage', 'Pipeline damage', 'Water shortage', 'Contaminated supply'],
    department: 'Water Supply',
    color: '#0ea5e9',
  },
  Drainage: {
    subcategories: ['Blocked drain', 'Waterlogging', 'Damaged drain', 'Sewage overflow'],
    department: 'Drainage & Sewerage',
    color: '#6366f1',
  },
  Electricity: {
    subcategories: ['Streetlight failure', 'Damaged public lighting', 'Exposed electrical wire'],
    department: 'Electrical & Public Lighting',
    color: '#eab308',
  },
  'Public Infrastructure': {
    subcategories: ['Damaged bench', 'Broken public facility', 'Damaged public property'],
    department: 'Municipal Maintenance',
    color: '#a855f7',
  },
  Other: {
    subcategories: ['Unclassified'],
    department: 'Central Dispatch',
    color: '#64748b',
  },
};

export const CATEGORY_NAMES = Object.keys(CATEGORIES);

export const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
export const SEVERITY_SCORE = { Low: 20, Medium: 45, High: 75, Critical: 100 };

export const STATUSES = ['Pending', 'Assigned', 'In Progress', 'Resolved'];
export const REVIEW_STATES = ['Pending Review', 'Confirmed', 'Corrected', 'Unable to Classify'];

export const DEPARTMENTS = [
  { name: 'Roads & Public Works', head: 'Anil Deshpande', phone: '080-2222-1101', color: '#f59e0b' },
  { name: 'Sanitation & Solid Waste', head: 'Meera Nair', phone: '080-2222-1102', color: '#16a34a' },
  { name: 'Water Supply', head: 'Rohit Bhat', phone: '080-2222-1103', color: '#0ea5e9' },
  { name: 'Drainage & Sewerage', head: 'Sunita Rao', phone: '080-2222-1104', color: '#6366f1' },
  { name: 'Electrical & Public Lighting', head: 'Imran Sheikh', phone: '080-2222-1105', color: '#eab308' },
  { name: 'Municipal Maintenance', head: 'Kavita Menon', phone: '080-2222-1106', color: '#a855f7' },
  { name: 'Central Dispatch', head: 'Priya Sharma', phone: '080-2222-1100', color: '#64748b' },
];

export const departmentFor = (category) => CATEGORIES[category]?.department || 'Central Dispatch';

// Style helpers shared by badges, map pins and charts
export const SEVERITY_STYLE = {
  Critical: { pill: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300', hex: '#dc2626' },
  High: { pill: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300', hex: '#f97316' },
  Medium: { pill: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300', hex: '#0ea5e9' },
  Low: { pill: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', hex: '#10b981' },
};

export const STATUS_STYLE = {
  Pending: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  Assigned: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  Resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
};

export const AREAS = [
  { name: 'MG Road', zone: 'Central', lat: 12.9756, lng: 77.6068 },
  { name: 'Shivajinagar', zone: 'Central', lat: 12.9857, lng: 77.6057 },
  { name: 'Indiranagar', zone: 'East', lat: 12.9784, lng: 77.6408 },
  { name: 'Whitefield', zone: 'East', lat: 12.9698, lng: 77.75 },
  { name: 'Koramangala', zone: 'South', lat: 12.9352, lng: 77.6245 },
  { name: 'HSR Layout', zone: 'South', lat: 12.9116, lng: 77.6474 },
  { name: 'Jayanagar', zone: 'South', lat: 12.9308, lng: 77.5838 },
  { name: 'Malleshwaram', zone: 'North', lat: 13.0035, lng: 77.571 },
  { name: 'Hebbal', zone: 'North', lat: 13.0358, lng: 77.597 },
  { name: 'Rajajinagar', zone: 'West', lat: 12.9916, lng: 77.552 },
];

export const CITY_CENTER = [12.9716, 77.5946];

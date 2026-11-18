// Prototype-only auth (localStorage, plain-text passwords). Replace with Supabase Auth.
const USERS = 'users';
const ACTIVE = 'activeUser';

export const initializeStorage = () => {
  if (!localStorage.getItem(USERS)) {
    const defaultUsers = [
      { id: 'usr_default1', name: 'Ravi Kumar', email: 'citizen@civic.com', password: 'password', role: 'citizen', civicScore: 120 },
      { id: 'adm_default1', name: 'Priya Sharma', email: 'admin@civic.com', password: 'password', role: 'admin', department: 'Central Dispatch' },
    ];
    localStorage.setItem(USERS, JSON.stringify(defaultUsers));
  }
};

export const registerUser = (userData) => {
  initializeStorage();
  const users = JSON.parse(localStorage.getItem(USERS));
  if (users.find((u) => u.email === userData.email)) {
    throw new Error('User with this email already exists.');
  }
  const newUser = {
    id: `${userData.role.substring(0, 3)}_${Math.random().toString(36).slice(2, 11)}`,
    ...userData,
    civicScore: userData.role === 'citizen' ? 10 : undefined,
    department: userData.role === 'admin' ? 'Central Dispatch' : undefined,
  };
  users.push(newUser);
  localStorage.setItem(USERS, JSON.stringify(users));
  return newUser;
};

export const loginUser = (email, password) => {
  initializeStorage();
  const users = JSON.parse(localStorage.getItem(USERS));
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) throw new Error('Invalid email or password.');
  localStorage.setItem(ACTIVE, JSON.stringify(user));
  window.dispatchEvent(new Event('cs-auth'));
  return user;
};

export const getActiveUser = () => {
  try {
    const user = localStorage.getItem(ACTIVE);
    return user ? JSON.parse(user) : null;
  } catch { return null; }
};

export const logoutUser = () => {
  localStorage.removeItem(ACTIVE);
  window.dispatchEvent(new Event('cs-auth'));
};

export const addCivicPoints = (points) => {
  const active = getActiveUser();
  if (!active || active.role !== 'citizen') return null;
  const users = JSON.parse(localStorage.getItem(USERS) || '[]');
  const idx = users.findIndex((u) => u.id === active.id);
  const updated = { ...active, civicScore: (active.civicScore || 0) + points };
  if (idx >= 0) { users[idx] = { ...users[idx], civicScore: updated.civicScore }; localStorage.setItem(USERS, JSON.stringify(users)); }
  localStorage.setItem(ACTIVE, JSON.stringify(updated));
  window.dispatchEvent(new Event('cs-auth'));
  return updated;
};

import { useCallback, useEffect, useState } from 'react';
import { listComplaints } from '../services/api';
import { getActiveUser } from './authStorage';

export function useComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setComplaints(await listComplaints());
    setLoading(false);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return { complaints, loading, refresh };
}

export function useActiveUser() {
  const [user, setUser] = useState(getActiveUser());
  useEffect(() => {
    const sync = () => setUser(getActiveUser());
    window.addEventListener('cs-auth', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('cs-auth', sync); window.removeEventListener('storage', sync); };
  }, []);
  return user;
}

export function useTheme() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
    } catch { /* ignore */ }
    return false;
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch { /* ignore */ }
  }, [dark]);
  return [dark, setDark];
}

export const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
export const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
export const timeAgo = (iso) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
};

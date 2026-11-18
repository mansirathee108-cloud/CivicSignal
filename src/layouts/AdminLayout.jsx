import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Home, List, Map as MapIcon, Sparkles, Building2, BarChart3, Settings, Search, Bell, Menu, X,
  ChevronDown, LogOut, Moon, Sun, AlertTriangle, ExternalLink,
} from 'lucide-react';
import Logo from '../components/Logo';
import { SeverityBadge } from '../components/ui';
import { getActiveUser, logoutUser } from '../utils/authStorage';
import { useComplaints, useTheme, timeAgo } from '../utils/hooks';

const NAV = [
  { to: '/admin', label: 'Overview', icon: Home, end: true },
  { to: '/admin/complaints', label: 'Complaints', icon: List },
  { to: '/admin/map', label: 'Live Map', icon: MapIcon },
  { to: '/admin/insights', label: 'AI Insights', icon: Sparkles },
  { to: '/admin/departments', label: 'Departments', icon: Building2 },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useState(getActiveUser());
  const [dark, setDark] = useTheme();
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(null); // 'bell' | 'profile' | null
  const [q, setQ] = useState('');
  const { complaints, refresh } = useComplaints();

  useEffect(() => {
    if (!user || user.role !== 'admin') navigate('/login', { replace: true, state: { from: location.pathname } });
  }, [user, navigate, location.pathname]);

  // Re-read data whenever the admin moves between pages so counts stay fresh
  useEffect(() => { refresh(); setDrawer(false); setMenu(null); }, [location.pathname, refresh]);

  const alerts = useMemo(
    () => complaints
      .filter((c) => c.adminState.status !== 'Resolved' && (c.aiPredictions.needsHumanReview))
      .sort((a, b) => b.derived.priority.score - a.derived.priority.score),
    [complaints]
  );
  const pendingReview = complaints.filter((c) => c.adminState.reviewState === 'Pending Review' || c.adminState.reviewState === 'Unable to Classify').length;

  if (!user || user.role !== 'admin') return null;

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(`/admin/complaints${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
  };

  const sidebar = (
    <div className="h-full flex flex-col bg-navy-900 text-white">
      <div className="h-16 px-5 flex items-center border-b border-white/10"><Link to="/" aria-label="Public site"><Logo dark size="sm" /></Link></div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Admin">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-brand-600 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}>
            <Icon className="h-[18px] w-[18px]" />
            <span className="flex-1">{label}</span>
            {label === 'Complaints' && pendingReview > 0 && (
              <span className="text-[11px] font-bold bg-white/20 rounded-full px-2 py-0.5">{pendingReview}</span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10 text-xs">
        <p className="flex items-center gap-2 font-semibold text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400" /> System Online</p>
        <p className="text-white/55 mt-1">Last updated:<br />{new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-page overflow-hidden">
      <aside className="hidden lg:block w-60 shrink-0">{sidebar}</aside>

      {drawer && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64">{sidebar}</div>
          <button className="flex-1 bg-black/50" aria-label="Close menu" onClick={() => setDrawer(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 bg-surface border-b border-line px-4 sm:px-6 flex items-center gap-3 relative z-30">
          <button className="lg:hidden p-2 -ml-2 text-ink" onClick={() => setDrawer(!drawer)} aria-label="Open menu">
            {drawer ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <form onSubmit={submitSearch} className="flex-1 max-w-xl relative">
            <Search className="h-4 w-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search complaints..." aria-label="Search complaints" className="input !rounded-full !pl-10 !py-2 bg-soft" />
          </form>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <div className="relative">
              <button className="relative p-2 rounded-full text-muted hover:bg-soft" onClick={() => setMenu(menu === 'bell' ? null : 'bell')} aria-label={`Alerts (${alerts.length})`}>
                <Bell className="h-5 w-5" />
                {alerts.length > 0 && <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{Math.min(alerts.length, 99)}</span>}
              </button>
              {menu === 'bell' && (
                <div className="absolute right-0 mt-2 w-80 card shadow-lift p-2 z-50">
                  <p className="px-3 py-2 text-xs font-bold text-muted uppercase tracking-wide">Needs human review</p>
                  {alerts.slice(0, 5).map((c) => (
                    <Link key={c.id} to={`/admin/complaints/${c.id}`} className="flex items-start gap-3 rounded-xl px-3 py-2 hover:bg-soft">
                      <AlertTriangle className="h-4 w-4 mt-0.5 text-orange-500 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink truncate">{c.citizenInput.title}</span>
                        <span className="block text-xs text-muted">{c.id} · {timeAgo(c.citizenInput.createdAt)}</span>
                      </span>
                      <SeverityBadge severity={c.adminState.confirmed?.severity || c.aiPredictions.severity} />
                    </Link>
                  ))}
                  {alerts.length === 0 && <p className="px-3 py-4 text-sm text-muted">Nothing needs review right now.</p>}
                  <Link to="/admin/complaints?review=1" className="block text-center text-sm font-semibold text-brand-600 py-2">View review queue</Link>
                </div>
              )}
            </div>

            <div className="relative">
              <button className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-soft" onClick={() => setMenu(menu === 'profile' ? null : 'profile')} aria-label="Account menu">
                <span className="h-8 w-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">{user.name.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase()}</span>
                <span className="hidden sm:block text-sm font-semibold text-ink">{user.name.split(' ')[0]}</span>
                <ChevronDown className="h-4 w-4 text-muted" />
              </button>
              {menu === 'profile' && (
                <div className="absolute right-0 mt-2 w-56 card shadow-lift p-2 z-50">
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold text-ink">{user.name}</p>
                    <p className="text-xs text-muted">{user.department || 'Administrator'}</p>
                  </div>
                  <Link to="/" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink hover:bg-soft"><ExternalLink className="h-4 w-4" /> View public site</Link>
                  <button onClick={() => setDark(!dark)} className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink hover:bg-soft">
                    {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} {dark ? 'Light mode' : 'Dark mode'}
                  </button>
                  <button onClick={() => { logoutUser(); navigate('/login'); }} className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"><LogOut className="h-4 w-4" /> Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8" onClick={() => menu && setMenu(null)}>
          <Outlet context={{ refreshAll: refresh }} />
        </main>
      </div>
    </div>
  );
}

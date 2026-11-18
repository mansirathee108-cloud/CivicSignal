import React, { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { Menu, X, Moon, Sun, LogOut, LayoutDashboard } from 'lucide-react';
import Logo from '../components/Logo';
import { useActiveUser, useTheme } from '../utils/hooks';
import { logoutUser } from '../utils/authStorage';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/report', label: 'Report an Issue' },
  { to: '/track', label: 'Track Complaint' },
  { to: '/about', label: 'About' },
];

export default function PublicLayout() {
  const user = useActiveUser();
  const [dark, setDark] = useTheme();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const linkCls = ({ isActive }) =>
    `relative py-2 text-sm font-medium transition-colors ${isActive ? 'text-white after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-0.5 after:bg-brand-400' : 'text-white/75 hover:text-white'}`;

  return (
    <div className="min-h-screen flex flex-col bg-page">
      <header className="bg-navy-900 sticky top-0 z-40 shadow-lg shadow-navy-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" aria-label="CivicSignal home"><Logo dark /></Link>

          <nav className="hidden md:flex items-center gap-8" aria-label="Main">
            {LINKS.map((l) => <NavLink key={l.to} to={l.to} end={l.end} className={linkCls}>{l.label}</NavLink>)}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={() => setDark(!dark)} aria-label="Toggle dark mode" className="p-2 rounded-full text-white/80 hover:bg-white/10">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                {user.role === 'admin' && (
                  <Link to="/admin" className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                )}
                <span className="text-sm text-white/85 px-2">{user.name}</span>
                <button onClick={() => { logoutUser(); navigate('/'); }} className="p-2 rounded-full text-white/80 hover:bg-white/10" aria-label="Log out">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="hidden sm:inline-flex rounded-full border border-brand-400 text-brand-200 hover:bg-brand-500/20 text-sm font-semibold px-5 py-1.5">
                Login
              </Link>
            )}
            <button className="md:hidden p-2 text-white" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden border-t border-white/10 px-4 pb-4 pt-2 space-y-1">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)}
                className={({ isActive }) => `block rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-white/10 text-white' : 'text-white/80'}`}>
                {l.label}
              </NavLink>
            ))}
            {user ? (
              <>
                {user.role === 'admin' && <Link to="/admin" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-brand-200">Admin dashboard</Link>}
                <button onClick={() => { logoutUser(); setOpen(false); navigate('/'); }} className="block w-full text-left rounded-lg px-3 py-2.5 text-sm font-medium text-white/80">Log out ({user.name})</button>
              </>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-brand-200">Login</Link>
            )}
          </div>
        )}
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="bg-navy-900 text-white/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row justify-between gap-4 text-sm">
          <div>
            <Logo dark size="sm" />
            <p className="mt-2 max-w-sm">Smarter Complaints. A Better City.</p>
          </div>
          <div className="flex gap-6">
            <Link to="/report" className="hover:text-white">Report an Issue</Link>
            <Link to="/track" className="hover:text-white">Track Complaint</Link>
            <Link to="/about" className="hover:text-white">About</Link>
          </div>
          <p className="text-xs md:text-right max-w-xs">Hackathon prototype. AI outputs shown on this site are simulated and do not come from a trained model.</p>
        </div>
      </footer>
    </div>
  );
}

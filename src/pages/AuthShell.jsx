import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { useTheme } from '../utils/hooks';

export default function AuthShell({ title, subtitle, children, footer }) {
  useTheme(); // applies saved light/dark preference
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-page">
      <div className="hidden lg:flex flex-col justify-between bg-navy-900 text-white p-12 relative overflow-hidden">
        <Link to="/"><Logo dark size="lg" /></Link>
        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold leading-tight">Smarter complaints.<br /><span className="text-brand-400">A better city.</span></h2>
          <p className="mt-4 text-white/70 max-w-sm">Report problems, follow progress and help your municipality respond faster.</p>
        </div>
        <p className="text-xs text-white/50 relative z-10">Hackathon prototype - sample data and simulated AI.</p>
        <div className="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-brand-600/20" />
        <div className="absolute -right-4 -bottom-4 h-56 w-56 rounded-full bg-blue-500/20" />
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden inline-block mb-8"><Logo /></Link>
          <h1 className="text-3xl font-extrabold text-ink">{title}</h1>
          <p className="text-muted mt-1.5 mb-7">{subtitle}</p>
          {children}
          <div className="mt-6 text-sm text-muted text-center">{footer}</div>
        </div>
      </div>
    </div>
  );
}

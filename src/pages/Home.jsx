import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Megaphone, MapPin, TrendingUp, ArrowRight, ShieldCheck, Handshake, BarChart3, Sparkles, FileText, Search, CheckCircle2,
} from 'lucide-react';
import CityIllustration from '../components/CityIllustration';
import { IconChip } from '../components/ui';
import { useComplaints } from '../utils/hooks';

const CARDS = [
  { icon: Megaphone, tone: 'blue', title: 'Report', text: 'Easily report issues like potholes, garbage, or broken streetlights.', to: '/report' },
  { icon: MapPin, tone: 'blue', title: 'Track', text: 'Get real-time updates on your complaint.', to: '/track' },
  { icon: TrendingUp, tone: 'blue', title: 'Improve', text: 'Help us build a smarter, more responsive city.', to: '/about' },
];

const FEATURES = [
  { icon: ShieldCheck, title: 'Smart Prioritization with AI' },
  { icon: MapPin, title: 'Location-Based Insights' },
  { icon: BarChart3, title: 'Data-Driven City Planning' },
  { icon: Handshake, title: 'A More Responsive Municipality' },
];

const STEPS = [
  { icon: FileText, title: '1. Describe the issue', text: 'Write a few lines, pin the location and add a photo if you have one.' },
  { icon: Sparkles, title: '2. AI suggests the details', text: 'We suggest a category, severity and department. Municipal staff always have the final say.' },
  { icon: Search, title: '3. Follow progress', text: 'Use your complaint ID to see when it is assigned, in progress and resolved.' },
];

export default function Home() {
  const { complaints } = useComplaints();
  const stats = useMemo(() => {
    const total = complaints.length;
    const resolved = complaints.filter((c) => c.adminState.status === 'Resolved');
    const days = resolved.map((c) => (new Date(c.adminState.resolvedAt) - new Date(c.citizenInput.createdAt)) / 86400000).filter((d) => d >= 0);
    const avg = days.length ? days.reduce((a, b) => a + b, 0) / days.length : 0;
    return { total, resolved: resolved.length, avg: avg.toFixed(1), areas: new Set(complaints.map((c) => c.citizenInput.location.area)).size };
  }, [complaints]);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-100 via-sky-50 to-page dark:from-navy-800 dark:via-navy-900 dark:to-page">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-28 lg:pt-20 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.1] tracking-tight text-navy-900 dark:text-white">
              Make your city <span className="text-brand-500">better,</span><br />one report at a time.
            </h1>
            <p className="mt-5 text-lg text-slate-600 dark:text-slate-300 max-w-md">
              Report issues, track progress, and help build a cleaner, safer and more connected city.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/report" className="btn-primary !px-6 !py-3"><Megaphone className="h-4 w-4" /> Report an Issue <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/track" className="btn-outline !px-6 !py-3"><MapPin className="h-4 w-4" /> Track a Complaint</Link>
            </div>
          </div>
          <CityIllustration className="w-full max-w-xl mx-auto lg:ml-auto drop-shadow-xl" />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-20 relative z-10">
        <div className="grid md:grid-cols-3 gap-5">
          {CARDS.map(({ icon, tone, title, text, to }) => (
            <Link key={title} to={to} className="card p-6 flex gap-4 hover:shadow-lift transition-shadow group">
              <IconChip icon={icon} tone={tone} className="h-14 w-14" />
              <div className="flex-1">
                <h2 className="text-lg font-bold text-ink">{title}</h2>
                <p className="text-sm text-muted mt-1">{text}</p>
              </div>
              <span className="self-end h-8 w-8 rounded-full bg-brand-50 dark:bg-brand-500/15 text-brand-600 flex items-center justify-center group-hover:translate-x-0.5 transition-transform"><ArrowRight className="h-4 w-4" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-14">
        <div className="card grid grid-cols-2 md:grid-cols-4 divide-x divide-line">
          {[
            ['Complaints received', stats.total],
            ['Resolved', stats.resolved],
            ['Avg. days to resolve', stats.avg],
            ['Neighbourhoods covered', stats.areas],
          ].map(([label, val]) => (
            <div key={label} className="p-5 text-center">
              <p className="text-3xl font-extrabold text-navy-900 dark:text-white">{val}</p>
              <p className="text-xs text-muted mt-1">{label}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted text-center mt-2">Sample data for the prototype.</p>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-16">
        <h2 className="text-2xl font-extrabold text-ink text-center">How CivicSignal works</h2>
        <div className="grid md:grid-cols-3 gap-5 mt-8">
          {STEPS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-6">
              <IconChip icon={Icon} tone="teal" />
              <h3 className="font-bold text-ink mt-4">{title}</h3>
              <p className="text-sm text-muted mt-1.5">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-16 mb-16">
        <div className="card p-6 sm:p-8 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:divide-x divide-line">
          {FEATURES.map(({ icon: Icon, title }) => (
            <div key={title} className="flex items-center gap-4 lg:px-4">
              <Icon className="h-10 w-10 text-navy-700 dark:text-brand-200 shrink-0" strokeWidth={1.5} />
              <p className="font-bold text-navy-900 dark:text-white leading-snug">{title}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-xl2 bg-navy-900 text-white p-8 flex flex-col md:flex-row items-center justify-between gap-5">
          <div>
            <h2 className="text-2xl font-extrabold flex items-center gap-2"><CheckCircle2 className="h-6 w-6 text-brand-400" /> Ready to report something?</h2>
            <p className="text-white/70 mt-1 text-sm">It takes about two minutes. No account needed to file a complaint.</p>
          </div>
          <Link to="/report" className="btn-primary !px-6 !py-3 shrink-0">Report an Issue <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </>
  );
}

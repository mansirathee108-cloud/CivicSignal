import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, UserCheck, Gauge, Lock, Map, Layers } from 'lucide-react';
import { IconChip } from '../components/ui';

const PRINCIPLES = [
  { icon: UserCheck, title: 'Humans decide', text: 'AI only recommends a category, urgency and department. Municipal staff confirm or change every classification. Nothing is closed, rejected or deprioritised automatically.' },
  { icon: Gauge, title: 'Confidence is shown', text: 'Every prediction comes with confidence scores. Low-confidence cases go to a review queue, and unclear text is marked "unable to classify" instead of guessed.' },
  { icon: ShieldCheck, title: 'Critical cases are always reviewed', text: 'Anything predicted as Critical is highlighted for urgent human review, even when the model is confident. CivicSignal is not an emergency service.' },
  { icon: Lock, title: 'Privacy by design', text: 'We collect only what is needed, keep your original words untouched, restrict admin access by role and protect uploaded photos.' },
  { icon: Layers, title: 'Transparent priority', text: 'The priority score combines severity, supporting reports, time unresolved and recurrence. Officials can see exactly why a complaint ranks where it does.' },
  { icon: Map, title: 'Location aware', text: 'Reports are grouped by place, so repeated and nearby complaints about the same problem are seen together, not as scattered tickets.' },
];

const FAQ = [
  ['Do I need an account to report an issue?', 'No. You can report and track without logging in. An account lets you see all your complaints in one place and earn Civic Score.'],
  ['Who sees my complaint?', 'Municipal administrators and the assigned department. Public pages show only the status and updates for a complaint ID.'],
  ['What if the AI picks the wrong category?', 'Staff review it. If you chose a category yourself, we keep your choice and show the AI suggestion alongside it.'],
  ['Is this a real municipal service?', 'No. This is a hackathon prototype. Data and AI outputs are simulated for demonstration.'],
];

export default function About() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-extrabold text-ink">About CivicSignal</h1>
      <p className="text-muted mt-3 max-w-2xl text-lg">
        CivicSignal turns scattered citizen complaints into clear, location-based information so city teams can act faster and citizens can see what happens next.
      </p>

      <h2 className="text-xl font-extrabold text-ink mt-12">How we use AI responsibly</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
        {PRINCIPLES.map(({ icon, title, text }) => (
          <div key={title} className="card p-6">
            <IconChip icon={icon} tone="teal" />
            <h3 className="font-bold text-ink mt-4">{title}</h3>
            <p className="text-sm text-muted mt-1.5">{text}</p>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-extrabold text-ink mt-12">Frequently asked questions</h2>
      <div className="mt-5 space-y-3">
        {FAQ.map(([q, a]) => (
          <details key={q} className="card px-5 py-4 group">
            <summary className="font-semibold text-ink cursor-pointer list-none flex justify-between gap-4">{q}<span className="text-brand-600 group-open:rotate-45 transition-transform text-xl leading-none">+</span></summary>
            <p className="text-sm text-muted mt-3">{a}</p>
          </details>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link to="/report" className="btn-primary !px-8 !py-3">Report an Issue</Link>
      </div>
    </div>
  );
}

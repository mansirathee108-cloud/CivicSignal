import React from 'react';

export function LogoMark({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden="true">
      <path d="M4 36V22h6v14M13 36V8h9v28M25 36V16h6v20" stroke="#2fb9b0" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M16.5 14h2.5M16.5 19h2.5M16.5 24h2.5M16.5 29h2.5" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
      <path d="M2 36h36" stroke="#3b82f6" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ dark = false, size = 'md' }) {
  const text = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-base' : 'text-xl';
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark className={size === 'lg' ? 'h-10 w-10' : 'h-8 w-8'} />
      <span className={`font-extrabold tracking-tight ${text} ${dark ? 'text-white' : 'text-navy-900 dark:text-white'}`}>
        Civic<span className="text-brand-400">Signal</span>
      </span>
    </span>
  );
}

// Shared Recharts styling that works in light and dark mode (uses the CSS variables).
export const axisTick = { fill: 'rgb(100 116 139)', fontSize: 12 };
export const gridStroke = 'rgba(148,163,184,0.25)';
export const tooltipStyle = {
  contentStyle: {
    background: 'rgb(var(--surface))',
    border: '1px solid rgb(var(--line))',
    borderRadius: 12,
    color: 'rgb(var(--ink))',
    fontSize: 12,
    boxShadow: '0 8px 30px rgba(11,31,58,.14)',
  },
  labelStyle: { color: 'rgb(var(--ink))', fontWeight: 700 },
  itemStyle: { color: 'rgb(var(--ink))' },
};
export const COLORS = { received: '#2563eb', resolved: '#10b981', teal: '#0f9e98', navy: '#0b1f3a' };

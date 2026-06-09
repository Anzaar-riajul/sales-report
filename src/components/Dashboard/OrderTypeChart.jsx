import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartSkeleton } from '../UI/Loader';
import { formatNumber } from '../../utils/formatters';

const COLORS = ['#C9A84C', '#0D9488'];
const GRADIENTS = [
  { start: '#C9A84C', end: '#E8C96A' },
  { start: '#0D9488', end: '#2DD4BF' },
];

function OrderTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
  return (
    <div className="bg-white/95 backdrop-blur-xl border border-border/40 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-[10px] text-text-muted">{d.name}</p>
      <p className="text-sm font-bold text-text-primary">{formatNumber(d.value)} <span className="text-[10px] font-normal text-text-muted">({pct}%)</span></p>
    </div>
  );
}

export default function OrderTypeChart({ report, loading }) {
  if (loading) return <ChartSkeleton />;

  if (!report) {
    return (
      <div className="bg-white/80 backdrop-blur-xl border border-border/40 rounded-2xl p-4 shadow-sm">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Order Split</h3>
        <div className="h-56 flex items-center justify-center text-text-muted text-sm">No data</div>
      </div>
    );
  }

  const data = [
    { name: 'Regular', value: report.regularOrder || 0 },
    { name: 'Customize', value: report.customizeOrder || 0 },
  ].filter(d => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl border border-border/40 rounded-2xl p-4 shadow-sm">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Order Split</h3>
        <div className="h-56 flex items-center justify-center text-text-muted text-sm">No data</div>
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-border/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
      <div className="absolute -top-8 -right-8 w-20 h-20 bg-gradient-to-br from-accent-gold/8 to-transparent rounded-full" />
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 relative">Order Split</h3>
      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <defs>
              {GRADIENTS.map((g, i) => (
                <linearGradient key={i} id={`pie-grad-${i}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={g.start} />
                  <stop offset="100%" stopColor={g.end} />
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={`url(#pie-grad-${index})`} />
              ))}
            </Pie>
            <Tooltip content={<OrderTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-lg font-bold text-text-primary">{formatNumber(total)}</p>
            <p className="text-[9px] text-text-muted">total</p>
          </div>
        </div>
      </div>
      {/* Legend */}
      <div className="flex justify-center gap-4 mt-1 relative">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: GRADIENTS[i]?.start }} />
            <span className="text-[10px] text-text-muted">{d.name}</span>
            <span className="text-[10px] font-mono font-semibold" style={{ color: GRADIENTS[i]?.start }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

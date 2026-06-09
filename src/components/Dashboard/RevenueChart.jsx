import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '../UI/Card';
import { formatDateShort, formatBDT } from '../../utils/formatters';
import { ChartSkeleton } from '../UI/Loader';

const COLORS = { revenue: '#C9A84C', advance: '#6366F1' };

function RevTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/85 backdrop-blur-xl border border-border/50 rounded-2xl p-3.5 shadow-xl min-w-[140px]">
      <p className="text-[10px] text-text-muted font-medium mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-bold tracking-tight" style={{ color: p.color }}>{formatBDT(p.value)}</p>
      ))}
    </div>
  );
}

export default function RevenueChart({ reports, loading }) {
  const [range, setRange] = useState(30);

  const data = useMemo(() => {
    if (!reports || reports.length === 0) return [];
    const sorted = [...reports]
      .filter(r => r.totalOrderValue > 0)
      .sort((a, b) => a.dateString.localeCompare(b.dateString));
    return sorted.slice(-range).map(r => ({
      date: formatDateShort(r.dateString),
      Revenue: r.totalOrderValue,
      Advance: r.totalAdvance,
    }));
  }, [reports, range]);

  if (loading) return <ChartSkeleton />;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-text-primary tracking-tight">Revenue Trend</h3>
        <div className="flex gap-1 bg-bg-elevated/60 p-0.5 rounded-lg border border-border/30">
          {[7, 30, 60, 90].map(d => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                range === d ? 'bg-white text-accent-gold shadow-sm border border-accent-gold/15' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>
      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-text-muted text-sm">No revenue data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gradRevLine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.revenue} stopOpacity={0.3} />
                <stop offset="100%" stopColor={COLORS.revenue} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradAdvLine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.advance} stopOpacity={0.3} />
                <stop offset="100%" stopColor={COLORS.advance} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.3} vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} axisLine={false} tickLine={false} width={40} />
            <Tooltip content={<RevTooltip />} cursor={{ stroke: '#E2E8F0', strokeDasharray: '3 3' }} />
            <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: '#475569', fontSize: '11px', fontWeight: 500 }}>{v}</span>} />
            <Area type="monotone" dataKey="Revenue" stroke={COLORS.revenue} strokeWidth={2.5} fill="url(#gradRevLine)" dot={false} activeDot={false} />
            <Area type="monotone" dataKey="Advance" stroke={COLORS.advance} strokeWidth={2.5} fill="url(#gradAdvLine)" dot={false} activeDot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

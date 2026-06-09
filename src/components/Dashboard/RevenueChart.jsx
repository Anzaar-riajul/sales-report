import { useState, useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '../UI/Card';
import { formatDateShort, formatBDT } from '../../utils/formatters';
import { ChartSkeleton } from '../UI/Loader';

function RevTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border/60 rounded-xl p-3 shadow-lg min-w-[130px]">
      <p className="text-[10px] text-text-muted mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-semibold" style={{ color: p.color }}>{formatBDT(p.value)}</p>
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
        <h3 className="section-title">Revenue Trend</h3>
        <div className="flex gap-1">
          {[7, 30, 60, 90].map(d => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                range === d ? 'bg-accent-gold/10 text-accent-gold border border-accent-gold/20' : 'text-text-muted hover:text-text-primary'
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
                <stop offset="0%" stopColor="#C9A84C" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#C9A84C" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="gradAdvLine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0D9488" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#0D9488" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.5} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} axisLine={false} tickLine={false} width={40} />
            <Tooltip content={<RevTooltip />} />
            <Legend formatter={(v) => <span style={{ color: '#0F172A', fontSize: '11px' }}>{v}</span>} />
            <Area type="monotone" dataKey="Revenue" stroke="#C9A84C" strokeWidth={2.5} fill="url(#gradRevLine)" dot={false} activeDot={false} />
            <Area type="monotone" dataKey="Advance" stroke="#0D9488" strokeWidth={2.5} fill="url(#gradAdvLine)" dot={false} activeDot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

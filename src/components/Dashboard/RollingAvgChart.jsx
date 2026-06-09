import { useState, useMemo } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ChartWidget from './ChartWidget';
import { computeRollingAverage, computeProductsPerOrderTrend } from '../../utils/analytics';
import { formatDateShort } from '../../utils/formatters';

function RollingTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-xl border border-border/40 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-[10px] text-text-muted mb-0.5">{label}</p>
      <p className="text-xs font-bold text-text-primary">{payload[0]?.value?.toFixed(1)}</p>
    </div>
  );
}

function RollingLineChart({ data, color = '#C9A84C', gradientId = 'rollGrad' }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.5} />
        <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94A3B8' }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={30} />
        <Tooltip content={<RollingTooltip />} />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#${gradientId})`} dot={false} activeDot={{ r: 4, fill: color, stroke: '#fff', strokeWidth: 2 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ProductsPerOrderChart({ reports }) {
  const data = useMemo(() => {
    const trend = computeProductsPerOrderTrend(reports || []);
    return trend.slice(-30).map(r => ({
      date: formatDateShort(r.date),
      value: r.ratio,
    }));
  }, [reports]);

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-border/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
      <div className="absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-br from-accent-teal/8 to-transparent rounded-full" />
      <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium mb-2 relative">Products Per Order</p>
      <p className="text-[9px] text-text-muted/60 mb-3 relative">Average products per order over time</p>
      <RollingLineChart data={data} color="#0D9488" gradientId="ppoGrad" />
    </div>
  );
}

function RollingAverageChart({ reports }) {
  const [days, setDays] = useState(7);
  const data = useMemo(() => {
    const avg = computeRollingAverage(reports || [], days);
    return avg.slice(-30).map(r => ({
      date: formatDateShort(r.date),
      value: r.avgOrder,
    }));
  }, [reports, days]);

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-border/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
      <div className="absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-br from-accent-gold/8 to-transparent rounded-full" />
      <div className="flex items-center justify-between mb-2 relative">
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium">Rolling Average</p>
          <p className="text-[9px] text-text-muted/60 mt-0.5">{days}-day moving average of orders</p>
        </div>
        <div className="flex gap-1">
          {[7, 14, 30].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-2 py-0.5 text-[10px] rounded-md transition-all ${
                days === d ? 'bg-accent-gold/10 text-accent-gold border border-accent-gold/20' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>
      <RollingLineChart data={data} color="#C9A84C" gradientId="rollGrad" />
    </div>
  );
}

export default function RollingAvgChart({ reports, loading }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <RollingAverageChart reports={reports} />
      <ProductsPerOrderChart reports={reports} />
    </div>
  );
}

import { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart } from 'recharts';
import Card from '../UI/Card';
import { formatBDT, formatDateShort } from '../../utils/formatters';

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border/60 rounded-xl p-3 shadow-lg min-w-[140px]">
      <p className="text-[10px] text-text-muted mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-medium" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.value > 999 ? formatBDT(p.value) : p.value}{p.name?.includes('Rate') || p.name?.includes('%') ? '%' : ''}
        </p>
      ))}
    </div>
  );
}

function RevenueOverview({ reports }) {
  const data = useMemo(() => {
    return (reports || []).map(r => ({
      date: formatDateShort(r.dateString),
      Revenue: r.totalOrderValue,
      Advance: r.totalAdvance,
    }));
  }, [reports]);

  if (data.length === 0) return null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider font-medium">Revenue Overview</p>
          <p className="text-[10px] text-text-muted/60 mt-0.5">Revenue vs Advance collected</p>
        </div>
        <div className="flex gap-3">
          <span className="flex items-center gap-1 text-[10px] text-text-muted"><span className="w-2 h-2 rounded-full bg-[#C9A84C]" />Revenue</span>
          <span className="flex items-center gap-1 text-[10px] text-text-muted"><span className="w-2 h-2 rounded-full bg-[#0D9488]" />Advance</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C9A84C" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#C9A84C" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradAdv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0D9488" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#0D9488" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.5} />
          <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748B' }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: '#64748B' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} axisLine={false} tickLine={false} width={40} />
          <Tooltip cursor={{ stroke: 'none' }} content={<TrendTooltip />} />
          <Area type="monotone" dataKey="Revenue" stroke="#C9A84C" strokeWidth={2} fill="url(#gradRev)" dot={false} />
          <Area type="monotone" dataKey="Advance" stroke="#0D9488" strokeWidth={2} fill="url(#gradAdv)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

function OrderMix({ reports }) {
  const data = useMemo(() => {
    return (reports || []).map(r => ({
      date: formatDateShort(r.dateString),
      Regular: r.regularOrder || 0,
      Customize: r.customizeOrder || 0,
      'Custom %': r.totalOrder > 0 ? Math.round((r.customizeOrder / r.totalOrder) * 100) : 0,
    }));
  }, [reports]);

  if (data.length === 0) return null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider font-medium">Order Mix</p>
          <p className="text-[10px] text-text-muted/60 mt-0.5">Regular vs Customize orders</p>
        </div>
        <div className="flex gap-3">
          <span className="flex items-center gap-1 text-[10px] text-text-muted"><span className="w-2 h-2 rounded-full bg-[#C9A84C]" />Regular</span>
          <span className="flex items-center gap-1 text-[10px] text-text-muted"><span className="w-2 h-2 rounded-full bg-[#E11D48]" />Customize</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data}>
          <defs>
            <linearGradient id="gradRegular" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C9A84C" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#C9A84C" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradCustom" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E11D48" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#E11D48" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.5} />
          <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748B' }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} width={30} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: '#E11D48' }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} width={35} />
          <Tooltip cursor={{ stroke: 'none' }} content={<TrendTooltip />} />
          <Area yAxisId="left" type="monotone" dataKey="Regular" stroke="#C9A84C" strokeWidth={2} fill="url(#gradRegular)" />
          <Area yAxisId="left" type="monotone" dataKey="Customize" stroke="#E11D48" strokeWidth={2} fill="url(#gradCustom)" />
          <Line yAxisId="right" type="monotone" dataKey="Custom %" stroke="#E11D48" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}

function PerformanceMetrics({ reports }) {
  const data = useMemo(() => {
    return (reports || []).filter(r => r.totalOrder > 0).map(r => ({
      date: formatDateShort(r.dateString),
      AOV: r.avgOrderValue || Math.round(r.totalOrderValue / r.totalOrder),
      'Advance %': r.advanceRate || 0,
      'Rev/Product': r.totalProduct > 0 ? Math.round(r.totalOrderValue / r.totalProduct) : 0,
    }));
  }, [reports]);

  if (data.length === 0) return null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider font-medium">Performance</p>
          <p className="text-[10px] text-text-muted/60 mt-0.5">AOV, advance rate, revenue per product</p>
        </div>
        <div className="flex gap-3">
          <span className="flex items-center gap-1 text-[10px] text-text-muted"><span className="w-2 h-2 rounded-full bg-blue-500" />AOV</span>
          <span className="flex items-center gap-1 text-[10px] text-text-muted"><span className="w-2 h-2 rounded-full bg-accent-gold" />Advance%</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.5} />
          <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748B' }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#64748B' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} axisLine={false} tickLine={false} width={40} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: '#C9A84C' }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} width={35} />
          <Tooltip cursor={{ stroke: 'none' }} content={<TrendTooltip />} />
          <Bar yAxisId="left" dataKey="AOV" fill="#3B82F6" fillOpacity={0.7} radius={[3, 3, 0, 0]} barSize={12} />
          <Line yAxisId="right" type="monotone" dataKey="Advance %" stroke="#C9A84C" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}

export default function AdvancedTrends({ reports }) {
  if (!reports || reports.length === 0) return null;

  return (
    <div className="space-y-3 sm:space-y-4">
      <RevenueOverview reports={reports} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <OrderMix reports={reports} />
        <PerformanceMetrics reports={reports} />
      </div>
    </div>
  );
}

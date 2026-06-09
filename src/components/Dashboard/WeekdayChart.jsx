import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ChartWidget from './ChartWidget';
import { computeWeekdayAnalysis } from '../../utils/analytics';

const DAY_COLORS = ['#C9A84C', '#C9A84C', '#C9A84C', '#C9A84C', '#C9A84C', '#F43F5E', '#F43F5E'];

function WeekdayTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/85 backdrop-blur-xl border border-border/50 rounded-2xl p-3.5 shadow-xl min-w-[130px]">
      <p className="text-[11px] font-semibold text-text-primary mb-1.5">{label}</p>
      <p className="text-sm font-bold tracking-tight">{payload[0]?.value} orders/day</p>
    </div>
  );
}

export default function WeekdayChart({ reports, loading }) {
  const data = useMemo(() => computeWeekdayAnalysis(reports || []), [reports]);

  return (
    <ChartWidget title="Weekday Performance" subtitle="Average orders per day of week" loading={loading} isEmpty={data.length === 0}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.3} vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={30} />
          <Tooltip cursor={{ stroke: 'none' }} content={<WeekdayTooltip />} />
          <Bar dataKey="avgOrders" radius={[8, 8, 0, 0]} barSize={28} name="Avg Orders">
            {data.map((_, i) => <Cell key={i} fill={DAY_COLORS[i] || '#C9A84C'} fillOpacity={0.85} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartWidget>
  );
}

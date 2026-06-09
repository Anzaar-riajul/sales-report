import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ChartWidget from './ChartWidget';
import { computeWeekdayAnalysis } from '../../utils/analytics';

const DAY_COLORS = ['#C9A84C', '#C9A84C', '#C9A84C', '#C9A84C', '#C9A84C', '#E11D48', '#E11D48'];

function WeekdayTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border/60 rounded-xl p-3 shadow-lg min-w-[120px]">
      <p className="text-[10px] text-text-muted mb-1">{label}</p>
      <p className="text-xs font-semibold text-text-primary">{payload[0]?.value} orders/day avg</p>
    </div>
  );
}

export default function WeekdayChart({ reports, loading }) {
  const data = useMemo(() => computeWeekdayAnalysis(reports || []), [reports]);

  return (
    <ChartWidget title="Weekday Performance" subtitle="Average orders per day of week" loading={loading} isEmpty={data.length === 0}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.5} />
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} width={30} />
          <Tooltip cursor={{ stroke: 'none' }} content={<WeekdayTooltip />} />
          <Bar dataKey="avgOrders" radius={[6, 6, 0, 0]} name="Avg Orders">
            {data.map((_, i) => <Cell key={i} fill={DAY_COLORS[i] || '#C9A84C'} fillOpacity={0.85} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartWidget>
  );
}

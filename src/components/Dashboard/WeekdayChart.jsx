import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ChartWidget from './ChartWidget';
import { computeWeekdayAnalysis } from '../../utils/analytics';

export default function WeekdayChart({ reports, loading }) {
  const data = useMemo(() => computeWeekdayAnalysis(reports || []), [reports]);

  return (
    <ChartWidget title="Weekday Performance" subtitle="Average orders per day of week" loading={loading} isEmpty={data.length === 0}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
            formatter={(value, name) => {
              if (name === 'avgOrders') return [`${value} orders`, 'Avg Orders'];
              if (name === 'avgValue') return [`BDT ${value.toLocaleString('en-BD')}`, 'Avg Value'];
              return [value, name];
            }}
          />
          <Bar dataKey="avgOrders" fill="#C9A84C" radius={[4, 4, 0, 0]} name="avgOrders" />
        </BarChart>
      </ResponsiveContainer>
    </ChartWidget>
  );
}

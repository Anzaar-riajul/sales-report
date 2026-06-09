import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ChartWidget from './ChartWidget';
import { computeYearlySummary } from '../../utils/analytics';
import { formatBDT } from '../../utils/formatters';

export default function YearlyReport({ reports, loading }) {
  const data = useMemo(() => {
    const yearly = computeYearlySummary(reports || []);
    return yearly.map(y => ({
      year: y.year,
      orders: y.totalOrder,
      value: y.totalOrderValue,
    }));
  }, [reports]);

  return (
    <ChartWidget title="Yearly Summary" subtitle="Revenue by year" loading={loading} isEmpty={data.length === 0}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
          <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
            formatter={(value) => [formatBDT(value), 'Revenue']}
          />
          <Bar dataKey="value" fill="#C9A84C" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartWidget>
  );
}

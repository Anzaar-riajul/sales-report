import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../UI/Card';
import { formatBDT } from '../../utils/formatters';
import { computeWeeklySummary } from '../../utils/analytics';
import { ChartSkeleton } from '../UI/Loader';

export default function WeeklyReport({ reports, loading }) {
  const weeklyData = useMemo(() => computeWeeklySummary(reports || []), [reports]);

  if (loading) return <ChartSkeleton />;

  const chartData = weeklyData.slice(-8).map(w => ({
    week: w.weekStart.slice(5),
    orders: w.totalOrder,
    value: w.totalOrderValue,
  }));

  if (chartData.length === 0) {
    return (
      <Card>
        <h3 className="section-title mb-4">Weekly Revenue</h3>
        <div className="h-64 flex items-center justify-center text-text-muted text-sm">No data</div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="section-title mb-4">Weekly Revenue Summary</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
          <Tooltip
            contentStyle={{ background: '#161A23', border: '1px solid #1E2330', borderRadius: '8px' }}
            formatter={(value) => [formatBDT(value), 'Revenue']}
          />
          <Bar dataKey="value" fill="#C9A84C" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

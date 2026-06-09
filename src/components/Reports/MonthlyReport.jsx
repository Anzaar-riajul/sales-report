import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../UI/Card';
import { formatBDT } from '../../utils/formatters';
import { computeMonthlySummary } from '../../utils/analytics';
import { ChartSkeleton } from '../UI/Loader';

export default function MonthlyReport({ reports, loading }) {
  const monthlyData = useMemo(() => computeMonthlySummary(reports || []), [reports]);

  if (loading) return <ChartSkeleton />;

  const chartData = monthlyData.slice(-6).map(m => ({
    month: m.month,
    orders: m.totalOrder,
    value: m.totalOrderValue,
  }));

  if (chartData.length === 0) {
    return (
      <Card>
        <h3 className="section-title mb-4">Monthly Revenue</h3>
        <div className="h-64 flex items-center justify-center text-text-muted text-sm">No data</div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="section-title mb-4">Monthly Revenue Summary</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
          <Tooltip
            contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
            formatter={(value) => [formatBDT(value), 'Revenue']}
          />
          <Bar dataKey="value" fill="#2DD4BF" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

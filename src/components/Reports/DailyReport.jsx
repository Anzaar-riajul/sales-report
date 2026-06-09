import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../UI/Card';
import { formatDate } from '../../utils/formatters';
import { ChartSkeleton } from '../UI/Loader';

export default function DailyReport({ reports, loading }) {
  if (loading) return <ChartSkeleton />;

  const data = reports && reports.length > 0
    ? [...reports].filter(r => r.totalOrderValue > 0).sort((a, b) => a.dateString.localeCompare(b.dateString)).slice(-14).map(r => ({
        date: formatDate(r.dateString),
        orders: r.totalOrder,
        products: r.totalProduct,
      }))
    : [];

  if (data.length === 0) {
    return (
      <Card>
        <h3 className="section-title mb-4">Daily Order Volume</h3>
        <div className="h-64 flex items-center justify-center text-text-muted text-sm">No data</div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="section-title mb-4">Daily Order Volume (Last 14 Days)</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#161A23', border: '1px solid #1E2330', borderRadius: '8px' }}
          />
          <Bar dataKey="orders" fill="#C9A84C" radius={[4, 4, 0, 0]} name="Orders" />
          <Bar dataKey="products" fill="#2DD4BF" radius={[4, 4, 0, 0]} name="Products" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

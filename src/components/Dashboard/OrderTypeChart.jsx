import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Card from '../UI/Card';
import { ChartSkeleton } from '../UI/Loader';

const COLORS = ['#C9A84C', '#2DD4BF'];

export default function OrderTypeChart({ report, loading }) {
  if (loading) return <ChartSkeleton />;

  if (!report) {
    return (
      <Card>
        <h3 className="section-title mb-4">Order Split</h3>
        <div className="h-64 flex items-center justify-center text-text-muted text-sm">No data</div>
      </Card>
    );
  }

  const data = [
    { name: 'Regular', value: report.regularOrder || 0 },
    { name: 'Customize', value: report.customizeOrder || 0 },
  ].filter(d => d.value > 0);

  if (data.length === 0) {
    return (
      <Card>
        <h3 className="section-title mb-4">Order Split</h3>
        <div className="h-64 flex items-center justify-center text-text-muted text-sm">No data</div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="section-title mb-4">Order Split</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#161A23', border: '1px solid #1E2330', borderRadius: '8px' }}
            formatter={(value, name) => [`${value} orders`, name]}
          />
          <Legend
            formatter={(value) => <span style={{ color: '#F1F5F9' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

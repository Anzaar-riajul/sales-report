import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Card from '../UI/Card';
import { computeCategoryBreakdown } from '../../utils/analytics';
import { ChartSkeleton } from '../UI/Loader';

const COLORS = ['#C9A84C', '#0D9488', '#E11D48', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#64748B'];

export default function CategoryBreakdown({ products, loading }) {
  const data = useMemo(() => computeCategoryBreakdown(products || []), [products]);

  if (loading) return <ChartSkeleton />;

  if (data.length === 0) {
    return (
      <Card>
        <h3 className="section-title mb-4">Category Breakdown</h3>
        <div className="h-64 flex items-center justify-center text-text-muted text-sm">No product data</div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="section-title mb-4">Category Breakdown</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={100} paddingAngle={2} dataKey="totalQuantity" nameKey="name">
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
            formatter={(value, name) => [`${value} units`, name]}
          />
          <Legend
            formatter={(value) => <span style={{ color: '#0F172A' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

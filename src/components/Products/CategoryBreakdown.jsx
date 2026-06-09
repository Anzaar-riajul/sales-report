import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Card from '../UI/Card';
import { computeCategoryBreakdown } from '../../utils/analytics';
import { ChartSkeleton } from '../UI/Loader';

const COLORS = ['#C9A84C', '#6366F1', '#14B8A6', '#F43F5E', '#F59E0B', '#8B5CF6', '#06B6D4', '#64748B'];

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
            contentStyle={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(226,232,240,0.5)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', fontSize: '11px' }}
            formatter={(value, name) => [`${value} units`, name]}
          />
          <Legend
            formatter={(value) => <span style={{ color: '#475569', fontSize: '11px', fontWeight: 500 }}>{value}</span>}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

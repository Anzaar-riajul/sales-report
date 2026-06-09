import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ChartWidget from './ChartWidget';
import { computeCategoryBreakdown } from '../../utils/analytics';

const COLORS = ['#C9A84C', '#2DD4BF', '#F472B6', '#A78BFA', '#FB923C', '#38BDF8', '#FBBF24', '#4ADE80'];

export default function CategoryChart({ products, loading }) {
  const data = useMemo(() => {
    const breakdown = computeCategoryBreakdown(products || []);
    return breakdown.slice(0, 10).map((c, i) => ({
      ...c,
      fill: COLORS[i % COLORS.length],
    }));
  }, [products]);

  return (
    <ChartWidget title="Category Breakdown" subtitle="Total quantity sold by category" loading={loading} isEmpty={data.length === 0}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
          <Tooltip
            contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
            formatter={(value, name) => {
              if (name === 'totalQuantity') return [value, 'Qty Sold'];
              if (name === 'productCount') return [value, 'Products'];
              return [value, name];
            }}
          />
          <Bar dataKey="totalQuantity" fill="#C9A84C" radius={[0, 4, 4, 0]} name="totalQuantity" />
        </BarChart>
      </ResponsiveContainer>
    </ChartWidget>
  );
}

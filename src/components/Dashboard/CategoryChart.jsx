import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ChartWidget from './ChartWidget';
import { computeCategoryBreakdown } from '../../utils/analytics';

const COLORS = ['#C9A84C', '#6366F1', '#14B8A6', '#F43F5E', '#8B5CF6'];

function CatTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-white/85 backdrop-blur-xl border border-border/50 rounded-2xl p-3.5 shadow-xl min-w-[130px]">
      <p className="text-[11px] font-semibold text-text-primary mb-1.5">{d?.name}</p>
      <p className="text-sm font-bold tracking-tight" style={{ color: d?.fill }}>{d?.totalQuantity} pcs</p>
      <p className="text-[10px] text-text-muted mt-0.5">{d?.productCount} products</p>
    </div>
  );
}

export default function CategoryChart({ products, loading }) {
  const data = useMemo(() => {
    const breakdown = computeCategoryBreakdown(products || []);
    return breakdown.slice(0, 5).map((c, i) => ({
      ...c,
      fill: COLORS[i],
    }));
  }, [products]);

  return (
    <ChartWidget title="Category Breakdown" subtitle="Top 5 categories by quantity" loading={loading} isEmpty={data.length === 0}>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.3} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#475569', fontWeight: 500 }} width={80} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ stroke: 'none' }} content={<CatTooltip />} />
          <Bar dataKey="totalQuantity" radius={[0, 8, 8, 0]} barSize={18} name="Qty Sold">
            {data.map((d, i) => <Cell key={i} fill={d.fill} fillOpacity={0.85} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartWidget>
  );
}

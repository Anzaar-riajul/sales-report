import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ChartWidget from './ChartWidget';
import { computeCategoryBreakdown } from '../../utils/analytics';

const COLORS = ['#C9A84C', '#0D9488', '#E11D48', '#A78BFA', '#FB923C'];

function CatTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-white border border-border/60 rounded-xl p-3 shadow-lg min-w-[120px]">
      <p className="text-[10px] text-text-muted mb-1">{d?.name}</p>
      <p className="text-xs font-semibold text-text-primary">{d?.totalQuantity} pcs sold</p>
      <p className="text-[10px] text-text-muted">{d?.productCount} products</p>
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
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.5} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#0F172A', fontWeight: 500 }} width={75} axisLine={false} tickLine={false} />
          <Tooltip content={<CatTooltip />} />
          <Bar dataKey="totalQuantity" radius={[0, 6, 6, 0]} barSize={16} name="Qty Sold">
            {data.map((d, i) => <Cell key={i} fill={d.fill} fillOpacity={0.85} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartWidget>
  );
}

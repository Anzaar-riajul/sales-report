import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../UI/Card';
import { formatDateShort, formatBDT } from '../../utils/formatters';
import { ChartSkeleton } from '../UI/Loader';

export default function RevenueChart({ reports, loading }) {
  const [range, setRange] = useState(30);

  const data = useMemo(() => {
    if (!reports || reports.length === 0) return [];
    const sorted = [...reports]
      .filter(r => r.totalOrderValue > 0)
      .sort((a, b) => a.dateString.localeCompare(b.dateString));
    return sorted.slice(-range).map(r => ({
      date: formatDateShort(r.dateString),
      revenue: r.totalOrderValue,
      advance: r.totalAdvance,
      orders: r.totalOrder,
    }));
  }, [reports, range]);

  if (loading) return <ChartSkeleton />;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title">Revenue Trend</h3>
        <div className="flex gap-1">
          {[7, 30, 60, 90].map(d => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                range === d ? 'bg-accent-gold/10 text-accent-gold border border-accent-gold/20' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>
      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-text-muted text-sm">No revenue data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `BDT ${(v / 1000).toFixed(0)}K`} />
            <Tooltip
              contentStyle={{ background: '#161A23', border: '1px solid #1E2330', borderRadius: '8px' }}
              formatter={(value) => [formatBDT(value), '']}
            />
            <Line type="monotone" dataKey="revenue" stroke="#C9A84C" strokeWidth={2} dot={false} name="Revenue" />
            <Line type="monotone" dataKey="advance" stroke="#2DD4BF" strokeWidth={2} dot={false} name="Advance" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

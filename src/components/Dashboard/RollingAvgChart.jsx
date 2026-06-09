import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ChartWidget from './ChartWidget';
import { computeRollingAverage, computeProductsPerOrderTrend } from '../../utils/analytics';
import { formatDateShort } from '../../utils/formatters';

function RollingLineChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
        />
        <Line type="monotone" dataKey="value" stroke="#C9A84C" strokeWidth={2} dot={false} name="Value" />
      </LineChart>
    </ResponsiveContainer>
  );
}

function ProductsPerOrderChart({ reports }) {
  const data = useMemo(() => {
    const trend = computeProductsPerOrderTrend(reports || []);
    return trend.slice(-30).map(r => ({
      date: formatDateShort(r.date),
      value: r.ratio,
    }));
  }, [reports]);

  return (
    <ChartWidget title="Products Per Order" subtitle="Average products per order over time" loading={false} isEmpty={data.length === 0}>
      <RollingLineChart data={data} />
    </ChartWidget>
  );
}

function RollingAverageChart({ reports }) {
  const [days, setDays] = useState(7);
  const data = useMemo(() => {
    const avg = computeRollingAverage(reports || [], days);
    return avg.slice(-30).map(r => ({
      date: formatDateShort(r.date),
      value: r.avgOrder,
    }));
  }, [reports, days]);

  return (
    <ChartWidget
      title="Rolling Average"
      subtitle={`${days}-day moving average of orders`}
      loading={false}
      isEmpty={data.length === 0}
      action={
        <div className="flex gap-1">
          {[7, 14, 30].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-2 py-0.5 text-xs rounded-md transition-all ${
                days === d ? 'bg-accent-gold/10 text-accent-gold border border-accent-gold/20' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      }
    >
      <RollingLineChart data={data} />
    </ChartWidget>
  );
}

import { useState } from 'react';

export default function RollingAvgChart({ reports, loading }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <RollingAverageChart reports={reports} />
      <ProductsPerOrderChart reports={reports} />
    </div>
  );
}

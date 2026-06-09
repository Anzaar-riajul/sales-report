import { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '../UI/Card';
import ChartWidget from './ChartWidget';
import { formatBDT, formatDateShort } from '../../utils/formatters';

function CollapsibleSection({ title, defaultOpen = false, children }) {
  return (
    <details open={defaultOpen} className="group">
      <summary className="flex items-center gap-2 cursor-pointer text-text-primary font-semibold text-lg mb-3 list-none">
        <span className="text-xs text-text-muted transition-transform group-open:rotate-90">▶</span>
        {title}
      </summary>
      {children}
    </details>
  );
}

function RevenueAdvanceChart({ reports }) {
  const data = useMemo(() => {
    return (reports || []).map(r => ({
      date: formatDateShort(r.dateString),
      revenue: r.totalOrderValue,
      advance: r.totalAdvance,
    }));
  }, [reports]);

  return (
    <ChartWidget title="Revenue & Advance" subtitle="Stacked bar view" loading={false} isEmpty={data.length === 0}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
          <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
            formatter={(value) => [formatBDT(value), '']}
          />
          <Legend formatter={(value) => <span style={{ color: '#0F172A', fontSize: '12px' }}>{value}</span>} />
          <Bar dataKey="advance" fill="#0D9488" radius={[4, 4, 0, 0]} name="Advance" />
          <Bar dataKey="revenue" fill="#C9A84C" radius={[4, 4, 0, 0]} name="Revenue" />
        </BarChart>
      </ResponsiveContainer>
    </ChartWidget>
  );
}

function AdvanceRateChart({ reports }) {
  const data = useMemo(() => {
    return (reports || []).map(r => ({
      date: formatDateShort(r.dateString),
      rate: r.advanceRate,
    }));
  }, [reports]);

  return (
    <ChartWidget title="Advance Rate Trend" subtitle="Percentage over time" loading={false} isEmpty={data.length === 0}>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
            formatter={(value) => [`${value}%`, 'Advance Rate']}
          />
          <Line type="monotone" dataKey="rate" stroke="#C9A84C" strokeWidth={2} dot={false} name="Advance Rate" />
        </LineChart>
      </ResponsiveContainer>
    </ChartWidget>
  );
}

function AOVChart({ reports }) {
  const data = useMemo(() => {
    return (reports || []).map(r => ({
      date: formatDateShort(r.dateString),
      aov: r.avgOrderValue || 0,
    }));
  }, [reports]);

  return (
    <ChartWidget title="Average Order Value" subtitle="Revenue ÷ Orders per day" loading={false} isEmpty={data.length === 0}>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
          <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
            formatter={(value) => [formatBDT(value), 'AOV']}
          />
          <Line type="monotone" dataKey="aov" stroke="#0D9488" strokeWidth={2} dot={false} name="AOV" />
        </LineChart>
      </ResponsiveContainer>
    </ChartWidget>
  );
}

function OrderTrendChart({ reports }) {
  const data = useMemo(() => {
    return (reports || []).map(r => ({
      date: formatDateShort(r.dateString),
      regular: r.regularOrder,
      customize: r.customizeOrder,
    }));
  }, [reports]);

  return (
    <ChartWidget title="Order Trend" subtitle="Regular vs Customize (stacked area)" loading={false} isEmpty={data.length === 0}>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }} />
          <Legend formatter={(value) => <span style={{ color: '#0F172A', fontSize: '12px' }}>{value}</span>} />
          <Area type="monotone" dataKey="regular" stackId="1" stroke="#C9A84C" fill="#C9A84C" fillOpacity={0.2} name="Regular" />
          <Area type="monotone" dataKey="customize" stackId="1" stroke="#0D9488" fill="#0D9488" fillOpacity={0.2} name="Customize" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWidget>
  );
}

function CustomizePctChart({ reports }) {
  const data = useMemo(() => {
    return (reports || []).filter(r => r.totalOrder > 0).map(r => ({
      date: formatDateShort(r.dateString),
      pct: Math.round((r.customizeOrder / r.totalOrder) * 100),
    }));
  }, [reports]);

  return (
    <ChartWidget title="Customize % Trend" subtitle="Share of customize orders over time" loading={false} isEmpty={data.length === 0}>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
            formatter={(value) => [`${value}%`, 'Customize %']}
          />
          <Line type="monotone" dataKey="pct" stroke="#E11D48" strokeWidth={2} dot={false} name="Customize %" />
        </LineChart>
      </ResponsiveContainer>
    </ChartWidget>
  );
}

function RevenuePerProductChart({ reports }) {
  const data = useMemo(() => {
    return (reports || []).filter(r => r.totalProduct > 0).map(r => ({
      date: formatDateShort(r.dateString),
      value: Math.round(r.totalOrderValue / r.totalProduct),
    }));
  }, [reports]);

  return (
    <ChartWidget title="Revenue per Product" subtitle="Average revenue per product sold" loading={false} isEmpty={data.length === 0}>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v.toFixed(0)}`} />
          <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
            formatter={(value) => [formatBDT(value), 'Rev/Product']}
          />
          <Line type="monotone" dataKey="value" stroke="#C9A84C" strokeWidth={2} dot={false} name="Rev/Product" />
        </LineChart>
      </ResponsiveContainer>
    </ChartWidget>
  );
}

export default function AdvancedTrends({ reports }) {
  const hasData = reports && reports.length > 0;

  return (
    <CollapsibleSection title="Advanced Trends">
      <div className="space-y-4">
        <RevenueAdvanceChart reports={reports} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AdvanceRateChart reports={reports} />
          <AOVChart reports={reports} />
        </div>
        <OrderTrendChart reports={reports} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CustomizePctChart reports={reports} />
          <RevenuePerProductChart reports={reports} />
        </div>
      </div>
    </CollapsibleSection>
  );
}

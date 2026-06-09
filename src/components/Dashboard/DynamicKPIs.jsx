import { useMemo } from 'react';
import Card from '../UI/Card';
import { formatBDT, formatBDTShort, formatNumber, formatPercent, getChangeColor, getChangeIcon } from '../../utils/formatters';

function KpiCard({ label, value, sub, change, changeLabel, subColor }) {
  return (
    <Card>
      <div className="space-y-2">
        <p className="text-text-muted text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className="stat-value text-text-primary">{value}</p>
        {sub && <p className={`text-xs ${subColor || 'text-text-muted'}`}>{sub}</p>}
        {change !== null && change !== undefined && (
          <p className={`text-xs font-medium ${getChangeColor(change)}`}>
            {getChangeIcon(change)} {Math.abs(change)}% {changeLabel || 'vs previous'}
          </p>
        )}
      </div>
    </Card>
  );
}

export default function DynamicKPIs({ reports, allReports }) {
  const latestReport = reports && reports.length > 0 ? reports[0] : null;

  const aggregate = useMemo(() => {
    if (!reports || reports.length === 0) return null;
    return reports.reduce((acc, r) => ({
      totalOrder: acc.totalOrder + (r.totalOrder || 0),
      regularOrder: acc.regularOrder + (r.regularOrder || 0),
      customizeOrder: acc.customizeOrder + (r.customizeOrder || 0),
      totalProduct: acc.totalProduct + (r.totalProduct || 0),
      regularProduct: acc.regularProduct + (r.regularProduct || 0),
      customizeProduct: acc.customizeProduct + (r.customizeProduct || 0),
      totalOrderValue: acc.totalOrderValue + (r.totalOrderValue || 0),
      totalAdvance: acc.totalAdvance + (r.totalAdvance || 0),
    }), { totalOrder: 0, regularOrder: 0, customizeOrder: 0, totalProduct: 0, regularProduct: 0, customizeProduct: 0, totalOrderValue: 0, totalAdvance: 0 });
  }, [reports]);

  const prevAggregate = useMemo(() => {
    if (!allReports || allReports.length < 2 || !reports || reports.length === 0) return null;
    const cutoff = reports.length;
    const prev = allReports.slice(cutoff, cutoff + reports.length);
    if (prev.length === 0) return null;
    return prev.reduce((acc, r) => ({
      totalOrder: acc.totalOrder + (r.totalOrder || 0),
      totalOrderValue: acc.totalOrderValue + (r.totalOrderValue || 0),
      totalAdvance: acc.totalAdvance + (r.totalAdvance || 0),
      totalProduct: acc.totalProduct + (r.totalProduct || 0),
      customizeOrder: acc.customizeOrder + (r.customizeOrder || 0),
      regularOrder: acc.regularOrder + (r.regularOrder || 0),
    }), { totalOrder: 0, totalOrderValue: 0, totalAdvance: 0, totalProduct: 0, customizeOrder: 0, regularOrder: 0 });
  }, [allReports, reports]);

  if (!latestReport || !aggregate) return null;

  const avgOrderValue = aggregate.totalOrder > 0
    ? Math.round(aggregate.totalOrderValue / aggregate.totalOrder)
    : 0;
  const customizeRate = aggregate.totalOrder > 0
    ? Math.round((aggregate.customizeOrder / aggregate.totalOrder) * 100)
    : 0;
  const prevAvgOrderValue = prevAggregate?.totalOrder > 0
    ? Math.round(prevAggregate.totalOrderValue / prevAggregate.totalOrder)
    : 0;

  const metrics = [
    {
      label: 'Total Orders',
      value: formatNumber(aggregate.totalOrder),
      sub: `${formatNumber(aggregate.regularOrder)} Regular · ${formatNumber(aggregate.customizeOrder)} Custom`,
      change: prevAggregate?.totalOrder
        ? Math.round(((aggregate.totalOrder - prevAggregate.totalOrder) / prevAggregate.totalOrder) * 100)
        : null,
    },
    {
      label: 'Order Value',
      value: formatBDTShort(aggregate.totalOrderValue),
      sub: formatBDT(aggregate.totalOrderValue),
      change: prevAggregate?.totalOrderValue
        ? Math.round(((aggregate.totalOrderValue - prevAggregate.totalOrderValue) / prevAggregate.totalOrderValue) * 100)
        : null,
    },
    {
      label: 'Avg Order Value',
      value: formatBDTShort(avgOrderValue),
      sub: formatBDT(avgOrderValue),
      change: prevAvgOrderValue > 0
        ? Math.round(((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100)
        : null,
    },
    {
      label: 'Total Advance',
      value: formatBDTShort(aggregate.totalAdvance),
      sub: `${aggregate.totalOrder > 0 ? formatPercent(Math.round((aggregate.totalAdvance / aggregate.totalOrderValue) * 100)) : '0%'} advance rate`,
      change: prevAggregate?.totalAdvance
        ? Math.round(((aggregate.totalAdvance - prevAggregate.totalAdvance) / prevAggregate.totalAdvance) * 100)
        : null,
    },
    {
      label: 'Customize Rate',
      value: formatPercent(customizeRate),
      sub: `${formatNumber(aggregate.customizeOrder)} of ${formatNumber(aggregate.totalOrder)} orders`,
      change: prevAggregate?.totalOrder > 0
        ? Math.round(customizeRate - Math.round((prevAggregate.customizeOrder / prevAggregate.totalOrder) * 100))
        : null,
    },
    {
      label: 'Total Products',
      value: formatNumber(aggregate.totalProduct),
      sub: `${formatNumber(aggregate.regularProduct)} Regular · ${formatNumber(aggregate.customizeProduct)} Custom`,
      change: prevAggregate?.totalProduct
        ? Math.round(((aggregate.totalProduct - prevAggregate.totalProduct) / prevAggregate.totalProduct) * 100)
        : null,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
      {metrics.map((m) => <KpiCard key={m.label} {...m} />)}
    </div>
  );
}

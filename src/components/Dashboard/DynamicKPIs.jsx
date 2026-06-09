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
            {getChangeIcon(change)} {Math.abs(change)}% {changeLabel || 'vs yesterday'}
          </p>
        )}
      </div>
    </Card>
  );
}

export default function DynamicKPIs({ latestReport, previousReport }) {
  if (!latestReport) return null;

  const avgOrderValue = latestReport.totalOrder > 0
    ? Math.round(latestReport.totalOrderValue / latestReport.totalOrder)
    : 0;
  const customizeRate = latestReport.totalOrder > 0
    ? Math.round((latestReport.customizeOrder / latestReport.totalOrder) * 100)
    : 0;
  const prevAvgOrderValue = previousReport?.totalOrder > 0
    ? Math.round(previousReport.totalOrderValue / previousReport.totalOrder)
    : 0;

  const metrics = [
    {
      label: 'Total Orders',
      value: formatNumber(latestReport.totalOrder),
      sub: `${formatNumber(latestReport.regularOrder)} Regular · ${formatNumber(latestReport.customizeOrder)} Custom`,
      change: previousReport?.totalOrder
        ? Math.round(((latestReport.totalOrder - previousReport.totalOrder) / previousReport.totalOrder) * 100)
        : null,
    },
    {
      label: 'Order Value',
      value: formatBDTShort(latestReport.totalOrderValue),
      sub: formatBDT(latestReport.totalOrderValue),
      change: previousReport?.totalOrderValue
        ? Math.round(((latestReport.totalOrderValue - previousReport.totalOrderValue) / previousReport.totalOrderValue) * 100)
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
      value: formatBDTShort(latestReport.totalAdvance),
      sub: `${formatPercent(latestReport.advanceRate)} advance rate`,
      change: previousReport?.totalAdvance
        ? Math.round(((latestReport.totalAdvance - previousReport.totalAdvance) / previousReport.totalAdvance) * 100)
        : null,
    },
    {
      label: 'Customize Rate',
      value: formatPercent(customizeRate),
      sub: `${formatNumber(latestReport.customizeOrder)} of ${formatNumber(latestReport.totalOrder)} orders`,
      change: previousReport?.totalOrder > 0
        ? Math.round(((customizeRate - (previousReport.customizeOrder / previousReport.totalOrder) * 100)))
        : null,
    },
    {
      label: 'Total Products',
      value: formatNumber(latestReport.totalProduct),
      sub: `${formatNumber(latestReport.regularProduct)} Regular · ${formatNumber(latestReport.customizeProduct)} Custom`,
      change: previousReport?.totalProduct
        ? Math.round(((latestReport.totalProduct - previousReport.totalProduct) / previousReport.totalProduct) * 100)
        : null,
    },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
      {metrics.map((m) => <KpiCard key={m.label} {...m} />)}
    </div>
  );
}

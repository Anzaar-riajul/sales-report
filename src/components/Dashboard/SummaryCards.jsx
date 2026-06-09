import Card from '../UI/Card';
import { formatBDT, formatNumber, formatPercent, getAdvanceRateColor, getChangeColor, getChangeIcon } from '../../utils/formatters';

export default function SummaryCards({ report, previousReport }) {
  if (!report) return null;

  const metrics = [
    {
      label: 'Total Orders',
      value: formatNumber(report.totalOrder),
      sub: `${formatNumber(report.regularOrder)} Regular · ${formatNumber(report.customizeOrder)} Custom`,
      change: previousReport?.totalOrder
        ? Math.round(((report.totalOrder - previousReport.totalOrder) / previousReport.totalOrder) * 100)
        : null,
    },
    {
      label: 'Total Products',
      value: formatNumber(report.totalProduct),
      sub: `${formatNumber(report.regularProduct)} Regular · ${formatNumber(report.customizeProduct)} Custom`,
      change: previousReport?.totalProduct
        ? Math.round(((report.totalProduct - previousReport.totalProduct) / previousReport.totalProduct) * 100)
        : null,
    },
    {
      label: 'Total Advance',
      value: formatBDT(report.totalAdvance),
      sub: `${getChangeIcon(report.advanceRate - 15)} ${formatPercent(report.advanceRate)} advance rate`,
      subColor: getAdvanceRateColor(report.advanceRate),
      change: previousReport?.totalAdvance
        ? Math.round(((report.totalAdvance - previousReport.totalAdvance) / previousReport.totalAdvance) * 100)
        : null,
    },
    {
      label: 'Order Value',
      value: formatBDT(report.totalOrderValue),
      sub: `Outstanding: ${formatBDT(report.outstandingAmount)}`,
      change: previousReport?.totalOrderValue
        ? Math.round(((report.totalOrderValue - previousReport.totalOrderValue) / previousReport.totalOrderValue) * 100)
        : null,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <div className="space-y-2">
            <p className="text-text-muted text-xs font-medium uppercase tracking-wider">{metric.label}</p>
            <p className="stat-value text-text-primary">{metric.value}</p>
            <p className={`text-xs ${metric.subColor || 'text-text-muted'}`}>{metric.sub}</p>
            {metric.change !== null && (
              <p className={`text-xs font-medium ${getChangeColor(metric.change)}`}>
                {getChangeIcon(metric.change)} {Math.abs(metric.change)}% vs yesterday
              </p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

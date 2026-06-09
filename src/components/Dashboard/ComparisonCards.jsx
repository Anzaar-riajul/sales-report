import { useMemo } from 'react';
import Card from '../UI/Card';
import { formatBDT, formatNumber, formatPercent, getChangeColor, getChangeIcon } from '../../utils/formatters';
import { computeWeekOverWeekGrowth, computeMTDComparison, computeSameWeekdayComparison } from '../../utils/analytics';

function ComparisonCard({ title, current, previous, currentLabel, previousLabel, growth, format = 'number' }) {
  const fmt = format === 'bdt' ? formatBDT : formatNumber;
  return (
    <Card>
      <h4 className="text-sm font-medium text-text-primary mb-3">{title}</h4>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="stat-value text-text-primary">{fmt(current)}</span>
        <span className={`text-sm font-medium ${getChangeColor(growth)}`}>
          {getChangeIcon(growth)} {Math.abs(growth)}%
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-text-muted flex justify-between">
          <span>{currentLabel}</span>
          <span className="font-mono">{fmt(current)}</span>
        </p>
        <p className="text-xs text-text-muted flex justify-between">
          <span>{previousLabel}</span>
          <span className="font-mono">{fmt(previous)}</span>
        </p>
      </div>
    </Card>
  );
}

export default function ComparisonCards({ reports, loading }) {
  const wow = useMemo(() => computeWeekOverWeekGrowth(reports || []), [reports]);
  const mtd = useMemo(() => computeMTDComparison(reports || []), [reports]);
  const sameDay = useMemo(() => computeSameWeekdayComparison(reports || []), [reports]);

  if (loading) return null;

  const hasData = wow || mtd || sameDay;
  if (!hasData) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {wow && (
        <ComparisonCard
          title="Week Over Week"
          current={wow.currentOrders}
          previous={wow.previousOrders}
          currentLabel="This week"
          previousLabel="Last week"
          growth={wow.orderGrowth}
        />
      )}
      {mtd && (
        <ComparisonCard
          title="Month Over Month"
          current={mtd.mtd.orders}
          previous={mtd.lastMonth.orders}
          currentLabel="This month"
          previousLabel="Last month"
          growth={mtd.orderGrowth}
        />
      )}
      {sameDay && (
        <ComparisonCard
          title="Same Day Last Week"
          current={sameDay.current.totalOrder}
          previous={sameDay.previous.totalOrder}
          currentLabel={sameDay.current.dateString}
          previousLabel={sameDay.previous.dateString}
          growth={sameDay.orderChange}
        />
      )}
    </div>
  );
}

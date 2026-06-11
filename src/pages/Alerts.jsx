import { useState, useMemo } from 'react';
import { subDays, format } from 'date-fns';
import { useReports } from '../hooks/useReports';
import { useProducts } from '../hooks/useProducts';
import { computeRollingAverage, computeWeekdayAnalysis, computeWeekOverWeekGrowth, computeMTDComparison, getProductLastSeen } from '../utils/analytics';
import { formatBDT, formatDateShort, formatNumber, formatBDTShort } from '../utils/formatters';
import DetailModal from '../components/UI/DetailModal';

const ALERT_TYPES = {
  revenue_drop: { icon: '📉', color: '#E11D48', label: 'Revenue Drop', severity: 'critical' },
  order_decline: { icon: '📦', color: '#E11D48', label: 'Order Decline', severity: 'critical' },
  low_advance: { icon: '💳', color: '#F59E0B', label: 'Low Advance Rate', severity: 'warning' },
  high_customize: { icon: '🎨', color: '#8B5CF6', label: 'High Customize Rate', severity: 'warning' },
  dead_stock: { icon: '💀', color: '#E11D48', label: 'Dead Stock', severity: 'critical' },
  missing_data: { icon: '⚠', color: '#F59E0B', label: 'Missing Data', severity: 'warning' },
  milestone: { icon: '🏆', color: '#0D9488', label: 'Milestone', severity: 'success' },
  surge: { icon: '🚀', color: '#0D9488', label: 'Performance Surge', severity: 'success' },
  no_reports: { icon: '📭', color: '#F59E0B', label: 'No Reports', severity: 'info' },
  weekend_drop: { icon: '📊', color: '#64748B', label: 'Weekend Trend', severity: 'info' },
};

function AlertCard({ alert, onClick, index }) {
  const type = ALERT_TYPES[alert.type] || ALERT_TYPES.no_reports;
  const isPositive = ['milestone', 'surge'].includes(alert.type);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden ${
        isPositive
          ? 'bg-gradient-to-r from-accent-teal/5 to-accent-teal/10 border-accent-teal/15 hover:shadow-accent-teal/10'
          : alert.severity === 'critical'
          ? 'bg-gradient-to-r from-accent-rose/5 to-accent-rose/10 border-accent-rose/15 hover:shadow-accent-rose/10'
          : alert.severity === 'warning'
          ? 'bg-gradient-to-r from-amber-50 to-amber-100/50 border-amber-200/50 hover:shadow-amber-200/20'
          : 'bg-white/80 border-border/30 hover:shadow-accent-gold/8'
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${type.color}, ${type.color}CC)` }}>
          {type.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: type.color }}>{type.label}</span>
            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
              alert.severity === 'critical' ? 'bg-accent-rose/10 text-accent-rose' :
              alert.severity === 'warning' ? 'bg-amber-100 text-amber-600' :
              alert.severity === 'success' ? 'bg-accent-teal/10 text-accent-teal' :
              'bg-bg-elevated text-text-muted'
            }`}>{alert.severity}</span>
          </div>
          <p className="text-sm font-semibold text-text-primary leading-tight">{alert.title}</p>
          <p className="text-[11px] text-text-muted mt-1 leading-relaxed line-clamp-2">{alert.description}</p>
          {alert.value && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-mono font-bold" style={{ color: type.color }}>{alert.value}</span>
              {alert.change !== undefined && (
                <span className={`text-[10px] font-mono font-bold ${alert.change >= 0 ? 'text-accent-teal' : 'text-accent-rose'}`}>
                  {alert.change >= 0 ? '+' : ''}{alert.change}%
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex-shrink-0 pt-1">
          <svg className="w-4 h-4 text-text-muted/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7" /></svg>
        </div>
      </div>
    </button>
  );
}

export default function Alerts() {
  const { reports, loading: reportsLoading } = useReports();
  const { products, loading: productsLoading } = useProducts();
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(null);

  const loading = reportsLoading || productsLoading;

  const alerts = useMemo(() => {
    if (!reports || reports.length < 2) return [];
    const sorted = [...reports].sort((a, b) => a.dateString.localeCompare(b.dateString));
    const latest = sorted[sorted.length - 1];
    const previous = sorted[sorted.length - 2];
    const result = [];

    // 1. Revenue drop detection
    if (previous && latest) {
      const revChange = previous.totalOrderValue > 0
        ? Math.round(((latest.totalOrderValue - previous.totalOrderValue) / previous.totalOrderValue) * 100)
        : 0;
      if (revChange < -15) {
        result.push({
          type: 'revenue_drop', title: `Revenue dropped ${Math.abs(revChange)}% from yesterday`,
          description: `Today's revenue is ${formatBDT(latest.totalOrderValue)} vs yesterday's ${formatBDT(previous.totalOrderValue)}. Significant decline detected.`,
          value: formatBDT(latest.totalOrderValue), change: revChange,
          severity: revChange < -30 ? 'critical' : 'warning',
          detail: { current: latest, previous, metric: 'revenue' },
        });
      } else if (revChange > 20) {
        result.push({
          type: 'surge', title: `Revenue surged ${revChange}% from yesterday!`,
          description: `Today's revenue is ${formatBDT(latest.totalOrderValue)} vs yesterday's ${formatBDT(previous.totalOrderValue)}. Excellent performance!`,
          value: formatBDT(latest.totalOrderValue), change: revChange,
          severity: 'success',
          detail: { current: latest, previous, metric: 'revenue' },
        });
      }
    }

    // 2. Order decline
    if (previous && latest) {
      const orderChange = previous.totalOrder > 0
        ? Math.round(((latest.totalOrder - previous.totalOrder) / previous.totalOrder) * 100)
        : 0;
      if (orderChange < -15) {
        result.push({
          type: 'order_decline', title: `Orders dropped ${Math.abs(orderChange)}%`,
          description: `${latest.totalOrder} orders today vs ${previous.totalOrder} yesterday. Investigate order sources.`,
          value: `${latest.totalOrder} orders`, change: orderChange,
          severity: orderChange < -30 ? 'critical' : 'warning',
          detail: { current: latest, previous, metric: 'orders' },
        });
      }
    }

    // 3. Low advance rate
    if (latest && latest.advanceRate < 40 && latest.totalOrderValue > 10000) {
      result.push({
        type: 'low_advance', title: `Advance rate is low at ${latest.advanceRate}%`,
        description: `Only ${formatBDT(latest.totalAdvance)} collected against ${formatBDT(latest.totalOrderValue)} order value. Target: 60%+.`,
        value: `${latest.advanceRate}%`, severity: latest.advanceRate < 25 ? 'critical' : 'warning',
        detail: { report: latest, metric: 'advance_rate' },
      });
    }

    // 4. High customize rate
    if (latest && latest.totalOrder > 5) {
      const customizeRate = Math.round((latest.customizeOrder / latest.totalOrder) * 100);
      if (customizeRate > 50) {
        result.push({
          type: 'high_customize', title: `${customizeRate}% orders are customize`,
          description: `${latest.customizeOrder} out of ${latest.totalOrder} orders are customize. May affect delivery timelines.`,
          value: `${customizeRate}%`, severity: customizeRate > 70 ? 'warning' : 'info',
          detail: { report: latest, metric: 'customize_rate' },
        });
      }
    }

    // 5. Dead stock alerts
    if (products && products.length > 0) {
      const deadStock = products.filter(p => {
        const lastSeen = getProductLastSeen(p);
        if (!lastSeen) return false;
        const daysSince = Math.floor((Date.now() - lastSeen.getTime()) / 86400000);
        return daysSince > 14 && p.totalQuantitySold > 0;
      });
      if (deadStock.length > 0) {
        const topDead = deadStock.sort((a, b) => b.totalQuantitySold - a.totalQuantitySold).slice(0, 3);
        result.push({
          type: 'dead_stock', title: `${deadStock.length} products with no sales in 14+ days`,
          description: `Top dead stock: ${topDead.map(p => p.name).join(', ')}. Consider promotions or discontinuing.`,
          value: `${deadStock.length} items`, severity: 'critical',
          detail: { products: deadStock, metric: 'dead_stock' },
        });
      }
    }

    // 6. Missing data gaps
    if (sorted.length >= 3) {
      const last30 = sorted.filter(r => {
        const daysAgo = Math.floor((Date.now() - new Date(r.dateString).getTime()) / 86400000);
        return daysAgo <= 30;
      });
      if (last30.length < 20) {
        result.push({
          type: 'missing_data', title: `${30 - last30.length} missing reports in last 30 days`,
          description: `Only ${last30.length} of 30 days have reports. Regular data entry ensures accurate analytics.`,
          value: `${30 - last30.length} gaps`, severity: 'warning',
          detail: { reports: last30, metric: 'data_completeness' },
        });
      }
    }

    // 7. Milestones
    const totalRevenue = sorted.reduce((sum, r) => sum + (r.totalOrderValue || 0), 0);
    const totalOrders = sorted.reduce((sum, r) => sum + (r.totalOrder || 0), 0);
    if (totalRevenue > 0) {
      const revenueMilestones = [100000, 500000, 1000000, 5000000, 10000000];
      for (const m of revenueMilestones) {
        if (totalRevenue >= m && totalRevenue < m * 1.1) {
          result.push({
            type: 'milestone', title: `Revenue milestone: ${formatBDTShort(m)}!`,
            description: `Total revenue has reached ${formatBDT(totalRevenue)} across ${sorted.length} reports. Keep growing!`,
            value: formatBDT(totalRevenue), severity: 'success',
            detail: { total: totalRevenue, reports: sorted.length, metric: 'revenue_milestone' },
          });
          break;
        }
      }
    }

    // 8. Weekend trend
    const weekdayAnalysis = computeWeekdayAnalysis(sorted);
    if (weekdayAnalysis.length >= 5) {
      const weekend = weekdayAnalysis.filter(d => ['Fri', 'Sat'].includes(d.day));
      const weekday = weekdayAnalysis.filter(d => !['Fri', 'Sat'].includes(d.day));
      if (weekend.length > 0 && weekday.length > 0) {
        const weekendAvg = weekend.reduce((s, d) => s + d.avgValue, 0) / weekend.length;
        const weekdayAvg = weekday.reduce((s, d) => s + d.avgValue, 0) / weekday.length;
        if (weekdayAvg > 0) {
          const diff = Math.round(((weekendAvg - weekdayAvg) / weekdayAvg) * 100);
          result.push({
            type: 'weekend_drop', title: `Weekend revenue ${diff >= 0 ? 'leads' : 'lags'} weekday by ${Math.abs(diff)}%`,
            description: `Weekend avg: ${formatBDTShort(weekendAvg)} vs Weekday avg: ${formatBDTShort(weekdayAvg)}.`,
            value: `${diff >= 0 ? '+' : ''}${diff}%`, severity: 'info',
            detail: { weekend: weekendAvg, weekday: weekdayAvg, diff, metric: 'weekend_trend' },
          });
        }
      }
    }

    // 9. 7-day rolling trend
    const rollingAvg = computeRollingAverage(sorted, 7);
    if (rollingAvg.length >= 2) {
      const last7 = rollingAvg.slice(-7);
      if (last7.length >= 2) {
        const trend = last7[last7.length - 1].avgOrder - last7[0].avgOrder;
        if (Math.abs(trend) > 2) {
          result.push({
            type: trend > 0 ? 'surge' : 'order_decline',
            title: `7-day trend: ${trend > 0 ? 'Upward' : 'Downward'} trajectory`,
            description: `Rolling average ${trend > 0 ? 'increased' : 'decreased'} by ${Math.abs(Math.round(trend))} orders over the last week.`,
            value: `${Math.round(rollingAvg[rollingAvg.length - 1].avgOrder)} avg`, severity: trend > 0 ? 'success' : 'warning',
            detail: { rollingAvg: last7, trend, metric: 'rolling_trend' },
          });
        }
      }
    }

    // 10. WoW growth
    const wow = computeWeekOverWeekGrowth(sorted);
    if (wow && Math.abs(wow.valueGrowth) > 10) {
      result.push({
        type: wow.valueGrowth > 0 ? 'surge' : 'revenue_drop',
        title: `Week-over-week: ${wow.valueGrowth > 0 ? '+' : ''}${wow.valueGrowth}% value change`,
        description: `This week: ${formatBDTShort(wow.currentValue)} (${wow.currentOrders} orders) vs last week: ${formatBDTShort(wow.previousValue)} (${wow.previousOrders} orders).`,
        value: `${wow.valueGrowth > 0 ? '+' : ''}${wow.valueGrowth}%`, severity: wow.valueGrowth > 0 ? 'success' : 'warning',
        detail: { wow, metric: 'wow_growth' },
      });
    }

    // Sort by severity
    const severityOrder = { critical: 0, warning: 1, info: 2, success: 3 };
    result.sort((a, b) => (severityOrder[a.severity] || 2) - (severityOrder[b.severity] || 2));

    return result;
  }, [reports, products]);

  const filteredAlerts = useMemo(() => {
    if (filter === 'all') return alerts;
    if (filter === 'critical') return alerts.filter(a => a.severity === 'critical');
    if (filter === 'warning') return alerts.filter(a => a.severity === 'warning');
    if (filter === 'success') return alerts.filter(a => a.severity === 'success');
    if (filter === 'info') return alerts.filter(a => a.severity === 'info');
    return alerts;
  }, [alerts, filter]);

  const stats = useMemo(() => ({
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    success: alerts.filter(a => a.severity === 'success').length,
    info: alerts.filter(a => a.severity === 'info').length,
  }), [alerts]);

  const openAlertDetail = (alert) => {
    const type = ALERT_TYPES[alert.type] || ALERT_TYPES.no_reports;
    let detailContent = null;

    if (alert.detail?.metric === 'revenue' || alert.detail?.metric === 'orders') {
      const { current, previous } = alert.detail;
      detailContent = (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-accent-teal/5 border border-accent-teal/15 rounded-xl p-3 text-center">
              <p className="text-[9px] text-accent-teal uppercase">Today</p>
              <p className="text-lg font-bold font-mono text-text-primary">{alert.detail.metric === 'revenue' ? formatBDT(current.totalOrderValue) : current.totalOrder}</p>
              <p className="text-[10px] text-text-muted">{formatDateShort(current.dateString)}</p>
            </div>
            <div className="bg-bg-elevated/60 rounded-xl p-3 text-center">
              <p className="text-[9px] text-text-muted uppercase">Yesterday</p>
              <p className="text-lg font-bold font-mono text-text-primary">{alert.detail.metric === 'revenue' ? formatBDT(previous.totalOrderValue) : previous.totalOrder}</p>
              <p className="text-[10px] text-text-muted">{formatDateShort(previous.dateString)}</p>
            </div>
          </div>
          <div className="bg-bg-elevated/30 rounded-xl p-3">
            <p className="text-[10px] text-text-muted uppercase mb-2">Recent Trend</p>
            <div className="flex items-end gap-1 h-16">
              {[current, previous].map((r, i) => {
                const val = alert.detail.metric === 'revenue' ? r.totalOrderValue : r.totalOrder;
                const maxVal = Math.max(current.totalOrderValue || current.totalOrder, previous.totalOrderValue || previous.totalOrder);
                return (
                  <div key={i} className="flex-1 rounded-t" style={{
                    height: `${maxVal > 0 ? (val / maxVal) * 100 : 0}%`,
                    background: i === 0 ? 'linear-gradient(180deg, #C9A84C, #C9A84C80)' : 'linear-gradient(180deg, #64748B, #64748B80)',
                  }} />
                );
              })}
            </div>
            <div className="flex gap-1 mt-1">
              <span className="flex-1 text-center text-[8px] text-text-muted">Today</span>
              <span className="flex-1 text-center text-[8px] text-text-muted">Yesterday</span>
            </div>
          </div>
        </div>
      );
    } else if (alert.detail?.metric === 'advance_rate') {
      const { report } = alert.detail;
      detailContent = (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-accent-gold/5 border border-accent-gold/15 rounded-xl p-3 text-center">
              <p className="text-[9px] text-accent-gold uppercase">Collected</p>
              <p className="text-lg font-bold font-mono text-accent-gold">{formatBDT(report.totalAdvance)}</p>
            </div>
            <div className="bg-bg-elevated/60 rounded-xl p-3 text-center">
              <p className="text-[9px] text-text-muted uppercase">Pending</p>
              <p className="text-lg font-bold font-mono text-accent-rose">{formatBDT(report.outstandingAmount)}</p>
            </div>
          </div>
          <div className="h-3 bg-bg-elevated rounded-full overflow-hidden flex">
            <div className="h-full bg-accent-gold rounded-full" style={{ width: `${report.advanceRate}%` }} />
            <div className="h-full bg-accent-rose/50 rounded-full" style={{ width: `${100 - report.advanceRate}%` }} />
          </div>
          <p className="text-center text-xs text-text-muted">{report.advanceRate}% advance rate (target: 60%+)</p>
        </div>
      );
    } else if (alert.detail?.metric === 'dead_stock') {
      detailContent = (
        <div className="space-y-2">
          {alert.detail.products.slice(0, 10).map(p => (
            <div key={p.name} className="flex items-center justify-between bg-bg-elevated/40 rounded-xl px-3 py-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">{p.name}</p>
                <p className="text-[9px] text-text-muted">{p.category || 'Other'} · {p.totalQuantitySold} sold total</p>
              </div>
              <span className="text-[10px] font-mono text-accent-rose">Last: {formatDateShort(getProductLastSeen(p)?.toISOString().slice(0,10))}</span>
            </div>
          ))}
        </div>
      );
    } else if (alert.detail?.metric === 'wow_growth') {
      const { wow } = alert.detail;
      detailContent = (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-accent-teal/5 border border-accent-teal/15 rounded-xl p-3 text-center">
              <p className="text-[9px] text-accent-teal uppercase">This Week</p>
              <p className="text-sm font-bold font-mono text-text-primary">{formatNumber(wow.currentOrders)} orders</p>
              <p className="text-[10px] text-accent-gold font-mono">{formatBDTShort(wow.currentValue)}</p>
              <p className="text-[9px] text-text-muted">{wow.currentDays} days</p>
            </div>
            <div className="bg-bg-elevated/60 rounded-xl p-3 text-center">
              <p className="text-[9px] text-text-muted uppercase">Last Week</p>
              <p className="text-sm font-bold font-mono text-text-primary">{formatNumber(wow.previousOrders)} orders</p>
              <p className="text-[10px] text-text-muted font-mono">{formatBDTShort(wow.previousValue)}</p>
              <p className="text-[9px] text-text-muted">{wow.previousDays} days</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2 rounded-xl bg-bg-elevated/30">
              <p className={`text-lg font-mono font-bold ${wow.orderGrowth >= 0 ? 'text-accent-teal' : 'text-accent-rose'}`}>
                {wow.orderGrowth >= 0 ? '+' : ''}{wow.orderGrowth}%
              </p>
              <p className="text-[9px] text-text-muted">Orders</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-bg-elevated/30">
              <p className={`text-lg font-mono font-bold ${wow.valueGrowth >= 0 ? 'text-accent-teal' : 'text-accent-rose'}`}>
                {wow.valueGrowth >= 0 ? '+' : ''}{wow.valueGrowth}%
              </p>
              <p className="text-[9px] text-text-muted">Value</p>
            </div>
          </div>
        </div>
      );
    } else if (alert.detail?.metric === 'rolling_trend') {
      detailContent = (
        <div className="space-y-2">
          {alert.detail.rollingAvg.map(d => (
            <div key={d.date} className="flex items-center justify-between bg-bg-elevated/40 rounded-xl px-3 py-2">
              <span className="text-xs font-medium text-text-primary">{d.date}</span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-text-muted">{d.totalOrder} actual</span>
                <span className="text-[10px] font-mono font-semibold text-accent-gold">{d.avgOrder} avg</span>
              </div>
            </div>
          ))}
        </div>
      );
    } else if (alert.detail?.metric === 'weekend_trend') {
      detailContent = (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-accent-gold/5 border border-accent-gold/15 rounded-xl p-3 text-center">
              <p className="text-[9px] text-accent-gold uppercase">Weekday Avg</p>
              <p className="text-lg font-bold font-mono text-text-primary">{formatBDTShort(alert.detail.weekday)}</p>
            </div>
            <div className="bg-accent-rose/5 border border-accent-rose/15 rounded-xl p-3 text-center">
              <p className="text-[9px] text-accent-rose uppercase">Weekend Avg</p>
              <p className="text-lg font-bold font-mono text-text-primary">{formatBDTShort(alert.detail.weekend)}</p>
            </div>
          </div>
          <div className="text-center p-2 rounded-xl bg-bg-elevated/30">
            <p className={`text-lg font-mono font-bold ${alert.detail.diff >= 0 ? 'text-accent-teal' : 'text-accent-rose'}`}>
              {alert.detail.diff >= 0 ? '+' : ''}{alert.detail.diff}%
            </p>
            <p className="text-[9px] text-text-muted">Weekend vs Weekday</p>
          </div>
        </div>
      );
    } else if (alert.detail?.metric === 'customize_rate') {
      const { report } = alert.detail;
      detailContent = (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-accent-gold/5 border border-accent-gold/15 rounded-xl p-3 text-center">
              <p className="text-[9px] text-accent-gold uppercase">Regular</p>
              <p className="text-lg font-bold font-mono text-text-primary">{report.regularOrder}</p>
            </div>
            <div className="bg-accent-rose/5 border border-accent-rose/15 rounded-xl p-3 text-center">
              <p className="text-[9px] text-accent-rose uppercase">Customize</p>
              <p className="text-lg font-bold font-mono text-text-primary">{report.customizeOrder}</p>
            </div>
          </div>
          <div className="h-3 bg-bg-elevated rounded-full overflow-hidden flex">
            <div className="h-full bg-accent-gold rounded-full" style={{ width: `${100 - Math.round((report.customizeOrder / report.totalOrder) * 100)}%` }} />
            <div className="h-full bg-accent-rose rounded-full" style={{ width: `${Math.round((report.customizeOrder / report.totalOrder) * 100)}%` }} />
          </div>
          <p className="text-center text-xs text-text-muted">{Math.round((report.customizeOrder / report.totalOrder) * 100)}% customize rate</p>
        </div>
      );
    } else {
      detailContent = (
        <div className="bg-bg-elevated/40 rounded-xl p-4">
          <p className="text-xs text-text-muted leading-relaxed">{alert.description}</p>
        </div>
      );
    }

    setModal({
      title: alert.title, icon: type.icon, color: type.color,
      subtitle: `${type.label} · ${alert.severity.toUpperCase()}`,
      content: detailContent,
    });
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="h-16 bg-bg-elevated/50 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-4 gap-2">{[1,2,3,4].map(i => <div key={i} className="h-12 bg-bg-elevated/50 rounded-2xl animate-pulse" />)}</div>
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-bg-elevated/50 rounded-2xl animate-pulse" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-accent-rose to-rose-500 rounded-2xl p-5 text-white shadow-lg shadow-accent-rose/20">
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />
        <div className="relative">
          <h1 className="text-xl font-bold tracking-tight">Alerts & Insights</h1>
          <p className="text-white/80 text-xs mt-1">{stats.total} alerts · {stats.critical} critical</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: 'Critical', value: stats.critical, color: '#E11D48', bg: 'bg-accent-rose/5 border-accent-rose/15' },
          { label: 'Warning', value: stats.warning, color: '#F59E0B', bg: 'bg-amber-50 border-amber-200/50' },
          { label: 'Success', value: stats.success, color: '#0D9488', bg: 'bg-accent-teal/5 border-accent-teal/15' },
          { label: 'Info', value: stats.info, color: '#64748B', bg: 'bg-bg-elevated/40 border-border/30' },
        ].map(s => (
          <button key={s.label} onClick={() => setFilter(s.label.toLowerCase())}
            className={`${s.bg} border rounded-xl p-2.5 text-center transition-all hover:shadow-md`}>
            <p className="text-lg font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] text-text-muted uppercase">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'All', count: stats.total },
          { key: 'critical', label: '🔴 Critical', count: stats.critical },
          { key: 'warning', label: '🟡 Warning', count: stats.warning },
          { key: 'success', label: '🟢 Success', count: stats.success },
          { key: 'info', label: '⚪ Info', count: stats.info },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all border whitespace-nowrap ${
              filter === f.key
                ? 'bg-accent-gold text-white border-accent-gold shadow-md shadow-accent-gold/20'
                : 'bg-white/80 text-text-muted border-border/30 hover:border-accent-gold/30'
            }`}>
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Alert list */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-white/80 border border-border/30 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-accent-teal/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">✅</span>
          </div>
          <p className="text-sm font-semibold text-text-primary">All clear!</p>
          <p className="text-xs text-text-muted mt-1">No {filter === 'all' ? '' : filter} alerts at this time</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAlerts.map((alert, i) => (
            <AlertCard key={i} alert={alert} index={i} onClick={() => openAlertDetail(alert)} />
          ))}
        </div>
      )}

      {/* DetailModal */}
      {modal && (
        <DetailModal open={!!modal} onClose={() => setModal(null)} title={modal.title} subtitle={modal.subtitle} icon={modal.icon} color={modal.color}>
          {modal.content}
        </DetailModal>
      )}
    </div>
  );
}

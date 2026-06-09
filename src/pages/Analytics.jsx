import { useState, useMemo, useCallback } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Cell } from 'recharts';
import { useReports } from '../hooks/useReports';
import {
  computeYearlySummary,
  computeWeekdayAnalysis,
  computeRollingAverage,
  computeProductsPerOrderTrend,
  computeSameWeekdayComparison,
  computeWeekOverWeekGrowth,
  computeMTDComparison,
} from '../utils/analytics';
import { formatBDT, formatDateShort, formatNumber, formatBDTShort, formatPercent, getChangeColor, getChangeIcon } from '../utils/formatters';
import DetailModal from '../components/UI/DetailModal';
import { filterReportsByRange } from '../utils/dateUtils';

const TABS = [
  { id: 'overview', icon: '📊', label: 'Overview' },
  { id: 'financial', icon: '💰', label: 'Financial' },
  { id: 'orders', icon: '📦', label: 'Orders' },
  { id: 'trends', icon: '📈', label: 'Trends' },
  { id: 'comparison', icon: '⚖', label: 'Compare' },
  { id: 'periodic', icon: '📅', label: 'Periodic' },
];

function AnalyticsCard({ icon, title, value, subtitle, trend, trendLabel, onClick, color = '#C9A84C' }) {
  const changeVal = trend !== undefined && trend !== null ? Number(trend) : null;
  const isPositive = changeVal !== null && changeVal >= 0;
  return (
    <button
      onClick={onClick}
      className="bg-white/80 backdrop-blur-xl border border-border/30 rounded-2xl p-3.5 text-left group hover:shadow-lg hover:shadow-accent-gold/8 hover:border-accent-gold/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-0.5 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, ${color}, ${color}80, transparent)` }} />
      <div className="flex items-start justify-between mb-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background: `${color}15`, color }}>{icon}</div>
        {changeVal !== null && (
          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${isPositive ? 'bg-accent-teal/10 text-accent-teal' : 'bg-accent-rose/10 text-accent-rose'}`}>
            {isPositive ? '▲' : '▼'}{Math.abs(changeVal)}%
          </span>
        )}
      </div>
      <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium">{title}</p>
      <p className="text-base font-bold font-mono text-text-primary mt-0.5">{value}</p>
      {subtitle && <p className="text-[10px] text-text-muted mt-0.5">{subtitle}</p>}
      {trendLabel && <p className="text-[9px] text-text-muted/60 mt-1">{trendLabel}</p>}
    </button>
  );
}

function SectionHeader({ icon, title, subtitle, onClick, color = '#C9A84C' }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-sm" style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}>{icon}</div>
        <div>
          <h3 className="text-sm font-bold text-text-primary tracking-tight">{title}</h3>
          {subtitle && <p className="text-[10px] text-text-muted">{subtitle}</p>}
        </div>
      </div>
      {onClick && (
        <button onClick={onClick} className="w-7 h-7 rounded-lg bg-bg-elevated/60 hover:bg-accent-gold/10 flex items-center justify-center text-text-muted hover:text-accent-gold transition-all opacity-0 group-hover:opacity-100">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
        </button>
      )}
    </div>
  );
}

function ChartCard({ children, onClick, title, className = '' }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white/80 backdrop-blur-xl border border-border/30 rounded-2xl p-4 cursor-pointer hover:shadow-lg hover:shadow-accent-gold/8 hover:border-accent-gold/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-xl border border-border/40 rounded-xl p-3 shadow-xl">
      <p className="text-[10px] text-text-muted font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-[10px] text-text-muted">{p.name}:</span>
          <span className="text-[11px] font-mono font-semibold text-text-primary">{formatter ? formatter(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [range, setRange] = useState({ type: '30d' });
  const { reports, loading } = useReports();
  const [activeTab, setActiveTab] = useState('overview');
  const [modal, setModal] = useState(null);

  const filteredReports = useMemo(() => filterReportsByRange(reports, range), [reports, range]);

  const weekdayAnalysis = useMemo(() => computeWeekdayAnalysis(filteredReports), [filteredReports]);
  const rollingAvg = useMemo(() => computeRollingAverage(filteredReports, 7), [filteredReports]);
  const productsPerOrder = useMemo(() => computeProductsPerOrderTrend(filteredReports), [filteredReports]);
  const sameWeekday = useMemo(() => computeSameWeekdayComparison(reports || []), [reports]);
  const wowGrowth = useMemo(() => computeWeekOverWeekGrowth(reports || []), [reports]);
  const mtdComparison = useMemo(() => computeMTDComparison(reports || []), [reports]);

  const orderTrend = useMemo(() => filteredReports.map(r => ({
    date: formatDateShort(r.dateString), orders: r.totalOrder, regular: r.regularOrder, customize: r.customizeOrder,
  })), [filteredReports]);

  const advanceTrend = useMemo(() => filteredReports.map(r => ({
    date: formatDateShort(r.dateString), advance: r.totalAdvance, outstanding: r.outstandingAmount, rate: r.advanceRate,
  })), [filteredReports]);

  const customizeTrend = useMemo(() => filteredReports.filter(r => r.totalOrder > 0).map(r => ({
    date: formatDateShort(r.dateString), pct: Math.round((r.customizeOrder / r.totalOrder) * 100),
  })), [filteredReports]);

  const revenuePerProduct = useMemo(() => filteredReports.filter(r => r.totalProduct > 0).map(r => ({
    date: formatDateShort(r.dateString), value: Math.round(r.totalOrderValue / r.totalProduct),
  })), [filteredReports]);

  const revenueTrend = useMemo(() => filteredReports.map(r => ({
    date: formatDateShort(r.dateString), revenue: r.totalOrderValue, advance: r.totalAdvance,
  })), [filteredReports]);

  const bestDay = useMemo(() => {
    if (weekdayAnalysis.length === 0) return null;
    return weekdayAnalysis.reduce((best, curr) => curr.avgValue > (best?.avgValue || 0) ? curr : best, null);
  }, [weekdayAnalysis]);

  const aggStats = useMemo(() => {
    if (filteredReports.length === 0) return null;
    const a = filteredReports.reduce((acc, r) => ({
      totalOrder: acc.totalOrder + (r.totalOrder || 0),
      totalValue: acc.totalValue + (r.totalOrderValue || 0),
      totalAdvance: acc.totalAdvance + (r.totalAdvance || 0),
      totalProducts: acc.totalProducts + (r.totalProduct || 0),
    }), { totalOrder: 0, totalValue: 0, totalAdvance: 0, totalProducts: 0 });
    return {
      ...a,
      avgOrderValue: a.totalOrder > 0 ? Math.round(a.totalValue / a.totalOrder) : 0,
      avgDailyOrders: filteredReports.length > 0 ? Math.round(a.totalOrder / filteredReports.length) : 0,
      advanceRate: a.totalValue > 0 ? Math.round((a.totalAdvance / a.totalValue) * 100) : 0,
    };
  }, [filteredReports]);

  const handleRangeChange = useCallback((newRange) => setRange(newRange), []);

  const openOverviewModal = () => {
    setModal({
      title: 'Overview Summary', icon: '📊', color: '#C9A84C',
      subtitle: `All metrics for ${filteredReports.length} reports`,
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Total Reports', value: filteredReports.length },
              { label: 'Total Orders', value: formatNumber(aggStats?.totalOrder || 0) },
              { label: 'Total Revenue', value: formatBDT(aggStats?.totalValue || 0) },
              { label: 'Total Advance', value: formatBDT(aggStats?.totalAdvance || 0) },
              { label: 'Avg Order Value', value: formatBDT(aggStats?.avgOrderValue || 0) },
              { label: 'Avg Daily Orders', value: aggStats?.avgDailyOrders || 0 },
              { label: 'Advance Rate', value: `${aggStats?.advanceRate || 0}%` },
              { label: 'Total Products', value: formatNumber(aggStats?.totalProducts || 0) },
            ].map(s => (
              <div key={s.label} className="bg-bg-elevated/40 rounded-xl p-3 text-center">
                <p className="text-[9px] text-text-muted uppercase">{s.label}</p>
                <p className="text-sm font-bold font-mono text-text-primary">{s.value}</p>
              </div>
            ))}
          </div>
          {bestDay && (
            <div className="bg-accent-gold/5 border border-accent-gold/15 rounded-xl p-3">
              <p className="text-[10px] text-accent-gold uppercase font-medium">Best Revenue Day</p>
              <p className="text-sm font-semibold text-text-primary">{bestDay.day}s avg {formatBDT(bestDay.avgValue)}</p>
            </div>
          )}
        </div>
      ),
    });
  };

  const openWeekdayModal = () => {
    setModal({
      title: 'Weekday Analysis', icon: '📅', color: '#0D9488',
      subtitle: 'Performance breakdown by day of week',
      content: (
        <div className="space-y-2">
          {weekdayAnalysis.map(d => (
            <div key={d.day} className="flex items-center justify-between bg-bg-elevated/40 rounded-xl px-3 py-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${['Sat','Sun'].includes(d.day) ? 'bg-accent-rose' : 'bg-accent-gold'}`} />
                <span className="text-xs font-medium text-text-primary">{d.day}</span>
                <span className="text-[9px] text-text-muted">({d.count} reports)</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono text-text-muted">{d.avgOrders} avg orders</span>
                <span className="text-[10px] font-mono text-accent-gold font-semibold">{formatBDT(d.avgValue)}</span>
              </div>
            </div>
          ))}
        </div>
      ),
    });
  };

  const openSameWeekdayModal = () => {
    if (!sameWeekday) return;
    setModal({
      title: 'Same Weekday Compare', icon: '📆', color: '#E11D48',
      subtitle: `This ${sameWeekday.current.dayOfWeek} vs Last ${sameWeekday.previous.dayOfWeek}`,
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-accent-teal/5 border border-accent-teal/15 rounded-xl p-3 text-center">
              <p className="text-[9px] text-accent-teal uppercase">This {sameWeekday.current.dayOfWeek}</p>
              <p className="text-lg font-bold font-mono text-text-primary">{formatNumber(sameWeekday.current.totalOrder)}</p>
              <p className="text-[10px] text-text-muted">{formatBDTShort(sameWeekday.current.totalOrderValue)}</p>
            </div>
            <div className="bg-bg-elevated/60 rounded-xl p-3 text-center">
              <p className="text-[9px] text-text-muted uppercase">Last {sameWeekday.previous.dayOfWeek}</p>
              <p className="text-lg font-bold font-mono text-text-primary">{formatNumber(sameWeekday.previous.totalOrder)}</p>
              <p className="text-[10px] text-text-muted">{formatBDTShort(sameWeekday.previous.totalOrderValue)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2 rounded-xl bg-bg-elevated/30">
              <p className={`text-lg font-mono font-bold ${sameWeekday.orderChange >= 0 ? 'text-accent-teal' : 'text-accent-rose'}`}>
                {sameWeekday.orderChange >= 0 ? '+' : ''}{sameWeekday.orderChange}%
              </p>
              <p className="text-[9px] text-text-muted">Orders Change</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-bg-elevated/30">
              <p className={`text-lg font-mono font-bold ${sameWeekday.valueChange >= 0 ? 'text-accent-teal' : 'text-accent-rose'}`}>
                {sameWeekday.valueChange >= 0 ? '+' : ''}{sameWeekday.valueChange}%
              </p>
              <p className="text-[9px] text-text-muted">Value Change</p>
            </div>
          </div>
        </div>
      ),
    });
  };

  const openWowModal = () => {
    if (!wowGrowth) return;
    setModal({
      title: 'Week-over-Week Growth', icon: '📈', color: '#C9A84C',
      subtitle: 'This week vs last week performance',
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'This Week', orders: formatNumber(wowGrowth.currentOrders), value: formatBDTShort(wowGrowth.currentValue), days: wowGrowth.currentDays },
              { label: 'Last Week', orders: formatNumber(wowGrowth.previousOrders), value: formatBDTShort(wowGrowth.previousValue), days: wowGrowth.previousDays },
            ].map(w => (
              <div key={w.label} className="bg-bg-elevated/40 rounded-xl p-3 text-center">
                <p className="text-[9px] text-text-muted uppercase">{w.label}</p>
                <p className="text-sm font-bold font-mono text-text-primary">{w.orders} orders</p>
                <p className="text-[10px] text-accent-gold font-mono">{w.value}</p>
                <p className="text-[9px] text-text-muted">{w.days} active days</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2 rounded-xl bg-bg-elevated/30">
              <p className={`text-lg font-mono font-bold ${wowGrowth.orderGrowth >= 0 ? 'text-accent-teal' : 'text-accent-rose'}`}>
                {wowGrowth.orderGrowth >= 0 ? '+' : ''}{wowGrowth.orderGrowth}%
              </p>
              <p className="text-[9px] text-text-muted">Orders Growth</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-bg-elevated/30">
              <p className={`text-lg font-mono font-bold ${wowGrowth.valueGrowth >= 0 ? 'text-accent-teal' : 'text-accent-rose'}`}>
                {wowGrowth.valueGrowth >= 0 ? '+' : ''}{wowGrowth.valueGrowth}%
              </p>
              <p className="text-[9px] text-text-muted">Value Growth</p>
            </div>
          </div>
        </div>
      ),
    });
  };

  const openMtdModal = () => {
    if (!mtdComparison) return;
    setModal({
      title: 'Month-to-Date vs Last Month', icon: '🗓', color: '#0D9488',
      subtitle: 'MTD performance comparison',
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-accent-teal/5 border border-accent-teal/15 rounded-xl p-3 text-center">
              <p className="text-[9px] text-accent-teal uppercase">This Month (MTD)</p>
              <p className="text-lg font-bold font-mono text-text-primary">{formatNumber(mtdComparison.mtd.orders)} orders</p>
              <p className="text-[10px] text-accent-gold font-mono">{formatBDTShort(mtdComparison.mtd.value)}</p>
              <p className="text-[9px] text-text-muted">{mtdComparison.mtd.days} days</p>
            </div>
            <div className="bg-bg-elevated/60 rounded-xl p-3 text-center">
              <p className="text-[9px] text-text-muted uppercase">Last Month</p>
              <p className="text-lg font-bold font-mono text-text-primary">{formatNumber(mtdComparison.lastMonth.orders)} orders</p>
              <p className="text-[10px] text-text-muted font-mono">{formatBDTShort(mtdComparison.lastMonth.value)}</p>
              <p className="text-[9px] text-text-muted">{mtdComparison.lastMonth.days} days</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2 rounded-xl bg-bg-elevated/30">
              <p className={`text-lg font-mono font-bold ${mtdComparison.orderGrowth >= 0 ? 'text-accent-teal' : 'text-accent-rose'}`}>
                {mtdComparison.orderGrowth >= 0 ? '+' : ''}{mtdComparison.orderGrowth}%
              </p>
              <p className="text-[9px] text-text-muted">Orders</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-bg-elevated/30">
              <p className={`text-lg font-mono font-bold ${mtdComparison.valueGrowth >= 0 ? 'text-accent-teal' : 'text-accent-rose'}`}>
                {mtdComparison.valueGrowth >= 0 ? '+' : ''}{mtdComparison.valueGrowth}%
              </p>
              <p className="text-[9px] text-text-muted">Value</p>
            </div>
          </div>
        </div>
      ),
    });
  };

  const openRevenueModal = () => {
    setModal({
      title: 'Revenue & Advance', icon: '💰', color: '#C9A84C',
      subtitle: 'Daily revenue and advance collection',
      content: (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {revenueTrend.map(d => (
            <div key={d.date} className="flex items-center justify-between bg-bg-elevated/40 rounded-xl px-3 py-2">
              <span className="text-xs font-medium text-text-primary">{d.date}</span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-accent-gold">{formatBDT(d.revenue)}</span>
                <span className="text-[10px] font-mono text-accent-teal">{formatBDT(d.advance)}</span>
              </div>
            </div>
          ))}
        </div>
      ),
    });
  };

  const openAdvanceRateModal = () => {
    setModal({
      title: 'Advance Rate Trend', icon: '💳', color: '#0D9488',
      subtitle: 'Daily advance collection rate',
      content: (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {advanceTrend.map(d => (
            <div key={d.date} className="flex items-center justify-between bg-bg-elevated/40 rounded-xl px-3 py-2">
              <span className="text-xs font-medium text-text-primary">{d.date}</span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-text-muted">{formatBDT(d.advance)}</span>
                <span className={`text-xs font-mono font-semibold ${d.rate >= 50 ? 'text-accent-teal' : 'text-accent-rose'}`}>{d.rate}%</span>
              </div>
            </div>
          ))}
        </div>
      ),
    });
  };

  const openOrderTrendModal = () => {
    setModal({
      title: 'Order Trend', icon: '📦', color: '#C9A84C',
      subtitle: 'Daily regular vs customize orders',
      content: (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {orderTrend.map(d => (
            <div key={d.date} className="flex items-center justify-between bg-bg-elevated/40 rounded-xl px-3 py-2">
              <span className="text-xs font-medium text-text-primary">{d.date}</span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-accent-gold">{d.regular} reg</span>
                <span className="text-[10px] font-mono text-accent-rose">{d.customize} cus</span>
                <span className="text-[10px] font-mono font-semibold text-text-primary">{d.orders} total</span>
              </div>
            </div>
          ))}
        </div>
      ),
    });
  };

  const openRollingAvgModal = () => {
    setModal({
      title: '7-Day Rolling Average', icon: '📉', color: '#E11D48',
      subtitle: 'Smoothed trend of daily orders',
      content: (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {rollingAvg.map(d => (
            <div key={d.date} className="flex items-center justify-between bg-bg-elevated/40 rounded-xl px-3 py-2">
              <span className="text-xs font-medium text-text-primary">{d.date}</span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-text-muted">{d.totalOrder} actual</span>
                <span className="text-[10px] font-mono font-semibold text-accent-gold">{d.avgOrder} avg</span>
              </div>
            </div>
          ))}
        </div>
      ),
    });
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="h-16 bg-bg-elevated/50 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 gap-2">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-bg-elevated/50 rounded-2xl animate-pulse" />)}</div>
        <div className="h-64 bg-bg-elevated/50 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-accent-gold to-amber-500 rounded-2xl p-5 text-white shadow-lg shadow-accent-gold/20">
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />
        <div className="relative">
          <h1 className="text-xl font-bold tracking-tight">Analytics</h1>
          <p className="text-white/80 text-xs mt-1">Deep insights across {filteredReports.length} reports</p>
        </div>
      </div>

      {/* Range pills */}
      <div className="flex gap-1.5 flex-wrap">
        {['7d', '30d', '90d'].map(t => (
          <button key={t} onClick={() => setRange({ type: t })}
            className={`px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all border ${
              range.type === t ? 'bg-accent-gold text-white border-accent-gold shadow-md shadow-accent-gold/20' : 'bg-white/80 text-text-muted border-border/30 hover:border-accent-gold/30'
            }`}>
            Last {t}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg-elevated/60 p-1 rounded-xl border border-border/30 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[10px] font-semibold transition-all whitespace-nowrap flex-1 justify-center ${
              activeTab === tab.id ? 'bg-white text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'
            }`}>
            <span className="text-xs">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW TAB ─── */}
      {activeTab === 'overview' && aggStats && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <AnalyticsCard icon="📊" title="Reports" value={filteredReports.length} subtitle="in range" onClick={openOverviewModal} />
            <AnalyticsCard icon="📦" title="Total Orders" value={formatNumber(aggStats.totalOrder)} subtitle={`${aggStats.avgDailyOrders}/day avg`} onClick={openOverviewModal} />
            <AnalyticsCard icon="💰" title="Revenue" value={formatBDT(aggStats.totalValue)} subtitle={`${formatBDT(aggStats.avgOrderValue)} avg`} onClick={openOverviewModal} />
            <AnalyticsCard icon="💳" title="Advance" value={`${aggStats.advanceRate}%`} subtitle={formatBDT(aggStats.totalAdvance)} onClick={openOverviewModal} />
          </div>

          {bestDay && (
            <button onClick={openWeekdayModal} className="w-full bg-gradient-to-r from-accent-gold/5 to-accent-teal/5 border border-accent-gold/15 rounded-2xl p-4 text-left hover:shadow-lg hover:shadow-accent-gold/8 transition-all">
              <SectionHeader icon="🏆" title="Best Revenue Day" color="#C9A84C" />
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-lg font-bold font-mono text-accent-gold">{bestDay.day}s</span>
                <span className="text-xs text-text-muted">avg</span>
                <span className="text-sm font-bold font-mono text-text-primary">{formatBDT(bestDay.avgValue)}</span>
                <span className="text-[9px] text-text-muted">({bestDay.count} reports)</span>
              </div>
            </button>
          )}

          {sameWeekday && (
            <button onClick={openSameWeekdayModal} className="w-full bg-white/80 border border-border/30 rounded-2xl p-4 text-left hover:shadow-lg hover:shadow-accent-gold/8 transition-all">
              <SectionHeader icon="📆" title="Same Weekday Compare" color="#E11D48" />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="text-center bg-accent-teal/5 rounded-xl p-2">
                  <p className="text-[9px] text-accent-teal uppercase">This {sameWeekday.current.dayOfWeek}</p>
                  <p className="text-sm font-bold font-mono text-text-primary">{formatNumber(sameWeekday.current.totalOrder)}</p>
                </div>
                <div className="text-center bg-bg-elevated/40 rounded-xl p-2">
                  <p className="text-[9px] text-text-muted uppercase">Last {sameWeekday.previous.dayOfWeek}</p>
                  <p className="text-sm font-bold font-mono text-text-primary">{formatNumber(sameWeekday.previous.totalOrder)}</p>
                </div>
              </div>
            </button>
          )}

          {wowGrowth && (
            <button onClick={openWowModal} className="w-full bg-white/80 border border-border/30 rounded-2xl p-4 text-left hover:shadow-lg hover:shadow-accent-gold/8 transition-all">
              <SectionHeader icon="📈" title="Week-over-Week Growth" color="#C9A84C" />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="text-center bg-bg-elevated/40 rounded-xl p-2">
                  <p className="text-[9px] text-text-muted uppercase">Orders</p>
                  <p className={`text-lg font-mono font-bold ${wowGrowth.orderGrowth >= 0 ? 'text-accent-teal' : 'text-accent-rose'}`}>
                    {wowGrowth.orderGrowth >= 0 ? '+' : ''}{wowGrowth.orderGrowth}%
                  </p>
                </div>
                <div className="text-center bg-bg-elevated/40 rounded-xl p-2">
                  <p className="text-[9px] text-text-muted uppercase">Value</p>
                  <p className={`text-lg font-mono font-bold ${wowGrowth.valueGrowth >= 0 ? 'text-accent-teal' : 'text-accent-rose'}`}>
                    {wowGrowth.valueGrowth >= 0 ? '+' : ''}{wowGrowth.valueGrowth}%
                  </p>
                </div>
              </div>
            </button>
          )}

          {mtdComparison && (
            <button onClick={openMtdModal} className="w-full bg-white/80 border border-border/30 rounded-2xl p-4 text-left hover:shadow-lg hover:shadow-accent-gold/8 transition-all">
              <SectionHeader icon="🗓" title="Month-to-Date vs Last Month" color="#0D9488" />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="text-center bg-accent-teal/5 rounded-xl p-2">
                  <p className="text-[9px] text-accent-teal uppercase">This Month</p>
                  <p className="text-sm font-bold font-mono text-text-primary">{formatNumber(mtdComparison.mtd.orders)}</p>
                  <p className="text-[9px] text-accent-gold font-mono">{formatBDTShort(mtdComparison.mtd.value)}</p>
                </div>
                <div className="text-center bg-bg-elevated/40 rounded-xl p-2">
                  <p className="text-[9px] text-text-muted uppercase">Last Month</p>
                  <p className="text-sm font-bold font-mono text-text-primary">{formatNumber(mtdComparison.lastMonth.orders)}</p>
                  <p className="text-[9px] text-text-muted font-mono">{formatBDTShort(mtdComparison.lastMonth.value)}</p>
                </div>
              </div>
            </button>
          )}
        </div>
      )}

      {/* ─── FINANCIAL TAB ─── */}
      {activeTab === 'financial' && (
        <div className="space-y-3">
          <ChartCard onClick={openRevenueModal}>
            <SectionHeader icon="💰" title="Revenue & Advance" subtitle="Daily breakdown" color="#C9A84C" />
            <div className="mt-3" onClick={e => e.stopPropagation()}>
              {revenueTrend.length === 0 ? <div className="h-48 flex items-center justify-center text-text-muted text-xs">No data</div> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F040" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip content={<CustomTooltip formatter={(v) => formatBDT(v)} />} />
                    <Legend formatter={(v) => <span style={{ color: '#0F172A', fontSize: '10px' }}>{v}</span>} />
                    <Bar dataKey="advance" fill="#2DD4BF" radius={[4, 4, 0, 0]} name="Advance" stackId="a" />
                    <Bar dataKey="revenue" fill="#C9A84C" radius={[4, 4, 0, 0]} name="Revenue" stackId="b" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartCard>

          <ChartCard onClick={openAdvanceRateModal}>
            <SectionHeader icon="💳" title="Advance Rate Trend" subtitle="Daily collection rate" color="#0D9488" />
            <div className="mt-3" onClick={e => e.stopPropagation()}>
              {advanceTrend.length === 0 ? <div className="h-48 flex items-center justify-center text-text-muted text-xs">No data</div> : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={advanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F040" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 9 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip content={<CustomTooltip formatter={(v) => `${v}%`} />} />
                    <Line type="monotone" dataKey="rate" stroke="#C9A84C" strokeWidth={2} dot={false} name="Rate" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartCard>
        </div>
      )}

      {/* ─── ORDERS TAB ─── */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          <ChartCard onClick={openOrderTrendModal}>
            <SectionHeader icon="📦" title="Order Trend" subtitle="Regular vs Customize" color="#C9A84C" />
            <div className="mt-3" onClick={e => e.stopPropagation()}>
              {orderTrend.length === 0 ? <div className="h-48 flex items-center justify-center text-text-muted text-xs">No data</div> : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={orderTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F040" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={(v) => <span style={{ color: '#0F172A', fontSize: '10px' }}>{v}</span>} />
                    <Area type="monotone" dataKey="regular" stackId="1" stroke="#C9A84C" fill="#C9A84C" fillOpacity={0.3} name="Regular" />
                    <Area type="monotone" dataKey="customize" stackId="1" stroke="#E11D48" fill="#E11D48" fillOpacity={0.3} name="Customize" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartCard>

          <div className="grid grid-cols-2 gap-2">
            <ChartCard onClick={openWeekdayModal}>
              <SectionHeader icon="📅" title="Weekday" color="#0D9488" />
              <div className="mt-2" onClick={e => e.stopPropagation()}>
                {weekdayAnalysis.length === 0 ? <div className="h-32 flex items-center justify-center text-text-muted text-xs">No data</div> : (
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={weekdayAnalysis}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F040" />
                      <XAxis dataKey="day" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="avgOrders" radius={[4, 4, 0, 0]} name="Avg Orders">
                        {weekdayAnalysis.map((entry, i) => (
                          <Cell key={i} fill={['Sat','Sun'].includes(entry.day) ? '#E11D48' : '#C9A84C'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>

            <ChartCard onClick={() => setModal({ title: 'Products per Order', icon: '🛒', color: '#0D9488', subtitle: 'Average items per order',
              content: (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {productsPerOrder.map(d => (
                    <div key={d.date} className="flex items-center justify-between bg-bg-elevated/40 rounded-xl px-3 py-2">
                      <span className="text-xs font-medium text-text-primary">{d.date}</span>
                      <span className="text-xs font-mono font-semibold text-accent-gold">{d.ratio} items</span>
                    </div>
                  ))}
                </div>
              )
            })}>
              <SectionHeader icon="🛒" title="Items/Order" color="#0D9488" />
              <div className="mt-2" onClick={e => e.stopPropagation()}>
                {productsPerOrder.length === 0 ? <div className="h-32 flex items-center justify-center text-text-muted text-xs">No data</div> : (
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={productsPerOrder}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F040" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 9 }} domain={[0, 'auto']} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="ratio" stroke="#2DD4BF" strokeWidth={2} dot={false} name="Items/Order" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>
          </div>
        </div>
      )}

      {/* ─── TRENDS TAB ─── */}
      {activeTab === 'trends' && (
        <div className="space-y-3">
          <ChartCard onClick={openRollingAvgModal}>
            <SectionHeader icon="📉" title="7-Day Rolling Average" subtitle="Smoothed order trend" color="#E11D48" />
            <div className="mt-3" onClick={e => e.stopPropagation()}>
              {rollingAvg.length === 0 ? <div className="h-48 flex items-center justify-center text-text-muted text-xs">No data</div> : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={rollingAvg}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F040" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={(v) => <span style={{ color: '#0F172A', fontSize: '10px' }}>{v}</span>} />
                    <Line type="monotone" dataKey="avgOrder" stroke="#C9A84C" strokeWidth={2} dot={false} name="7d Avg" />
                    <Line type="monotone" dataKey="totalOrder" stroke="#64748B" strokeWidth={1} dot={false} name="Daily" strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartCard>

          <div className="grid grid-cols-2 gap-2">
            <ChartCard onClick={() => setModal({ title: 'Customize % Trend', icon: '🎨', color: '#E11D48', subtitle: 'Customize order percentage',
              content: (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {customizeTrend.map(d => (
                    <div key={d.date} className="flex items-center justify-between bg-bg-elevated/40 rounded-xl px-3 py-2">
                      <span className="text-xs font-medium text-text-primary">{d.date}</span>
                      <span className={`text-xs font-mono font-semibold ${d.pct >= 30 ? 'text-accent-rose' : 'text-accent-teal'}`}>{d.pct}%</span>
                    </div>
                  ))}
                </div>
              )
            })}>
              <SectionHeader icon="🎨" title="Customize %" color="#E11D48" />
              <div className="mt-2" onClick={e => e.stopPropagation()}>
                {customizeTrend.length === 0 ? <div className="h-32 flex items-center justify-center text-text-muted text-xs">No data</div> : (
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={customizeTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F040" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 9 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip content={<CustomTooltip formatter={(v) => `${v}%`} />} />
                      <Line type="monotone" dataKey="pct" stroke="#E11D48" strokeWidth={2} dot={false} name="Customize %" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>

            <ChartCard onClick={() => setModal({ title: 'Revenue per Product', icon: '💎', color: '#C9A84C', subtitle: 'Average value per item sold',
              content: (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {revenuePerProduct.map(d => (
                    <div key={d.date} className="flex items-center justify-between bg-bg-elevated/40 rounded-xl px-3 py-2">
                      <span className="text-xs font-medium text-text-primary">{d.date}</span>
                      <span className="text-xs font-mono font-semibold text-accent-gold">{formatBDT(d.value)}</span>
                    </div>
                  ))}
                </div>
              )
            })}>
              <SectionHeader icon="💎" title="Rev/Product" color="#C9A84C" />
              <div className="mt-2" onClick={e => e.stopPropagation()}>
                {revenuePerProduct.length === 0 ? <div className="h-32 flex items-center justify-center text-text-muted text-xs">No data</div> : (
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={revenuePerProduct}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F040" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                      <Tooltip content={<CustomTooltip formatter={(v) => formatBDT(v)} />} />
                      <Line type="monotone" dataKey="value" stroke="#C9A84C" strokeWidth={2} dot={false} name="Rev/Product" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>
          </div>
        </div>
      )}

      {/* ─── COMPARISON TAB ─── */}
      {activeTab === 'comparison' && (
        <div className="space-y-3">
          {wowGrowth && (
            <button onClick={openWowModal} className="w-full bg-white/80 border border-border/30 rounded-2xl p-4 text-left hover:shadow-lg hover:shadow-accent-gold/8 transition-all">
              <SectionHeader icon="📈" title="Week-over-Week Growth" color="#C9A84C" />
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="text-center bg-bg-elevated/40 rounded-xl p-2">
                  <p className="text-[9px] text-text-muted uppercase">Orders</p>
                  <p className="text-xs font-bold font-mono text-text-primary">{formatNumber(wowGrowth.currentOrders)}</p>
                  <p className={`text-[10px] font-mono ${wowGrowth.orderGrowth >= 0 ? 'text-accent-teal' : 'text-accent-rose'}`}>
                    {wowGrowth.orderGrowth >= 0 ? '+' : ''}{wowGrowth.orderGrowth}%
                  </p>
                </div>
                <div className="text-center bg-bg-elevated/40 rounded-xl p-2">
                  <p className="text-[9px] text-text-muted uppercase">Value</p>
                  <p className="text-xs font-bold font-mono text-text-primary">{formatBDTShort(wowGrowth.currentValue)}</p>
                  <p className={`text-[10px] font-mono ${wowGrowth.valueGrowth >= 0 ? 'text-accent-teal' : 'text-accent-rose'}`}>
                    {wowGrowth.valueGrowth >= 0 ? '+' : ''}{wowGrowth.valueGrowth}%
                  </p>
                </div>
                <div className="text-center bg-bg-elevated/40 rounded-xl p-2">
                  <p className="text-[9px] text-text-muted uppercase">Days</p>
                  <p className="text-xs font-bold font-mono text-text-primary">{wowGrowth.currentDays}d</p>
                  <p className="text-[10px] font-mono text-text-muted">vs {wowGrowth.previousDays}d</p>
                </div>
              </div>
            </button>
          )}

          {mtdComparison && (
            <button onClick={openMtdModal} className="w-full bg-white/80 border border-border/30 rounded-2xl p-4 text-left hover:shadow-lg hover:shadow-accent-gold/8 transition-all">
              <SectionHeader icon="🗓" title="Month-to-Date vs Last Month" color="#0D9488" />
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="text-center bg-bg-elevated/40 rounded-xl p-2">
                  <p className="text-[9px] text-text-muted uppercase">Orders</p>
                  <p className="text-xs font-bold font-mono text-text-primary">{formatNumber(mtdComparison.mtd.orders)}</p>
                  <p className={`text-[10px] font-mono ${mtdComparison.orderGrowth >= 0 ? 'text-accent-teal' : 'text-accent-rose'}`}>
                    {mtdComparison.orderGrowth >= 0 ? '+' : ''}{mtdComparison.orderGrowth}%
                  </p>
                </div>
                <div className="text-center bg-bg-elevated/40 rounded-xl p-2">
                  <p className="text-[9px] text-text-muted uppercase">Value</p>
                  <p className="text-xs font-bold font-mono text-text-primary">{formatBDTShort(mtdComparison.mtd.value)}</p>
                  <p className={`text-[10px] font-mono ${mtdComparison.valueGrowth >= 0 ? 'text-accent-teal' : 'text-accent-rose'}`}>
                    {mtdComparison.valueGrowth >= 0 ? '+' : ''}{mtdComparison.valueGrowth}%
                  </p>
                </div>
                <div className="text-center bg-bg-elevated/40 rounded-xl p-2">
                  <p className="text-[9px] text-text-muted uppercase">Advance</p>
                  <p className="text-xs font-bold font-mono text-text-primary">{formatBDTShort(mtdComparison.mtd.advance)}</p>
                  <p className="text-[10px] font-mono text-text-muted">vs {formatBDTShort(mtdComparison.lastMonth.advance)}</p>
                </div>
              </div>
            </button>
          )}

          {sameWeekday && (
            <button onClick={openSameWeekdayModal} className="w-full bg-white/80 border border-border/30 rounded-2xl p-4 text-left hover:shadow-lg hover:shadow-accent-gold/8 transition-all">
              <SectionHeader icon="📆" title="Same Weekday Compare" color="#E11D48" />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="text-center bg-accent-teal/5 rounded-xl p-2">
                  <p className="text-[9px] text-accent-teal uppercase">This {sameWeekday.current.dayOfWeek}</p>
                  <p className="text-sm font-bold font-mono text-text-primary">{formatNumber(sameWeekday.current.totalOrder)}</p>
                  <p className="text-[10px] text-accent-gold font-mono">{formatBDTShort(sameWeekday.current.totalOrderValue)}</p>
                </div>
                <div className="text-center bg-bg-elevated/40 rounded-xl p-2">
                  <p className="text-[9px] text-text-muted uppercase">Last {sameWeekday.previous.dayOfWeek}</p>
                  <p className="text-sm font-bold font-mono text-text-primary">{formatNumber(sameWeekday.previous.totalOrder)}</p>
                  <p className="text-[10px] text-text-muted font-mono">{formatBDTShort(sameWeekday.previous.totalOrderValue)}</p>
                </div>
              </div>
            </button>
          )}

          {!wowGrowth && !mtdComparison && !sameWeekday && (
            <div className="bg-white/80 border border-border/30 rounded-2xl p-8 text-center">
              <p className="text-sm text-text-muted">Not enough data for comparisons</p>
              <p className="text-xs text-text-muted/60 mt-1">Add more reports to unlock</p>
            </div>
          )}
        </div>
      )}

      {/* ─── PERIODIC TAB ─── */}
      {activeTab === 'periodic' && (
        <div className="space-y-3">
          {/* Yearly summary */}
          <ChartCard onClick={() => {
            const yearlyData = computeYearlySummary(reports || []);
            setModal({
              title: 'Yearly Summary', icon: '📅', color: '#C9A84C',
              subtitle: 'All years breakdown',
              content: (
                <div className="space-y-2">
                  {yearlyData.map(y => (
                    <div key={y.year} className="flex items-center justify-between bg-bg-elevated/40 rounded-xl px-3 py-2">
                      <span className="text-xs font-medium text-text-primary">{y.year}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-text-muted">{y.totalOrder} orders</span>
                        <span className="text-[10px] font-mono text-accent-gold font-semibold">{formatBDT(y.totalOrderValue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ),
            });
          }}>
            <SectionHeader icon="📅" title="Yearly Summary" color="#C9A84C" />
            <div className="mt-3" onClick={e => e.stopPropagation()}>
              {(() => {
                const yearlyData = computeYearlySummary(reports || []);
                const chartData = yearlyData.map(y => ({ year: y.year, orders: y.totalOrder, value: y.totalOrderValue }));
                if (chartData.length === 0) return <div className="h-48 flex items-center justify-center text-text-muted text-xs">No data</div>;
                return (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F040" />
                      <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                      <Tooltip content={<CustomTooltip formatter={(v) => formatBDT(v)} />} />
                      <Bar dataKey="value" fill="#C9A84C" radius={[4, 4, 0, 0]} name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>
          </ChartCard>

          {/* Monthly breakdown */}
          {(() => {
            const monthlyData = computeYearlySummary(reports || []);
            if (monthlyData.length === 0) return null;
            const currentYear = monthlyData[monthlyData.length - 1];
            if (!currentYear?.months) return null;
            return (
              <ChartCard onClick={() => setModal({
                title: `${currentYear.year} Monthly Breakdown`, icon: '🗓', color: '#0D9488',
                subtitle: 'Month-by-month performance',
                content: (
                  <div className="space-y-2">
                    {currentYear.months.map(m => (
                      <div key={m.month} className="flex items-center justify-between bg-bg-elevated/40 rounded-xl px-3 py-2">
                        <span className="text-xs font-medium text-text-primary">{m.month}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-text-muted">{m.totalOrder} orders</span>
                          <span className="text-[10px] font-mono text-accent-gold font-semibold">{formatBDT(m.totalOrderValue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ),
              })}>
                <SectionHeader icon="🗓" title={`${currentYear.year} Monthly`} color="#0D9488" />
                <div className="mt-3" onClick={e => e.stopPropagation()}>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={currentYear.months.map(m => ({ month: m.month, orders: m.totalOrder, value: m.totalOrderValue }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F040" />
                      <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                      <Tooltip content={<CustomTooltip formatter={(v) => formatBDT(v)} />} />
                      <Bar dataKey="value" fill="#0D9488" radius={[4, 4, 0, 0]} name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            );
          })()}
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

import { useMemo, useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatBDT, formatBDTShort, formatNumber, formatPercent, formatDateShort } from '../../utils/formatters';
import { subDays, subMonths, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import DetailModal from '../UI/DetailModal';

const THEME = {
  orders: { accent: '#C9A84C', bg: 'bg-[#C9A84C]', light: 'from-[#C9A84C]/10 via-white to-white', text: 'text-accent-gold', label: 'Total Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  value: { accent: '#0D9488', bg: 'bg-[#0D9488]', light: 'from-[#0D9488]/10 via-white to-white', text: 'text-accent-teal', label: 'Order Value', icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
  aov: { accent: '#3B82F6', bg: 'bg-[#3B82F6]', light: 'from-[#3B82F6]/10 via-white to-white', text: 'text-blue-500', label: 'Avg Order Value', icon: 'M12 20V10M18 20V4M6 20v-4' },
  advance: { accent: '#C9A84C', bg: 'bg-[#C9A84C]', light: 'from-[#C9A84C]/10 via-white to-white', text: 'text-accent-gold', label: 'Total Advance', icon: 'M12 2v20M17 7l-5-5-5 5' },
  customize: { accent: '#E11D48', bg: 'bg-[#E11D48]', light: 'from-[#E11D48]/10 via-white to-white', text: 'text-accent-rose', label: 'Customize Rate', icon: 'M4 7V4h16v3M9 20h6M12 4v16' },
  products: { accent: '#0D9488', bg: 'bg-[#0D9488]', light: 'from-[#0D9488]/10 via-white to-white', text: 'text-accent-teal', label: 'Total Products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
};

function AnimatedValue({ value }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : (value || 0);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const duration = 800;
        const start = performance.now();
        function animate(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          setDisplay(num * ease);
          if (progress < 1) requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [num]);

  let formatted;
  if (num >= 100000) formatted = formatBDTShort(display);
  else if (typeof value === 'string' && value.includes('%')) formatted = `${Math.round(display)}%`;
  else formatted = Math.round(display).toLocaleString();

  return <span ref={ref}>{formatted}</span>;
}

function TrendChart({ data, color, dataKey, height = 140 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`trend-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis hide />
        <Tooltip
          contentStyle={{ background: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', fontSize: '11px' }}
          formatter={(value) => [typeof value === 'number' && value > 999 ? formatBDT(value) : Math.round(value), '']}
          labelStyle={{ color: '#94A3B8', fontSize: '10px' }}
        />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} fill={`url(#trend-${dataKey})`} dot={false} activeDot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function KpiModal({ open, onClose, metric, reports }) {
  const [range, setRange] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    if (range === 'all') return reports;

    const sorted = [...reports].sort((a, b) => new Date(a.dateString) - new Date(b.dateString));
    const latest = sorted[sorted.length - 1];
    const latestDate = latest ? parseISO(latest.dateString) : new Date();

    let start, end;
    if (range === 'today') {
      start = startOfDay(latestDate);
      end = endOfDay(latestDate);
    } else if (range === 'yesterday') {
      start = startOfDay(subDays(latestDate, 1));
      end = endOfDay(subDays(latestDate, 1));
    } else if (range === '7d') {
      start = startOfDay(subDays(latestDate, 6));
      end = endOfDay(latestDate);
    } else if (range === '30d') {
      start = startOfDay(subDays(latestDate, 29));
      end = endOfDay(latestDate);
    } else if (range === 'custom' && customStart && customEnd) {
      start = startOfDay(parseISO(customStart));
      end = endOfDay(parseISO(customEnd));
    } else {
      return reports;
    }

    return reports.filter(r => {
      try {
        const d = parseISO(r.dateString);
        return isWithinInterval(d, { start, end });
      } catch { return false; }
    });
  }, [reports, range, customStart, customEnd]);

  const trendData = useMemo(() => {
    if (!filteredReports) return [];
    return [...filteredReports].reverse().map(r => {
      let val = 0;
      if (metric.key === 'orders') val = r.totalOrder || 0;
      else if (metric.key === 'value') val = r.totalOrderValue || 0;
      else if (metric.key === 'aov') val = r.totalOrder > 0 ? Math.round(r.totalOrderValue / r.totalOrder) : 0;
      else if (metric.key === 'advance') val = r.totalAdvance || 0;
      else if (metric.key === 'customize') val = r.totalOrder > 0 ? Math.round((r.customizeOrder / r.totalOrder) * 100) : 0;
      else if (metric.key === 'products') val = r.totalProduct || 0;
      return { date: formatDateShort(r.dateString), value: val };
    });
  }, [filteredReports, metric.key]);

  const breakdown = useMemo(() => {
    if (!filteredReports || filteredReports.length === 0) return [];
    const items = [];
    if (metric.key === 'orders') {
      items.push({ label: 'Regular Orders', value: filteredReports.reduce((s, r) => s + (r.regularOrder || 0), 0) });
      items.push({ label: 'Customize Orders', value: filteredReports.reduce((s, r) => s + (r.customizeOrder || 0), 0) });
      items.push({ label: 'Total Days', value: filteredReports.length });
    } else if (metric.key === 'value') {
      items.push({ label: 'Total Revenue', value: formatBDT(filteredReports.reduce((s, r) => s + (r.totalOrderValue || 0), 0)) });
      items.push({ label: 'Total Advance', value: formatBDT(filteredReports.reduce((s, r) => s + (r.totalAdvance || 0), 0)) });
      items.push({ label: 'Pending', value: formatBDT(filteredReports.reduce((s, r) => s + (r.totalOrderValue || 0) - (r.totalAdvance || 0), 0)) });
    } else if (metric.key === 'advance') {
      const totalVal = filteredReports.reduce((s, r) => s + (r.totalOrderValue || 0), 0);
      const totalAdv = filteredReports.reduce((s, r) => s + (r.totalAdvance || 0), 0);
      items.push({ label: 'Advance Collected', value: formatBDT(totalAdv) });
      items.push({ label: 'Total Value', value: formatBDT(totalVal) });
      items.push({ label: 'Advance Rate', value: `${totalVal > 0 ? Math.round((totalAdv / totalVal) * 100) : 0}%` });
    } else if (metric.key === 'customize') {
      const totalOrd = filteredReports.reduce((s, r) => s + (r.totalOrder || 0), 0);
      const totalCust = filteredReports.reduce((s, r) => s + (r.customizeOrder || 0), 0);
      items.push({ label: 'Customize Orders', value: totalCust });
      items.push({ label: 'Regular Orders', value: totalOrd - totalCust });
      items.push({ label: 'Customize Rate', value: `${totalOrd > 0 ? Math.round((totalCust / totalOrd) * 100) : 0}%` });
    } else if (metric.key === 'products') {
      const totalProd = filteredReports.reduce((s, r) => s + (r.totalProduct || 0), 0);
      const regProd = filteredReports.reduce((s, r) => s + (r.regularProduct || 0), 0);
      items.push({ label: 'Regular Products', value: regProd });
      items.push({ label: 'Customize Products', value: totalProd - regProd });
      items.push({ label: 'Avg per Day', value: filteredReports.length > 0 ? Math.round(totalProd / filteredReports.length) : 0 });
    } else if (metric.key === 'aov') {
      const totalVal = filteredReports.reduce((s, r) => s + (r.totalOrderValue || 0), 0);
      const totalOrd = filteredReports.reduce((s, r) => s + (r.totalOrder || 0), 0);
      const aovs = filteredReports.filter(r => r.totalOrder > 0).map(r => r.totalOrderValue / r.totalOrder);
      items.push({ label: 'Highest AOV', value: formatBDT(aovs.length > 0 ? Math.max(...aovs) : 0) });
      items.push({ label: 'Lowest AOV', value: formatBDT(aovs.length > 0 ? Math.min(...aovs) : 0) });
      items.push({ label: 'Total Revenue', value: formatBDT(totalVal) });
    }
    return items;
  }, [filteredReports, metric.key]);

  if (!metric || !open) return null;

  const t = THEME[metric.key];

  return (
    <DetailModal
      open={open}
      onClose={onClose}
      title={t.label}
      subtitle={metric.sub}
      color={t.accent}
      icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
          <path d={t.icon} />
        </svg>
      }
    >
      {/* Range filter */}
      <div className="flex gap-1 mb-4 bg-bg-elevated/60 p-1 rounded-xl overflow-x-auto scrollbar-none">
        {[
          { key: 'today', label: 'Today' },
          { key: 'yesterday', label: 'Yesterday' },
          { key: '7d', label: '7d' },
          { key: '30d', label: '30d' },
          { key: 'all', label: 'All' },
          { key: 'custom', label: '📅' },
        ].map(r => (
          <button key={r.key} onClick={() => setRange(r.key)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
              range === r.key ? 'bg-white text-text-primary shadow-sm border border-border/30' : 'text-text-muted hover:text-text-primary'
            }`}>
            {r.label}
          </button>
        ))}
      </div>
      {range === 'custom' && (
        <div className="flex items-center gap-2 mb-4">
          <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
            className="flex-1 text-[10px] px-2 py-1.5 border border-border/50 rounded-lg focus:outline-none focus:border-accent-gold/50 bg-white" />
          <span className="text-[10px] text-text-muted">to</span>
          <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
            className="flex-1 text-[10px] px-2 py-1.5 border border-border/50 rounded-lg focus:outline-none focus:border-accent-gold/50 bg-white" />
        </div>
      )}

      {/* Big value */}
      <div className="text-center py-4 mb-4 bg-gradient-to-b from-bg-elevated/30 to-transparent rounded-2xl">
        <p className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: t.accent }}>
          {metric.valueDisplay}
        </p>
        {metric.change !== null && metric.change !== undefined && (
          <span className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
            metric.change > 0 ? 'bg-accent-teal/10 text-accent-teal' :
            metric.change < 0 ? 'bg-accent-rose/10 text-accent-rose' :
            'bg-text-muted/10 text-text-muted'
          }`}>
            {metric.change > 0 ? '▲' : metric.change < 0 ? '▼' : '–'} {Math.abs(metric.change)}% vs prev
          </span>
        )}
      </div>

      {/* Trend chart */}
      {trendData.length > 1 && (
        <div className="mb-4">
          <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium mb-2">Trend</p>
          <div className="bg-gradient-to-b from-bg-elevated/20 to-transparent rounded-xl p-2">
            <TrendChart data={trendData} color={t.accent} dataKey="value" height={150} />
          </div>
        </div>
      )}

      {/* Breakdown */}
      {breakdown.length > 0 && (
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium mb-2">Breakdown</p>
          <div className="space-y-1.5">
            {breakdown.map((b, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl bg-bg-elevated/30">
                <span className="text-xs text-text-muted">{b.label}</span>
                <span className="text-xs font-semibold text-text-primary font-mono">{b.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </DetailModal>
  );
}

function KpiCard({ label, value, sub, change, icon, index, progress, progressLabel, onClick }) {
  const t = THEME[icon];

  return (
    <div
      onClick={onClick}
      className={`relative glass-card overflow-hidden animate-fade-in-up stagger-${Math.min(index + 1, 8)} group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer active:scale-[0.98]`}
    >
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${t.bg} opacity-60 group-hover:opacity-100 transition-opacity rounded-t-2xl`} />
      <div className={`absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br ${t.light} rounded-full opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all pointer-events-none`} />

      <div className="relative p-3.5 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] sm:text-[10px] font-semibold text-text-muted uppercase tracking-[0.1em]">{label}</span>
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br ${t.light} border border-border/50 flex items-center justify-center ${t.text} shadow-sm group-hover:scale-110 transition-transform`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 sm:w-4 sm:h-4">
              <path d={t.icon} />
            </svg>
          </div>
        </div>

        <div className="flex items-end justify-between gap-2 mb-2">
          <p className="text-xl sm:text-2xl font-bold font-mono text-text-primary tracking-tight leading-none">
            <AnimatedValue value={value} />
          </p>
          {change !== null && change !== undefined && (
            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold whitespace-nowrap self-start mt-0.5 ${
              change > 0 ? 'bg-accent-teal/10 text-accent-teal' :
              change < 0 ? 'bg-accent-rose/10 text-accent-rose' :
              'bg-text-muted/10 text-text-muted'
            }`}>
              <span className="text-[8px]">{change > 0 ? '▲' : change < 0 ? '▼' : '–'}</span>
              {Math.abs(change)}%
            </span>
          )}
        </div>

        {sub && <p className="text-[10px] sm:text-[11px] text-text-muted truncate">{sub}</p>}

        {progress !== undefined && (
          <div className="mt-3 pt-2.5 border-t border-border/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] text-text-muted/70">{progressLabel || ''}</span>
              <span className="text-[8px] font-mono text-text-muted">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-1.5 bg-bg-elevated rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ease-out ${t.bg} opacity-60`} style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
          </div>
        )}

        {/* Click hint */}
        <div className="absolute bottom-1.5 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[8px] text-text-muted/40">tap for details</span>
        </div>
      </div>
    </div>
  );
}

export default function DynamicKPIs({ reports, allReports }) {
  const [selectedKpi, setSelectedKpi] = useState(null);
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
    ? Math.round(aggregate.totalOrderValue / aggregate.totalOrder) : 0;
  const customizeRate = aggregate.totalOrder > 0
    ? Math.round((aggregate.customizeOrder / aggregate.totalOrder) * 100) : 0;
  const prevAvgOrderValue = prevAggregate?.totalOrder > 0
    ? Math.round(prevAggregate.totalOrderValue / prevAggregate.totalOrder) : 0;
  const advanceRate = aggregate.totalOrderValue > 0
    ? Math.round((aggregate.totalAdvance / aggregate.totalOrderValue) * 100) : 0;

  const pctChange = (cur, prev) => prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null;

  const metrics = [
    {
      key: 'orders', label: 'Total Orders', icon: 'orders',
      value: aggregate.totalOrder,
      valueDisplay: aggregate.totalOrder.toLocaleString(),
      sub: `${formatNumber(aggregate.regularOrder)} Reg · ${formatNumber(aggregate.customizeOrder)} Cust`,
      change: pctChange(aggregate.totalOrder, prevAggregate?.totalOrder),
    },
    {
      key: 'value', label: 'Order Value', icon: 'value',
      value: aggregate.totalOrderValue,
      valueDisplay: formatBDT(aggregate.totalOrderValue),
      sub: formatBDT(aggregate.totalOrderValue),
      change: pctChange(aggregate.totalOrderValue, prevAggregate?.totalOrderValue),
    },
    {
      key: 'aov', label: 'Avg Order Value', icon: 'aov',
      value: avgOrderValue,
      valueDisplay: formatBDT(avgOrderValue),
      sub: formatBDT(avgOrderValue),
      change: pctChange(avgOrderValue, prevAvgOrderValue),
    },
    {
      key: 'advance', label: 'Total Advance', icon: 'advance',
      value: aggregate.totalAdvance,
      valueDisplay: formatBDT(aggregate.totalAdvance),
      sub: `${formatPercent(advanceRate)} advance rate`,
      change: pctChange(aggregate.totalAdvance, prevAggregate?.totalAdvance),
      progress: advanceRate,
      progressLabel: 'Advance rate',
    },
    {
      key: 'customize', label: 'Customize Rate', icon: 'customize',
      value: `${customizeRate}%`,
      valueDisplay: `${customizeRate}%`,
      sub: `${formatNumber(aggregate.customizeOrder)} of ${formatNumber(aggregate.totalOrder)} orders`,
      change: prevAggregate?.totalOrder > 0
        ? Math.round(customizeRate - Math.round((prevAggregate.customizeOrder / prevAggregate.totalOrder) * 100)) : null,
      progress: customizeRate,
      progressLabel: 'Customize rate',
    },
    {
      key: 'products', label: 'Total Products', icon: 'products',
      value: aggregate.totalProduct,
      valueDisplay: aggregate.totalProduct.toLocaleString(),
      sub: `${formatNumber(aggregate.regularProduct)} Reg · ${formatNumber(aggregate.customizeProduct)} Cust`,
      change: pctChange(aggregate.totalProduct, prevAggregate?.totalProduct),
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-2">
        {metrics.map((m, i) => (
          <KpiCard key={m.label} {...m} index={i} onClick={() => setSelectedKpi(m)} />
        ))}
      </div>
      <KpiModal
        open={!!selectedKpi}
        onClose={() => setSelectedKpi(null)}
        metric={selectedKpi}
        reports={reports}
      />
    </>
  );
}

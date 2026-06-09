import { useMemo, useState, useEffect, useRef } from 'react';
import { formatBDT, formatBDTShort, formatNumber, formatPercent, getChangeColor, getChangeIcon } from '../../utils/formatters';

function AnimatedValue({ value, prefix = '', suffix = '', decimals = 0 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : (value || 0);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const duration = 800;
        const start = performance.now();
        const from = 0;
        const to = num;

        function animate(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          setDisplay(from + (to - from) * ease);
          if (progress < 1) requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [num]);

  const formatted = num >= 100000
    ? formatBDTShort(num)
    : decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString();

  return <span ref={ref}>{prefix}{formatted}{suffix}</span>;
}

const ICONS = {
  orders: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
  ),
  value: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
  ),
  aov: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
  ),
  advance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M12 2v20M17 7l-5-5-5 5"/></svg>
  ),
  customize: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>
  ),
  products: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
  ),
};

const GRADIENTS = {
  orders: 'from-accent-gold/15 via-accent-gold/5 to-transparent',
  value: 'from-accent-teal/15 via-accent-teal/5 to-transparent',
  aov: 'from-blue-500/10 via-blue-500/5 to-transparent',
  advance: 'from-accent-gold/15 via-accent-gold/5 to-transparent',
  customize: 'from-accent-rose/10 via-accent-rose/5 to-transparent',
  products: 'from-accent-teal/15 via-accent-teal/5 to-transparent',
};

const ICON_COLORS = {
  orders: 'text-accent-gold',
  value: 'text-accent-teal',
  aov: 'text-blue-500',
  advance: 'text-accent-gold',
  customize: 'text-accent-rose',
  products: 'text-accent-teal',
};

function KpiCard({ label, value, sub, change, icon, index }) {
  const cardClass = `glass-card p-4 sm:p-5 animate-fade-in-up stagger-${Math.min(index + 1, 8)}`;
  return (
    <div className={cardClass}>
      <div className="flex items-start justify-between mb-2.5">
        <p className="text-[10px] sm:text-xs font-medium text-text-muted uppercase tracking-[0.08em]">{label}</p>
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${GRADIENTS[icon]} border border-border/40 flex items-center justify-center ${ICON_COLORS[icon]}`}>
          {ICONS[icon]}
        </div>
      </div>
      <p className="stat-value text-text-primary mb-1">
        <AnimatedValue value={value} />
      </p>
      <div className="flex items-center justify-between gap-2">
        {sub && <p className="text-[10px] sm:text-xs text-text-muted truncate">{sub}</p>}
        {change !== null && change !== undefined && (
          <span className={`text-[10px] sm:text-xs font-semibold whitespace-nowrap ${getChangeColor(change)}`}>
            {getChangeIcon(change)} {Math.abs(change)}%
          </span>
        )}
      </div>
    </div>
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
      label: 'Total Orders', icon: 'orders',
      value: aggregate.totalOrder,
      sub: `${formatNumber(aggregate.regularOrder)} Reg · ${formatNumber(aggregate.customizeOrder)} Cust`,
      change: prevAggregate?.totalOrder
        ? Math.round(((aggregate.totalOrder - prevAggregate.totalOrder) / prevAggregate.totalOrder) * 100)
        : null,
    },
    {
      label: 'Order Value', icon: 'value',
      value: aggregate.totalOrderValue,
      sub: formatBDT(aggregate.totalOrderValue),
      change: prevAggregate?.totalOrderValue
        ? Math.round(((aggregate.totalOrderValue - prevAggregate.totalOrderValue) / prevAggregate.totalOrderValue) * 100)
        : null,
    },
    {
      label: 'Avg Order Value', icon: 'aov',
      value: avgOrderValue,
      sub: formatBDT(avgOrderValue),
      change: prevAvgOrderValue > 0
        ? Math.round(((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100)
        : null,
    },
    {
      label: 'Total Advance', icon: 'advance',
      value: aggregate.totalAdvance,
      sub: `${aggregate.totalOrderValue > 0 ? formatPercent(Math.round((aggregate.totalAdvance / aggregate.totalOrderValue) * 100)) : '0%'} rate`,
      change: prevAggregate?.totalAdvance
        ? Math.round(((aggregate.totalAdvance - prevAggregate.totalAdvance) / prevAggregate.totalAdvance) * 100)
        : null,
    },
    {
      label: 'Customize Rate', icon: 'customize',
      value: `${customizeRate}%`,
      sub: `${formatNumber(aggregate.customizeOrder)} of ${formatNumber(aggregate.totalOrder)} orders`,
      change: prevAggregate?.totalOrder > 0
        ? Math.round(customizeRate - Math.round((prevAggregate.customizeOrder / prevAggregate.totalOrder) * 100))
        : null,
    },
    {
      label: 'Total Products', icon: 'products',
      value: aggregate.totalProduct,
      sub: `${formatNumber(aggregate.regularProduct)} Reg · ${formatNumber(aggregate.customizeProduct)} Cust`,
      change: prevAggregate?.totalProduct
        ? Math.round(((aggregate.totalProduct - prevAggregate.totalProduct) / prevAggregate.totalProduct) * 100)
        : null,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
      {metrics.map((m, i) => <KpiCard key={m.label} {...m} index={i} />)}
    </div>
  );
}

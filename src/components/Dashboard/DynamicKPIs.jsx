import { useMemo, useState, useEffect, useRef } from 'react';
import { formatBDT, formatBDTShort, formatNumber, formatPercent } from '../../utils/formatters';

const THEME = {
  orders: { accent: '#C9A84C', bg: 'bg-[#C9A84C]', light: 'from-[#C9A84C]/10 via-white to-white', text: 'text-accent-gold', label: 'Orders' },
  value: { accent: '#0D9488', bg: 'bg-[#0D9488]', light: 'from-[#0D9488]/10 via-white to-white', text: 'text-accent-teal', label: 'Value' },
  aov: { accent: '#3B82F6', bg: 'bg-[#3B82F6]', light: 'from-[#3B82F6]/10 via-white to-white', text: 'text-blue-500', label: 'AOV' },
  advance: { accent: '#C9A84C', bg: 'bg-[#C9A84C]', light: 'from-[#C9A84C]/10 via-white to-white', text: 'text-accent-gold', label: 'Advance' },
  customize: { accent: '#E11D48', bg: 'bg-[#E11D48]', light: 'from-[#E11D48]/10 via-white to-white', text: 'text-accent-rose', label: 'Customize' },
  products: { accent: '#0D9488', bg: 'bg-[#0D9488]', light: 'from-[#0D9488]/10 via-white to-white', text: 'text-accent-teal', label: 'Products' },
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

  let formatted;
  if (num >= 100000) formatted = formatBDTShort(num);
  else if (typeof value === 'string' && value.includes('%')) formatted = `${Math.round(display)}%`;
  else formatted = Math.round(display).toLocaleString();

  return <span ref={ref}>{formatted}</span>;
}

function KpiCard({ label, value, sub, change, icon, index, progress, progressLabel }) {
  const t = THEME[icon];

  return (
    <div className={`relative glass-card overflow-hidden animate-fade-in-up stagger-${Math.min(index + 1, 8)} group hover:shadow-md transition-all duration-300`}>
      {/* Top accent strip */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${t.bg} opacity-60 group-hover:opacity-100 transition-opacity rounded-t-2xl`} />

      {/* Subtle radial background */}
      <div className={`absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br ${t.light} rounded-full opacity-40 group-hover:opacity-60 transition-opacity pointer-events-none`} />

      <div className="relative p-3.5 sm:p-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] sm:text-[10px] font-semibold text-text-muted uppercase tracking-[0.1em]">{label}</span>
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br ${t.light} border border-border/50 flex items-center justify-center ${t.text} shadow-sm`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 sm:w-4 sm:h-4">
              {icon === 'orders' && <><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></>}
              {icon === 'value' && <><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>}
              {icon === 'aov' && <><path d="M12 20V10M18 20V4M6 20v-4"/></>}
              {icon === 'advance' && <><path d="M12 2v20M17 7l-5-5-5 5"/></>}
              {icon === 'customize' && <><path d="M4 7V4h16v3M9 20h6M12 4v16"/></>}
              {icon === 'products' && <><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></>}
            </svg>
          </div>
        </div>

        {/* Value + change badge */}
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

        {/* Sub text */}
        {sub && <p className="text-[10px] sm:text-[11px] text-text-muted truncate">{sub}</p>}

        {/* Progress bar */}
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
    ? Math.round(aggregate.totalOrderValue / aggregate.totalOrder) : 0;
  const customizeRate = aggregate.totalOrder > 0
    ? Math.round((aggregate.customizeOrder / aggregate.totalOrder) * 100) : 0;
  const prevAvgOrderValue = prevAggregate?.totalOrder > 0
    ? Math.round(prevAggregate.totalOrderValue / prevAggregate.totalOrder) : 0;
  const advanceRate = aggregate.totalOrderValue > 0
    ? Math.round((aggregate.totalAdvance / aggregate.totalOrderValue) * 100) : 0;

  const metrics = [
    {
      label: 'Total Orders', icon: 'orders',
      value: aggregate.totalOrder,
      sub: `${formatNumber(aggregate.regularOrder)} Reg · ${formatNumber(aggregate.customizeOrder)} Cust`,
      change: prevAggregate?.totalOrder
        ? Math.round(((aggregate.totalOrder - prevAggregate.totalOrder) / prevAggregate.totalOrder) * 100) : null,
    },
    {
      label: 'Order Value', icon: 'value',
      value: aggregate.totalOrderValue,
      sub: formatBDT(aggregate.totalOrderValue),
      change: prevAggregate?.totalOrderValue
        ? Math.round(((aggregate.totalOrderValue - prevAggregate.totalOrderValue) / prevAggregate.totalOrderValue) * 100) : null,
    },
    {
      label: 'Avg Order Value', icon: 'aov',
      value: avgOrderValue,
      sub: formatBDT(avgOrderValue),
      change: prevAvgOrderValue > 0
        ? Math.round(((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100) : null,
    },
    {
      label: 'Total Advance', icon: 'advance',
      value: aggregate.totalAdvance,
      sub: `${formatPercent(advanceRate)} advance rate`,
      change: prevAggregate?.totalAdvance
        ? Math.round(((aggregate.totalAdvance - prevAggregate.totalAdvance) / prevAggregate.totalAdvance) * 100) : null,
      progress: advanceRate,
      progressLabel: 'Advance rate',
    },
    {
      label: 'Customize Rate', icon: 'customize',
      value: `${customizeRate}%`,
      sub: `${formatNumber(aggregate.customizeOrder)} of ${formatNumber(aggregate.totalOrder)} orders`,
      change: prevAggregate?.totalOrder > 0
        ? Math.round(customizeRate - Math.round((prevAggregate.customizeOrder / prevAggregate.totalOrder) * 100)) : null,
      progress: customizeRate,
      progressLabel: 'Customize rate',
    },
    {
      label: 'Total Products', icon: 'products',
      value: aggregate.totalProduct,
      sub: `${formatNumber(aggregate.regularProduct)} Reg · ${formatNumber(aggregate.customizeProduct)} Cust`,
      change: prevAggregate?.totalProduct
        ? Math.round(((aggregate.totalProduct - prevAggregate.totalProduct) / prevAggregate.totalProduct) * 100) : null,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
      {metrics.map((m, i) => <KpiCard key={m.label} {...m} index={i} />)}
    </div>
  );
}

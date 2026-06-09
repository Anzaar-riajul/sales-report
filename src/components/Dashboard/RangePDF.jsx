import { useMemo } from 'react';
import { formatBDT, formatNumber, formatDateShort } from '../../utils/formatters';

const T = {
  gold: '#C9A84C', teal: '#0D9488', rose: '#E11D48', blue: '#3B82F6', purple: '#8B5CF6',
  text: '#0F172A', muted: '#64748B', border: '#E2E8F0', bg: '#F8FAFC', white: '#FFFFFF',
};

function Box({ label, value, color = T.gold }) {
  return (
    <div style={{ background: `linear-gradient(135deg, ${color}0A, ${color}04)`, border: `1px solid ${color}22`, borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
      <p style={{ fontSize: '8px', color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, fontWeight: 700 }}>{label}</p>
      <p style={{ fontSize: '16px', fontWeight: 800, color: T.text, margin: '3px 0 0', fontFamily: 'monospace' }}>{value}</p>
    </div>
  );
}

function Row({ left, right, color, bg }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: bg || 'transparent', borderRadius: '6px', marginBottom: '1px' }}>
      <span style={{ fontSize: '10px', color: T.muted }}>{left}</span>
      <span style={{ fontSize: '11px', fontWeight: 700, color: color || T.text, fontFamily: 'monospace' }}>{right}</span>
    </div>
  );
}

function SectionTitle({ icon, title, color = T.gold }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', marginTop: '4px' }}>
      <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>{icon}</div>
      <span style={{ fontSize: '10px', fontWeight: 700, color: T.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
    </div>
  );
}

function AlertItem({ icon, text, color = T.gold }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', padding: '7px 8px', background: `${color}08`, border: `1px solid ${color}18`, borderRadius: '8px', marginBottom: '3px' }}>
      <span style={{ fontSize: '11px', flexShrink: 0, marginTop: '1px' }}>{icon}</span>
      <span style={{ fontSize: '9px', color: T.text, lineHeight: '1.5' }}>{text}</span>
    </div>
  );
}

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ width: '100%', height: '4px', background: `${color}15`, borderRadius: '2px', overflow: 'hidden', marginTop: '3px' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px' }} />
    </div>
  );
}

export default function RangePDF({ reports, rangeLabel, startDate, endDate }) {
  if (!reports || reports.length === 0) return null;

  const sorted = useMemo(() => [...reports].sort((a, b) => a.dateString.localeCompare(b.dateString)), [reports]);
  const days = sorted.length;

  // Aggregate
  const agg = useMemo(() => sorted.reduce((acc, r) => ({
    totalOrder: acc.totalOrder + (r.totalOrder || 0),
    regularOrder: acc.regularOrder + (r.regularOrder || 0),
    customizeOrder: acc.customizeOrder + (r.customizeOrder || 0),
    totalProduct: acc.totalProduct + (r.totalProduct || 0),
    regularProduct: acc.regularProduct + (r.regularProduct || 0),
    customizeProduct: acc.customizeProduct + (r.customizeProduct || 0),
    totalOrderValue: acc.totalOrderValue + (r.totalOrderValue || 0),
    totalAdvance: acc.totalAdvance + (r.totalAdvance || 0),
  }), { totalOrder: 0, regularOrder: 0, customizeOrder: 0, totalProduct: 0, regularProduct: 0, customizeProduct: 0, totalOrderValue: 0, totalAdvance: 0 }), [sorted]);

  const avgOrders = days > 0 ? Math.round(agg.totalOrder / days) : 0;
  const avgValue = days > 0 ? Math.round(agg.totalOrderValue / days) : 0;
  const avgProducts = days > 0 ? Math.round(agg.totalProduct / days) : 0;
  const advanceRate = agg.totalOrderValue > 0 ? Math.round((agg.totalAdvance / agg.totalOrderValue) * 100) : 0;
  const customizeRate = agg.totalOrder > 0 ? Math.round((agg.customizeOrder / agg.totalOrder) * 100) : 0;
  const pendingAmount = Math.max(0, agg.totalOrderValue - agg.totalAdvance);
  const avgOrderValue = agg.totalOrder > 0 ? Math.round(agg.totalOrderValue / agg.totalOrder) : 0;

  // Best/worst day
  const bestDay = useMemo(() => sorted.reduce((best, r) => (r.totalOrderValue > (best?.totalOrderValue || 0)) ? r : best, null), [sorted]);
  const worstDay = useMemo(() => sorted.reduce((worst, r) => (r.totalOrderValue < (worst?.totalOrderValue || Infinity)) ? r : worst, null), [sorted]);

  // Top products
  const topProducts = useMemo(() => {
    const map = {};
    sorted.forEach(r => (r.products || []).forEach(p => {
      if (!map[p.name]) map[p.name] = { name: p.name, qty: 0, category: p.category || 'Other' };
      map[p.name].qty += p.quantity || 0;
    }));
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 15);
  }, [sorted]);

  // Dead products
  const deadProducts = useMemo(() => {
    const lastSeen = {};
    sorted.forEach(r => (r.products || []).forEach(p => {
      if (!lastSeen[p.name] || r.dateString > lastSeen[p.name].date) {
        lastSeen[p.name] = { date: r.dateString, qty: p.quantity || 0, category: p.category || 'Other' };
      }
    }));
    const endDateStr = sorted[sorted.length - 1]?.dateString;
    return Object.entries(lastSeen)
      .filter(([, d]) => Math.floor((new Date(endDateStr) - new Date(d.date)) / 86400000) > 14)
      .sort((a, b) => new Date(a[1].date) - new Date(b[1].date))
      .slice(0, 10)
      .map(([name, d]) => ({ name, lastSeen: d.date, category: d.category }));
  }, [sorted]);

  // Weekly summary (group by ISO week)
  const weeklyData = useMemo(() => {
    const weeks = {};
    sorted.forEach(r => {
      const d = new Date(r.dateString);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().split('T')[0];
      if (!weeks[key]) weeks[key] = { week: key, orders: 0, value: 0, advance: 0, products: 0, days: 0 };
      weeks[key].orders += r.totalOrder || 0;
      weeks[key].value += r.totalOrderValue || 0;
      weeks[key].advance += r.totalAdvance || 0;
      weeks[key].products += r.totalProduct || 0;
      weeks[key].days += 1;
    });
    return Object.values(weeks).sort((a, b) => a.week.localeCompare(b.week));
  }, [sorted]);

  // Week-over-week comparison
  const weekComparison = useMemo(() => {
    if (weeklyData.length < 2) return null;
    const current = weeklyData[weeklyData.length - 1];
    const previous = weeklyData[weeklyData.length - 2];
    const orderGrowth = previous.orders > 0 ? Math.round(((current.orders - previous.orders) / previous.orders) * 100) : 0;
    const valueGrowth = previous.value > 0 ? Math.round(((current.value - previous.value) / previous.value) * 100) : 0;
    return { current, previous, orderGrowth, valueGrowth };
  }, [weeklyData]);

  // Daily trend data
  const dailyTrend = useMemo(() => sorted.map(r => ({
    date: formatDateShort(r.dateString),
    orders: r.totalOrder,
    value: r.totalOrderValue,
  })), [sorted]);

  // Alerts & suggestions
  const alerts = useMemo(() => {
    const result = [];
    if (advanceRate < 40) result.push({ icon: '⚠', text: `Average advance rate is ${advanceRate}%. Collecting 60%+ upfront reduces pending risk.`, color: T.rose });
    if (advanceRate >= 60) result.push({ icon: '✅', text: `Strong advance rate at ${advanceRate}%. Payment collection is healthy.`, color: T.teal });
    if (customizeRate > 40) result.push({ icon: '🎨', text: `${customizeRate}% orders are customize. Plan production capacity to meet delivery timelines.`, color: T.purple });
    if (deadProducts.length > 3) result.push({ icon: '💀', text: `${deadProducts.length} products haven't sold in 14+ days. Run promotions or consider discontinuing.`, color: T.rose });
    if (bestDay && worstDay && bestDay.totalOrderValue > worstDay.totalOrderValue * 3) {
      result.push({ icon: '📊', text: `Big gap between best (${formatBDT(bestDay.totalOrderValue)}) and worst (${formatBDT(worstDay.totalOrderValue)}) days. Aim for consistency.`, color: T.gold });
    }
    if (weekComparison) {
      if (weekComparison.valueGrowth > 10) result.push({ icon: '🚀', text: `Revenue grew ${weekComparison.valueGrowth}% this week vs last. Momentum is strong!`, color: T.teal });
      if (weekComparison.valueGrowth < -10) result.push({ icon: '📉', text: `Revenue dropped ${Math.abs(weekComparison.valueGrowth)}% this week. Investigate and plan recovery.`, color: T.rose });
    }
    if (avgOrderValue > 3000) result.push({ icon: '💎', text: `High AOV of ${formatBDT(avgOrderValue)}. Premium products are performing well.`, color: T.gold });
    if (days >= 7 && avgOrders < 5) result.push({ icon: '💡', text: `Low daily average of ${avgOrders} orders. Consider marketing campaigns to boost sales.`, color: T.purple });
    return result;
  }, [advanceRate, customizeRate, deadProducts, bestDay, worstDay, weekComparison, avgOrderValue, days, avgOrders]);

  const maxDailyValue = useMemo(() => Math.max(...dailyTrend.map(d => d.value), 1), [dailyTrend]);

  return (
    <div
      id="range-pdf-content"
      style={{
        width: '400px', maxWidth: '400px',
        background: T.white,
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        color: T.text, padding: '0',
        position: 'absolute', left: '-9999px', top: 0,
      }}
    >
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${T.gold}, ${T.gold}CC)`, padding: '18px', color: T.white, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', bottom: '-10px', left: '40%', width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Anzaar Islamic Lifestyle</h1>
          <p style={{ fontSize: '10px', opacity: 0.85, margin: '3px 0 0' }}>Sales Report · {rangeLabel || `${formatDateShort(startDate)} → ${formatDateShort(endDate)}`}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <span style={{ fontSize: '10px', opacity: 0.8 }}>{days} days · {formatDateShort(startDate)} – {formatDateShort(endDate)}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 18px' }}>
        {/* Summary Stats */}
        <SectionTitle icon="📊" title="Summary" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
          <Box label="Total Orders" value={formatNumber(agg.totalOrder)} color={T.gold} />
          <Box label="Total Value" value={formatBDT(agg.totalOrderValue)} color={T.teal} />
          <Box label="Total Advance" value={formatBDT(agg.totalAdvance)} color={T.gold} />
          <Box label="Products" value={formatNumber(agg.totalProduct)} color={T.teal} />
        </div>

        {/* Daily Averages */}
        <SectionTitle icon="📈" title="Daily Averages" color={T.blue} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '10px' }}>
          <div style={{ background: T.bg, borderRadius: '8px', padding: '8px', textAlign: 'center', border: `1px solid ${T.border}40` }}>
            <p style={{ fontSize: '7px', color: T.muted, margin: 0, textTransform: 'uppercase' }}>Orders</p>
            <p style={{ fontSize: '14px', fontWeight: 700, color: T.text, margin: '2px 0 0', fontFamily: 'monospace' }}>{avgOrders}</p>
          </div>
          <div style={{ background: T.bg, borderRadius: '8px', padding: '8px', textAlign: 'center', border: `1px solid ${T.border}40` }}>
            <p style={{ fontSize: '7px', color: T.muted, margin: 0, textTransform: 'uppercase' }}>Value</p>
            <p style={{ fontSize: '14px', fontWeight: 700, color: T.gold, margin: '2px 0 0', fontFamily: 'monospace' }}>{formatBDT(avgValue)}</p>
          </div>
          <div style={{ background: T.bg, borderRadius: '8px', padding: '8px', textAlign: 'center', border: `1px solid ${T.border}40` }}>
            <p style={{ fontSize: '7px', color: T.muted, margin: 0, textTransform: 'uppercase' }}>AOV</p>
            <p style={{ fontSize: '14px', fontWeight: 700, color: T.teal, margin: '2px 0 0', fontFamily: 'monospace' }}>{formatBDT(avgOrderValue)}</p>
          </div>
        </div>

        {/* Order Split */}
        <SectionTitle icon="📦" title="Order Split" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
          <div style={{ background: `${T.gold}0A`, border: `1px solid ${T.gold}20`, borderRadius: '8px', padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '8px', fontWeight: 600, color: T.muted, textTransform: 'uppercase' }}>Regular</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: T.gold, fontFamily: 'monospace' }}>{formatNumber(agg.regularOrder)}</span>
            </div>
            <span style={{ fontSize: '8px', color: T.muted }}>{100 - customizeRate}%</span>
            <MiniBar value={100 - customizeRate} max={100} color={T.gold} />
          </div>
          <div style={{ background: `${T.rose}0A`, border: `1px solid ${T.rose}20`, borderRadius: '8px', padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '8px', fontWeight: 600, color: T.muted, textTransform: 'uppercase' }}>Custom</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: T.rose, fontFamily: 'monospace' }}>{formatNumber(agg.customizeOrder)}</span>
            </div>
            <span style={{ fontSize: '8px', color: T.muted }}>{customizeRate}%</span>
            <MiniBar value={customizeRate} max={100} color={T.rose} />
          </div>
        </div>

        {/* Payment */}
        <SectionTitle icon="💳" title="Payment" color={T.teal} />
        <div style={{ background: T.bg, borderRadius: '8px', padding: '8px 10px', marginBottom: '10px', border: `1px solid ${T.border}40` }}>
          <Row left="Collected" right={formatBDT(agg.totalAdvance)} color={T.teal} />
          <Row left="Pending" right={formatBDT(pendingAmount)} color={T.rose} bg={`${T.rose}04`} />
          <Row left="Advance Rate" right={`${advanceRate}%`} color={advanceRate >= 50 ? T.teal : T.rose} />
        </div>

        {/* Best & Worst Day (only if multi-day) */}
        {days > 1 && bestDay && worstDay && (
          <>
            <SectionTitle icon="🏆" title="Highlights" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
              <div style={{ background: `${T.teal}08`, border: `1px solid ${T.teal}20`, borderRadius: '8px', padding: '8px 10px' }}>
                <p style={{ fontSize: '7px', fontWeight: 600, color: T.teal, textTransform: 'uppercase', margin: '0 0 3px' }}>Best Day</p>
                <p style={{ fontSize: '9px', fontWeight: 700, color: T.text, margin: 0 }}>{formatDateShort(bestDay.dateString)}</p>
                <p style={{ fontSize: '8px', color: T.muted, margin: '2px 0 0' }}>{formatBDT(bestDay.totalOrderValue)} · {bestDay.totalOrder} orders</p>
              </div>
              <div style={{ background: `${T.rose}08`, border: `1px solid ${T.rose}20`, borderRadius: '8px', padding: '8px 10px' }}>
                <p style={{ fontSize: '7px', fontWeight: 600, color: T.rose, textTransform: 'uppercase', margin: '0 0 3px' }}>Lowest Day</p>
                <p style={{ fontSize: '9px', fontWeight: 700, color: T.text, margin: 0 }}>{formatDateShort(worstDay.dateString)}</p>
                <p style={{ fontSize: '8px', color: T.muted, margin: '2px 0 0' }}>{formatBDT(worstDay.totalOrderValue)} · {worstDay.totalOrder} orders</p>
              </div>
            </div>
          </>
        )}

        {/* Order Trend (bar chart) */}
        {dailyTrend.length > 0 && (
          <>
            <SectionTitle icon="📊" title="Daily Order Trend" color={T.blue} />
            <div style={{ background: T.bg, borderRadius: '8px', padding: '10px', marginBottom: '10px', border: `1px solid ${T.border}40` }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '60px' }}>
                {dailyTrend.map((d, i) => {
                  const h = maxDailyValue > 0 ? Math.max((d.value / maxDailyValue) * 56, 4) : 4;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <div style={{ width: '100%', height: `${h}px`, background: `linear-gradient(180deg, ${T.gold}, ${T.gold}80)`, borderRadius: '3px 3px 0 0' }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '7px', color: T.muted }}>{dailyTrend[0]?.date}</span>
                <span style={{ fontSize: '7px', color: T.muted }}>{dailyTrend[dailyTrend.length - 1]?.date}</span>
              </div>
            </div>
          </>
        )}

        {/* Weekly Performance */}
        {weeklyData.length > 0 && (
          <>
            <SectionTitle icon="📅" title="Weekly Performance" color={T.purple} />
            <div style={{ border: `1px solid ${T.border}40`, borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0', background: T.bg, borderBottom: `1px solid ${T.border}40` }}>
                {['Week', 'Orders', 'Value', 'Advance'].map(h => (
                  <span key={h} style={{ padding: '5px 6px', fontSize: '7px', fontWeight: 600, color: T.muted, textTransform: 'uppercase', textAlign: h === 'Week' ? 'left' : 'right' }}>{h}</span>
                ))}
              </div>
              {weeklyData.map((w, i) => (
                <div key={w.week} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0', background: i % 2 === 0 ? T.bg : T.white, borderBottom: i < weeklyData.length - 1 ? `1px solid ${T.border}30` : 'none' }}>
                  <span style={{ padding: '5px 6px', fontSize: '8px', color: T.text, fontWeight: 600 }}>{w.week.slice(5)}</span>
                  <span style={{ padding: '5px 6px', fontSize: '8px', fontFamily: 'monospace', textAlign: 'right' }}>{w.orders}</span>
                  <span style={{ padding: '5px 6px', fontSize: '8px', fontFamily: 'monospace', textAlign: 'right', color: T.gold }}>{formatBDT(w.value)}</span>
                  <span style={{ padding: '5px 6px', fontSize: '8px', fontFamily: 'monospace', textAlign: 'right', color: T.teal }}>{formatBDT(w.advance)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Week-over-Week Comparison */}
        {weekComparison && (
          <>
            <SectionTitle icon="⚖" title="Week vs Previous Week" color={T.blue} />
            <div style={{ background: T.bg, borderRadius: '8px', padding: '10px', marginBottom: '10px', border: `1px solid ${T.border}40` }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '7px', color: T.muted, margin: 0, textTransform: 'uppercase' }}>This Week</p>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: T.text, margin: '2px 0 0', fontFamily: 'monospace' }}>{weekComparison.current.orders} orders</p>
                  <p style={{ fontSize: '9px', color: T.gold, fontFamily: 'monospace' }}>{formatBDT(weekComparison.current.value)}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '7px', color: T.muted, margin: 0, textTransform: 'uppercase' }}>Last Week</p>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: T.text, margin: '2px 0 0', fontFamily: 'monospace' }}>{weekComparison.previous.orders} orders</p>
                  <p style={{ fontSize: '9px', color: T.muted, fontFamily: 'monospace' }}>{formatBDT(weekComparison.previous.value)}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div style={{ textAlign: 'center', padding: '4px', background: T.white, borderRadius: '6px' }}>
                  <p style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: 700, color: weekComparison.orderGrowth >= 0 ? T.teal : T.rose, margin: 0 }}>
                    {weekComparison.orderGrowth >= 0 ? '+' : ''}{weekComparison.orderGrowth}%
                  </p>
                  <p style={{ fontSize: '7px', color: T.muted, margin: '1px 0 0' }}>Orders</p>
                </div>
                <div style={{ textAlign: 'center', padding: '4px', background: T.white, borderRadius: '6px' }}>
                  <p style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: 700, color: weekComparison.valueGrowth >= 0 ? T.teal : T.rose, margin: 0 }}>
                    {weekComparison.valueGrowth >= 0 ? '+' : ''}{weekComparison.valueGrowth}%
                  </p>
                  <p style={{ fontSize: '7px', color: T.muted, margin: '1px 0 0' }}>Value</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Top Products */}
        {topProducts.length > 0 && (
          <>
            <SectionTitle icon="🏆" title={`Top Products (${topProducts.length})`} />
            <div style={{ border: `1px solid ${T.border}40`, borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
              {topProducts.map((p, i) => (
                <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: i % 2 === 0 ? T.bg : T.white, borderBottom: i < topProducts.length - 1 ? `1px solid ${T.border}30` : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0, flex: 1 }}>
                    <span style={{ width: '16px', height: '16px', borderRadius: '5px', background: i < 3 ? `${T.gold}15` : `${T.muted}10`, color: i < 3 ? T.gold : T.muted, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 700, fontFamily: 'monospace', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: '9px', color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span style={{ fontSize: '7px', color: T.muted, background: T.bg, padding: '1px 4px', borderRadius: '4px' }}>{p.category}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: T.gold, fontFamily: 'monospace' }}>{p.qty}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Dead Products */}
        {deadProducts.length > 0 && (
          <>
            <SectionTitle icon="💀" title={`Dead Stock (${deadProducts.length})`} color={T.rose} />
            <div style={{ border: `1px solid ${T.rose}20`, borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
              {deadProducts.map((p, i) => (
                <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', background: i % 2 === 0 ? `${T.rose}04` : T.white, borderBottom: i < deadProducts.length - 1 ? `1px solid ${T.border}30` : 'none' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: '9px', color: T.text, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                    <span style={{ fontSize: '7px', color: T.muted }}>{p.category}</span>
                  </div>
                  <span style={{ fontSize: '7px', color: T.rose, fontFamily: 'monospace', flexShrink: 0 }}>Last: {p.lastSeen}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Daily Breakdown (compact) */}
        {days > 1 && (
          <>
            <SectionTitle icon="📋" title="Daily Breakdown" color={T.muted} />
            <div style={{ border: `1px solid ${T.border}40`, borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0', background: T.bg, borderBottom: `1px solid ${T.border}40` }}>
                {['Date', 'Ord', 'Value', 'Adv'].map(h => (
                  <span key={h} style={{ padding: '4px 6px', fontSize: '7px', fontWeight: 600, color: T.muted, textTransform: 'uppercase', textAlign: h === 'Date' ? 'left' : 'right' }}>{h}</span>
                ))}
              </div>
              {sorted.map((r, i) => (
                <div key={r.dateString} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0', background: i % 2 === 0 ? T.bg : T.white, borderBottom: i < sorted.length - 1 ? `1px solid ${T.border}30` : 'none' }}>
                  <span style={{ padding: '4px 6px', fontSize: '8px', color: T.text }}>{formatDateShort(r.dateString)}</span>
                  <span style={{ padding: '4px 6px', fontSize: '8px', fontFamily: 'monospace', textAlign: 'right' }}>{r.totalOrder}</span>
                  <span style={{ padding: '4px 6px', fontSize: '8px', fontFamily: 'monospace', textAlign: 'right', color: T.gold }}>{formatBDT(r.totalOrderValue)}</span>
                  <span style={{ padding: '4px 6px', fontSize: '8px', fontFamily: 'monospace', textAlign: 'right', color: T.teal }}>{formatBDT(r.totalAdvance)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Alerts & Suggestions */}
        {alerts.length > 0 && (
          <>
            <SectionTitle icon="🔔" title="Alerts & Suggestions" color={T.rose} />
            <div style={{ marginBottom: '10px' }}>
              {alerts.map((a, i) => (
                <AlertItem key={i} icon={a.icon} text={a.text} color={a.color} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${T.border}40`, padding: '8px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '7px', color: T.muted, margin: 0 }}>Anzaar Islamic Lifestyle</p>
        <p style={{ fontSize: '7px', color: T.muted, margin: 0 }}>
          {new Date().toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

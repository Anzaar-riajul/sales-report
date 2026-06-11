import { useMemo } from 'react';
import { formatBDT, formatNumber, formatDateShort } from '../../utils/formatters';

const T = {
  gold: '#C9A84C', teal: '#0D9488', rose: '#E11D48', blue: '#3B82F6', purple: '#8B5CF6',
  text: '#0F172A', muted: '#64748B', border: '#E2E8F0', bg: '#F8FAFC', white: '#FFFFFF',
};

function StatCard({ label, value, color = T.gold }) {
  return (
    <div style={{ background: `${color}0A`, border: `2px solid ${color}25`, borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
      <div style={{ fontSize: '11px', color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: 900, color: T.text, margin: '4px 0 0', fontFamily: 'monospace', lineHeight: 1.1 }}>{value}</div>
    </div>
  );
}

function InfoRow({ label, value, color, bg }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: bg || 'transparent', borderRadius: '10px', borderBottom: `1px solid ${T.border}25` }}>
      <span style={{ fontSize: '14px', color: T.muted }}>{label}</span>
      <span style={{ fontSize: '15px', fontWeight: 800, color: color || T.text, fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
}

function SectionHeader({ icon, title, color = T.gold }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', marginTop: '6px' }}>
      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>{icon}</div>
      <span style={{ fontSize: '14px', fontWeight: 800, color: T.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
    </div>
  );
}

function AlertBox({ icon, text, color = T.gold }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: `${color}0A`, border: `2px solid ${color}20`, borderRadius: '12px', marginBottom: '6px' }}>
      <span style={{ fontSize: '16px', flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: '13px', color: T.text, lineHeight: '1.6' }}>{text}</span>
    </div>
  );
}

function BarVis({ value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ width: '100%', height: '6px', background: `${color}15`, borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px' }} />
    </div>
  );
}
export default function RangePDF({ reports, rangeLabel, startDate, endDate }) {
  const sorted = useMemo(() => reports ? [...reports].sort((a, b) => a.dateString.localeCompare(b.dateString)) : [], [reports]);
  const days = sorted.length;
  const agg = useMemo(() => sorted.reduce((acc, r) => ({
    totalOrder: acc.totalOrder + (r.totalOrder || 0),
    regularOrder: acc.regularOrder + (r.regularOrder || 0),
    customizeOrder: acc.customizeOrder + (r.customizeOrder || 0),
    totalProduct: acc.totalProduct + (r.totalProduct || 0),
    totalOrderValue: acc.totalOrderValue + (r.totalOrderValue || 0),
    totalAdvance: acc.totalAdvance + (r.totalAdvance || 0),
  }), { totalOrder: 0, regularOrder: 0, customizeOrder: 0, totalProduct: 0, totalOrderValue: 0, totalAdvance: 0 }), [sorted]);
  const avgOrders = days > 0 ? Math.round(agg.totalOrder / days) : 0;
  const avgValue = days > 0 ? Math.round(agg.totalOrderValue / days) : 0;
  const advanceRate = agg.totalOrderValue > 0 ? Math.round((agg.totalAdvance / agg.totalOrderValue) * 100) : 0;
  const customizeRate = agg.totalOrder > 0 ? Math.round((agg.customizeOrder / agg.totalOrder) * 100) : 0;
  const pendingAmount = Math.max(0, agg.totalOrderValue - agg.totalAdvance);
  const avgOrderValue = agg.totalOrder > 0 ? Math.round(agg.totalOrderValue / agg.totalOrder) : 0;
  const bestDay = useMemo(() => sorted.reduce((best, r) => (r.totalOrderValue > (best?.totalOrderValue || 0)) ? r : best, null), [sorted]);
  const worstDay = useMemo(() => sorted.reduce((worst, r) => (r.totalOrderValue < (worst?.totalOrderValue || Infinity)) ? r : worst, null), [sorted]);
  const topProducts = useMemo(() => {
    const map = {};
    sorted.forEach(r => (r.products || []).forEach(p => {
      if (!map[p.name]) map[p.name] = { name: p.name, qty: 0, category: p.category || 'Other' };
      map[p.name].qty += p.quantity || 0;
    }));
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 10);
  }, [sorted]);
  const deadProducts = useMemo(() => {
    const lastSeen = {};
    sorted.forEach(r => (r.products || []).forEach(p => {
      if (!lastSeen[p.name] || r.dateString > lastSeen[p.name].date) {
        lastSeen[p.name] = { date: r.dateString, category: p.category || 'Other' };
      }
    }));
    const endStr = sorted[sorted.length - 1]?.dateString;
    return Object.entries(lastSeen)
      .filter(([, d]) => Math.floor((new Date(endStr) - new Date(d.date)) / 86400000) > 14)
      .slice(0, 8)
      .map(([name, d]) => ({ name, lastSeen: d.date, category: d.category }));
  }, [sorted]);
  const weeklyData = useMemo(() => {
    const weeks = {};
    sorted.forEach(r => {
      const d = new Date(r.dateString);
      const ws = new Date(d); ws.setDate(d.getDate() - d.getDay());
      const key = ws.toISOString().split('T')[0];
      if (!weeks[key]) weeks[key] = { week: key, orders: 0, value: 0, advance: 0, days: 0 };
      weeks[key].orders += r.totalOrder || 0;
      weeks[key].value += r.totalOrderValue || 0;
      weeks[key].advance += r.totalAdvance || 0;
      weeks[key].days += 1;
    });
    return Object.values(weeks).sort((a, b) => a.week.localeCompare(b.week));
  }, [sorted]);
  const weekComp = useMemo(() => {
    if (weeklyData.length < 2) return null;
    const curr = weeklyData[weeklyData.length - 1];
    const prev = weeklyData[weeklyData.length - 2];
    return { curr, prev, orderGrowth: prev.orders > 0 ? Math.round(((curr.orders - prev.orders) / prev.orders) * 100) : 0, valueGrowth: prev.value > 0 ? Math.round(((curr.value - prev.value) / prev.value) * 100) : 0, };
  }, [weeklyData]);
  const dailyTrend = useMemo(() => sorted.map(r => ({ date: formatDateShort(r.dateString), value: r.totalOrderValue || 0, })), [sorted]);
  const maxTrendVal = useMemo(() => Math.max(...dailyTrend.map(d => d.value), 1), [dailyTrend]);
  const alerts = useMemo(() => {
    const r = [];
    if (advanceRate < 40) r.push({ icon: '⚠️', text: `Avg advance rate ${advanceRate}%. Collect 60%+ upfront.`, color: T.rose });
    if (advanceRate >= 60) r.push({ icon: '✅', text: `Strong advance rate at ${advanceRate}%.`, color: T.teal });
    if (customizeRate > 40) r.push({ icon: '🎨', text: `${customizeRate}% customize orders. Plan production.`, color: T.purple });
    if (deadProducts.length > 3) r.push({ icon: '💀', text: `${deadProducts.length} products dead 14+ days.`, color: T.rose });
    if (weekComp) {
      if (weekComp.valueGrowth > 10) r.push({ icon: '🚀', text: `Revenue +${weekComp.valueGrowth}% this week.`, color: T.teal });
      if (weekComp.valueGrowth < -10) r.push({ icon: '📉', text: `Revenue ${weekComp.valueGrowth}% this week.`, color: T.rose });
    }
    if (avgOrderValue > 3000) r.push({ icon: '💎', text: `High AOV ৳${avgOrderValue}.`, color: T.gold });
    return r;
  }, [advanceRate, customizeRate, deadProducts, weekComp, avgOrderValue]);

  if (!reports || reports.length === 0) return null;

  return (
    <div
      id="range-pdf-content"
      style={{
        width: '420px', maxWidth: '420px',
        background: T.white,
        fontFamily: "-apple-system, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif",
        color: T.text, padding: '0',
        position: 'absolute', left: '-9999px', top: 0, overflow: 'visible',
      }}
    >
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${T.gold}, ${T.gold}CC)`, padding: '28px 20px', color: T.white }}>
        <div style={{ fontSize: '14px', fontWeight: 600, opacity: 0.85, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Anzaar Lifestyle</div>
        <div style={{ fontSize: '20px', fontWeight: 900, margin: '4px 0 0' }}>Sales Report</div>
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>{rangeLabel || `${formatDateShort(startDate)} → ${formatDateShort(endDate)}`}</div>
          <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '4px' }}>{days} days · {formatDateShort(startDate)} – {formatDateShort(endDate)}</div>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Summary */}
        <SectionHeader icon="📊" title="Summary" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          <StatCard label="Orders" value={formatNumber(agg.totalOrder)} color={T.gold} />
          <StatCard label="Revenue" value={formatBDT(agg.totalOrderValue)} color={T.teal} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
          <div style={{ background: T.bg, borderRadius: '12px', padding: '10px', textAlign: 'center', border: `1px solid ${T.border}50` }}>
            <div style={{ fontSize: '10px', color: T.muted, textTransform: 'uppercase' }}>Avg/Day</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: T.text, fontFamily: 'monospace' }}>{avgOrders}</div>
          </div>
          <div style={{ background: T.bg, borderRadius: '12px', padding: '10px', textAlign: 'center', border: `1px solid ${T.border}50` }}>
            <div style={{ fontSize: '10px', color: T.muted, textTransform: 'uppercase' }}>Value/Day</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: T.gold, fontFamily: 'monospace' }}>{formatBDT(avgValue)}</div>
          </div>
          <div style={{ background: T.bg, borderRadius: '12px', padding: '10px', textAlign: 'center', border: `1px solid ${T.border}50` }}>
            <div style={{ fontSize: '10px', color: T.muted, textTransform: 'uppercase' }}>AOV</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: T.teal, fontFamily: 'monospace' }}>{formatBDT(avgOrderValue)}</div>
          </div>
        </div>

        {/* Order Split */}
        <SectionHeader icon="📦" title="Order Split" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '6px' }}>
          <div style={{ background: `${T.gold}0A`, border: `2px solid ${T.gold}25`, borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: T.muted, textTransform: 'uppercase', fontWeight: 700 }}>Regular</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: T.gold, fontFamily: 'monospace', margin: '4px 0' }}>{formatNumber(agg.regularOrder)}</div>
            <div style={{ fontSize: '11px', color: T.muted }}>{100 - customizeRate}%</div>
          </div>
          <div style={{ background: `${T.rose}0A`, border: `2px solid ${T.rose}25`, borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: T.muted, textTransform: 'uppercase', fontWeight: 700 }}>Custom</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: T.rose, fontFamily: 'monospace', margin: '4px 0' }}>{formatNumber(agg.customizeOrder)}</div>
            <div style={{ fontSize: '11px', color: T.muted }}>{customizeRate}%</div>
          </div>
        </div>
        <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', background: `${T.rose}15`, marginBottom: '16px' }}>
          <div style={{ width: `${100 - customizeRate}%`, background: T.gold, borderRadius: '4px 0 0 4px' }} />
          <div style={{ width: `${customizeRate}%`, background: T.rose, borderRadius: '0 4px 4px 0' }} />
        </div>

        {/* Payment */}
        <SectionHeader icon="💳" title="Payment" color={T.teal} />
        <div style={{ background: T.bg, borderRadius: '14px', border: `1px solid ${T.border}40`, overflow: 'hidden', marginBottom: '16px' }}>
          <InfoRow label="Collected" value={formatBDT(agg.totalAdvance)} color={T.teal} bg={`${T.teal}05`} />
          <InfoRow label="Pending" value={formatBDT(pendingAmount)} color={T.rose} />
          <InfoRow label="Rate" value={`${advanceRate}%`} color={advanceRate >= 50 ? T.teal : T.rose} />
        </div>

        {/* Best/Worst */}
        {days > 1 && bestDay && worstDay && (
          <>
            <SectionHeader icon="🏆" title="Highlights" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: `${T.teal}08`, border: `2px solid ${T.teal}20`, borderRadius: '14px', padding: '14px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: T.teal, textTransform: 'uppercase' }}>Best Day</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: T.text, margin: '4px 0 2px' }}>{formatDateShort(bestDay.dateString)}</div>
                <div style={{ fontSize: '13px', color: T.gold, fontFamily: 'monospace', fontWeight: 700 }}>{formatBDT(bestDay.totalOrderValue)}</div>
                <div style={{ fontSize: '11px', color: T.muted }}>{bestDay.totalOrder} orders</div>
              </div>
              <div style={{ background: `${T.rose}08`, border: `2px solid ${T.rose}20`, borderRadius: '14px', padding: '14px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: T.rose, textTransform: 'uppercase' }}>Lowest Day</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: T.text, margin: '4px 0 2px' }}>{formatDateShort(worstDay.dateString)}</div>
                <div style={{ fontSize: '13px', color: T.muted, fontFamily: 'monospace', fontWeight: 700 }}>{formatBDT(worstDay.totalOrderValue)}</div>
                <div style={{ fontSize: '11px', color: T.muted }}>{worstDay.totalOrder} orders</div>
              </div>
            </div>
          </>
        )}

        {/* Daily Trend */}
        {dailyTrend.length > 0 && (
          <>
            <SectionHeader icon="📈" title="Daily Trend" color={T.blue} />
            <div style={{ background: T.bg, borderRadius: '14px', padding: '14px', marginBottom: '16px', border: `1px solid ${T.border}40` }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '80px' }}>
                {dailyTrend.map((d, i) => {
                  const h = maxTrendVal > 0 ? Math.max((d.value / maxTrendVal) * 72, 6) : 6;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                      <div style={{ width: '100%', height: `${h}px`, background: `linear-gradient(180deg, ${T.gold}, ${T.gold}70)`, borderRadius: '4px 4px 0 0' }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ fontSize: '10px', color: T.muted }}>{dailyTrend[0]?.date}</span>
                <span style={{ fontSize: '10px', color: T.muted }}>{dailyTrend[dailyTrend.length - 1]?.date}</span>
              </div>
            </div>
          </>
        )}

        {/* Weekly Performance */}
        {weeklyData.length > 0 && (
          <>
            <SectionHeader icon="📅" title="Weekly Performance" color={T.purple} />
            <div style={{ border: `2px solid ${T.border}40`, borderRadius: '14px', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', background: T.bg, borderBottom: `2px solid ${T.border}40` }}>
                {['Week', 'Ord', 'Value', 'Adv'].map(h => (
                  <span key={h} style={{ padding: '8px 8px', fontSize: '10px', fontWeight: 700, color: T.muted, textTransform: 'uppercase', textAlign: h === 'Week' ? 'left' : 'right' }}>{h}</span>
                ))}
              </div>
              {weeklyData.map((w, i) => (
                <div key={w.week} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', background: i % 2 === 0 ? T.bg : T.white, borderBottom: i < weeklyData.length - 1 ? `1px solid ${T.border}25` : 'none' }}>
                  <span style={{ padding: '8px 8px', fontSize: '12px', color: T.text, fontWeight: 700 }}>{w.week.slice(5)}</span>
                  <span style={{ padding: '8px 8px', fontSize: '12px', fontFamily: 'monospace', textAlign: 'right' }}>{w.orders}</span>
                  <span style={{ padding: '8px 8px', fontSize: '12px', fontFamily: 'monospace', textAlign: 'right', color: T.gold, fontWeight: 700 }}>{formatBDT(w.value)}</span>
                  <span style={{ padding: '8px 8px', fontSize: '12px', fontFamily: 'monospace', textAlign: 'right', color: T.teal }}>{formatBDT(w.advance)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Week Comparison */}
        {weekComp && (
          <>
            <SectionHeader icon="⚖" title="Week vs Previous" color={T.blue} />
            <div style={{ background: T.bg, borderRadius: '14px', padding: '14px', marginBottom: '16px', border: `1px solid ${T.border}40` }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: T.muted, textTransform: 'uppercase' }}>This Week</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: T.text, fontFamily: 'monospace' }}>{weekComp.curr.orders}</div>
                  <div style={{ fontSize: '12px', color: T.gold, fontFamily: 'monospace' }}>{formatBDT(weekComp.curr.value)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: T.muted, textTransform: 'uppercase' }}>Last Week</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: T.text, fontFamily: 'monospace' }}>{weekComp.prev.orders}</div>
                  <div style={{ fontSize: '12px', color: T.muted, fontFamily: 'monospace' }}>{formatBDT(weekComp.prev.value)}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ textAlign: 'center', padding: '6px', background: T.white, borderRadius: '8px' }}>
                  <div style={{ fontSize: '18px', fontFamily: 'monospace', fontWeight: 800, color: weekComp.orderGrowth >= 0 ? T.teal : T.rose }}>
                    {weekComp.orderGrowth >= 0 ? '+' : ''}{weekComp.orderGrowth}%
                  </div>
                  <div style={{ fontSize: '10px', color: T.muted }}>Orders</div>
                </div>
                <div style={{ textAlign: 'center', padding: '6px', background: T.white, borderRadius: '8px' }}>
                  <div style={{ fontSize: '18px', fontFamily: 'monospace', fontWeight: 800, color: weekComp.valueGrowth >= 0 ? T.teal : T.rose }}>
                    {weekComp.valueGrowth >= 0 ? '+' : ''}{weekComp.valueGrowth}%
                  </div>
                  <div style={{ fontSize: '10px', color: T.muted }}>Value</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Top Products */}
        {topProducts.length > 0 && (
          <>
            <SectionHeader icon="🏆" title={`Top ${topProducts.length} Products`} />
            <div style={{ border: `2px solid ${T.border}40`, borderRadius: '14px', overflow: 'hidden', marginBottom: '16px' }}>
              {topProducts.map((p, i) => (
                <div key={p.name} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', background: i % 2 === 0 ? T.bg : T.white,
                  borderBottom: i < topProducts.length - 1 ? `1px solid ${T.border}25` : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                    <span style={{
                      width: '22px', height: '22px', borderRadius: '7px',
                      background: i < 3 ? `${T.gold}15` : `${T.muted}10`,
                      color: i < 3 ? T.gold : T.muted,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', fontWeight: 800, fontFamily: 'monospace', flexShrink: 0,
                    }}>{i + 1}</span>
                    <span style={{ fontSize: '13px', color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span style={{ fontSize: '10px', color: T.muted, background: T.bg, padding: '2px 6px', borderRadius: '6px' }}>{p.category}</span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: T.gold, fontFamily: 'monospace' }}>{p.qty}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Dead Products */}
        {deadProducts.length > 0 && (
          <>
            <SectionHeader icon="💀" title={`Dead Stock (${deadProducts.length})`} color={T.rose} />
            <div style={{ border: `2px solid ${T.rose}20`, borderRadius: '14px', overflow: 'hidden', marginBottom: '16px' }}>
              {deadProducts.map((p, i) => (
                <div key={p.name} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', background: i % 2 === 0 ? `${T.rose}05` : T.white,
                  borderBottom: i < deadProducts.length - 1 ? `1px solid ${T.border}25` : 'none',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: '10px', color: T.muted }}>{p.category}</div>
                  </div>
                  <span style={{ fontSize: '10px', color: T.rose, fontFamily: 'monospace', flexShrink: 0 }}>Last: {p.lastSeen}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Daily Breakdown */}
        {days > 1 && (
          <>
            <SectionHeader icon="📋" title="Daily Breakdown" color={T.muted} />
            <div style={{ border: `2px solid ${T.border}40`, borderRadius: '14px', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', background: T.bg, borderBottom: `2px solid ${T.border}40` }}>
                {['Date', 'Ord', 'Value', 'Adv'].map(h => (
                  <span key={h} style={{ padding: '6px 8px', fontSize: '9px', fontWeight: 700, color: T.muted, textTransform: 'uppercase', textAlign: h === 'Date' ? 'left' : 'right' }}>{h}</span>
                ))}
              </div>
              {sorted.map((r, i) => (
                <div key={r.dateString} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', background: i % 2 === 0 ? T.bg : T.white, borderBottom: i < sorted.length - 1 ? `1px solid ${T.border}25` : 'none' }}>
                  <span style={{ padding: '6px 8px', fontSize: '11px', color: T.text, fontWeight: 600 }}>{formatDateShort(r.dateString)}</span>
                  <span style={{ padding: '6px 8px', fontSize: '11px', fontFamily: 'monospace', textAlign: 'right' }}>{r.totalOrder}</span>
                  <span style={{ padding: '6px 8px', fontSize: '11px', fontFamily: 'monospace', textAlign: 'right', color: T.gold, fontWeight: 700 }}>{formatBDT(r.totalOrderValue)}</span>
                  <span style={{ padding: '6px 8px', fontSize: '11px', fontFamily: 'monospace', textAlign: 'right', color: T.teal }}>{formatBDT(r.totalAdvance)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <>
            <SectionHeader icon="🔔" title="Alerts" color={T.rose} />
            <div style={{ marginBottom: '16px' }}>
              {alerts.map((a, i) => (
                <AlertBox key={i} icon={a.icon} text={a.text} color={a.color} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: `2px solid ${T.border}30`, padding: '14px 20px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', color: T.muted }}>Anzaar Sales Report</span>
        <span style={{ fontSize: '11px', color: T.muted }}>{new Date().toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </div>
    </div>
  );
}

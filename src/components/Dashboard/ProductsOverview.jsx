import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { subDays } from 'date-fns';
import { computeNewProducts, computeProductRankings, getProductLastSeen } from '../../utils/analytics';
import { formatBDT, formatDateShort } from '../../utils/formatters';
import DetailModal from '../UI/DetailModal';

const CARD_THEMES = {
  top: { accent: '#C9A84C', label: 'Top Products', icon: '🏆', subtitle: 'Best sellers by quantity' },
  today: { accent: '#6366F1', label: "Today's Products", icon: '📦', subtitle: "Products from today's report" },
  new: { accent: '#14B8A6', label: 'New This Week', icon: '✨', subtitle: 'Recently added products' },
  dead: { accent: '#F43F5E', label: 'Dead Stock', icon: '⚠', subtitle: 'No sales in 7+ days' },
};

function MiniChart({ data, color }) {
  if (!data || data.length < 2) return null;
  return (
    <ResponsiveContainer width="100%" height={60}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`mini-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis hide /><YAxis hide />
        <Tooltip
          contentStyle={{ background: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '10px' }}
          formatter={(v) => [Math.round(v), '']}
        />
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#mini-${color.replace('#', '')})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function CardModal({ open, onClose, type, data, reports }) {
  const navigate = useNavigate();
  const t = CARD_THEMES[type];
  const trendData = useMemo(() => {
    if (!reports || type !== 'top') return [];
    return [...reports].reverse().slice(-14).map(r => ({
      date: formatDateShort(r.dateString),
      v: r.totalProduct || 0,
    }));
  }, [reports, type]);

  if (!open) return null;

  return (
    <DetailModal
      open={open}
      onClose={onClose}
      title={t.label}
      subtitle={`${data.length} products`}
      color={t.accent}
      icon={<span className="text-lg">{t.icon}</span>}
    >
      {/* Mini trend */}
      {trendData.length > 1 && (
        <div className="mb-4 bg-gradient-to-b from-bg-elevated/20 to-transparent rounded-xl p-2">
          <p className="text-[9px] text-text-muted uppercase tracking-wider mb-1">14-day product count trend</p>
          <MiniChart data={trendData} color={t.accent} />
        </div>
      )}

      {/* Product list */}
      <div className="space-y-1">
        {data.map((p, i) => (
          <div
            key={p.name}
            onClick={() => { onClose(); navigate(`/products/${encodeURIComponent(p.name)}`); }}
            className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-bg-elevated/40 cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0"
                style={{ background: `${t.accent}15`, color: t.accent }}>
                {i + 1}
              </span>
              <span className="text-xs font-medium text-text-primary truncate group-hover:text-accent-gold transition-colors">{p.name}</span>
              {p.category && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-bg-elevated/80 text-text-muted border border-border/30">{p.category}</span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {p.velocity !== undefined && <span className="text-[10px] text-text-muted font-mono">{p.velocity}/d</span>}
              <span className="text-xs font-bold font-mono" style={{ color: t.accent }}>
                {type === 'dead' ? `${p.totalQuantitySold || 0} sold` : `×${p.quantity || p.totalQuantitySold || 0}`}
              </span>
            </div>
          </div>
        ))}
      </div>

      {data.length === 0 && (
        <p className="text-xs text-text-muted text-center py-6">No products to show</p>
      )}

      <button
        onClick={() => { onClose(); navigate('/products'); }}
        className="w-full mt-4 py-2.5 text-xs font-medium text-accent-gold bg-accent-gold/5 hover:bg-accent-gold/10 border border-accent-gold/15 rounded-xl transition-all"
      >
        View all products →
      </button>
    </DetailModal>
  );
}

function MiniSection({ title, type, count, children, onClick }) {
  const t = CARD_THEMES[type];
  return (
    <div
      onClick={onClick}
      className="relative overflow-hidden bg-white/80 backdrop-blur-xl border border-border/40 rounded-2xl p-3.5 sm:p-4 cursor-pointer group hover:shadow-lg hover:border-accent-gold/20 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300"
    >
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] opacity-40 group-hover:opacity-80 transition-opacity"
        style={{ background: `linear-gradient(90deg, ${t.accent}, ${t.accent}60, transparent)` }} />

      {/* Radial glow */}
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none"
        style={{ background: `radial-gradient(circle, ${t.accent}30, transparent)` }} />

      <div className="relative">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sm">{t.icon}</span>
            <h3 className="text-xs font-semibold text-text-primary">{title}</h3>
            {count !== undefined && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border" style={{ borderColor: `${t.accent}25`, color: t.accent, background: `${t.accent}08` }}>
                {count}
              </span>
            )}
          </div>
          <span className="text-[9px] text-text-muted/40 group-hover:text-accent-gold transition-colors">tap →</span>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ProductsOverview({ products, reports, latestReport }) {
  const [modal, setModal] = useState(null);
  const [showMore, setShowMore] = useState(false);

  const newProducts = useMemo(() => computeNewProducts(products || [], reports || []), [products, reports]);
  const newTop = useMemo(() => newProducts.slice(0, 5), [newProducts]);

  const todayProducts = useMemo(() => {
    if (!latestReport?.products) return [];
    return [...latestReport.products].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [latestReport]);

  const rankings = useMemo(() => computeProductRankings(products || []).slice(0, 5), [products]);
  const deadStock = useMemo(() => {
    if (!products || !reports || reports.length === 0) return [];
    const sorted = [...reports].sort((a, b) => new Date(b.dateString) - new Date(a.dateString));
    const latest = sorted[0];
    if (!latest) return [];
    const [y, m, d] = latest.dateString.split('-').map(Number);
    const cutoff = subDays(new Date(y, m - 1, d), 7);
    return products
      .filter(p => {
        const lastSeen = getProductLastSeen(p);
        if (!lastSeen) return true;
        return lastSeen < cutoff;
      })
      .sort((a, b) => (a.totalQuantitySold || 0) - (b.totalQuantitySold || 0))
      .slice(0, 5);
  }, [products, reports]);

  if (!products || products.length === 0) return null;

  const openModal = (type, data) => setModal({ type, data });

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
        {/* Top Products */}
        <MiniSection title="Top Products" type="top" count={rankings[0]?.totalQuantitySold} onClick={() => openModal('top', rankings)}>
          {rankings.length === 0 ? (
            <p className="text-[10px] text-text-muted py-2 text-center">No data yet</p>
          ) : (
            <div className="space-y-0.5">
              {rankings.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-4 h-4 rounded-md bg-accent-gold/10 text-accent-gold text-[8px] font-mono flex items-center justify-center">{i + 1}</span>
                    <span className="text-[11px] font-medium text-text-primary truncate">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-accent-gold font-semibold">{p.totalQuantitySold}</span>
                    <span className="text-[8px] text-text-muted">{p.velocity}/d</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </MiniSection>

        {/* Dead Stock */}
        <MiniSection title="Dead Stock" type="dead" count={deadStock.length} onClick={() => openModal('dead', deadStock)}>
          {deadStock.length === 0 ? (
            <p className="text-[10px] text-accent-gold py-2 text-center">✓ No dead stock</p>
          ) : (
            <div className="space-y-0.5">
              {deadStock.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2 min-w-0">
                      <span className="w-4 h-4 rounded-md text-[8px] font-mono flex items-center justify-center"
                        style={{ background: `${CARD_THEMES.dead.accent}15`, color: CARD_THEMES.dead.accent }}>{i + 1}</span>
                      <span className="text-[11px] font-medium text-text-primary truncate">{p.name}</span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold" style={{ color: CARD_THEMES.dead.accent }}>{p.totalQuantitySold || 0} sold</span>
                </div>
              ))}
            </div>
          )}
        </MiniSection>

        {/* Expanded sections - Today's + New This Week */}
        {showMore && (
          <>
            <MiniSection title="Today's Products" type="today" count={todayProducts.length} onClick={() => openModal('today', todayProducts)}>
              {todayProducts.length === 0 ? (
                <p className="text-[10px] text-text-muted py-2 text-center">No products today</p>
              ) : (
                <div className="space-y-0.5">
                  {todayProducts.map((p, i) => (
                    <div key={p.name} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-4 h-4 rounded-md text-[8px] font-mono flex items-center justify-center"
                        style={{ background: `${CARD_THEMES.today.accent}15`, color: CARD_THEMES.today.accent }}>{i + 1}</span>
                        <span className="text-[11px] font-medium text-text-primary truncate">{p.name}</span>
                      </div>
                      <span className="text-[10px] font-mono font-semibold" style={{ color: CARD_THEMES.today.accent }}>×{p.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </MiniSection>

            <MiniSection title="New This Week" type="new" count={newProducts.length} onClick={() => openModal('new', newTop)}>
              {newTop.length === 0 ? (
                <p className="text-[10px] text-text-muted py-2 text-center">No new products</p>
              ) : (
                <div className="space-y-0.5">
                  {newTop.map((p, i) => (
                    <div key={p.name} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2 min-w-0">
                      <span className="w-4 h-4 rounded-md text-[8px] font-mono flex items-center justify-center"
                        style={{ background: `${CARD_THEMES.new.accent}15`, color: CARD_THEMES.new.accent }}>{i + 1}</span>
                      <span className="text-[11px] font-medium text-text-primary truncate">{p.name}</span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold" style={{ color: CARD_THEMES.new.accent }}>{p.totalQuantitySold || 0} sold</span>
                    </div>
                  ))}
                </div>
              )}
            </MiniSection>
          </>
        )}
      </div>

      {/* View More / View Less button */}
      <button
        onClick={() => setShowMore(!showMore)}
        className="w-full py-2.5 text-xs font-medium text-accent-gold bg-accent-gold/5 hover:bg-accent-gold/10 border border-accent-gold/15 rounded-xl transition-all flex items-center justify-center gap-1.5"
      >
        {showMore ? (
          <>Show Less <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6" /></svg></>
        ) : (
          <>View More <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg></>
        )}
      </button>

      <CardModal
        open={!!modal}
        onClose={() => setModal(null)}
        type={modal?.type || 'top'}
        data={modal?.data || []}
        reports={reports}
      />
    </>
  );
}

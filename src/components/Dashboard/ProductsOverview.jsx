import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { subDays } from 'date-fns';
import { computeNewProducts, computeProductRankings } from '../../utils/analytics';
import Card from '../UI/Card';
import Badge from '../UI/Badge';

function MiniSection({ title, count, children, seeAllTo }) {
  const navigate = useNavigate();
  return (
    <Card>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          {count !== undefined && <Badge variant="gold">{count}</Badge>}
        </div>
        <button onClick={() => navigate(seeAllTo)} className="text-[10px] text-accent-gold hover:underline font-medium whitespace-nowrap">See all →</button>
      </div>
      {children}
    </Card>
  );
}

function DeadStockMini({ products, reports }) {
  const navigate = useNavigate();
  const deadStock = useMemo(() => {
    if (!products || !reports || reports.length === 0) return [];
    const sorted = [...reports].sort((a, b) => new Date(b.dateString) - new Date(a.dateString));
    const latest = sorted[0];
    if (!latest) return [];
    const cutoff = subDays(new Date(latest.dateString), 7);
    return products
      .filter(p => {
        if (!p.lastSeenDate) return true;
        const lastSeen = p.lastSeenDate.toDate ? p.lastSeenDate.toDate() : new Date(p.lastSeenDate);
        return lastSeen < cutoff;
      })
      .sort((a, b) => (a.totalQuantitySold || 0) - (b.totalQuantitySold || 0))
      .slice(0, 5);
  }, [products, reports]);

  if (deadStock.length === 0) {
    return <p className="text-xs text-accent-teal py-3 text-center">✓ No dead stock</p>;
  }
  return (
    <div className="space-y-1">
      {deadStock.map(p => (
        <div key={p.name} onClick={() => navigate(`/products/${encodeURIComponent(p.name)}`)} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-bg-elevated/50 cursor-pointer transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-medium text-text-primary truncate">{p.name}</span>
            <Badge variant="rose">{p.category || 'Other'}</Badge>
          </div>
          <span className="text-[10px] font-mono text-text-muted flex-shrink-0">{p.totalQuantitySold || 0} sold</span>
        </div>
      ))}
    </div>
  );
}

export default function ProductsOverview({ products, reports, latestReport }) {
  const navigate = useNavigate();

  const newProducts = useMemo(() => computeNewProducts(products || [], reports || []), [products, reports]);
  const newTop = useMemo(() => newProducts.slice(0, 5), [newProducts]);

  const todayProducts = useMemo(() => {
    if (!latestReport?.products) return [];
    return [...latestReport.products].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [latestReport]);

  const rankings = useMemo(() => computeProductRankings(products || []).slice(0, 5), [products]);
  const deadCount = useMemo(() => {
    if (!products || !reports || reports.length === 0) return 0;
    const sorted = [...reports].sort((a, b) => new Date(b.dateString) - new Date(a.dateString));
    const latest = sorted[0];
    if (!latest) return 0;
    const cutoff = subDays(new Date(latest.dateString), 7);
    return products.filter(p => {
      if (!p.lastSeenDate) return true;
      const lastSeen = p.lastSeenDate.toDate ? p.lastSeenDate.toDate() : new Date(p.lastSeenDate);
      return lastSeen < cutoff;
    }).length;
  }, [products, reports]);

  if (!products || products.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <MiniSection title="Top Products" count={rankings[0]?.totalQuantitySold || 0} seeAllTo="/products">
        {rankings.length === 0 ? (
          <p className="text-xs text-text-muted py-3 text-center">No product data yet</p>
        ) : (
          <div className="space-y-1">
            {rankings.map((p, i) => (
              <div key={p.name} onClick={() => navigate(`/products/${encodeURIComponent(p.name)}`)} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-bg-elevated/50 cursor-pointer transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-4 h-4 rounded-full bg-accent-gold/10 text-accent-gold text-[9px] font-mono flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span className="text-xs font-medium text-text-primary truncate">{p.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] font-mono text-accent-gold">{p.totalQuantitySold}</span>
                  <span className="text-[9px] text-text-muted">{p.velocity}/d</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </MiniSection>

      <MiniSection title="Today's Products" count={todayProducts.length} seeAllTo="/products">
        {todayProducts.length === 0 ? (
          <p className="text-xs text-text-muted py-3 text-center">No products today</p>
        ) : (
          <div className="space-y-1">
            {todayProducts.map((p, i) => (
              <div key={p.name} onClick={() => navigate(`/products/${encodeURIComponent(p.name)}`)} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-bg-elevated/50 cursor-pointer transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-4 h-4 rounded-full bg-accent-gold/10 text-accent-gold text-[9px] font-mono flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span className="text-xs font-medium text-text-primary truncate">{p.name}</span>
                  {p.category && <Badge variant="gold">{p.category}</Badge>}
                </div>
                <span className="text-[10px] font-mono text-accent-gold flex-shrink-0">×{p.quantity}</span>
              </div>
            ))}
          </div>
        )}
      </MiniSection>

      <MiniSection title="New This Week" count={newProducts.length} seeAllTo="/products">
        {newTop.length === 0 ? (
          <p className="text-xs text-text-muted py-3 text-center">No new products this week</p>
        ) : (
          <div className="space-y-1">
            {newTop.map(p => (
              <div key={p.name} onClick={() => navigate(`/products/${encodeURIComponent(p.name)}`)} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-bg-elevated/50 cursor-pointer transition-colors">
                <span className="text-xs font-medium text-accent-teal truncate">{p.name}</span>
                <span className="text-[10px] font-mono text-text-muted flex-shrink-0">{p.totalQuantitySold || 0} sold</span>
              </div>
            ))}
          </div>
        )}
      </MiniSection>

      <MiniSection title="Dead Stock" count={deadCount} seeAllTo="/products">
        <DeadStockMini products={products} reports={reports} />
      </MiniSection>
    </div>
  );
}

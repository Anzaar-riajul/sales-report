import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReports } from '../hooks/useReports';
import { useProducts } from '../hooks/useProducts';
import { computeNewProducts, computeProductRankings, computeCategoryBreakdown } from '../utils/analytics';
import CategoryBreakdown from '../components/Products/CategoryBreakdown';
import DeadStockAlert from '../components/Products/DeadStockAlert';
import OthersCategoryPanel from '../components/Products/OthersCategoryPanel';
import Card from '../components/UI/Card';
import Badge from '../components/UI/Badge';
import DetailModal from '../components/UI/DetailModal';
import { formatNumber } from '../utils/formatters';
import { subDays } from 'date-fns';

const STAT_CARDS = [
  {
    key: 'totalProducts',
    label: 'Total Products',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
    gradient: 'from-accent-gold via-amber-400 to-yellow-500',
    shadow: 'shadow-accent-gold/20',
  },
  {
    key: 'categories',
    label: 'Categories',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    gradient: 'from-accent-teal via-emerald-400 to-teal-500',
    shadow: 'shadow-accent-teal/20',
  },
  {
    key: 'topSeller',
    label: 'Top Seller',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    gradient: 'from-rose-500 via-pink-400 to-rose-600',
    shadow: 'shadow-rose-500/20',
  },
  {
    key: 'deadStock',
    label: 'Dead Stock',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    gradient: 'from-slate-500 via-gray-400 to-slate-600',
    shadow: 'shadow-slate-500/20',
  },
];

const SORT_OPTIONS = [
  { key: 'totalQuantitySold', label: 'Total Sold' },
  { key: 'totalAppearances', label: 'Consistency' },
  { key: 'velocity', label: 'Velocity' },
  { key: 'lastSeenDate', label: 'Last Seen' },
];

export default function Products() {
  const { products, loading, refetch } = useProducts();
  const { reports } = useReports();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('totalQuantitySold');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const rankings = useMemo(() => computeProductRankings(products || []), [products]);
  const categories = useMemo(() => {
    const cats = new Set(rankings.map(p => p.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [rankings]);

  const newProducts = useMemo(() => computeNewProducts(products || [], reports || []), [products, reports]);

  const deadStock = useMemo(() => {
    if (!products || products.length === 0 || !reports || reports.length === 0) return [];
    const sorted = [...reports].sort((a, b) => new Date(b.dateString) - new Date(a.dateString));
    const latest = sorted[0];
    if (!latest) return [];
    const cutoff = subDays(new Date(latest.dateString), 7);
    return products.filter(p => {
      if (!p.lastSeenDate) return true;
      const lastSeen = p.lastSeenDate.toDate ? p.lastSeenDate.toDate() : new Date(p.lastSeenDate);
      return lastSeen < cutoff;
    });
  }, [products, reports]);

  const categoryBreakdown = useMemo(() => computeCategoryBreakdown(products || []), [products]);
  const topSeller = useMemo(() => rankings[0] || null, [rankings]);
  const uniqueCategories = useMemo(() => new Set(rankings.map(p => p.category).filter(Boolean)).size, [rankings]);

  const [showAllDeadStock, setShowAllDeadStock] = useState(false);
  const [showAllNewProducts, setShowAllNewProducts] = useState(false);
  const [showAllRanking, setShowAllRanking] = useState(false);

  const DEAD_STOCK_LIMIT = 5;
  const NEW_PRODUCTS_LIMIT = 6;
  const RANKING_LIMIT = 8;

  const filtered = useMemo(() => {
    return rankings.filter(p => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [rankings, search, categoryFilter]);

  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortBy] || 0;
    const bVal = b[sortBy] || 0;
    if (typeof aVal === 'number') return bVal - aVal;
    return String(bVal).localeCompare(String(aVal));
  });

  const handleCategoryUpdated = useCallback(() => {
    refetch();
  }, [refetch]);

  const getStatValue = (key) => {
    switch (key) {
      case 'totalProducts':
        return formatNumber(products?.length || 0);
      case 'categories':
        return formatNumber(uniqueCategories);
      case 'topSeller':
        return topSeller ? topSeller.name.substring(0, 12) + (topSeller.name.length > 12 ? '...' : '') : '—';
      case 'deadStock':
        return formatNumber(deadStock.length);
      default:
        return '0';
    }
  };

  const getStatSubtext = (key) => {
    switch (key) {
      case 'totalProducts':
        return topSeller ? `Top: ${topSeller.name.substring(0, 15)}` : 'No data yet';
      case 'categories':
        return categoryBreakdown.length > 0 ? `Leading: ${categoryBreakdown[0].name}` : 'No data yet';
      case 'topSeller':
        return topSeller ? `${formatNumber(topSeller.totalQuantitySold || 0)} sold` : '';
      case 'deadStock':
        return deadStock.length > 0 ? 'Need attention' : 'All active!';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent-gold to-amber-500 flex items-center justify-center shadow-lg shadow-accent-gold/20">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-text-primary tracking-tight">Products</h2>
            <p className="text-xs text-text-muted mt-0.5">Loading product intelligence...</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card-static p-4 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-bg-elevated mb-3" />
              <div className="h-4 bg-bg-elevated rounded w-20 mb-2" />
              <div className="h-6 bg-bg-elevated rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 animate-fade-in-up">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent-gold to-amber-500 flex items-center justify-center shadow-lg shadow-accent-gold/20">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-text-primary tracking-tight">Products</h2>
          <p className="text-xs text-text-muted mt-0.5">Product intelligence & categorization</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map((stat, i) => (
          <div
            key={stat.key}
            className={`glass-card-static p-4 animate-fade-in-up stagger-${i + 1} group hover:scale-[1.02] transition-transform duration-300`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform duration-300`}>
                {stat.icon}
              </div>
              <div className="w-2 h-2 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="font-mono text-xl font-bold text-text-primary tracking-tight count-animate">
              {getStatValue(stat.key)}
            </p>
            <p className="text-[11px] text-text-muted mt-1">{getStatSubtext(stat.key)}</p>
          </div>
        ))}
      </div>

      {/* Category Breakdown + Dead Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="animate-fade-in-up stagger-3">
          <CategoryBreakdown products={products} loading={loading} />
        </div>
        <div className="animate-fade-in-up stagger-4">
          <DeadStockAlert products={products} reports={reports} loading={loading} />
        </div>
      </div>

      {/* New Products This Week */}
      {newProducts.length > 0 && (
        <div className="animate-fade-in-up stagger-5">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M2 12h20" />
                  </svg>
                </div>
                <div>
                  <h3 className="section-title">New This Week</h3>
                  <p className="text-xs text-text-muted mt-0.5">{newProducts.length} products spotted for the first time</p>
                </div>
              </div>
              <Badge variant="teal">{newProducts.length} new</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {(showAllNewProducts ? newProducts : newProducts.slice(0, NEW_PRODUCTS_LIMIT)).map((p, i) => (
                <button
                  key={p.name}
                  onClick={() => navigate(`/products/${encodeURIComponent(p.name)}`)}
                  className="px-3 py-1.5 bg-gradient-to-r from-accent-teal/5 to-emerald-500/5 border border-accent-teal/20 rounded-xl text-sm font-medium text-accent-teal hover:from-accent-teal/10 hover:to-emerald-500/10 hover:border-accent-teal/30 hover:shadow-md hover:shadow-accent-teal/10 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  {p.name}
                </button>
              ))}
            </div>
            {newProducts.length > NEW_PRODUCTS_LIMIT && (
              <button
                onClick={() => setShowAllNewProducts(!showAllNewProducts)}
                className="mt-3 text-xs text-accent-teal hover:underline font-medium"
              >
                {showAllNewProducts ? 'Show less' : `See all ${newProducts.length} products`}
              </button>
            )}
          </Card>
        </div>
      )}

      {/* Others Category Panel */}
      <OthersCategoryPanel
        products={products}
        loading={loading}
        onCategoryUpdated={handleCategoryUpdated}
      />

      {/* Product Ranking Table */}
      <div className="animate-fade-in-up stagger-6">
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 20V10M12 20V4M6 20v-6" />
                </svg>
              </div>
              <div>
                <h3 className="section-title">Product Ranking</h3>
                <p className="text-xs text-text-muted mt-0.5">{filtered.length} of {rankings.length} products</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-dark text-sm py-1.5 px-3 w-40"
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input-dark text-sm py-1.5 px-3"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort buttons */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {SORT_OPTIONS.map(s => (
              <button
                key={s.key}
                onClick={() => setSortBy(s.key)}
                className={`px-3 py-1 text-xs rounded-lg transition-all duration-200 ${
                  sortBy === s.key
                    ? 'bg-gradient-to-r from-accent-gold/15 to-amber-400/15 text-accent-gold border border-accent-gold/25 shadow-sm shadow-accent-gold/10'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated/80'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {sorted.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-bg-elevated/50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-text-muted/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <p className="text-sm text-text-muted">No products found</p>
              <p className="text-xs text-text-muted/60 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left py-3 pr-2 text-[11px] font-semibold text-text-muted uppercase tracking-wider">#</th>
                    <th className="text-left py-3 pr-2 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Product</th>
                    <th className="text-left py-3 pr-2 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Category</th>
                    <th className="text-right py-3 pr-2 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Sold</th>
                    <th className="text-right py-3 pr-2 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Appear.</th>
                    <th className="text-right py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider">Velocity</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAllRanking ? sorted : sorted.slice(0, RANKING_LIMIT)).map((product, index) => {
                    const isTop = index < 3;
                    const medals = ['🥇', '🥈', '🥉'];
                    return (
                      <tr
                        key={product.name}
                        onClick={() => navigate(`/products/${encodeURIComponent(product.name)}`)}
                        className={`border-b border-border/30 last:border-0 cursor-pointer transition-all duration-200 group ${
                          isTop ? 'bg-gradient-to-r from-accent-gold/[0.03] to-transparent hover:from-accent-gold/[0.06]' : 'hover:bg-bg-elevated/40'
                        }`}
                      >
                        <td className="py-3 pr-2">
                          <span className="font-mono text-xs text-text-muted">
                            {isTop ? medals[index] : <span className="text-text-muted/60">{index + 1}</span>}
                          </span>
                        </td>
                        <td className="py-3 pr-2">
                          <span className="font-medium text-accent-gold group-hover:underline transition-colors">{product.name}</span>
                        </td>
                        <td className="py-3 pr-2">
                          <Badge variant={product.category === 'Other' ? 'default' : 'gold'}>
                            {product.category || 'Other'}
                          </Badge>
                        </td>
                        <td className="py-3 pr-2 text-right font-mono font-semibold text-accent-gold">{formatNumber(product.totalQuantitySold)}</td>
                        <td className="py-3 pr-2 text-right font-mono text-text-primary">{product.totalAppearances}</td>
                        <td className="py-3 text-right font-mono text-accent-teal">{product.velocity}/day</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {sorted.length > RANKING_LIMIT && (
                <button
                  onClick={() => setShowAllRanking(!showAllRanking)}
                  className="w-full mt-3 py-2 text-xs text-accent-gold hover:underline font-medium text-center"
                >
                  {showAllRanking ? 'Show less' : `See all ${sorted.length} products`}
                </button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

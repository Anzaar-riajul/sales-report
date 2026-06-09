import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import { TableSkeleton } from '../UI/Loader';
import { computeProductRankings } from '../../utils/analytics';
import { formatNumber } from '../../utils/formatters';

export default function ProductRanking({ products, loading }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('totalQuantitySold');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const rankings = useMemo(() => computeProductRankings(products || []), [products]);
  const categories = useMemo(() => {
    const cats = new Set(rankings.map(p => p.category));
    return ['all', ...Array.from(cats)];
  }, [rankings]);

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

  if (loading) return <Card><h3 className="section-title mb-4">Product Ranking</h3><TableSkeleton rows={8} /></Card>;

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="section-title">Product Ranking</h3>
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

      <div className="flex gap-2 mb-3 flex-wrap">
        {[
          { key: 'totalQuantitySold', label: 'Total Sold' },
          { key: 'totalAppearances', label: 'Consistency' },
          { key: 'velocity', label: 'Velocity' },
          { key: 'lastSeenDate', label: 'Last Seen' },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setSortBy(s.key)}
            className={`px-3 py-1 text-xs rounded-md transition-all ${
              sortBy === s.key ? 'bg-accent-gold/10 text-accent-gold border border-accent-gold/20' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="py-8 text-center text-text-muted text-sm">No products found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-muted text-xs uppercase tracking-wider border-b border-border">
                <th className="text-left py-2 pr-2">#</th>
                <th className="text-left py-2 pr-2">Product</th>
                <th className="text-left py-2 pr-2">Category</th>
                <th className="text-right py-2 pr-2">Total Sold</th>
                <th className="text-right py-2 pr-2">Appearances</th>
                <th className="text-right py-2">Velocity</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((product, index) => (
                <tr
                  key={product.name}
                  onClick={() => navigate(`/products/${encodeURIComponent(product.name)}`)}
                  className="border-b border-border/50 last:border-0 cursor-pointer hover:bg-bg-elevated/50 transition-colors"
                >
                  <td className="py-2.5 pr-2 text-text-muted font-mono text-xs">{index + 1}</td>
                  <td className="py-2.5 pr-2 text-accent-gold font-medium hover:underline">{product.name}</td>
                  <td className="py-2.5 pr-2">
                    <Badge variant={product.category === 'Other' ? 'default' : 'gold'}>{product.category}</Badge>
                  </td>
                  <td className="py-2.5 pr-2 text-right font-mono text-accent-gold">{formatNumber(product.totalQuantitySold)}</td>
                  <td className="py-2.5 pr-2 text-right font-mono text-text-primary">{product.totalAppearances}</td>
                  <td className="py-2.5 text-right font-mono text-accent-teal">{product.velocity}/day</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

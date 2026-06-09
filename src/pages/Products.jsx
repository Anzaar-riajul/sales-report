import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReports } from '../hooks/useReports';
import { useProducts } from '../hooks/useProducts';
import { computeNewProducts } from '../utils/analytics';
import ProductRanking from '../components/Products/ProductRanking';
import CategoryBreakdown from '../components/Products/CategoryBreakdown';
import DeadStockAlert from '../components/Products/DeadStockAlert';
import Card from '../components/UI/Card';
import Badge from '../components/UI/Badge';

function NewProductTracker({ products, reports }) {
  const navigate = useNavigate();
  const newProducts = useMemo(() => computeNewProducts(products || [], reports || []), [products, reports]);

  if (newProducts.length === 0) return null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="section-title">New Products This Week</h3>
        <Badge variant="teal">{newProducts.length} new</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {newProducts.map(p => (
          <button
            key={p.name}
            onClick={() => navigate(`/products/${encodeURIComponent(p.name)}`)}
            className="px-3 py-1.5 bg-accent-teal/5 border border-accent-teal/20 rounded-lg text-sm text-accent-teal hover:bg-accent-teal/10 transition-colors"
          >
            {p.name}
          </button>
        ))}
      </div>
    </Card>
  );
}

export default function Products() {
  const { products, loading } = useProducts();
  const { reports } = useReports();

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl text-text-primary">Product Intelligence</h2>

      <NewProductTracker products={products} reports={reports} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CategoryBreakdown products={products} loading={loading} />
        <DeadStockAlert products={products} reports={reports} loading={loading} />
      </div>

      <ProductRanking products={products} loading={loading} />
    </div>
  );
}

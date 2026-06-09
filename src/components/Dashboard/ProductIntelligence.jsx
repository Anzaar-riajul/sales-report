import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import { formatNumber } from '../../utils/formatters';
import { computeStockRecommendations, computeHotProducts, computeColdProducts, computeTrendingCategories } from '../../utils/productIntelligence';

const actionStyles = {
  'Stock Up': 'text-accent-teal bg-accent-teal/10 border-accent-teal/20',
  'Restock': 'text-accent-teal bg-accent-teal/5 border-accent-teal/10',
  'Monitor': 'text-yellow-400 bg-yellow-500/5 border-yellow-500/10',
  'Reduce Stock': 'text-accent-rose bg-accent-rose/5 border-accent-rose/10',
  'Discontinue': 'text-accent-rose bg-accent-rose/10 border-accent-rose/20',
};

const trendIcons = {
  rising: '↑',
  declining: '↓',
  flat: '→',
};
const trendColors = {
  rising: 'text-accent-teal',
  declining: 'text-accent-rose',
  flat: 'text-text-muted',
};

function ProductRow({ product, showAction }) {
  const navigate = useNavigate();
  return (
    <tr
      className="border-b border-border/50 last:border-0 cursor-pointer hover:bg-bg-elevated/30 transition-colors"
      onClick={() => navigate(`/products/${encodeURIComponent(product.name)}`)}
    >
      <td className="py-2.5 pr-2">
        <div>
          <span className="text-text-primary text-sm font-medium">{product.name}</span>
          <span className="text-text-muted text-xs ml-2">({product.quantity}{product.quantity > 0 ? ' sold' : ''})</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant="default">{product.category}</Badge>
          <span className={`text-xs ${trendColors[product.trend]}`}>
            {trendIcons[product.trend]} {product.trend}
          </span>
        </div>
      </td>
      {showAction && (
        <td className="py-2.5 text-right">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${actionStyles[product.action] || 'text-text-muted'}`}>
            {product.action}
          </span>
        </td>
      )}
      <td className="py-2.5 text-right pr-2">
        <span className="text-xs text-text-muted font-mono">{product.velocity}/d</span>
      </td>
      <td className="py-2.5 text-right">
        <span className={`text-xs font-mono ${product.daysSinceLastSale <= 3 ? 'text-accent-teal' : product.daysSinceLastSale >= 14 ? 'text-accent-rose' : 'text-text-muted'}`}>
          {product.daysSinceLastSale === 0 ? 'Today' : product.daysSinceLastSale === Infinity ? '—' : `${product.daysSinceLastSale}d ago`}
        </span>
      </td>
    </tr>
  );
}

function HotSellers({ products, reports }) {
  const data = useMemo(() => computeHotProducts(products, reports, 8), [products, reports]);
  if (data.length === 0) return null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="section-title">🔥 Need Stock</h3>
        <Badge variant="teal">{data.length} products</Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-muted text-xs uppercase tracking-wider border-b border-border">
              <th className="text-left py-2 pr-2">Product</th>
              <th className="text-right py-2 pr-2">Action</th>
              <th className="text-right py-2 pr-2">Velocity</th>
              <th className="text-right py-2">Last</th>
            </tr>
          </thead>
          <tbody>
            {data.map(p => <ProductRow key={p.name} product={p} showAction />)}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ColdProducts({ products, reports }) {
  const data = useMemo(() => computeColdProducts(products, reports, 8), [products, reports]);
  if (data.length === 0) return null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="section-title">❄️ Don't Restock</h3>
        <Badge variant="rose">{data.length} products</Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-muted text-xs uppercase tracking-wider border-b border-border">
              <th className="text-left py-2 pr-2">Product</th>
              <th className="text-right py-2 pr-2">Action</th>
              <th className="text-right py-2 pr-2">Velocity</th>
              <th className="text-right py-2">Last</th>
            </tr>
          </thead>
          <tbody>
            {data.map(p => <ProductRow key={p.name} product={p} showAction />)}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function CategoryHealth({ products, reports }) {
  const data = useMemo(() => computeTrendingCategories(products, reports), [products, reports]);
  if (data.length === 0) return null;
  const maxScore = Math.max(...data.map(c => c.stockUp));

  return (
    <Card>
      <h3 className="section-title mb-4">📊 Category Health</h3>
      <div className="space-y-3">
        {data.map(c => (
          <div key={c.name}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-text-primary font-medium">{c.name}</span>
              <span className="text-text-muted">{c.stockUp}/{c.totalProducts} need stock</span>
            </div>
            <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-teal to-accent-gold rounded-full transition-all duration-500"
                style={{ width: `${(c.stockUp / Math.max(c.totalProducts, 1)) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function ProductIntelligence({ products, reports }) {
  const hasProducts = products && products.length > 0;

  if (!hasProducts) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HotSellers products={products} reports={reports} />
        <ColdProducts products={products} reports={reports} />
      </div>
      <CategoryHealth products={products} reports={reports} />
    </div>
  );
}

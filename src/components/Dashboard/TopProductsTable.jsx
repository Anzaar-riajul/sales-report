import Card from '../UI/Card';
import Badge from '../UI/Badge';
import { TableSkeleton } from '../UI/Loader';

export default function TopProductsTable({ products, loading }) {
  if (loading) return <Card><h3 className="section-title mb-4">Today's Products</h3><TableSkeleton /></Card>;

  const sorted = products ? [...products].sort((a, b) => b.quantity - a.quantity) : [];
  const topProducts = sorted.slice(0, 10);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title">Today's Products</h3>
        <span className="text-xs text-text-muted">{sorted.length} items</span>
      </div>
      {topProducts.length === 0 ? (
        <div className="py-8 text-center text-text-muted text-sm">No products in today's report</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-muted text-xs uppercase tracking-wider border-b border-border">
                <th className="text-left py-2 pr-2">#</th>
                <th className="text-left py-2 pr-2">Product</th>
                <th className="text-right py-2 pr-2">Category</th>
                <th className="text-right py-2">Qty</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, index) => (
                <tr key={product.name} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5 pr-2 text-text-muted font-mono text-xs">{index + 1}</td>
                  <td className="py-2.5 pr-2 text-text-primary font-medium">{product.name}</td>
                  <td className="py-2.5 pr-2 text-right">
                    <Badge variant={product.category === 'Other' ? 'default' : 'gold'}>{product.category}</Badge>
                  </td>
                  <td className="py-2.5 text-right font-mono text-accent-gold">{product.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useProducts } from '../hooks/useProducts';
import { useReports } from '../hooks/useReports';
import { computeProductSalesHistory } from '../utils/analytics';
import { formatNumber, formatDate, formatBDTShort, getChangeColor, getChangeIcon } from '../utils/formatters';
import Card from '../components/UI/Card';
import Badge from '../components/UI/Badge';
import DateRangePicker from '../components/UI/DateRangePicker';
import { filterReportsByRange } from '../utils/dateUtils';
import { ChartSkeleton } from '../components/UI/Loader';

export default function ProductDetail() {
  const { productName } = useParams();
  const navigate = useNavigate();
  const decodedName = decodeURIComponent(productName || '');
  const { products, loading: productsLoading } = useProducts();
  const { reports, loading: reportsLoading } = useReports();
  const [range, setRange] = useState({ type: 'all' });

  const handleRangeChange = useCallback((newRange) => {
    setRange(newRange);
  }, []);

  const product = useMemo(() => {
    if (!products || products.length === 0) return null;
    return products.find(p => p.name === decodedName) || null;
  }, [products, decodedName]);

  const filteredReports = useMemo(() => filterReportsByRange(reports, range), [reports, range]);

  const salesHistory = useMemo(() => {
    return computeProductSalesHistory(product, filteredReports);
  }, [product, filteredReports]);

  const allTimeHistory = useMemo(() => {
    return computeProductSalesHistory(product, reports);
  }, [product, reports]);

  const sameProductReports = useMemo(() => {
    if (!reports || !product) return [];
    return reports
      .filter(r => r.products && r.products.some(p => p.name === decodedName))
      .sort((a, b) => a.dateString.localeCompare(b.dateString));
  }, [reports, product, decodedName]);

  const loading = productsLoading || reportsLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48"><ChartSkeleton /></div>
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate('/products')} className="text-accent-gold text-sm hover:underline">&larr; Back to Products</button>
        <Card>
          <div className="py-12 text-center">
            <p className="text-text-muted text-lg">Product "{decodedName}" not found</p>
          </div>
        </Card>
      </div>
    );
  }

  const { dailyData, summary } = salesHistory;

  const categoryColors = {
    'Abaya': 'gold',
    'Kurti': 'teal',
    'Gown': 'rose',
    'Kaftan': 'teal',
    'Hijab': 'gold',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/products')} className="text-accent-gold text-sm hover:underline">&larr;</button>
        <div>
          <h2 className="font-display text-2xl text-text-primary">{decodedName}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={categoryColors[product.category] || 'default'}>{product.category || 'Other'}</Badge>
            <span className="text-text-muted text-xs">
              {sameProductReports.length} reports
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Sold', value: formatNumber(allTimeHistory.summary?.totalQuantity || 0), color: 'text-accent-gold' },
          { label: 'Appearances', value: formatNumber(allTimeHistory.summary?.totalAppearances || 0), color: 'text-text-primary' },
          { label: 'Velocity', value: `${allTimeHistory.summary?.velocity || 0}/day`, color: 'text-accent-teal' },
          { label: 'Best Day', value: formatNumber(allTimeHistory.summary?.bestDay?.quantity || 0), color: 'text-accent-gold' },
          { label: 'First Seen', value: allTimeHistory.summary?.firstSeen ? formatDate(allTimeHistory.summary.firstSeen) : 'N/A', color: 'text-text-muted' },
          { label: 'Last Seen', value: allTimeHistory.summary?.lastSeen ? formatDate(allTimeHistory.summary.lastSeen) : 'N/A', color: 'text-text-muted' },
        ].map(stat => (
          <Card key={stat.label}>
            <p className="text-text-muted text-xs">{stat.label}</p>
            <p className={`font-mono text-lg font-semibold mt-1 ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="section-title">Sales History</h3>
        <DateRangePicker value={range} onChange={handleRangeChange} />
      </div>

      <Card>
        <h3 className="section-title mb-4">Daily Quantity Sold</h3>
        {dailyData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-text-muted text-sm">No sales data for this period</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => formatDate(d)} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                labelFormatter={(label) => formatDate(label)}
                formatter={(value) => [value, 'Quantity']}
              />
              <Bar dataKey="quantity" fill="#C9A84C" radius={[4, 4, 0, 0]} name="Quantity" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="section-title mb-4">Sales Trend</h3>
          {dailyData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-text-muted text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => formatDate(d)} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                  labelFormatter={(label) => formatDate(label)}
                />
                <Legend formatter={(value) => <span style={{ color: '#0F172A' }}>{value}</span>} />
                <Line type="monotone" dataKey="quantity" stroke="#C9A84C" strokeWidth={2} dot={true} name="Quantity Sold" />
                <Line type="monotone" dataKey="totalOrderValue" stroke="#2DD4BF" strokeWidth={2} dot={false} name="Order Value (BDT)" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h3 className="section-title mb-4">Week-over-Week Comparison</h3>
          {summary ? (
            <div className="space-y-4">
              <div className="glass-card-elevated p-4">
                <p className="text-text-muted text-xs">Recent 7 Days</p>
                <p className="font-mono text-2xl font-bold text-text-primary">{formatNumber(summary.recent7Qty)} units</p>
              </div>
              <div className="glass-card-elevated p-4">
                <p className="text-text-muted text-xs">Previous 7 Days</p>
                <p className="font-mono text-2xl font-bold text-text-muted">{formatNumber(summary.prev7Qty)} units</p>
              </div>
              {summary.prev7Qty > 0 && (
                <div className={`glass-card-elevated p-4 ${getChangeColor(summary.weekGrowth)}`}>
                  <p className="text-xs">Week Growth</p>
                  <p className="font-mono text-2xl font-bold">
                    {getChangeIcon(summary.weekGrowth)} {Math.abs(summary.weekGrowth)}%
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-text-muted text-sm">Not enough data</div>
          )}
        </Card>
      </div>

      <Card>
        <h3 className="section-title mb-4">Daily Sales History</h3>
        {dailyData.length === 0 ? (
          <div className="py-8 text-center text-text-muted text-sm">No data</div>
        ) : (
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-muted text-xs uppercase tracking-wider border-b border-border sticky top-0 bg-bg-card">
                  <th className="text-left py-2 pr-2">Date</th>
                  <th className="text-right py-2 pr-2">Quantity</th>
                  <th className="text-right py-2 pr-2">Day Orders</th>
                  <th className="text-right py-2">Day Value</th>
                </tr>
              </thead>
              <tbody>
                {[...dailyData].reverse().map((day) => (
                  <tr key={day.date} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-2 text-text-primary">{formatDate(day.date)}</td>
                    <td className="py-2 pr-2 text-right font-mono text-accent-gold">{day.quantity}</td>
                    <td className="py-2 pr-2 text-right font-mono text-text-primary">{day.totalOrder}</td>
                    <td className="py-2 text-right font-mono text-text-muted text-xs">{formatBDTShort(day.totalOrderValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

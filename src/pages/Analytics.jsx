import { useState, useMemo, useCallback } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useReports } from '../hooks/useReports';
import {
  computeYearlySummary,
  computeWeekdayAnalysis,
  computeRollingAverage,
  computeProductsPerOrderTrend,
  computeSameWeekdayComparison,
  computeWeekOverWeekGrowth,
  computeMTDComparison,
} from '../utils/analytics';
import { formatBDT, formatDateShort, formatNumber, formatBDTShort, getChangeColor, getChangeIcon } from '../utils/formatters';
import Card from '../components/UI/Card';
import DateRangePicker from '../components/UI/DateRangePicker';
import { filterReportsByRange } from '../utils/dateUtils';
import WeeklyReport from '../components/Reports/WeeklyReport';
import MonthlyReport from '../components/Reports/MonthlyReport';
import { ChartSkeleton } from '../components/UI/Loader';

function ComparisonCard({ title, currentLabel, previousLabel, metrics }) {
  return (
    <Card>
      <h3 className="section-title mb-4">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {metrics.map(m => (
          <div key={m.label} className="glass-card-elevated p-4">
            <p className="text-text-muted text-xs">{m.label}</p>
            <div className="flex items-baseline gap-3 mt-1">
              <div>
                <p className="text-text-muted text-xs">{currentLabel}</p>
                <p className="font-mono text-lg font-semibold text-text-primary">{m.current}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">{previousLabel}</p>
                <p className="font-mono text-sm text-text-muted">{m.previous}</p>
              </div>
              {m.change !== null && (
                <p className={`font-mono font-bold text-lg ${getChangeColor(m.change)}`}>
                  {getChangeIcon(m.change)}{Math.abs(m.change)}%
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function Analytics() {
  const [range, setRange] = useState({ type: '30d' });
  const { reports, loading } = useReports();

  const filteredReports = useMemo(() => filterReportsByRange(reports, range), [reports, range]);

  const weekdayAnalysis = useMemo(() => computeWeekdayAnalysis(filteredReports), [filteredReports]);
  const rollingAvg = useMemo(() => computeRollingAverage(filteredReports, 7), [filteredReports]);
  const productsPerOrder = useMemo(() => computeProductsPerOrderTrend(filteredReports), [filteredReports]);
  const sameWeekday = useMemo(() => computeSameWeekdayComparison(reports || []), [reports]);
  const wowGrowth = useMemo(() => computeWeekOverWeekGrowth(reports || []), [reports]);
  const mtdComparison = useMemo(() => computeMTDComparison(reports || []), [reports]);

  const orderTrend = useMemo(() => {
    return filteredReports.map(r => ({
      date: formatDateShort(r.dateString),
      orders: r.totalOrder,
      regular: r.regularOrder,
      customize: r.customizeOrder,
    }));
  }, [filteredReports]);

  const advanceTrend = useMemo(() => {
    return filteredReports.map(r => ({
      date: formatDateShort(r.dateString),
      advance: r.totalAdvance,
      outstanding: r.outstandingAmount,
      rate: r.advanceRate,
    }));
  }, [filteredReports]);

  const customizeTrend = useMemo(() => {
    return filteredReports.filter(r => r.totalOrder > 0).map(r => ({
      date: formatDateShort(r.dateString),
      pct: Math.round((r.customizeOrder / r.totalOrder) * 100),
    }));
  }, [filteredReports]);

  const revenuePerProduct = useMemo(() => {
    return filteredReports.filter(r => r.totalProduct > 0).map(r => ({
      date: formatDateShort(r.dateString),
      value: Math.round(r.totalOrderValue / r.totalProduct),
    }));
  }, [filteredReports]);

  const revenueTrend = useMemo(() => {
    return filteredReports.map(r => ({
      date: formatDateShort(r.dateString),
      revenue: r.totalOrderValue,
      advance: r.totalAdvance,
    }));
  }, [filteredReports]);

  const bestDay = useMemo(() => {
    if (weekdayAnalysis.length === 0) return null;
    return weekdayAnalysis.reduce((best, curr) => curr.avgValue > (best?.avgValue || 0) ? curr : best, null);
  }, [weekdayAnalysis]);

  const tabs = [
    { id: 'financial', label: 'Financial' },
    { id: 'orders', label: 'Orders' },
    { id: 'trends', label: 'Trends' },
    { id: 'comparison', label: 'Comparison' },
    { id: 'periodic', label: 'Periodic' },
  ];
  const [activeTab, setActiveTab] = useState('financial');

  const handleRangeChange = useCallback((newRange) => {
    setRange(newRange);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="font-display text-2xl text-text-primary">Analytics</h2>
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-text-primary">Analytics</h2>
        <DateRangePicker value={range} onChange={handleRangeChange} />
      </div>

      {sameWeekday && (
        <Card>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-text-muted text-xs">Same Weekday Comparison</p>
              <p className="text-text-primary text-sm mt-1">
                This {sameWeekday.current.dayOfWeek}: {formatNumber(sameWeekday.current.totalOrder)} orders ({formatBDTShort(sameWeekday.current.totalOrderValue)})
              </p>
              <p className="text-text-muted text-sm">
                Last {sameWeekday.previous.dayOfWeek}: {formatNumber(sameWeekday.previous.totalOrder)} orders ({formatBDTShort(sameWeekday.previous.totalOrderValue)})
              </p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-mono font-bold ${sameWeekday.orderChange >= 0 ? 'text-accent-teal' : 'text-accent-rose'}`}>
                {sameWeekday.orderChange >= 0 ? '+' : ''}{sameWeekday.orderChange}%
              </p>
              <p className="text-xs text-text-muted">Orders</p>
              <p className={`text-sm font-mono ${sameWeekday.valueChange >= 0 ? 'text-accent-teal' : 'text-accent-rose'}`}>
                {sameWeekday.valueChange >= 0 ? '+' : ''}{sameWeekday.valueChange}%
              </p>
              <p className="text-xs text-text-muted">Value</p>
            </div>
          </div>
        </Card>
      )}

      {bestDay && (
        <Card>
          <p className="text-text-muted text-xs mb-1">Best Revenue Day</p>
          <p className="text-accent-gold font-display text-lg">
            {bestDay.day}s average {formatBDTShort(bestDay.avgValue)}
            <span className="text-text-muted text-sm ml-2">({bestDay.count} reports)</span>
          </p>
        </Card>
      )}

      <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm rounded-t-lg transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'text-accent-gold border-b-2 border-accent-gold' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'financial' && (
        <div className="space-y-4">
          <Card>
            <h3 className="section-title mb-4">Revenue & Advance</h3>
            {revenueTrend.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-text-muted text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={{ background: '#161A23', border: '1px solid #1E2330', borderRadius: '8px' }}
                    formatter={(value) => [formatBDT(value), '']}
                  />
                  <Legend formatter={(value) => <span style={{ color: '#F1F5F9' }}>{value}</span>} />
                  <Bar dataKey="advance" fill="#2DD4BF" radius={[4, 4, 0, 0]} name="Advance" stackId="a" />
                  <Bar dataKey="revenue" fill="#C9A84C" radius={[4, 4, 0, 0]} name="Revenue" stackId="b" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card>
            <h3 className="section-title mb-4">Advance Rate Trend</h3>
            {advanceTrend.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-text-muted text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={advanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={{ background: '#161A23', border: '1px solid #1E2330', borderRadius: '8px' }}
                    formatter={(value) => [`${value}%`, 'Advance Rate']}
                  />
                  <Line type="monotone" dataKey="rate" stroke="#C9A84C" strokeWidth={2} dot={false} name="Advance Rate" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card>
            <h3 className="section-title mb-4">Average Order Value Trend</h3>
            {filteredReports.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-text-muted text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={filteredReports.map(r => ({ date: formatDateShort(r.dateString), aov: r.avgOrderValue }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={{ background: '#161A23', border: '1px solid #1E2330', borderRadius: '8px' }}
                    formatter={(value) => [formatBDT(value), 'Avg Order Value']}
                  />
                  <Line type="monotone" dataKey="aov" stroke="#2DD4BF" strokeWidth={2} dot={false} name="AOV" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-4">
          <Card>
            <h3 className="section-title mb-4">Order Trend</h3>
            {orderTrend.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-text-muted text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={orderTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#161A23', border: '1px solid #1E2330', borderRadius: '8px' }} />
                  <Legend formatter={(value) => <span style={{ color: '#F1F5F9' }}>{value}</span>} />
                  <Area type="monotone" dataKey="regular" stackId="1" stroke="#C9A84C" fill="#C9A84C" fillOpacity={0.3} name="Regular" />
                  <Area type="monotone" dataKey="customize" stackId="1" stroke="#2DD4BF" fill="#2DD4BF" fillOpacity={0.3} name="Customize" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <h3 className="section-title mb-4">Weekday Order Analysis</h3>
              {weekdayAnalysis.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-text-muted text-sm">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={weekdayAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#161A23', border: '1px solid #1E2330', borderRadius: '8px' }}
                      formatter={(value, name) => [value, name === 'avgOrders' ? 'Avg Orders' : 'Avg Value']}
                    />
                    <Bar dataKey="avgOrders" fill="#C9A84C" radius={[4, 4, 0, 0]} name="avgOrders" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card>
              <h3 className="section-title mb-4">Products per Order</h3>
              {productsPerOrder.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-text-muted text-sm">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={productsPerOrder}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 'auto']} />
                    <Tooltip contentStyle={{ background: '#161A23', border: '1px solid #1E2330', borderRadius: '8px' }}
                      formatter={(value) => [value, 'Products/Order']}
                    />
                    <Line type="monotone" dataKey="ratio" stroke="#2DD4BF" strokeWidth={2} dot={false} name="Products/Order" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-4">
          <Card>
            <h3 className="section-title mb-4">7-Day Rolling Average</h3>
            {rollingAvg.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-text-muted text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={rollingAvg}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#161A23', border: '1px solid #1E2330', borderRadius: '8px' }} />
                  <Legend formatter={(value) => <span style={{ color: '#F1F5F9' }}>{value}</span>} />
                  <Line type="monotone" dataKey="avgOrder" stroke="#C9A84C" strokeWidth={2} dot={false} name="Avg Orders (7d)" />
                  <Line type="monotone" dataKey="totalOrder" stroke="#64748B" strokeWidth={1} dot={false} name="Daily Orders" strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <h3 className="section-title mb-4">Customize Order % Trend</h3>
              {customizeTrend.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-text-muted text-sm">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={customizeTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={{ background: '#161A23', border: '1px solid #1E2330', borderRadius: '8px' }}
                      formatter={(value) => [`${value}%`, 'Customize %']}
                    />
                    <Line type="monotone" dataKey="pct" stroke="#FB7185" strokeWidth={2} dot={false} name="Customize %" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card>
              <h3 className="section-title mb-4">Revenue per Product</h3>
              {revenuePerProduct.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-text-muted text-sm">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={revenuePerProduct}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v.toFixed(0)}`} />
                    <Tooltip contentStyle={{ background: '#161A23', border: '1px solid #1E2330', borderRadius: '8px' }}
                      formatter={(value) => [formatBDT(value), 'Revenue/Product']}
                    />
                    <Line type="monotone" dataKey="value" stroke="#C9A84C" strokeWidth={2} dot={false} name="Rev/Product" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'comparison' && (
        <div className="space-y-4">
          {wowGrowth && (
            <ComparisonCard
              title="Week-over-Week Growth"
              currentLabel="This Week"
              previousLabel="Last Week"
              metrics={[
                {
                  label: 'Total Orders',
                  current: formatNumber(wowGrowth.currentOrders),
                  previous: formatNumber(wowGrowth.previousOrders),
                  change: wowGrowth.orderGrowth,
                },
                {
                  label: 'Order Value',
                  current: formatBDTShort(wowGrowth.currentValue),
                  previous: formatBDTShort(wowGrowth.previousValue),
                  change: wowGrowth.valueGrowth,
                },
                {
                  label: 'Active Days',
                  current: `${wowGrowth.currentDays}d`,
                  previous: `${wowGrowth.previousDays}d`,
                  change: null,
                },
              ]}
            />
          )}

          {mtdComparison && (
            <ComparisonCard
              title="Month-to-Date vs Last Month"
              currentLabel="This Month (MTD)"
              previousLabel="Last Month"
              metrics={[
                {
                  label: 'Total Orders',
                  current: formatNumber(mtdComparison.mtd.orders),
                  previous: formatNumber(mtdComparison.lastMonth.orders),
                  change: mtdComparison.orderGrowth,
                },
                {
                  label: 'Order Value',
                  current: formatBDTShort(mtdComparison.mtd.value),
                  previous: formatBDTShort(mtdComparison.lastMonth.value),
                  change: mtdComparison.valueGrowth,
                },
                {
                  label: 'Total Advance',
                  current: formatBDTShort(mtdComparison.mtd.advance),
                  previous: formatBDTShort(mtdComparison.lastMonth.advance),
                  change: null,
                },
                {
                  label: 'Report Days',
                  current: `${mtdComparison.mtd.days}d`,
                  previous: `${mtdComparison.lastMonth.days}d`,
                  change: null,
                },
              ]}
            />
          )}

          {sameWeekday && (
            <ComparisonCard
              title="Same Weekday Comparison"
              currentLabel={`This ${sameWeekday.current.dayOfWeek}`}
              previousLabel={`Last ${sameWeekday.previous.dayOfWeek}`}
              metrics={[
                {
                  label: 'Orders',
                  current: formatNumber(sameWeekday.current.totalOrder),
                  previous: formatNumber(sameWeekday.previous.totalOrder),
                  change: sameWeekday.orderChange,
                },
                {
                  label: 'Order Value',
                  current: formatBDTShort(sameWeekday.current.totalOrderValue),
                  previous: formatBDTShort(sameWeekday.previous.totalOrderValue),
                  change: sameWeekday.valueChange,
                },
              ]}
            />
          )}

          {!wowGrowth && !mtdComparison && !sameWeekday && (
            <Card>
              <div className="py-12 text-center text-text-muted text-sm">Not enough data for comparisons. Add more reports.</div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'periodic' && (
        <div className="space-y-4">
          <WeeklyReport reports={reports} loading={loading} />
          <MonthlyReport reports={reports} loading={loading} />
          <Card>
            <h3 className="section-title mb-4">Yearly Summary</h3>
            {(() => {
              const yearlyData = computeYearlySummary(reports || []);
              const chartData = yearlyData.map(y => ({
                year: y.year,
                orders: y.totalOrder,
                value: y.totalOrderValue,
              }));
              if (chartData.length === 0) return <div className="h-64 flex items-center justify-center text-text-muted text-sm">No data</div>;
              return (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={{ background: '#161A23', border: '1px solid #1E2330', borderRadius: '8px' }}
                      formatter={(value) => [formatBDT(value), 'Revenue']}
                    />
                    <Bar dataKey="value" fill="#C9A84C" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              );
            })()}
          </Card>
        </div>
      )}
    </div>
  );
}

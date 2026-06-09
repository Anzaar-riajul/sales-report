import { useState, useMemo, useCallback } from 'react';
import { subDays, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { useReports } from '../hooks/useReports';
import { generateReportPDF } from '../utils/pdfGenerator';
import { formatBDT, formatNumber, formatDateShort } from '../utils/formatters';
import DetailModal from '../components/UI/DetailModal';
import RangePDF from '../components/Dashboard/RangePDF';

const PRESETS = [
  { label: 'Today', icon: '📅', getRange: () => ({ start: format(new Date(), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'Yesterday', icon: '⏪', getRange: () => { const d = subDays(new Date(), 1); return { start: format(d, 'yyyy-MM-dd'), end: format(d, 'yyyy-MM-dd') }; } },
  { label: 'This Week', icon: '📊', getRange: () => ({ start: format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd'), end: format(endOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd') }) },
  { label: 'Last 7 Days', icon: '📈', getRange: () => ({ start: format(subDays(new Date(), 6), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'This Month', icon: '🗓', getRange: () => ({ start: format(startOfMonth(new Date()), 'yyyy-MM-dd'), end: format(endOfMonth(new Date()), 'yyyy-MM-dd') }) },
  { label: 'Last 30 Days', icon: '📉', getRange: () => ({ start: format(subDays(new Date(), 29), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'Last 90 Days', icon: '📋', getRange: () => ({ start: format(subDays(new Date(), 89), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'All Time', icon: '🌐', getRange: () => ({ start: '', end: '' }) },
];

export default function PDFExport() {
  const { reports, loading } = useReports();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activePreset, setActivePreset] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('presets');
  const [modal, setModal] = useState(null);

  const handlePreset = (preset, index) => {
    const range = preset.getRange();
    setStartDate(range.start);
    setEndDate(range.end);
    setActivePreset(index);
  };

  const filteredReports = useMemo(() => {
    if (!reports || reports.length === 0) return [];
    const sorted = [...reports].sort((a, b) => a.dateString.localeCompare(b.dateString));
    if (!startDate || !endDate) return sorted;
    return sorted.filter(r => r.dateString >= startDate && r.dateString <= endDate);
  }, [reports, startDate, endDate]);

  const stats = useMemo(() => {
    if (filteredReports.length === 0) return null;
    const agg = filteredReports.reduce((acc, r) => ({
      totalOrder: acc.totalOrder + (r.totalOrder || 0),
      regularOrder: acc.regularOrder + (r.regularOrder || 0),
      customizeOrder: acc.customizeOrder + (r.customizeOrder || 0),
      totalProduct: acc.totalProduct + (r.totalProduct || 0),
      totalOrderValue: acc.totalOrderValue + (r.totalOrderValue || 0),
      totalAdvance: acc.totalAdvance + (r.totalAdvance || 0),
    }), { totalOrder: 0, regularOrder: 0, customizeOrder: 0, totalProduct: 0, totalOrderValue: 0, totalAdvance: 0 });

    const days = filteredReports.length;
    const avgOrders = days > 0 ? Math.round(agg.totalOrder / days) : 0;
    const avgValue = days > 0 ? Math.round(agg.totalOrderValue / days) : 0;
    const advanceRate = agg.totalOrderValue > 0 ? Math.round((agg.totalAdvance / agg.totalOrderValue) * 100) : 0;
    const customizeRate = agg.totalOrder > 0 ? Math.round((agg.customizeOrder / agg.totalOrder) * 100) : 0;
    const pendingAmount = Math.max(0, agg.totalOrderValue - agg.totalAdvance);

    const bestDay = filteredReports.reduce((best, r) => (r.totalOrderValue > (best?.totalOrderValue || 0)) ? r : best, null);
    const worstDay = filteredReports.reduce((worst, r) => (r.totalOrderValue < (worst?.totalOrderValue || Infinity)) ? r : worst, null);

    const dailyData = [...filteredReports].sort((a, b) => a.dateString.localeCompare(b.dateString)).map(r => ({
      date: formatDateShort(r.dateString), orders: r.totalOrder, value: r.totalOrderValue,
    }));

    const productMap = {};
    filteredReports.forEach(r => {
      (r.products || []).forEach(p => {
        if (!productMap[p.name]) productMap[p.name] = { name: p.name, qty: 0, category: p.category || 'Other' };
        productMap[p.name].qty += p.quantity || 0;
      });
    });
    const topProducts = Object.values(productMap).sort((a, b) => b.qty - a.qty).slice(0, 10);

    return { ...agg, days, avgOrders, avgValue, advanceRate, customizeRate, pendingAmount, bestDay, worstDay, dailyData, topProducts };
  }, [filteredReports]);

  const rangeLabel = useMemo(() => {
    if (activePreset !== null) return PRESETS[activePreset].label;
    if (startDate && endDate) return `${formatDateShort(startDate)} – ${formatDateShort(endDate)}`;
    return 'All Reports';
  }, [activePreset, startDate, endDate]);

  const handleExport = useCallback(async () => {
    if (filteredReports.length === 0) return;
    setGenerating(true);
    try {
      const filename = `Anzaar-${rangeLabel.replace(/\s+/g, '-')}-${startDate || 'all'}.pdf`;
      await generateReportPDF({ dateString: startDate }, 'range-pdf-content', filename);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setGenerating(false);
    }
  }, [filteredReports, rangeLabel, startDate]);

  const openOrdersModal = () => {
    if (!stats) return;
    setModal({
      title: 'Order Breakdown', icon: '📦', color: '#C9A84C',
      subtitle: `${stats.days} reports · ${formatNumber(stats.totalOrder)} total orders`,
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-accent-gold/5 border border-accent-gold/15 rounded-xl p-3 text-center">
              <p className="text-[9px] text-accent-gold uppercase">Regular</p>
              <p className="text-lg font-bold font-mono text-text-primary">{formatNumber(stats.regularOrder)}</p>
              <p className="text-[9px] text-text-muted">{100 - stats.customizeRate}% of total</p>
            </div>
            <div className="bg-accent-rose/5 border border-accent-rose/15 rounded-xl p-3 text-center">
              <p className="text-[9px] text-accent-rose uppercase">Customize</p>
              <p className="text-lg font-bold font-mono text-text-primary">{formatNumber(stats.customizeOrder)}</p>
              <p className="text-[9px] text-text-muted">{stats.customizeRate}% of total</p>
            </div>
          </div>
          <div className="h-3 bg-bg-elevated rounded-full overflow-hidden flex">
            <div className="h-full bg-accent-gold rounded-full" style={{ width: `${100 - stats.customizeRate}%` }} />
            <div className="h-full bg-accent-rose rounded-full" style={{ width: `${stats.customizeRate}%` }} />
          </div>
          <div className="bg-bg-elevated/40 rounded-xl p-3">
            <p className="text-[10px] text-text-muted uppercase mb-2">Daily Average</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center">
                <p className="text-sm font-bold font-mono text-text-primary">{stats.avgOrders}</p>
                <p className="text-[9px] text-text-muted">orders/day</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold font-mono text-accent-gold">{formatBDT(stats.avgValue)}</p>
                <p className="text-[9px] text-text-muted">value/day</p>
              </div>
            </div>
          </div>
        </div>
      ),
    });
  };

  const openRevenueModal = () => {
    if (!stats) return;
    setModal({
      title: 'Revenue Details', icon: '💰', color: '#0D9488',
      subtitle: `${formatBDT(stats.totalOrderValue)} total revenue`,
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-accent-teal/5 border border-accent-teal/15 rounded-xl p-3 text-center">
              <p className="text-[9px] text-accent-teal uppercase">Collected</p>
              <p className="text-lg font-bold font-mono text-accent-teal">{formatBDT(stats.totalAdvance)}</p>
              <p className="text-[9px] text-text-muted">{stats.advanceRate}% advance rate</p>
            </div>
            <div className="bg-accent-rose/5 border border-accent-rose/15 rounded-xl p-3 text-center">
              <p className="text-[9px] text-accent-rose uppercase">Pending</p>
              <p className="text-lg font-bold font-mono text-accent-rose">{formatBDT(stats.pendingAmount)}</p>
              <p className="text-[9px] text-text-muted">{100 - stats.advanceRate}% unpaid</p>
            </div>
          </div>
          <div className="h-3 bg-bg-elevated rounded-full overflow-hidden flex">
            <div className="h-full bg-accent-teal rounded-full" style={{ width: `${stats.advanceRate}%` }} />
            <div className="h-full bg-accent-rose/50 rounded-full" style={{ width: `${100 - stats.advanceRate}%` }} />
          </div>
          <div className="bg-bg-elevated/40 rounded-xl p-3">
            <p className="text-[10px] text-text-muted uppercase mb-2">Per Product</p>
            <p className="text-center text-sm font-bold font-mono text-accent-gold">
              {stats.totalProduct > 0 ? formatBDT(Math.round(stats.totalOrderValue / stats.totalProduct)) : '—'}
            </p>
            <p className="text-center text-[9px] text-text-muted">avg revenue per item</p>
          </div>
        </div>
      ),
    });
  };

  const openBestWorstModal = () => {
    if (!stats?.bestDay || !stats?.worstDay) return;
    setModal({
      title: 'Best & Worst Days', icon: '🏆', color: '#C9A84C',
      subtitle: 'Performance extremes in range',
      content: (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-accent-teal/5 to-accent-teal/10 border border-accent-teal/15 rounded-xl p-3">
            <p className="text-[9px] text-accent-teal uppercase font-medium mb-1">Best Day</p>
            <p className="text-sm font-bold text-text-primary">{formatDateShort(stats.bestDay.dateString)} · {stats.bestDay.dayOfWeek}</p>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="text-center"><p className="text-xs font-bold font-mono text-text-primary">{stats.bestDay.totalOrder}</p><p className="text-[8px] text-text-muted">orders</p></div>
              <div className="text-center"><p className="text-xs font-bold font-mono text-accent-gold">{formatBDT(stats.bestDay.totalOrderValue)}</p><p className="text-[8px] text-text-muted">revenue</p></div>
              <div className="text-center"><p className="text-xs font-bold font-mono text-accent-teal">{formatBDT(stats.bestDay.totalAdvance)}</p><p className="text-[8px] text-text-muted">advance</p></div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-accent-rose/5 to-accent-rose/10 border border-accent-rose/15 rounded-xl p-3">
            <p className="text-[9px] text-accent-rose uppercase font-medium mb-1">Lowest Day</p>
            <p className="text-sm font-bold text-text-primary">{formatDateShort(stats.worstDay.dateString)} · {stats.worstDay.dayOfWeek}</p>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="text-center"><p className="text-xs font-bold font-mono text-text-primary">{stats.worstDay.totalOrder}</p><p className="text-[8px] text-text-muted">orders</p></div>
              <div className="text-center"><p className="text-xs font-bold font-mono text-accent-gold">{formatBDT(stats.worstDay.totalOrderValue)}</p><p className="text-[8px] text-text-muted">revenue</p></div>
              <div className="text-center"><p className="text-xs font-bold font-mono text-accent-teal">{formatBDT(stats.worstDay.totalAdvance)}</p><p className="text-[8px] text-text-muted">advance</p></div>
            </div>
          </div>
        </div>
      ),
    });
  };

  const openProductsModal = () => {
    if (!stats?.topProducts?.length) return;
    setModal({
      title: 'Top Products', icon: '🛒', color: '#C9A84C',
      subtitle: `${stats.topProducts.length} products in range`,
      content: (
        <div className="space-y-1.5">
          {stats.topProducts.map((p, i) => (
            <div key={p.name} className="flex items-center justify-between bg-bg-elevated/40 rounded-xl px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-mono font-bold ${
                  i === 0 ? 'bg-accent-gold/15 text-accent-gold' : i === 1 ? 'bg-gray-200 text-gray-600' : i === 2 ? 'bg-amber-100 text-amber-700' : 'bg-bg-elevated text-text-muted'
                }`}>{i + 1}</span>
                <span className="text-xs font-medium text-text-primary truncate">{p.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-bg-elevated text-text-muted">{p.category}</span>
                <span className="text-xs font-mono font-bold text-accent-gold">{p.qty}</span>
              </div>
            </div>
          ))}
        </div>
      ),
    });
  };

  const openDailyModal = () => {
    if (!stats?.dailyData?.length) return;
    setModal({
      title: 'Daily Breakdown', icon: '📊', color: '#0D9488',
      subtitle: `${stats.dailyData.length} days in range`,
      content: (
        <div className="space-y-1.5 max-h-80 overflow-y-auto">
          {[...filteredReports].reverse().map(r => (
            <div key={r.dateString} className="flex items-center justify-between bg-bg-elevated/40 rounded-xl px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-gold/40 flex-shrink-0" />
                <span className="text-xs font-medium text-text-primary">{formatDateShort(r.dateString)}</span>
                <span className="text-[9px] text-text-muted">{r.dayOfWeek}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-[10px] font-mono text-text-muted">{r.totalOrder} orders</span>
                <span className="text-[10px] font-mono text-accent-gold">{formatBDT(r.totalOrderValue)}</span>
              </div>
            </div>
          ))}
        </div>
      ),
    });
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto space-y-4 animate-fade-in">
        <div className="h-24 bg-bg-elevated/50 rounded-2xl animate-pulse" />
        <div className="h-16 bg-bg-elevated/50 rounded-2xl animate-pulse" />
        <div className="h-40 bg-bg-elevated/50 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-4 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-accent-gold to-amber-500 rounded-2xl p-5 text-white shadow-lg shadow-accent-gold/20">
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />
        <div className="relative">
          <h1 className="text-xl font-bold tracking-tight">Export PDF</h1>
          <p className="text-white/80 text-xs mt-1">Select range & download your report</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-bg-elevated/60 p-1 rounded-xl border border-border/30">
        {[
          { key: 'presets', label: 'Quick Select' },
          { key: 'custom', label: 'Custom Range' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === tab.key ? 'bg-white text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Preset Grid */}
      {activeTab === 'presets' && (
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((preset, i) => (
            <button key={i} onClick={() => handlePreset(preset, i)}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-200 ${
                activePreset === i
                  ? 'bg-accent-gold/10 border-accent-gold/30 shadow-md shadow-accent-gold/10'
                  : 'bg-white/80 border-border/30 hover:border-accent-gold/20 hover:shadow-sm'
              }`}>
              <span className="text-lg">{preset.icon}</span>
              <span className={`text-xs font-medium ${activePreset === i ? 'text-accent-gold' : 'text-text-primary'}`}>{preset.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Custom Range */}
      {activeTab === 'custom' && (
        <div className="bg-white/80 backdrop-blur-xl border border-border/40 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-text-muted uppercase tracking-wider font-medium block mb-1">From</label>
              <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setActivePreset(null); }}
                className="w-full text-xs px-3 py-2.5 border border-border/50 rounded-xl focus:outline-none focus:border-accent-gold/50 bg-white" />
            </div>
            <div className="pt-5"><span className="text-text-muted text-sm">→</span></div>
            <div className="flex-1">
              <label className="text-[10px] text-text-muted uppercase tracking-wider font-medium block mb-1">To</label>
              <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setActivePreset(null); }}
                className="w-full text-xs px-3 py-2.5 border border-border/50 rounded-xl focus:outline-none focus:border-accent-gold/50 bg-white" />
            </div>
          </div>
        </div>
      )}

      {/* Stats Preview */}
      {stats && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-semibold text-text-primary">{rangeLabel}</p>
            <span className="text-[10px] text-text-muted font-mono">{stats.days} reports</span>
          </div>

          {/* Clickable Stats */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={openOrdersModal} className="bg-white/80 border border-border/30 rounded-xl p-3 text-center hover:shadow-lg hover:shadow-accent-gold/8 hover:border-accent-gold/20 hover:-translate-y-0.5 transition-all">
              <p className="text-[9px] text-text-muted uppercase">Orders</p>
              <p className="text-lg font-bold font-mono text-text-primary">{formatNumber(stats.totalOrder)}</p>
              <p className="text-[9px] text-text-muted">{stats.avgOrders}/day avg</p>
            </button>
            <button onClick={openRevenueModal} className="bg-white/80 border border-border/30 rounded-xl p-3 text-center hover:shadow-lg hover:shadow-accent-gold/8 hover:border-accent-gold/20 hover:-translate-y-0.5 transition-all">
              <p className="text-[9px] text-text-muted uppercase">Value</p>
              <p className="text-lg font-bold font-mono text-accent-gold">{formatBDT(stats.totalOrderValue)}</p>
              <p className="text-[9px] text-text-muted">{formatBDT(stats.avgValue)}/day</p>
            </button>
            <button onClick={openRevenueModal} className="bg-white/80 border border-border/30 rounded-xl p-3 text-center hover:shadow-lg hover:shadow-accent-gold/8 hover:border-accent-gold/20 hover:-translate-y-0.5 transition-all">
              <p className="text-[9px] text-text-muted uppercase">Advance</p>
              <p className="text-lg font-bold font-mono text-accent-teal">{formatBDT(stats.totalAdvance)}</p>
              <p className="text-[9px] text-text-muted">{stats.advanceRate}% rate</p>
            </button>
            <button onClick={openRevenueModal} className="bg-white/80 border border-border/30 rounded-xl p-3 text-center hover:shadow-lg hover:shadow-accent-gold/8 hover:border-accent-gold/20 hover:-translate-y-0.5 transition-all">
              <p className="text-[9px] text-text-muted uppercase">Pending</p>
              <p className="text-lg font-bold font-mono text-accent-rose">{formatBDT(stats.pendingAmount)}</p>
              <p className="text-[9px] text-text-muted">{100 - stats.advanceRate}% unpaid</p>
            </button>
          </div>

          {/* Clickable Order Split */}
          <button onClick={openOrdersModal} className="w-full bg-white/80 border border-border/30 rounded-xl p-3 text-left hover:shadow-lg hover:shadow-accent-gold/8 hover:border-accent-gold/20 transition-all">
            <span className="text-[10px] text-text-muted uppercase font-medium">Order Mix</span>
            <div className="flex gap-2 mt-2">
              <div className="flex-1 bg-accent-gold/5 rounded-lg p-2 text-center">
                <p className="text-xs font-bold font-mono text-accent-gold">{formatNumber(stats.regularOrder)}</p>
                <p className="text-[9px] text-text-muted">Regular ({100 - stats.customizeRate}%)</p>
              </div>
              <div className="flex-1 bg-accent-rose/5 rounded-lg p-2 text-center">
                <p className="text-xs font-bold font-mono text-accent-rose">{formatNumber(stats.customizeOrder)}</p>
                <p className="text-[9px] text-text-muted">Custom ({stats.customizeRate}%)</p>
              </div>
            </div>
            <div className="mt-2 h-2 bg-bg-elevated rounded-full overflow-hidden flex">
              <div className="h-full bg-accent-gold rounded-full" style={{ width: `${100 - stats.customizeRate}%` }} />
              <div className="h-full bg-accent-rose rounded-full" style={{ width: `${stats.customizeRate}%` }} />
            </div>
          </button>

          {/* Clickable Best/Worst */}
          {stats.bestDay && stats.worstDay && (
            <button onClick={openBestWorstModal} className="w-full grid grid-cols-2 gap-2 text-left hover:shadow-lg hover:shadow-accent-gold/8 transition-all">
              <div className="bg-accent-teal/5 border border-accent-teal/15 rounded-xl p-3">
                <p className="text-[9px] text-accent-teal uppercase font-medium mb-1">Best Day</p>
                <p className="text-xs font-semibold text-text-primary">{formatDateShort(stats.bestDay.dateString)}</p>
                <p className="text-[10px] text-accent-gold font-mono">{formatBDT(stats.bestDay.totalOrderValue)}</p>
              </div>
              <div className="bg-accent-rose/5 border border-accent-rose/15 rounded-xl p-3">
                <p className="text-[9px] text-accent-rose uppercase font-medium mb-1">Lowest Day</p>
                <p className="text-xs font-semibold text-text-primary">{formatDateShort(stats.worstDay.dateString)}</p>
                <p className="text-[10px] text-text-muted font-mono">{formatBDT(stats.worstDay.totalOrderValue)}</p>
              </div>
            </button>
          )}

          {/* Clickable Top Products */}
          {stats.topProducts.length > 0 && (
            <button onClick={openProductsModal} className="w-full bg-white/80 border border-border/30 rounded-xl p-3 text-left hover:shadow-lg hover:shadow-accent-gold/8 hover:border-accent-gold/20 transition-all">
              <p className="text-[10px] text-text-muted uppercase font-medium mb-2">Top Products</p>
              <div className="space-y-1">
                {stats.topProducts.slice(0, 5).map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-4 h-4 rounded bg-accent-gold/10 text-accent-gold text-[8px] font-mono flex items-center justify-center">{i + 1}</span>
                      <span className="text-[11px] font-medium text-text-primary truncate">{p.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-accent-gold font-semibold">{p.qty}</span>
                  </div>
                ))}
              </div>
              {stats.topProducts.length > 5 && (
                <p className="text-[9px] text-accent-gold text-center mt-2">+{stats.topProducts.length - 5} more · Tap to see all</p>
              )}
            </button>
          )}

          {/* Export Button */}
          <button onClick={handleExport} disabled={generating || filteredReports.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent-gold to-amber-500 text-white font-semibold text-sm py-3.5 px-4 rounded-xl shadow-lg shadow-accent-gold/25 hover:shadow-xl hover:shadow-accent-gold/35 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300">
            {generating ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating PDF...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF Report
              </>
            )}
          </button>

          {/* Clickable Daily Reports */}
          <button onClick={openDailyModal} className="w-full bg-white/80 border border-border/30 rounded-xl p-3 text-left hover:shadow-lg hover:shadow-accent-gold/8 hover:border-accent-gold/20 transition-all">
            <p className="text-[10px] text-text-muted uppercase font-medium mb-2">Recent Reports in Range</p>
            <div className="space-y-1 max-h-32 overflow-hidden">
              {[...filteredReports].reverse().slice(0, 5).map((r, i) => (
                <div key={r.dateString} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-gold/40 flex-shrink-0" />
                    <span className="text-[11px] text-text-primary font-medium">{formatDateShort(r.dateString)}</span>
                    <span className="text-[9px] text-text-muted">{r.dayOfWeek}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[10px] font-mono text-text-muted">{r.totalOrder} orders</span>
                    <span className="text-[10px] font-mono text-accent-gold">{formatBDT(r.totalOrderValue)}</span>
                  </div>
                </div>
              ))}
            </div>
            {filteredReports.length > 5 && (
              <p className="text-[9px] text-accent-gold text-center mt-1">+{filteredReports.length - 5} more · Tap to see all</p>
            )}
          </button>
        </div>
      )}

      {/* No data */}
      {filteredReports.length === 0 && !loading && (
        <div className="bg-white/80 backdrop-blur-xl border border-border/40 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-bg-elevated/50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-text-muted/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm text-text-muted">No reports found</p>
          <p className="text-xs text-text-muted/60 mt-1">Try a different date range</p>
        </div>
      )}

      {/* Hidden Range PDF render */}
      {filteredReports.length > 0 && (
        <RangePDF reports={filteredReports} rangeLabel={rangeLabel}
          startDate={startDate || filteredReports[0]?.dateString}
          endDate={endDate || filteredReports[filteredReports.length - 1]?.dateString} />
      )}

      {/* DetailModal */}
      {modal && (
        <DetailModal open={!!modal} onClose={() => setModal(null)} title={modal.title} subtitle={modal.subtitle} icon={modal.icon} color={modal.color}>
          {modal.content}
        </DetailModal>
      )}
    </div>
  );
}

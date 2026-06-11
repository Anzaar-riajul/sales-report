import { subDays, isWithinInterval, parseISO } from 'date-fns';

function getDaysSince(dateValue) {
  if (!dateValue) return Infinity;
  const d = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
  return Math.floor((new Date() - d) / (1000 * 60 * 60 * 24));
}

function getRecentHistory(product, days) {
  if (!product.dailyHistory) return [];
  const cutoff = subDays(new Date(), days);
  return product.dailyHistory.filter(h => {
    const d = typeof h.date === 'string' ? parseISO(h.date) : h.date;
    return d >= cutoff;
  });
}

export function computeStockRecommendations(products, reports) {
  if (!products || products.length === 0) return [];
  const sorted = [...reports || []].sort((a, b) => new Date(b.dateString) - new Date(a.dateString));
  const latestDate = sorted.length > 0 ? new Date(sorted[0].dateString) : new Date();

  const recommendations = products.map(product => {
    const history = (product.dailyHistory || []).sort((a, b) => b.date.localeCompare(a.date));
    const daysSinceLastSale = getDaysSince(product.lastSeenDate);
    const recent14 = getRecentHistory(product, 14);
    const recent7 = getRecentHistory(product, 7);
    const recent30 = getRecentHistory(product, 30);

    const qty7 = recent7.reduce((s, h) => s + h.quantity, 0);
    const qty14 = recent14.reduce((s, h) => s + h.quantity, 0);
    const qty30 = recent30.reduce((s, h) => s + h.quantity, 0);
    const velocity = product.totalAppearances > 0
      ? Math.round((product.totalQuantitySold / product.totalAppearances) * 10) / 10
      : 0;

    let action, reason;
    const days30 = 30;
    const history30 = history.filter(h => {
      const d = typeof h.date === 'string' ? parseISO(h.date) : h.date;
      return d >= subDays(latestDate, 30);
    });
    const appearances30 = history30.length;

    if (qty7 >= 5 && velocity >= 3) {
      action = 'Stock Up';
      reason = `Sold ${qty7} in 7 days, high velocity (${velocity}/day)`;
    } else if (qty7 >= 2 && velocity >= 1.5) {
      action = 'Restock';
      reason = `Sold ${qty7} in 7 days, steady demand`;
    } else if (qty14 > 0 && daysSinceLastSale <= 14) {
      action = 'Monitor';
      reason = `Last sold ${daysSinceLastSale}d ago, keep minimal stock`;
    } else if (daysSinceLastSale >= 14 && daysSinceLastSale < 30) {
      action = 'Reduce Stock';
      reason = `Not sold in ${daysSinceLastSale} days, avoid restocking`;
    } else if (daysSinceLastSale >= 30) {
      action = 'Discontinue';
      reason = `No sale in ${daysSinceLastSale} days, consider removing`;
    } else {
      action = 'Monitor';
      reason = `Low data — appearances: ${product.totalAppearances}`;
    }

    const score = (qty7 * 3) + (qty14 * 2) + (velocity * 5) - (daysSinceLastSale * 2);
    const recentAppearances = appearances30;
    const consistency = product.totalAppearances > 0
      ? Math.round((recentAppearances / Math.min(product.totalAppearances, 30)) * 100)
      : 0;

    let trend = 'flat';
    const prev7 = getRecentHistory(product, 14).filter(h => {
      const d = typeof h.date === 'string' ? parseISO(h.date) : h.date;
      return d < subDays(new Date(), 7) && d >= subDays(new Date(), 14);
    });
    const prev7Qty = prev7.reduce((s, h) => s + h.quantity, 0);
    if (prev7Qty > 0 && qty7 > prev7Qty * 1.3) trend = 'rising';
    else if (prev7Qty > 0 && qty7 < prev7Qty * 0.5) trend = 'declining';

    return {
      name: product.name,
      category: product.category || 'Other',
      action,
      reason,
      score,
      trend,
      velocity,
      daysSinceLastSale,
      qty7,
      qty14,
      qty30,
      totalQuantity: product.totalQuantitySold || 0,
      totalAppearances: product.totalAppearances || 0,
      consistency,
      lastSeen: product.lastSeenDate,
    };
  });

  return recommendations;
}

export function computeHotProducts(products, reports, topN = 10) {
  const recs = computeStockRecommendations(products, reports);
  return recs
    .filter(r => r.action === 'Stock Up' || r.action === 'Restock')
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

export function computeColdProducts(products, reports, topN = 10) {
  const recs = computeStockRecommendations(products, reports);
  return recs
    .filter(r => r.action === 'Reduce Stock' || r.action === 'Discontinue')
    .sort((a, b) => b.daysSinceLastSale - a.daysSinceLastSale)
    .slice(0, topN);
}

export function computeTrendingCategories(products, reports) {
  const recs = computeStockRecommendations(products, reports);
  const categories = {};
  for (const r of recs) {
    if (!categories[r.category]) {
      categories[r.category] = {
        name: r.category,
        totalProducts: 0,
        stockUp: 0,
        monitor: 0,
        reduce: 0,
        discontinue: 0,
        totalScore: 0,
      };
    }
    categories[r.category].totalProducts += 1;
    categories[r.category].totalScore += r.score;
    if (r.action === 'Stock Up' || r.action === 'Restock') categories[r.category].stockUp += 1;
    else if (r.action === 'Monitor') categories[r.category].monitor += 1;
    else if (r.action === 'Reduce Stock') categories[r.category].reduce += 1;
    else if (r.action === 'Discontinue') categories[r.category].discontinue += 1;
  }
  return Object.values(categories)
    .map(c => ({
      ...c,
      health: c.totalProducts > 0 ? Math.round((c.stockUp / c.totalProducts) * 100) : 0,
    }))
    .sort((a, b) => b.health - a.health);
}

export function computeDailyNewProducts(reports) {
  if (!reports || reports.length === 0) return [];
  const byDate = {};
  for (const report of reports) {
    if (!report.products) continue;
    const prevReports = reports.filter(r =>
      r.dateString < report.dateString
    ).sort((a, b) => b.dateString.localeCompare(a.dateString));
    const prevProductNames = new Set(
      prevReports.flatMap(r => r.products?.map(p => p.name.toLowerCase()) || [])
    );
    const newProducts = report.products.filter(p => !prevProductNames.has(p.name.toLowerCase()));
    if (newProducts.length > 0) {
      byDate[report.dateString] = newProducts.map(p => ({ name: p.name, quantity: p.quantity }));
    }
  }
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, products]) => ({ date, products, count: products.length }));
}

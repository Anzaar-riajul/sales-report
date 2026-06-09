import { format, parseISO, subDays, startOfWeek, isSameDay, isWithinInterval, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export function computeAlerts(allReports, allProducts) {
  const alerts = [];
  if (!allReports || allReports.length === 0) return alerts;

  const sortedReports = [...allReports].sort((a, b) => new Date(b.dateString) - new Date(a.dateString));
  const latest = sortedReports[0];

  const last7 = sortedReports.filter(r => {
    const d = new Date(r.dateString);
    const weekAgo = subDays(new Date(latest.dateString), 7);
    return d >= weekAgo;
  });

  if (last7.length >= 3) {
    const avgOrders7 = last7.reduce((sum, r) => sum + r.totalOrder, 0) / last7.length;
    if (latest.totalOrder < avgOrders7 * 0.7) {
      alerts.push({
        type: 'warning',
        message: `Today's orders (${latest.totalOrder}) are 30%+ below 7-day average (${Math.round(avgOrders7)})`,
        severity: 'high'
      });
    }
  }

  if (latest.advanceRate < 15) {
    alerts.push({
      type: 'warning',
      message: `Advance rate dropped below 15% today (${latest.advanceRate}%)`,
      severity: 'high'
    });
  }

  if (latest.totalOrderValue > 0) {
    const maxValue = sortedReports.reduce((max, r) => Math.max(max, r.totalOrderValue), 0);
    if (latest.totalOrderValue === maxValue) {
      alerts.push({
        type: 'success',
        message: `Best revenue day in 30 days! ${format(new Date(latest.dateString), 'MMM dd')} — BDT ${(latest.totalOrderValue / 100000).toFixed(1)}L`,
        severity: 'low'
      });
    }
  }

  if (allProducts && allProducts.length > 0) {
    const now = new Date(latest.dateString);
    const weekAgo = subDays(now, 7);

    const deadStock = allProducts.filter(p => {
      if (!p.lastSeenDate) return false;
      const lastSeen = p.lastSeenDate.toDate ? p.lastSeenDate.toDate() : new Date(p.lastSeenDate);
      return lastSeen < weekAgo;
    });

    if (deadStock.length > 0 && deadStock.length <= 10) {
      alerts.push({
        type: 'warning',
        message: `Dead stock: ${deadStock.map(p => p.name).join(', ')} not ordered in 7+ days`,
        severity: 'medium'
      });
    }

    for (const product of allProducts) {
      if (!product.dailyHistory || product.dailyHistory.length < 4) continue;
      const history = [...product.dailyHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
      const recent7 = history.filter(h => isWithinInterval(new Date(h.date), { start: weekAgo, end: now }));
      const prev7 = history.filter(h => isWithinInterval(new Date(h.date), { start: subDays(weekAgo, 7), end: subDays(weekAgo, 1) }));

      if (recent7.length > 0 && prev7.length > 0) {
        const recentSum = recent7.reduce((s, h) => s + h.quantity, 0);
        const prevSum = prev7.reduce((s, h) => s + h.quantity, 0);
        if (prevSum > 0 && recentSum >= prevSum * 2) {
          const pct = Math.round(((recentSum - prevSum) / prevSum) * 100);
          alerts.push({
            type: 'info',
            message: `Rising star: ${product.name} up ${pct}% this week`,
            severity: 'low'
          });
        }
      }
    }
  }

  const recentCustomRate = sortedReports.slice(0, 7).filter(r => r.totalOrder > 0);
  if (recentCustomRate.length >= 3) {
    const avgCustomPct = recentCustomRate.reduce((s, r) => s + (r.customizeOrder / r.totalOrder) * 100, 0) / recentCustomRate.length;
    if (avgCustomPct > 40) {
      alerts.push({
        type: 'info',
        message: `Customize orders at ${Math.round(avgCustomPct)}% — consider capacity check`,
        severity: 'medium'
      });
    }
  }

  if (sortedReports.length > 1) {
    const secondLatest = sortedReports[1];
    if (secondLatest && secondLatest.totalOrder > 0) {
      const nextDay = new Date(secondLatest.dateString);
      nextDay.setDate(nextDay.getDate() + 1);
      if (isSameDay(nextDay, new Date(latest.dateString))) {
        const orderGrowth = ((latest.totalOrder - secondLatest.totalOrder) / secondLatest.totalOrder) * 100;
        if (Math.abs(orderGrowth) > 5) {
          const direction = orderGrowth > 0 ? 'up' : 'down';
          alerts.push({
            type: orderGrowth > 0 ? 'success' : 'warning',
            message: `Orders ${direction} ${Math.abs(Math.round(orderGrowth))}% vs yesterday`,
            severity: 'low'
          });
        }
      }
    }
  }

  return alerts;
}

export function computeWeeklySummary(reports) {
  if (!reports || reports.length === 0) return [];
  const weeks = {};

  for (const report of reports) {
    const d = parseISO(report.dateString);
    const weekStart = format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    if (!weeks[weekStart]) {
      weeks[weekStart] = {
        weekStart,
        totalOrder: 0, totalProduct: 0, totalAdvance: 0, totalOrderValue: 0,
        days: 0
      };
    }
    weeks[weekStart].totalOrder += report.totalOrder;
    weeks[weekStart].totalProduct += report.totalProduct;
    weeks[weekStart].totalAdvance += report.totalAdvance;
    weeks[weekStart].totalOrderValue += report.totalOrderValue;
    weeks[weekStart].days += 1;
  }

  return Object.values(weeks).sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export function computeMonthlySummary(reports) {
  if (!reports || reports.length === 0) return [];
  const months = {};

  for (const report of reports) {
    const d = parseISO(report.dateString);
    const monthKey = format(d, 'yyyy-MM');
    if (!months[monthKey]) {
      months[monthKey] = {
        month: monthKey,
        totalOrder: 0, totalProduct: 0, totalAdvance: 0, totalOrderValue: 0,
        days: 0
      };
    }
    months[monthKey].totalOrder += report.totalOrder;
    months[monthKey].totalProduct += report.totalProduct;
    months[monthKey].totalAdvance += report.totalAdvance;
    months[monthKey].totalOrderValue += report.totalOrderValue;
    months[monthKey].days += 1;
  }

  return Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
}

export function computeYearlySummary(reports) {
  if (!reports || reports.length === 0) return [];
  const years = {};

  for (const report of reports) {
    const d = parseISO(report.dateString);
    const yearKey = format(d, 'yyyy');
    if (!years[yearKey]) {
      years[yearKey] = {
        year: yearKey,
        totalOrder: 0, totalProduct: 0, totalAdvance: 0, totalOrderValue: 0,
        days: 0
      };
    }
    years[yearKey].totalOrder += report.totalOrder;
    years[yearKey].totalProduct += report.totalProduct;
    years[yearKey].totalAdvance += report.totalAdvance;
    years[yearKey].totalOrderValue += report.totalOrderValue;
    years[yearKey].days += 1;
  }

  return Object.values(years).sort((a, b) => a.year.localeCompare(b.year));
}

export function computeWeekdayAnalysis(reports) {
  if (!reports || reports.length === 0) return [];
  const days = {
    'Monday': { orders: [], values: [] },
    'Tuesday': { orders: [], values: [] },
    'Wednesday': { orders: [], values: [] },
    'Thursday': { orders: [], values: [] },
    'Friday': { orders: [], values: [] },
    'Saturday': { orders: [], values: [] },
    'Sunday': { orders: [], values: [] },
  };

  for (const report of reports) {
    if (report.dayOfWeek && days[report.dayOfWeek]) {
      days[report.dayOfWeek].orders.push(report.totalOrder);
      days[report.dayOfWeek].values.push(report.totalOrderValue);
    }
  }

  return Object.entries(days).map(([day, data]) => ({
    day,
    avgOrders: data.orders.length > 0 ? Math.round(data.orders.reduce((a, b) => a + b, 0) / data.orders.length) : 0,
    avgValue: data.values.length > 0 ? Math.round(data.values.reduce((a, b) => a + b, 0) / data.values.length) : 0,
    count: data.orders.length,
  }));
}

export function computeRollingAverage(reports, days = 7) {
  if (!reports || reports.length === 0) return [];
  const sorted = [...reports].sort((a, b) => a.dateString.localeCompare(b.dateString));
  return sorted.map((report, i) => {
    const start = Math.max(0, i - days + 1);
    const slice = sorted.slice(start, i + 1);
    const avgOrder = slice.reduce((s, r) => s + r.totalOrder, 0) / slice.length;
    const avgValue = slice.reduce((s, r) => s + r.totalOrderValue, 0) / slice.length;
    return {
      date: report.dateString,
      avgOrder: Math.round(avgOrder * 10) / 10,
      avgValue: Math.round(avgValue * 10) / 10,
      totalOrder: report.totalOrder,
      totalOrderValue: report.totalOrderValue,
    };
  });
}

export function computeProductRankings(products) {
  if (!products || products.length === 0) return [];
  return [...products]
    .map(p => ({
      ...p,
      velocity: p.totalAppearances > 0 ? Math.round((p.totalQuantitySold / p.totalAppearances) * 10) / 10 : 0
    }))
    .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold);
}

export function computeCategoryBreakdown(products) {
  if (!products || products.length === 0) return [];
  const categories = {};

  for (const product of products) {
    const cat = product.category || 'Other';
    if (!categories[cat]) categories[cat] = { name: cat, totalQuantity: 0, productCount: 0 };
    categories[cat].totalQuantity += product.totalQuantitySold;
    categories[cat].productCount += 1;
  }

  return Object.values(categories).sort((a, b) => b.totalQuantity - a.totalQuantity);
}

export function computeSameWeekdayComparison(reports) {
  if (!reports || reports.length < 2) return null;
  const sorted = [...reports].sort((a, b) => new Date(b.dateString) - new Date(a.dateString));
  const latest = sorted[0];
  const sameDayLastWeek = sorted.find(r =>
    r.dayOfWeek === latest.dayOfWeek &&
    r.dateString !== latest.dateString
  );
  if (!sameDayLastWeek) return null;

  const orderChange = sameDayLastWeek.totalOrder > 0
    ? Math.round(((latest.totalOrder - sameDayLastWeek.totalOrder) / sameDayLastWeek.totalOrder) * 100)
    : 0;
  const valueChange = sameDayLastWeek.totalOrderValue > 0
    ? Math.round(((latest.totalOrderValue - sameDayLastWeek.totalOrderValue) / sameDayLastWeek.totalOrderValue) * 100)
    : 0;

  return {
    current: latest,
    previous: sameDayLastWeek,
    orderChange,
    valueChange
  };
}

export function computeProductsPerOrderTrend(reports) {
  if (!reports || reports.length === 0) return [];
  return [...reports]
    .sort((a, b) => a.dateString.localeCompare(b.dateString))
    .map(r => ({
      date: r.dateString,
      ratio: r.totalOrder > 0 ? Math.round((r.totalProduct / r.totalOrder) * 100) / 100 : 0
    }));
}

export function computeDailyReport(report, previousReport) {
  if (!report) return null;

  const daily = {
    ...report,
    dayOverDay: null
  };

  if (previousReport) {
    daily.dayOverDay = {
      orderChange: previousReport.totalOrder > 0
        ? Math.round(((report.totalOrder - previousReport.totalOrder) / previousReport.totalOrder) * 100) : 0,
      valueChange: previousReport.totalOrderValue > 0
        ? Math.round(((report.totalOrderValue - previousReport.totalOrderValue) / previousReport.totalOrderValue) * 100) : 0,
      advanceChange: previousReport.totalAdvance > 0
        ? Math.round(((report.totalAdvance - previousReport.totalAdvance) / previousReport.totalAdvance) * 100) : 0,
    };
  }

  return daily;
}

export function computeWeekOverWeekGrowth(reports) {
  if (!reports || reports.length < 2) return null;
  const sorted = [...reports].sort((a, b) => new Date(b.dateString) - new Date(a.dateString));
  const now = new Date(sorted[0].dateString);
  const weekAgo = subDays(now, 7);
  const twoWeeksAgo = subDays(now, 14);

  const currentWeek = sorted.filter(r => {
    const d = new Date(r.dateString);
    return d >= weekAgo && d <= now;
  });
  const previousWeek = sorted.filter(r => {
    const d = new Date(r.dateString);
    return d >= twoWeeksAgo && d < weekAgo;
  });

  if (currentWeek.length === 0 || previousWeek.length === 0) return null;

  const currentOrders = currentWeek.reduce((s, r) => s + r.totalOrder, 0);
  const previousOrders = previousWeek.reduce((s, r) => s + r.totalOrder, 0);
  const currentValue = currentWeek.reduce((s, r) => s + r.totalOrderValue, 0);
  const previousValue = previousWeek.reduce((s, r) => s + r.totalOrderValue, 0);

  return {
    currentOrders,
    previousOrders,
    orderGrowth: previousOrders > 0 ? Math.round(((currentOrders - previousOrders) / previousOrders) * 100) : 0,
    currentValue,
    previousValue,
    valueGrowth: previousValue > 0 ? Math.round(((currentValue - previousValue) / previousValue) * 100) : 0,
    currentDays: currentWeek.length,
    previousDays: previousWeek.length,
  };
}

export function computeMTDComparison(reports) {
  if (!reports || reports.length === 0) return null;
  const sorted = [...reports].sort((a, b) => new Date(b.dateString) - new Date(a.dateString));
  const latest = new Date(sorted[0].dateString);

  const mtdStart = startOfMonth(latest);
  const thisMonth = sorted.filter(r => {
    const d = new Date(r.dateString);
    return d >= mtdStart && d <= latest;
  });

  const lastMonthStart = startOfMonth(subMonths(latest, 1));
  const lastMonthEnd = endOfMonth(lastMonthStart);
  const lastMonth = sorted.filter(r => {
    const d = new Date(r.dateString);
    return d >= lastMonthStart && d <= lastMonthEnd;
  });

  if (thisMonth.length === 0 || lastMonth.length === 0) return null;

  const mtdOrders = thisMonth.reduce((s, r) => s + r.totalOrder, 0);
  const lmOrders = lastMonth.reduce((s, r) => s + r.totalOrder, 0);
  const mtdValue = thisMonth.reduce((s, r) => s + r.totalOrderValue, 0);
  const lmValue = lastMonth.reduce((s, r) => s + r.totalOrderValue, 0);
  const mtdAdvance = thisMonth.reduce((s, r) => s + r.totalAdvance, 0);
  const lmAdvance = lastMonth.reduce((s, r) => s + r.totalAdvance, 0);

  return {
    mtd: {
      orders: mtdOrders,
      value: mtdValue,
      advance: mtdAdvance,
      days: thisMonth.length,
    },
    lastMonth: {
      orders: lmOrders,
      value: lmValue,
      advance: lmAdvance,
      days: lastMonth.length,
    },
    orderGrowth: lmOrders > 0 ? Math.round(((mtdOrders - lmOrders) / lmOrders) * 100) : 0,
    valueGrowth: lmValue > 0 ? Math.round(((mtdValue - lmValue) / lmValue) * 100) : 0,
  };
}

export function computeProductSalesHistory(product, reports) {
  if (!product || !reports) return { dailyData: [], summary: null };

  const history = (product.dailyHistory || [])
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(h => {
      const report = reports.find(r => r.dateString === h.date);
      return {
        date: h.date,
        quantity: h.quantity,
        totalOrderValue: report?.totalOrderValue || 0,
        totalOrder: report?.totalOrder || 0,
        advanceRate: report?.advanceRate || 0,
      };
    });

  const totalQuantity = history.reduce((s, h) => s + h.quantity, 0);
  const totalAppearances = history.length;
  const firstSeen = history.length > 0 ? history[0].date : null;
  const lastSeen = history.length > 0 ? history[history.length - 1].date : null;

  const sortedHist = [...history].sort((a, b) => b.quantity - a.quantity);
  const bestDay = sortedHist.length > 0 ? sortedHist[0] : null;

  const recent7 = history.filter(h => {
    const d = new Date(h.date);
    const weekAgo = subDays(new Date(), 7);
    return d >= weekAgo;
  });
  const recent7Qty = recent7.reduce((s, h) => s + h.quantity, 0);

  const prev7 = history.filter(h => {
    const d = new Date(h.date);
    const weekAgo = subDays(new Date(), 7);
    const twoWeeksAgo = subDays(new Date(), 14);
    return d >= twoWeeksAgo && d < weekAgo;
  });
  const prev7Qty = prev7.reduce((s, h) => s + h.quantity, 0);

  return {
    dailyData: history,
    summary: {
      totalQuantity,
      totalAppearances,
      firstSeen,
      lastSeen,
      velocity: totalAppearances > 0 ? Math.round((totalQuantity / totalAppearances) * 10) / 10 : 0,
      bestDay,
      recent7Qty,
      prev7Qty,
      weekGrowth: prev7Qty > 0 ? Math.round(((recent7Qty - prev7Qty) / prev7Qty) * 100) : 0,
    }
  };
}

export function computeNewProducts(products, reports) {
  if (!products || !reports || reports.length === 0) return [];
  const sorted = [...reports].sort((a, b) => new Date(b.dateString) - new Date(a.dateString));
  const now = new Date(sorted[0].dateString);
  const weekAgo = subDays(now, 7);

  return products.filter(p => {
    if (!p.firstSeenDate) return false;
    const firstSeen = p.firstSeenDate.toDate ? p.firstSeenDate.toDate() : new Date(p.firstSeenDate);
    return firstSeen >= weekAgo;
  }).sort((a, b) => {
    const aDate = a.firstSeenDate?.toDate ? a.firstSeenDate.toDate() : new Date(a.firstSeenDate);
    const bDate = b.firstSeenDate?.toDate ? b.firstSeenDate.toDate() : new Date(b.firstSeenDate);
    return bDate - aDate;
  });
}

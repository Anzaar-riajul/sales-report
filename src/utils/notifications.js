import { getCache, setCache } from './cache';

const NOTIF_KEY = 'anzaar_notifications';
import { getProductLastSeen } from './analytics';
const NOTIF_SEEN_KEY = 'anzaar_notifs_seen';
const NOTIF_GENERATED_KEY = 'anzaar_notifs_generated';

export function getNotifications() {
  try {
    return JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
  } catch { return []; }
}

export function saveNotifications(notifs) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs));
}

export function getSeenIds() {
  try {
    return JSON.parse(localStorage.getItem(NOTIF_SEEN_KEY) || '[]');
  } catch { return []; }
}

export function markSeen(id) {
  const seen = getSeenIds();
  if (!seen.includes(id)) {
    seen.push(id);
    localStorage.setItem(NOTIF_SEEN_KEY, JSON.stringify(seen));
  }
}

export function markAllSeen() {
  const notifs = getNotifications();
  localStorage.setItem(NOTIF_SEEN_KEY, JSON.stringify(notifs.map(n => n.id)));
}

export function getUnreadCount() {
  const notifs = getNotifications();
  const seen = getSeenIds();
  return notifs.filter(n => !seen.includes(n.id)).length;
}

export function wasGeneratedToday() {
  const last = localStorage.getItem(NOTIF_GENERATED_KEY);
  if (!last) return false;
  const lastDate = new Date(parseInt(last)).toDateString();
  return lastDate === new Date().toDateString();
}

export function markGenerated() {
  localStorage.setItem(NOTIF_GENERATED_KEY, Date.now().toString());
}

export function generateAndStoreNotifications(reports, products) {
  if (!reports || reports.length < 2) return getNotifications();

  const existing = getNotifications();
  const existingIds = new Set(existing.map(n => n.id));
  const sorted = [...reports].sort((a, b) => new Date(b.dateString) - new Date(a.dateString));
  const latest = sorted[0];
  const previous = sorted[1];
  const newNotifs = [];

  const valChange = latest.totalOrderValue - previous.totalOrderValue;

  if (valChange > 0 && !existingIds.has('rag_value_up')) {
    newNotifs.push({
      id: `rag_value_up_${latest.dateString}`, type: 'success', icon: '▲',
      title: `Value up ৳${(valChange / 100000).toFixed(1)}L vs previous`,
      desc: `Today: ৳${(latest.totalOrderValue / 100000).toFixed(1)}L vs yesterday: ৳${(previous.totalOrderValue / 100000).toFixed(1)}L`,
      time: latest.dateString,
    });
  } else if (valChange < 0 && !existingIds.has('rag_value_down')) {
    newNotifs.push({
      id: `rag_value_down_${latest.dateString}`, type: 'critical', icon: '▼',
      title: `Value down ৳${(Math.abs(valChange) / 100000).toFixed(1)}L vs previous`,
      desc: `Today: ৳${(latest.totalOrderValue / 100000).toFixed(1)}L vs yesterday: ৳${(previous.totalOrderValue / 100000).toFixed(1)}L`,
      time: latest.dateString,
    });
  }

  const revChange = previous.totalOrderValue > 0
    ? ((latest.totalOrderValue - previous.totalOrderValue) / previous.totalOrderValue) * 100 : 0;

  if (revChange < -30 && !existingIds.has('rev_drop_' + latest.dateString)) {
    newNotifs.push({
      id: `rev_drop_${latest.dateString}`, type: 'critical', icon: '📉',
      title: 'Revenue dropped significantly',
      desc: `Today: ৳${(latest.totalOrderValue / 100000).toFixed(1)}L vs yesterday: ৳${(previous.totalOrderValue / 100000).toFixed(1)}L (${Math.round(revChange)}%)`,
      time: latest.dateString,
    });
  } else if (revChange > 30 && !existingIds.has('rev_surge_' + latest.dateString)) {
    newNotifs.push({
      id: `rev_surge_${latest.dateString}`, type: 'success', icon: '🚀',
      title: 'Revenue surge detected!',
      desc: `Today: ৳${(latest.totalOrderValue / 100000).toFixed(1)}L vs yesterday: ৳${(previous.totalOrderValue / 100000).toFixed(1)}L (+${Math.round(revChange)}%)`,
      time: latest.dateString,
    });
  }

  if (latest.advanceRate < 15 && !existingIds.has('low_advance_' + latest.dateString)) {
    newNotifs.push({
      id: `low_advance_${latest.dateString}`, type: 'critical', icon: '⚠️',
      title: `Advance rate critically low (${latest.advanceRate}%)`,
      desc: `Only ${latest.advanceRate}% collected. Target: 60%+. Collect more upfront.`,
      time: latest.dateString,
    });
  }

  if (latest.customizeRate > 50 && !existingIds.has('high_custom_' + latest.dateString)) {
    newNotifs.push({
      id: `high_custom_${latest.dateString}`, type: 'warning', icon: '🎨',
      title: `High customize orders (${latest.customizeRate}%)`,
      desc: `${latest.customizeRate}% orders are customize. Plan production time.`,
      time: latest.dateString,
    });
  }

  if (latest.totalOrder < 5 && !existingIds.has('low_orders_' + latest.dateString)) {
    newNotifs.push({
      id: `low_orders_${latest.dateString}`, type: 'warning', icon: '📦',
      title: `Low order count (${latest.totalOrder} orders)`,
      desc: `Only ${latest.totalOrder} orders today. Check marketing.`,
      time: latest.dateString,
    });
  } else if (latest.totalOrder > 20 && !existingIds.has('high_orders_' + latest.dateString)) {
    newNotifs.push({
      id: `high_orders_${latest.dateString}`, type: 'success', icon: '🔥',
      title: `Strong order day! (${latest.totalOrder} orders)`,
      desc: `${latest.totalOrder} orders today. Great performance!`,
      time: latest.dateString,
    });
  }

  if (products && products.length > 0) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    const deadStock = products.filter(p => {
      const lastSeen = getProductLastSeen(p);
      if (!lastSeen) return true;
      return lastSeen < cutoff;
    });
    if (deadStock.length > 3 && !existingIds.has('dead_stock_' + latest.dateString)) {
      newNotifs.push({
        id: `dead_stock_${latest.dateString}`, type: 'critical', icon: '💀',
        title: `${deadStock.length} products dead for 14+ days`,
        desc: `Top: ${deadStock.slice(0, 3).map(p => p.name).join(', ')}. Consider promotions.`,
        time: latest.dateString,
      });
    }
  }

  if (latest.averageOrderValue > 3000 && !existingIds.has('high_aov_' + latest.dateString)) {
    newNotifs.push({
      id: `high_aov_${latest.dateString}`, type: 'success', icon: '💎',
      title: `High AOV: ৳${latest.averageOrderValue.toLocaleString()}`,
      desc: `Premium orders performing well.`,
      time: latest.dateString,
    });
  }

  if (newNotifs.length > 0) {
    const all = [...newNotifs, ...existing].slice(0, 50);
    saveNotifications(all);
  }

  markGenerated();
  return [...newNotifs, ...existing];
}

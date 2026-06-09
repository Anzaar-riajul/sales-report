import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReports } from '../hooks/useReports';
import { useProducts } from '../hooks/useProducts';
import { formatBDT, formatBDTShort, formatDateShort } from '../utils/formatters';
import { format, subDays, isAfter } from 'date-fns';
import {
  getNotifications, getSeenIds, markSeen as storeMarkSeen,
  markAllSeen, generateAndStoreNotifications
} from '../utils/notifications';
import { getProductLastSeen } from '../utils/analytics';

const SEVERITY = {
  critical: { icon: '🔴', color: '#E11D48', bg: 'from-rose-50 to-red-50', border: 'border-rose-200', label: 'Critical' },
  warning: { icon: '🟡', color: '#F59E0B', bg: 'from-amber-50 to-yellow-50', border: 'border-amber-200', label: 'Warning' },
  success: { icon: '🟢', color: '#10B981', bg: 'from-emerald-50 to-green-50', border: 'border-emerald-200', label: 'Success' },
  info: { icon: '🔵', color: '#3B82F6', bg: 'from-blue-50 to-sky-50', border: 'border-blue-200', label: 'Info' },
};

function generateNotifications(reports, products) {
  if (!reports || reports.length < 2) return [];
  const sorted = [...reports].sort((a, b) => new Date(b.dateString) - new Date(a.dateString));
  const latest = sorted[0];
  const previous = sorted[1];
  const notifs = [];
  const now = new Date();

  const revChange = previous.totalOrderValue > 0
    ? ((latest.totalOrderValue - previous.totalOrderValue) / previous.totalOrderValue) * 100 : 0;

  const valChange = latest.totalOrderValue - previous.totalOrderValue;

  if (valChange > 0) {
    notifs.push({
      id: 'rag_value_up', type: 'success', icon: '▲',
      title: `Value up ${formatBDTShort(valChange)} vs previous`,
      desc: `Today: ${formatBDT(latest.totalOrderValue)} vs yesterday: ${formatBDT(previous.totalOrderValue)}`,
      time: latest.dateString, metric: formatBDTShort(valChange),
    });
  } else if (valChange < 0) {
    notifs.push({
      id: 'rag_value_down', type: 'critical', icon: '▼',
      title: `Value down ${formatBDTShort(Math.abs(valChange))} vs previous`,
      desc: `Today: ${formatBDT(latest.totalOrderValue)} vs yesterday: ${formatBDT(previous.totalOrderValue)}`,
      time: latest.dateString, metric: formatBDTShort(Math.abs(valChange)),
    });
  }

  if (revChange < -30) {
    notifs.push({
      id: 'rev_drop', type: 'critical', icon: '📉',
      title: 'Revenue dropped significantly',
      desc: `Today: ${formatBDT(latest.totalOrderValue)} vs yesterday: ${formatBDT(previous.totalOrderValue)} (${Math.round(revChange)}%)`,
      time: latest.dateString, metric: formatBDT(latest.totalOrderValue),
    });
  } else if (revChange > 30) {
    notifs.push({
      id: 'rev_surge', type: 'success', icon: '🚀',
      title: 'Revenue surge detected!',
      desc: `Today: ${formatBDT(latest.totalOrderValue)} vs yesterday: ${formatBDT(previous.totalOrderValue)} (+${Math.round(revChange)}%)`,
      time: latest.dateString, metric: formatBDT(latest.totalOrderValue),
    });
  }

  if (latest.advanceRate < 15) {
    notifs.push({
      id: 'low_advance', type: 'critical', icon: '⚠️',
      title: 'Advance rate critically low',
      desc: `Only ${latest.advanceRate}% collected. Target: 60%+. Collect more upfront.`,
      time: latest.dateString, metric: `${latest.advanceRate}%`,
    });
  } else if (latest.advanceRate < 40) {
    notifs.push({
      id: 'med_advance', type: 'warning', icon: '💳',
      title: 'Advance rate below target',
      desc: `${latest.advanceRate}% collected. Try to collect 60%+ upfront.`,
      time: latest.dateString, metric: `${latest.advanceRate}%`,
    });
  }

  if (latest.customizeRate > 50) {
    notifs.push({
      id: 'high_custom', type: 'warning', icon: '🎨',
      title: 'High customize orders',
      desc: `${latest.customizeRate}% orders are customize. Plan production time accordingly.`,
      time: latest.dateString, metric: `${latest.customizeRate}%`,
    });
  }

  if (latest.totalOrder < 5) {
    notifs.push({
      id: 'low_orders', type: 'warning', icon: '📦',
      title: 'Low order count today',
      desc: `Only ${latest.totalOrder} orders today. Check marketing or promotions.`,
      time: latest.dateString, metric: `${latest.totalOrder} orders`,
    });
  } else if (latest.totalOrder > 20) {
    notifs.push({
      id: 'high_orders', type: 'success', icon: '🔥',
      title: 'Strong order day!',
      desc: `${latest.totalOrder} orders today. Great performance!`,
      time: latest.dateString, metric: `${latest.totalOrder} orders`,
    });
  }

  if (products && products.length > 0) {
    const cutoff = subDays(now, 14);
    const deadStock = products.filter(p => {
      const lastSeen = getProductLastSeen(p);
      if (!lastSeen) return true;
      return lastSeen < cutoff;
    });
    if (deadStock.length > 3) {
      notifs.push({
        id: 'dead_stock', type: 'critical', icon: '💀',
        title: `${deadStock.length} products dead for 14+ days`,
        desc: `Top: ${deadStock.slice(0, 3).map(p => p.name).join(', ')}. Consider promotions.`,
        time: latest.dateString, metric: `${deadStock.length} items`,
      });
    }
  }

  const totalRevenue = sorted.reduce((s, r) => s + (r.totalOrderValue || 0), 0);
  const milestones = [500000, 1000000, 2500000, 5000000, 10000000];
  for (const m of milestones) {
    if (totalRevenue >= m && totalRevenue < m * 1.1) {
      notifs.push({
        id: `milestone_${m}`, type: 'success', icon: '🏆',
        title: `Revenue milestone: ${formatBDTShort(m)}!`,
        desc: `Total revenue reached ${formatBDT(totalRevenue)} across ${sorted.length} reports.`,
        time: latest.dateString, metric: formatBDTShort(m),
      });
      break;
    }
  }

  if (latest.averageOrderValue > 3000) {
    notifs.push({
      id: 'high_aov', type: 'success', icon: '💎',
      title: 'High average order value',
      desc: `AOV is ${formatBDT(latest.averageOrderValue)}. Premium orders performing well.`,
      time: latest.dateString, metric: formatBDT(latest.averageOrderValue),
    });
  }

  const wow = sorted.slice(0, 7);
  const prevWow = sorted.slice(7, 14);
  if (prevWow.length > 0) {
    const currVal = wow.reduce((s, r) => s + (r.totalOrderValue || 0), 0);
    const prevVal = prevWow.reduce((s, r) => s + (r.totalOrderValue || 0), 0);
    const wowChange = prevVal > 0 ? ((currVal - prevVal) / prevVal) * 100 : 0;
    if (wowChange < -15) {
      notifs.push({
        id: 'wow_drop', type: 'warning', icon: '📊',
        title: 'Week-over-week decline',
        desc: `This week: ${formatBDTShort(currVal)} vs last week: ${formatBDTShort(prevVal)} (${Math.round(wowChange)}%)`,
        time: latest.dateString, metric: `${Math.round(wowChange)}%`,
      });
    } else if (wowChange > 15) {
      notifs.push({
        id: 'wow_up', type: 'success', icon: '📈',
        title: 'Week-over-week growth',
        desc: `This week: ${formatBDTShort(currVal)} vs last week: ${formatBDTShort(prevVal)} (+${Math.round(wowChange)}%)`,
        time: latest.dateString, metric: `+${Math.round(wowChange)}%`,
      });
    }
  }

  notifs.push({
    id: 'system', type: 'info', icon: '⚙',
    title: 'System running smoothly',
    desc: `${sorted.length} reports processed. ${products?.length || 0} products tracked. All systems operational.`,
    time: latest.dateString, metric: `${sorted.length} reports`,
  });

  return notifs;
}

export default function Notifications() {
  const navigate = useNavigate();
  const { reports } = useReports();
  const { products } = useProducts();
  const [filter, setFilter] = useState('all');
  const [seenIds, setSeenIds] = useState(() => getSeenIds());
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const stored = generateAndStoreNotifications(reports, products);
    setNotifications(stored);
  }, [reports, products]);

  useEffect(() => {
    window.dispatchEvent(new Event('notification-updated'));
  }, [seenIds]);

  const markAllRead = () => {
    markAllSeen();
    setSeenIds(notifications.map(n => n.id));
  };

  const markSeen = (id) => {
    storeMarkSeen(id);
    if (!seenIds.includes(id)) {
      setSeenIds(prev => [...prev, id]);
    }
  };

  const filtered = filter === 'all' ? notifications
    : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !seenIds.includes(n.id)).length;

  const counts = {
    all: notifications.length,
    critical: notifications.filter(n => n.type === 'critical').length,
    warning: notifications.filter(n => n.type === 'warning').length,
    success: notifications.filter(n => n.type === 'success').length,
    info: notifications.filter(n => n.type === 'info').length,
  };

  return (
    <div className="min-h-screen animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/3 -translate-x-1/4" />
        </div>
        <div className="relative px-5 pt-8 pb-6 sm:px-8 sm:pt-10 sm:pb-7">
          <button onClick={() => navigate(-1)}
            className="absolute top-4 left-4 sm:top-6 sm:left-6 w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all backdrop-blur-sm">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Notifications</h1>
            <p className="text-white/70 text-sm mt-1">
              {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 sm:px-4 -mt-4 space-y-3 pb-8">
        {/* Filter tabs */}
        <div className="flex gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-xl border border-border/30 shadow-sm overflow-x-auto scrollbar-none">
          {[
            { key: 'all', label: 'All' },
            { key: 'critical', label: '🔴 Critical' },
            { key: 'warning', label: '🟡 Warning' },
            { key: 'success', label: '🟢 Success' },
            { key: 'info', label: '🔵 Info' },
          ].map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                filter === t.key ? 'bg-white text-text-primary shadow-sm border border-border/30' : 'text-text-muted hover:text-text-primary'
              }`}>
              {t.label}
              <span className={`text-[9px] px-1 py-0.5 rounded-full font-bold ${
                filter === t.key ? 'bg-accent-gold/10 text-accent-gold' : 'bg-bg-elevated text-text-muted'
              }`}>{counts[t.key]}</span>
            </button>
          ))}
        </div>

        {/* Mark all read */}
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="w-full py-2.5 bg-white/90 backdrop-blur-sm border border-border/30 rounded-xl text-[11px] font-semibold text-accent-gold hover:bg-accent-gold/5 hover:border-accent-gold/20 transition-all flex items-center justify-center gap-2 shadow-sm">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Mark all as read ({unreadCount})
          </button>
        )}

        {/* Notification list */}
        {filtered.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm border border-border/30 rounded-2xl p-8 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-accent-teal/10 border border-accent-teal/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h3 className="font-semibold text-text-primary mb-1">All clear!</h3>
            <p className="text-xs text-text-muted">No {filter !== 'all' ? SEVERITY[filter]?.label.toLowerCase() + ' ' : ''}notifications right now.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((notif, i) => {
              const sev = SEVERITY[notif.type];
              const isSeen = seenIds.includes(notif.id);
              return (
                <button key={notif.id} onClick={() => markSeen(notif.id)}
                  className={`w-full text-left rounded-2xl p-4 transition-all duration-300 border ${
                    isSeen
                      ? 'bg-white/80 border-border/20 hover:border-border/40'
                      : `bg-gradient-to-r ${sev.bg} ${sev.border} hover:shadow-lg`
                  }`}
                  style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isSeen ? 'bg-bg-elevated/60' : 'bg-white/60'
                    }`}>
                      <span className="text-lg">{notif.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {!isSeen && <span className="w-2 h-2 rounded-full bg-accent-rose flex-shrink-0 animate-pulse" />}
                        <h4 className={`text-sm font-semibold truncate ${isSeen ? 'text-text-primary' : 'text-text-primary'}`}>
                          {notif.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2">{notif.desc}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold`} style={{ background: `${sev.color}15`, color: sev.color }}>
                          {sev.label}
                        </span>
                        <span className="text-[9px] text-text-muted">{formatDateShort(notif.time)}</span>
                        {notif.metric && (
                          <span className="text-[9px] font-mono font-semibold text-accent-gold ml-auto">{notif.metric}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* View Alerts page */}
        <button onClick={() => navigate('/alerts')}
          className="w-full py-3 bg-white/90 backdrop-blur-sm border border-border/30 rounded-2xl text-[11px] font-semibold text-accent-gold hover:bg-accent-gold/5 hover:border-accent-gold/20 hover:shadow-md transition-all flex items-center justify-center gap-2 shadow-sm">
          View Full Alert Dashboard
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

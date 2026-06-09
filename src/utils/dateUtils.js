export function filterReportsByRange(reports, range) {
  if (!reports || reports.length === 0) return [];
  if (!range) return [...reports].sort((a, b) => a.dateString.localeCompare(b.dateString));

  const sorted = [...reports].sort((a, b) => a.dateString.localeCompare(b.dateString));
  const now = sorted.length > 0 ? new Date(sorted[sorted.length - 1].dateString) : new Date();

  switch (range.type) {
    case '7d':
      return sorted.slice(-7);
    case '30d':
      return sorted.slice(-30);
    case '60d':
      return sorted.slice(-60);
    case '90d':
      return sorted.slice(-90);
    case 'weekly': {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return sorted.filter(r => new Date(r.dateString) >= weekAgo);
    }
    case 'monthly': {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return sorted.filter(r => new Date(r.dateString) >= monthAgo);
    }
    case 'yearly': {
      const yearAgo = new Date(now);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      return sorted.filter(r => new Date(r.dateString) >= yearAgo);
    }
    case 'custom':
      if (range.start && range.end) {
        const start = new Date(range.start);
        const end = new Date(range.end);
        end.setHours(23, 59, 59, 999);
        return sorted.filter(r => {
          const d = new Date(r.dateString);
          return d >= start && d <= end;
        });
      }
      return sorted;
    default:
      return sorted;
  }
}

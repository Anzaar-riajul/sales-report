import { format, parseISO } from 'date-fns';

export function formatBDT(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return 'BDT 0';
  const num = Math.round(amount);
  const str = num.toString();
  const last3 = str.slice(-3);
  const rest = str.slice(0, -3);
  if (rest.length === 0) return `BDT ${last3}`;

  const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  return `BDT ${formatted}`;
}

export function formatBDTShort(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return 'BDT 0';
  if (amount >= 10000000) return `BDT ${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `BDT ${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `BDT ${(amount / 1000).toFixed(1)}K`;
  return `BDT ${amount}`;
}

export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return num.toLocaleString('en-BD');
}

export function formatDate(dateString) {
  if (!dateString) return '';
  try {
    return format(parseISO(dateString), 'MMM dd, yyyy');
  } catch {
    return dateString;
  }
}

export function formatDateShort(dateString) {
  if (!dateString) return '';
  try {
    return format(parseISO(dateString), 'MMM dd');
  } catch {
    return dateString;
  }
}

export function formatPercent(value) {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  return `${Math.round(value)}%`;
}

export function getAdvanceRateColor(rate) {
  if (rate >= 30) return 'text-accent-teal';
  if (rate >= 15) return 'text-yellow-400';
  return 'text-accent-rose';
}

export function getChangeColor(change) {
  if (change > 0) return 'text-accent-teal';
  if (change < 0) return 'text-accent-rose';
  return 'text-text-muted';
}

export function getChangeIcon(change) {
  if (change > 0) return '↑';
  if (change < 0) return '↓';
  return '→';
}

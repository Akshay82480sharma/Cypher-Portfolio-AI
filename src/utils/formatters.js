/**
 * Format number as Indian currency (₹)
 * e.g., 123456789 → ₹12,34,56,789
 */
export function formatCurrency(amount, decimals = 2) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  
  const formatted = abs.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  return `${isNegative ? '-' : ''}₹${formatted}`;
}

/**
 * Format as compact Indian notation (L, Cr)
 * e.g., 12345678 → ₹1.23 Cr
 */
export function formatCompactCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const sign = isNegative ? '-' : '';
  
  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  }
  if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(2)} K`;
  }
  return `${sign}₹${abs.toFixed(2)}`;
}

/**
 * Format percentage
 */
export function formatPercent(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers
 */
export function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format date
 */
export function formatDate(date, format = 'short') {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const options = {
    short: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    time: { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' },
    relative: null,
  };
  
  if (format === 'relative') {
    return getRelativeTime(d);
  }
  
  return d.toLocaleDateString('en-IN', options[format] || options.short);
}

/**
 * Relative time (e.g., "2 hours ago")
 */
function getRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date, 'short');
}

/**
 * Get color class based on value (gain/loss)
 */
export function getChangeColor(value) {
  if (value > 0) return 'text-gain';
  if (value < 0) return 'text-loss';
  return 'text-muted';
}

/**
 * Generate a random ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Calculate CAGR (Compound Annual Growth Rate)
 */
export function calculateCAGR(beginValue, endValue, years) {
  if (beginValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / beginValue, 1 / years) - 1) * 100;
}

/**
 * Calculate absolute P&L
 */
export function calculatePnL(currentPrice, avgPrice, quantity) {
  return (currentPrice - avgPrice) * quantity;
}

/**
 * Calculate P&L percentage
 */
export function calculatePnLPercent(currentPrice, avgPrice) {
  if (avgPrice === 0) return 0;
  return ((currentPrice - avgPrice) / avgPrice) * 100;
}

/**
 * Calculate total portfolio value
 */
export function calculatePortfolioValue(holdings) {
  return holdings.reduce((total, h) => total + (h.currentPrice * h.quantity), 0);
}

/**
 * Calculate total invested amount
 */
export function calculateTotalInvested(holdings) {
  return holdings.reduce((total, h) => total + (h.avgPrice * h.quantity), 0);
}

/**
 * Calculate allocation percentages
 */
export function calculateAllocations(holdings) {
  const totalValue = calculatePortfolioValue(holdings);
  if (totalValue === 0) return [];
  
  return holdings.map(h => ({
    ...h,
    allocation: ((h.currentPrice * h.quantity) / totalValue) * 100,
    currentValue: h.currentPrice * h.quantity,
  }));
}

/**
 * Calculate allocation by asset type
 */
export function calculateTypeAllocations(holdings) {
  const totalValue = calculatePortfolioValue(holdings);
  if (totalValue === 0) return {};
  
  const typeMap = {};
  holdings.forEach(h => {
    const type = h.type || 'stock';
    if (!typeMap[type]) {
      typeMap[type] = { value: 0, percentage: 0, count: 0 };
    }
    typeMap[type].value += h.currentPrice * h.quantity;
    typeMap[type].count += 1;
  });
  
  Object.keys(typeMap).forEach(type => {
    typeMap[type].percentage = (typeMap[type].value / totalValue) * 100;
  });
  
  return typeMap;
}

/**
 * Calculate sector allocations
 */
export function calculateSectorAllocations(holdings) {
  const totalValue = calculatePortfolioValue(holdings);
  if (totalValue === 0) return {};
  
  const sectorMap = {};
  holdings.forEach(h => {
    const sector = h.sector || 'Other';
    if (!sectorMap[sector]) {
      sectorMap[sector] = { value: 0, percentage: 0, count: 0 };
    }
    sectorMap[sector].value += h.currentPrice * h.quantity;
    sectorMap[sector].count += 1;
  });
  
  Object.keys(sectorMap).forEach(sector => {
    sectorMap[sector].percentage = (sectorMap[sector].value / totalValue) * 100;
  });
  
  return sectorMap;
}

/**
 * SIP Future Value Calculator
 * FV = P × [(1 + r)^n - 1] / r × (1 + r)
 */
export function calculateSIPFutureValue(monthlyAmount, annualRate, years) {
  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;
  if (monthlyRate === 0) return monthlyAmount * months;
  const fv = monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
  return fv;
}

/**
 * Required SIP to reach a goal
 */
export function calculateRequiredSIP(targetAmount, annualRate, years) {
  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;
  if (monthlyRate === 0) return targetAmount / months;
  const sip = targetAmount / (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
  return sip;
}

/**
 * Lumpsum Future Value
 */
export function calculateLumpsumFV(principal, annualRate, years) {
  return principal * Math.pow(1 + annualRate / 100, years);
}

/**
 * Calculate daily change from previous prices
 */
export function calculateDailyChange(holdings) {
  let totalCurrentValue = 0;
  let totalPreviousValue = 0;
  
  holdings.forEach(h => {
    totalCurrentValue += h.currentPrice * h.quantity;
    const prevPrice = h.previousClose || h.currentPrice;
    totalPreviousValue += prevPrice * h.quantity;
  });
  
  const change = totalCurrentValue - totalPreviousValue;
  const changePercent = totalPreviousValue > 0 
    ? ((totalCurrentValue - totalPreviousValue) / totalPreviousValue) * 100 
    : 0;
  
  return { change, changePercent, currentValue: totalCurrentValue, previousValue: totalPreviousValue };
}

/**
 * Generate portfolio history from holdings
 * (Simulates historical portfolio values for chart)
 */
export function generatePortfolioHistory(holdings, days = 30) {
  const history = [];
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    let portfolioValue = 0;
    let niftyValue = 22000 + (Math.random() - 0.45) * 300 * ((days - i) / days);
    
    holdings.forEach(h => {
      // Simulate historical price with random walk
      const randomFactor = 1 + (Math.random() - 0.48) * 0.03;
      const dayFactor = Math.pow(randomFactor, i);
      const historicalPrice = h.currentPrice / dayFactor;
      portfolioValue += historicalPrice * h.quantity;
    });
    
    history.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(portfolioValue),
      nifty: Math.round(niftyValue * 100) / 100,
    });
  }
  
  return history;
}

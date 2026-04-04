/**
 * Rebalancing Engine
 * Calculates drift from target and suggests trades
 */

import { calculatePortfolioValue, calculateTypeAllocations } from '../utils/calculations';

/**
 * Calculate rebalance suggestions
 */
export function calculateRebalance(holdings, targetAllocation = null) {
  if (!holdings || holdings.length === 0) return { trades: [], drift: 0 };
  
  const target = targetAllocation || {
    stock: 50,
    crypto: 15,
    mutualfund: 20,
    etf: 15,
  };
  
  const totalValue = calculatePortfolioValue(holdings);
  const currentAllocations = calculateTypeAllocations(holdings);
  
  const comparison = [];
  let totalDrift = 0;
  
  Object.entries(target).forEach(([type, targetPct]) => {
    const currentPct = currentAllocations[type]?.percentage || 0;
    const currentValue = currentAllocations[type]?.value || 0;
    const targetValue = (targetPct / 100) * totalValue;
    const drift = currentPct - targetPct;
    const valueDiff = currentValue - targetValue;
    
    totalDrift += Math.abs(drift);
    
    comparison.push({
      type,
      label: getTypeLabel(type),
      currentPct: Math.round(currentPct * 10) / 10,
      targetPct,
      drift: Math.round(drift * 10) / 10,
      currentValue,
      targetValue,
      valueDiff,
      action: drift > 2 ? 'SELL' : drift < -2 ? 'BUY' : 'HOLD',
    });
  });
  
  // Generate specific trade suggestions
  const trades = generateTrades(holdings, comparison, totalValue);
  
  return {
    comparison,
    trades,
    totalDrift: Math.round(totalDrift * 10) / 10,
    portfolioValue: totalValue,
    isRebalanceNeeded: totalDrift > 10,
  };
}

function generateTrades(holdings, comparison, totalValue) {
  const trades = [];
  
  comparison.forEach(comp => {
    if (comp.action === 'SELL' && comp.valueDiff > 0) {
      // Find holdings of this type to sell
      const typeHoldings = holdings.filter(h => h.type === comp.type);
      // Suggest selling from the largest position
      const sorted = typeHoldings.sort((a, b) => 
        (b.currentPrice * b.quantity) - (a.currentPrice * a.quantity)
      );
      
      if (sorted.length > 0) {
        const holding = sorted[0];
        const sellValue = Math.abs(comp.valueDiff);
        const sellQty = Math.ceil(sellValue / holding.currentPrice);
        
        trades.push({
          action: 'SELL',
          symbol: holding.symbol,
          name: holding.name,
          type: comp.type,
          quantity: Math.min(sellQty, holding.quantity),
          estimatedValue: sellValue,
          reason: `Reduce ${comp.label} allocation from ${comp.currentPct}% to ${comp.targetPct}%`,
        });
      }
    }
    
    if (comp.action === 'BUY' && comp.valueDiff < 0) {
      const buyValue = Math.abs(comp.valueDiff);
      trades.push({
        action: 'BUY',
        symbol: comp.type === 'mutualfund' ? 'Index MF' : comp.type === 'etf' ? 'NIFTY-ETF' : comp.type === 'crypto' ? 'BTC/ETH' : 'Diversified Stocks',
        name: `Add ${comp.label} exposure`,
        type: comp.type,
        quantity: null,
        estimatedValue: buyValue,
        reason: `Increase ${comp.label} allocation from ${comp.currentPct}% to ${comp.targetPct}%`,
      });
    }
  });
  
  return trades;
}

function getTypeLabel(type) {
  const labels = {
    stock: 'Stocks',
    crypto: 'Crypto',
    mutualfund: 'Mutual Funds',
    etf: 'ETFs',
    cash: 'Cash',
  };
  return labels[type] || type;
}

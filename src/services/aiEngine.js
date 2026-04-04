/**
 * AI Advisor Engine — Rule-based intelligence
 * Analyzes portfolio and generates actionable insights
 */

import { calculateTypeAllocations, calculateSectorAllocations, calculatePortfolioValue, calculatePnLPercent } from '../utils/calculations';

/**
 * Calculate Portfolio Health Score (0-10)
 */
export function calculateHealthScore(holdings) {
  if (!holdings || holdings.length === 0) return { score: 0, breakdown: {} };
  
  const diversificationScore = scoreDiversification(holdings);
  const riskScore = scoreRisk(holdings);
  const performanceScore = scorePerformance(holdings);
  const balanceScore = scoreBalance(holdings);
  
  const weightedScore = 
    diversificationScore * 0.30 +
    riskScore * 0.25 +
    performanceScore * 0.25 +
    balanceScore * 0.20;
  
  return {
    score: Math.round(weightedScore * 10) / 10,
    breakdown: {
      diversification: { score: diversificationScore, weight: 30, label: 'Diversification' },
      risk: { score: riskScore, weight: 25, label: 'Risk Management' },
      performance: { score: performanceScore, weight: 25, label: 'Performance' },
      balance: { score: balanceScore, weight: 20, label: 'Balance' },
    },
  };
}

function scoreDiversification(holdings) {
  let score = 10;
  const count = holdings.length;
  
  // Penalize too few holdings
  if (count < 3) score -= 4;
  else if (count < 5) score -= 2;
  else if (count < 7) score -= 1;
  
  // Check asset type diversity
  const types = new Set(holdings.map(h => h.type));
  if (types.size === 1) score -= 3;
  else if (types.size === 2) score -= 1;
  
  // Check sector diversity
  const sectors = new Set(holdings.map(h => h.sector));
  if (sectors.size < 3) score -= 2;
  
  return Math.max(0, Math.min(10, score));
}

function scoreRisk(holdings) {
  let score = 10;
  const totalValue = calculatePortfolioValue(holdings);
  
  // Check concentration risk
  holdings.forEach(h => {
    const allocation = (h.currentPrice * h.quantity) / totalValue * 100;
    if (allocation > 40) score -= 4;
    else if (allocation > 30) score -= 3;
    else if (allocation > 25) score -= 2;
  });
  
  // Check crypto exposure
  const typeAllocations = calculateTypeAllocations(holdings);
  const cryptoAlloc = typeAllocations.crypto?.percentage || 0;
  if (cryptoAlloc > 40) score -= 3;
  else if (cryptoAlloc > 25) score -= 2;
  else if (cryptoAlloc > 15) score -= 1;
  
  return Math.max(0, Math.min(10, score));
}

function scorePerformance(holdings) {
  let score = 5; // Start neutral
  
  let totalInvested = 0;
  let totalCurrentValue = 0;
  let gainers = 0;
  
  holdings.forEach(h => {
    const invested = h.avgPrice * h.quantity;
    const current = h.currentPrice * h.quantity;
    totalInvested += invested;
    totalCurrentValue += current;
    
    if (h.currentPrice > h.avgPrice) gainers++;
  });
  
  // Overall return
  const overallReturn = ((totalCurrentValue - totalInvested) / totalInvested) * 100;
  if (overallReturn > 20) score += 4;
  else if (overallReturn > 10) score += 3;
  else if (overallReturn > 5) score += 2;
  else if (overallReturn > 0) score += 1;
  else if (overallReturn < -10) score -= 3;
  else if (overallReturn < -5) score -= 2;
  else if (overallReturn < 0) score -= 1;
  
  // Hit rate
  const hitRate = gainers / holdings.length;
  if (hitRate > 0.7) score += 1;
  else if (hitRate < 0.3) score -= 1;
  
  return Math.max(0, Math.min(10, score));
}

function scoreBalance(holdings) {
  let score = 10;
  
  const sectorAllocations = calculateSectorAllocations(holdings);
  
  // Penalize sector imbalance
  Object.values(sectorAllocations).forEach(s => {
    if (s.percentage > 45) score -= 3;
    else if (s.percentage > 35) score -= 2;
    else if (s.percentage > 30) score -= 1;
  });
  
  // Check type balance
  const typeAllocations = calculateTypeAllocations(holdings);
  const types = Object.keys(typeAllocations);
  if (types.length === 1) score -= 2;
  
  return Math.max(0, Math.min(10, score));
}

/**
 * Detect portfolio risks
 */
export function detectRisks(holdings) {
  const risks = [];
  const totalValue = calculatePortfolioValue(holdings);
  const typeAllocations = calculateTypeAllocations(holdings);
  const sectorAllocations = calculateSectorAllocations(holdings);
  
  // Concentration risk
  holdings.forEach(h => {
    const allocation = (h.currentPrice * h.quantity) / totalValue * 100;
    if (allocation > 25) {
      risks.push({
        id: `conc-${h.id}`,
        severity: allocation > 35 ? 'critical' : 'warning',
        type: 'concentration',
        title: `${h.name} is ${allocation.toFixed(1)}% of portfolio`,
        description: `Single stock exposure above 25% increases risk significantly. Consider trimming position.`,
        holding: h.symbol,
        metric: allocation,
      });
    }
  });
  
  // Sector imbalance
  Object.entries(sectorAllocations).forEach(([sector, data]) => {
    if (data.percentage > 35) {
      risks.push({
        id: `sector-${sector}`,
        severity: data.percentage > 45 ? 'critical' : 'warning',
        type: 'sector_imbalance',
        title: `${sector} sector overweight at ${data.percentage.toFixed(1)}%`,
        description: `Reduce ${sector} exposure to below 30% for better diversification.`,
        metric: data.percentage,
      });
    }
  });
  
  // High crypto allocation
  if (typeAllocations.crypto?.percentage > 20) {
    risks.push({
      id: 'crypto-high',
      severity: typeAllocations.crypto.percentage > 35 ? 'critical' : 'warning',
      type: 'volatility',
      title: `High crypto exposure: ${typeAllocations.crypto.percentage.toFixed(1)}%`,
      description: 'Crypto assets are highly volatile. Consider keeping crypto below 15-20% of total portfolio.',
      metric: typeAllocations.crypto.percentage,
    });
  }
  
  // Under-diversification
  if (holdings.length < 5) {
    risks.push({
      id: 'under-diversified',
      severity: holdings.length < 3 ? 'critical' : 'warning',
      type: 'diversification',
      title: `Only ${holdings.length} holdings — under-diversified`,
      description: 'A well-diversified portfolio typically has 8-15 holdings across multiple sectors and asset classes.',
      metric: holdings.length,
    });
  }
  
  // No mutual funds or ETFs (no passive exposure)
  if (!typeAllocations.mutualfund && !typeAllocations.etf) {
    risks.push({
      id: 'no-passive',
      severity: 'info',
      type: 'allocation',
      title: 'No passive investment exposure',
      description: 'Consider adding index funds or ETFs for stable, low-cost market exposure.',
      metric: 0,
    });
  }
  
  return risks.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

/**
 * Generate AI recommendations
 */
export function generateRecommendations(holdings) {
  const recommendations = [];
  const totalValue = calculatePortfolioValue(holdings);
  const typeAllocations = calculateTypeAllocations(holdings);
  const sectorAllocations = calculateSectorAllocations(holdings);
  
  // Per-holding recommendations
  holdings.forEach(h => {
    const pnlPercent = calculatePnLPercent(h.currentPrice, h.avgPrice);
    const allocation = (h.currentPrice * h.quantity) / totalValue * 100;
    
    // Big winners — consider booking profits
    if (pnlPercent > 50 && allocation > 15) {
      recommendations.push({
        id: `sell-${h.id}`,
        action: 'SELL',
        symbol: h.symbol,
        name: h.name,
        reason: `Up ${pnlPercent.toFixed(1)}% with ${allocation.toFixed(1)}% allocation. Consider booking partial profits.`,
        priority: 'medium',
        impact: 'Reduce concentration risk and lock in gains',
      });
    }
    
    // Near 52-week high
    if (h.week52High && h.currentPrice > h.week52High * 0.95) {
      recommendations.push({
        id: `near-high-${h.id}`,
        action: 'HOLD',
        symbol: h.symbol,
        name: h.name,
        reason: `Near 52-week high (₹${h.week52High.toLocaleString('en-IN')}). Monitor closely for reversal signals.`,
        priority: 'low',
        impact: 'Watch for potential resistance',
      });
    }
    
    // Deep losses
    if (pnlPercent < -20) {
      recommendations.push({
        id: `review-${h.id}`,
        action: 'HOLD',
        symbol: h.symbol,
        name: h.name,
        reason: `Down ${Math.abs(pnlPercent).toFixed(1)}%. Review thesis — if fundamentals unchanged, consider averaging down.`,
        priority: 'high',
        impact: 'Potential tax-loss harvesting opportunity',
      });
    }
    
    // Small positions (< 3%)
    if (allocation < 3 && h.type === 'stock') {
      recommendations.push({
        id: `small-${h.id}`,
        action: 'BUY',
        symbol: h.symbol,
        name: h.name,
        reason: `Only ${allocation.toFixed(1)}% allocation. If you have conviction, increase to meaningful position (5-10%).`,
        priority: 'low',
        impact: 'Improve portfolio impact',
      });
    }
  });
  
  // Portfolio-level recommendations
  if (!typeAllocations.mutualfund && !typeAllocations.etf) {
    recommendations.push({
      id: 'add-index',
      action: 'BUY',
      symbol: 'NIFTY-ETF',
      name: 'Nifty 50 Index Fund/ETF',
      reason: 'Add passive exposure through index funds for stable long-term returns with lower expense ratios.',
      priority: 'medium',
      impact: 'Better diversification and lower risk',
    });
  }
  
  // Check if crypto is missing (suggest small allocation)
  if (!typeAllocations.crypto) {
    recommendations.push({
      id: 'add-crypto',
      action: 'BUY',
      symbol: 'BTC/ETH',
      name: 'Bitcoin / Ethereum',
      reason: 'Consider a small 5-10% allocation to crypto for portfolio diversification and growth potential.',
      priority: 'low',
      impact: 'Exposure to digital asset class',
    });
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Calculate target allocation suggestion
 */
export function suggestTargetAllocation(riskProfile = 'moderate') {
  const profiles = {
    conservative: { stock: 40, mutualfund: 30, etf: 20, crypto: 5, cash: 5 },
    moderate: { stock: 45, mutualfund: 25, etf: 15, crypto: 10, cash: 5 },
    aggressive: { stock: 50, mutualfund: 15, etf: 10, crypto: 20, cash: 5 },
  };
  
  return profiles[riskProfile] || profiles.moderate;
}

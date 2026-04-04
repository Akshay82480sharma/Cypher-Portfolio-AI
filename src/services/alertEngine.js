/**
 * Smart Alert Engine
 * Generates intelligent alerts based on portfolio state
 */

import { calculatePortfolioValue, calculateDailyChange, calculateTypeAllocations, calculateSectorAllocations } from '../utils/calculations';

/**
 * Run all alert checks and return triggered alerts
 */
export function runAlertChecks(holdings, goals = [], previousAlerts = []) {
  const alerts = [];
  
  alerts.push(...checkPortfolioDrops(holdings));
  alerts.push(...checkSectorOverweight(holdings));
  alerts.push(...checkGoalMilestones(goals));
  alerts.push(...checkRebalanceNeeded(holdings));
  alerts.push(...checkPriceTargets(holdings));
  
  // Deduplicate against existing alerts
  const existingIds = new Set(previousAlerts.map(a => a.id));
  return alerts.filter(a => !existingIds.has(a.id));
}

function checkPortfolioDrops(holdings) {
  const alerts = [];
  const { change, changePercent } = calculateDailyChange(holdings);
  
  if (changePercent < -5) {
    alerts.push({
      id: `drop-5-${new Date().toDateString()}`,
      type: 'critical',
      category: 'portfolio',
      title: `Portfolio crashed ${Math.abs(changePercent).toFixed(1)}% today ⚠️`,
      message: `Your portfolio lost ₹${Math.abs(change).toLocaleString('en-IN')} today. This is a significant drop — review your holdings.`,
      timestamp: new Date().toISOString(),
      read: false,
      actionable: true,
      action: 'View Portfolio',
    });
  } else if (changePercent < -3) {
    alerts.push({
      id: `drop-3-${new Date().toDateString()}`,
      type: 'warning',
      category: 'portfolio',
      title: `Portfolio dropped ${Math.abs(changePercent).toFixed(1)}% today`,
      message: `Your portfolio lost ₹${Math.abs(change).toLocaleString('en-IN')} today. Keep an eye on market conditions.`,
      timestamp: new Date().toISOString(),
      read: false,
      actionable: true,
      action: 'View Portfolio',
    });
  }
  
  return alerts;
}

function checkSectorOverweight(holdings) {
  const alerts = [];
  const sectorAllocations = calculateSectorAllocations(holdings);
  
  Object.entries(sectorAllocations).forEach(([sector, data]) => {
    if (data.percentage > 40) {
      alerts.push({
        id: `sector-ow-${sector}`,
        type: 'warning',
        category: 'allocation',
        title: `${sector} sector overweight detected`,
        message: `${sector} makes up ${data.percentage.toFixed(1)}% of your portfolio. Consider diversifying to reduce concentration risk.`,
        timestamp: new Date().toISOString(),
        read: false,
        actionable: true,
        action: 'View Rebalancing',
      });
    }
  });
  
  return alerts;
}

function checkGoalMilestones(goals) {
  const alerts = [];
  
  goals.forEach(goal => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    
    if (progress >= 75 && progress < 80) {
      alerts.push({
        id: `goal-75-${goal.id}`,
        type: 'info',
        category: 'goal',
        title: `${goal.name} is ${Math.round(progress)}% complete! 🎉`,
        message: `You're making great progress towards your ${goal.name} goal.`,
        timestamp: new Date().toISOString(),
        read: false,
        actionable: false,
      });
    }
    
    if (progress >= 50 && progress < 55) {
      alerts.push({
        id: `goal-50-${goal.id}`,
        type: 'info',
        category: 'goal',
        title: `${goal.name} reached halfway mark! 🎯`,
        message: `You've completed 50% of your ${goal.name} goal. Keep going!`,
        timestamp: new Date().toISOString(),
        read: false,
        actionable: false,
      });
    }
  });
  
  return alerts;
}

function checkRebalanceNeeded(holdings) {
  const alerts = [];
  const typeAllocations = calculateTypeAllocations(holdings);
  
  // Simple drift check
  const targetAllocations = { stock: 50, crypto: 15, mutualfund: 20, etf: 15 };
  let totalDrift = 0;
  
  Object.entries(targetAllocations).forEach(([type, target]) => {
    const actual = typeAllocations[type]?.percentage || 0;
    totalDrift += Math.abs(actual - target);
  });
  
  if (totalDrift > 20) {
    alerts.push({
      id: `rebalance-${new Date().toDateString()}`,
      type: 'warning',
      category: 'rebalance',
      title: 'Time to rebalance your portfolio',
      message: `Your portfolio has drifted ${totalDrift.toFixed(0)}% from target allocation. Consider rebalancing.`,
      timestamp: new Date().toISOString(),
      read: false,
      actionable: true,
      action: 'Rebalance Now',
    });
  }
  
  return alerts;
}

function checkPriceTargets(holdings) {
  const alerts = [];
  
  holdings.forEach(h => {
    // Near 52-week high
    if (h.week52High && h.currentPrice > h.week52High * 0.98) {
      alerts.push({
        id: `52wk-high-${h.id}`,
        type: 'info',
        category: 'insight',
        title: `${h.name} near 52-week high`,
        message: `${h.symbol} is at ₹${h.currentPrice.toLocaleString('en-IN')}, close to 52-week high of ₹${h.week52High.toLocaleString('en-IN')}.`,
        timestamp: new Date().toISOString(),
        read: false,
        actionable: false,
      });
    }
    
    // Near 52-week low
    if (h.week52Low && h.currentPrice < h.week52Low * 1.05) {
      alerts.push({
        id: `52wk-low-${h.id}`,
        type: 'warning',
        category: 'insight',
        title: `${h.name} near 52-week low`,
        message: `${h.symbol} is at ₹${h.currentPrice.toLocaleString('en-IN')}, near 52-week low of ₹${h.week52Low.toLocaleString('en-IN')}.`,
        timestamp: new Date().toISOString(),
        read: false,
        actionable: false,
      });
    }
  });
  
  return alerts;
}

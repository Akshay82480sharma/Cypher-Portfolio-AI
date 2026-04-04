/**
 * Goal Calculator Service
 */

import { calculateSIPFutureValue, calculateRequiredSIP, calculateLumpsumFV } from '../utils/calculations';

/**
 * Analyze a financial goal and return detailed projections
 */
export function analyzeGoal(goal) {
  const {
    targetAmount,
    currentAmount,
    monthlyContribution,
    targetDate,
    expectedReturn,
  } = goal;
  
  const now = new Date();
  const target = new Date(targetDate);
  const yearsRemaining = Math.max(0, (target - now) / (365.25 * 24 * 60 * 60 * 1000));
  const monthsRemaining = Math.round(yearsRemaining * 12);
  
  // Current progress
  const progress = (currentAmount / targetAmount) * 100;
  
  // Projected value with current SIP
  const sipFV = calculateSIPFutureValue(monthlyContribution, expectedReturn, yearsRemaining);
  const lumpsumFV = calculateLumpsumFV(currentAmount, expectedReturn, yearsRemaining);
  const projectedTotal = sipFV + lumpsumFV;
  
  // Required SIP to reach goal
  const remainingTarget = targetAmount - calculateLumpsumFV(currentAmount, expectedReturn, yearsRemaining);
  const requiredSIP = remainingTarget > 0 
    ? calculateRequiredSIP(remainingTarget, expectedReturn, yearsRemaining) 
    : 0;
  
  // Surplus or shortfall
  const surplus = projectedTotal - targetAmount;
  const isOnTrack = surplus >= 0;
  
  // Generate projection data for chart
  const projectionData = generateProjectionData(
    currentAmount, monthlyContribution, expectedReturn, yearsRemaining
  );
  
  return {
    progress: Math.min(progress, 100),
    yearsRemaining: Math.round(yearsRemaining * 10) / 10,
    monthsRemaining,
    projectedTotal,
    requiredSIP: Math.max(0, requiredSIP),
    currentSIP: monthlyContribution,
    surplus,
    isOnTrack,
    projectionData,
    totalInvested: currentAmount + (monthlyContribution * monthsRemaining),
    wealthGained: projectedTotal - currentAmount - (monthlyContribution * monthsRemaining),
  };
}

function generateProjectionData(currentAmount, monthlySIP, annualReturn, years) {
  const data = [];
  const monthlyRate = annualReturn / 100 / 12;
  const totalMonths = Math.round(years * 12);
  
  let balance = currentAmount;
  
  for (let month = 0; month <= totalMonths; month += Math.max(1, Math.floor(totalMonths / 24))) {
    const yearLabel = (month / 12).toFixed(1);
    data.push({
      month,
      year: parseFloat(yearLabel),
      value: Math.round(balance),
      invested: currentAmount + (monthlySIP * month),
    });
    
    // Advance by step months
    const step = Math.max(1, Math.floor(totalMonths / 24));
    for (let s = 0; s < step && (month + s) < totalMonths; s++) {
      balance = balance * (1 + monthlyRate) + monthlySIP;
    }
  }
  
  return data;
}

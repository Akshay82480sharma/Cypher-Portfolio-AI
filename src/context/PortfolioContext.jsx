import { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import { MOCK_HOLDINGS, MOCK_GOALS, MOCK_ALERTS } from '../services/mockData';
import { calculatePortfolioValue, calculateTotalInvested, calculateDailyChange, calculateTypeAllocations, calculateSectorAllocations } from '../utils/calculations';
import { generateId } from '../utils/formatters';

const PortfolioContext = createContext(null);

const STORAGE_KEY = 'nexus-ai-portfolio';

function loadFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.warn('Failed to load portfolio data:', e);
  }
  return null;
}

function saveToStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      holdings: state.holdings,
      goals: state.goals,
      alerts: state.alerts,
      settings: state.settings,
    }));
  } catch (e) {
    console.warn('Failed to save portfolio data:', e);
  }
}

const initialState = {
  holdings: MOCK_HOLDINGS,
  goals: MOCK_GOALS,
  alerts: MOCK_ALERTS,
  settings: {
    riskProfile: 'moderate',
    currency: 'INR',
    theme: 'dark',
  },
  activePage: 'dashboard',
  modals: {
    addHolding: false,
    addGoal: false,
    holdingDetail: null,
  },
};

function portfolioReducer(state, action) {
  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, activePage: action.payload };
      
    case 'ADD_HOLDING': {
      const newHolding = {
        ...action.payload,
        id: generateId(),
        addedDate: new Date().toISOString().split('T')[0],
        previousClose: action.payload.currentPrice,
        dayHigh: action.payload.currentPrice,
        dayLow: action.payload.currentPrice,
      };
      return { ...state, holdings: [...state.holdings, newHolding] };
    }
    
    case 'UPDATE_HOLDING':
      return {
        ...state,
        holdings: state.holdings.map(h =>
          h.id === action.payload.id ? { ...h, ...action.payload } : h
        ),
      };
    
    case 'REMOVE_HOLDING':
      return {
        ...state,
        holdings: state.holdings.filter(h => h.id !== action.payload),
      };
    
    case 'ADD_GOAL': {
      const newGoal = {
        ...action.payload,
        id: generateId(),
        createdDate: new Date().toISOString().split('T')[0],
      };
      return { ...state, goals: [...state.goals, newGoal] };
    }
    
    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map(g =>
          g.id === action.payload.id ? { ...g, ...action.payload } : g
        ),
      };
    
    case 'REMOVE_GOAL':
      return {
        ...state,
        goals: state.goals.filter(g => g.id !== action.payload),
      };
    
    case 'ADD_ALERT':
      return { ...state, alerts: [action.payload, ...state.alerts] };
    
    case 'MARK_ALERT_READ':
      return {
        ...state,
        alerts: state.alerts.map(a =>
          a.id === action.payload ? { ...a, read: true } : a
        ),
      };
    
    case 'DISMISS_ALERT':
      return {
        ...state,
        alerts: state.alerts.filter(a => a.id !== action.payload),
      };
    
    case 'OPEN_MODAL':
      return { ...state, modals: { ...state.modals, [action.payload.modal]: action.payload.data ?? true } };
    
    case 'CLOSE_MODAL':
      return { ...state, modals: { ...state.modals, [action.payload]: false } };
    
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    
    case 'LOAD_DATA':
      return { ...state, ...action.payload };
    
    default:
      return state;
  }
}

export function PortfolioProvider({ children }) {
  const saved = loadFromStorage();
  const [state, dispatch] = useReducer(portfolioReducer, saved ? { ...initialState, ...saved } : initialState);
  
  // Auto-save to localStorage
  useEffect(() => {
    saveToStorage(state);
  }, [state.holdings, state.goals, state.alerts, state.settings]);
  
  // Computed values
  const computed = useMemo(() => {
    const totalValue = calculatePortfolioValue(state.holdings);
    const totalInvested = calculateTotalInvested(state.holdings);
    const totalPnL = totalValue - totalInvested;
    const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    const dailyChange = calculateDailyChange(state.holdings);
    const typeAllocations = calculateTypeAllocations(state.holdings);
    const sectorAllocations = calculateSectorAllocations(state.holdings);
    const unreadAlerts = state.alerts.filter(a => !a.read).length;
    
    return {
      totalValue,
      totalInvested,
      totalPnL,
      totalPnLPercent,
      dailyChange,
      typeAllocations,
      sectorAllocations,
      unreadAlerts,
    };
  }, [state.holdings, state.alerts]);
  
  return (
    <PortfolioContext.Provider value={{ state, dispatch, computed }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) throw new Error('usePortfolio must be used within PortfolioProvider');
  return context;
}

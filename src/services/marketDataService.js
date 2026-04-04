/**
 * Market Data Service — Real-Time Prices
 * 
 * Data Sources:
 *   🪙 Crypto    → CoinGecko API (free, no key, CORS-friendly)
 *   💱 Forex     → Frankfurter API (free, no key, CORS-friendly)
 *   📈 Stocks    → Yahoo Finance (via Vite proxy) + Alpha Vantage (fallback)
 *   📊 MF/ETF    → Smart simulation
 */

const REFRESH_INTERVAL = 30000; // 30 seconds
const ALPHA_VANTAGE_KEY = '3HI7XM2KNXGXET6G';

// ── Symbol Mappings ──

// CoinGecko IDs for crypto (free, no key needed!)
const COINGECKO_MAP = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'DOGE': 'dogecoin',
  'XRP': 'ripple',
};

// Frankfurter forex pairs (base → target)
const FOREX_MAP = {
  'USD/INR': { from: 'USD', to: 'INR' },
  'EUR/INR': { from: 'EUR', to: 'INR' },
  'GBP/INR': { from: 'GBP', to: 'INR' },
  'JPY/INR': { from: 'JPY', to: 'INR' },
  'EUR/USD': { from: 'EUR', to: 'USD' },
  'GBP/USD': { from: 'GBP', to: 'USD' },
};

// Yahoo Finance symbols for Indian stocks
const YAHOO_SYMBOL_MAP = {
  'RELIANCE.NS': 'RELIANCE.NS',
  'TCS.NS': 'TCS.NS',
  'HDFCBANK.NS': 'HDFCBANK.NS',
  'INFY.NS': 'INFY.NS',
  'ICICIBANK.NS': 'ICICIBANK.NS',
  'AXISBANK.NS': 'AXISBANK.NS',
  // ETFs also trade on NSE
  'NIFTY-ETF': 'NIFTYBEES.NS',
  'GOLDBEES': 'GOLDBEES.NS',
};

// Alpha Vantage BSE symbols (fallback for stocks)
const ALPHA_SYMBOL_MAP = {
  'RELIANCE.NS': 'RELIANCE.BSE',
  'TCS.NS': 'TCS.BSE',
  'HDFCBANK.NS': 'HDFCBANK.BSE',
  'INFY.NS': 'INFY.BSE',
  'ICICIBANK.NS': 'ICICIBANK.BSE',
  'AXISBANK.NS': 'AXISBANK.BSE',
};

// MFAPI scheme codes for Indian mutual funds (free, CORS-friendly)
const MFAPI_MAP = {
  'PPFAS-MF': 122639,    // Parag Parikh Flexi Cap Fund
  'AXIS-MF': 120503,     // Axis Bluechip Fund
  'MIRAE-MF': 118834,    // Mirae Asset Large Cap Fund
};

// ── State ──
const momentum = {};
let cryptoCache = { data: null, time: 0 };
let forexCache = { data: null, time: 0 };
let stockCache = { data: null, time: 0 };
let mfCache = { data: null, time: 0 };
let alphaVantageUsedToday = 0;
const CACHE_TTL = 20000; // 20 seconds

// ── Market Hours ──
function isMarketOpen() {
  const now = new Date();
  const istOffset = 5.5 * 60;
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const istMinutes = utcMinutes + istOffset;
  const day = now.getUTCDay();
  const istDay = istMinutes >= 1440 ? (day + 1) % 7 : day;
  const adjustedMinutes = istMinutes % 1440;
  return istDay >= 1 && istDay <= 5 && adjustedMinutes >= 555 && adjustedMinutes <= 930;
}

// ═══════════════════════════════════════
// CRYPTO — CoinGecko (free, no API key)
// ═══════════════════════════════════════
async function fetchCryptoPrices(holdings) {
  const cryptoHoldings = holdings.filter(h => h.type === 'crypto' && COINGECKO_MAP[h.symbol]);
  if (cryptoHoldings.length === 0) return {};

  // Check cache
  if (cryptoCache.data && (Date.now() - cryptoCache.time) < CACHE_TTL) {
    return cryptoCache.data;
  }

  try {
    const ids = cryptoHoldings.map(h => COINGECKO_MAP[h.symbol]).join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=inr&include_24hr_change=true`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data = await res.json();

    const results = {};
    cryptoHoldings.forEach(h => {
      const geckoId = COINGECKO_MAP[h.symbol];
      const coinData = data[geckoId];
      if (coinData?.inr) {
        results[h.id] = {
          currentPrice: Math.round(coinData.inr * 100) / 100,
          previousClose: h.previousClose, // Keep existing
          dayHigh: Math.max(h.dayHigh || 0, coinData.inr),
          dayLow: Math.min(h.dayLow || Infinity, coinData.inr),
        };
      }
    });

    cryptoCache = { data: results, time: Date.now() };
    console.log(`[MarketData] 🪙 Crypto: CoinGecko ✅ (${Object.keys(results).length} coins)`);
    return results;
  } catch (err) {
    console.warn('[MarketData] CoinGecko failed:', err.message);
    return cryptoCache.data || {};
  }
}

// ═══════════════════════════════════════
// FOREX — Frankfurter API (free, no key)
// ═══════════════════════════════════════
async function fetchForexRates(holdings) {
  const forexHoldings = holdings.filter(h => h.type === 'forex' && FOREX_MAP[h.symbol]);
  if (forexHoldings.length === 0) return {};

  // Check cache
  if (forexCache.data && (Date.now() - forexCache.time) < CACHE_TTL) {
    return forexCache.data;
  }

  try {
    // Fetch all needed currency pairs
    const uniqueBases = [...new Set(forexHoldings.map(h => FOREX_MAP[h.symbol].from))];
    const allTargets = [...new Set(forexHoldings.map(h => FOREX_MAP[h.symbol].to))];
    
    const rateMap = {};
    for (const base of uniqueBases) {
      const url = `https://api.frankfurter.app/latest?from=${base}&to=${allTargets.join(',')}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      rateMap[base] = data.rates;
    }

    const results = {};
    forexHoldings.forEach(h => {
      const pair = FOREX_MAP[h.symbol];
      const rate = rateMap[pair.from]?.[pair.to];
      if (rate) {
        results[h.id] = {
          currentPrice: Math.round(rate * 10000) / 10000,
          previousClose: h.previousClose,
          dayHigh: Math.max(h.dayHigh || 0, rate),
          dayLow: Math.min(h.dayLow || Infinity, rate),
        };
      }
    });

    forexCache = { data: results, time: Date.now() };
    console.log(`[MarketData] 💱 Forex: Frankfurter ✅ (${Object.keys(results).length} pairs)`);
    return results;
  } catch (err) {
    console.warn('[MarketData] Frankfurter failed:', err.message);
    return forexCache.data || {};
  }
}

// ═══════════════════════════════════════
// STOCKS — Yahoo Finance (via Vite proxy)
// ═══════════════════════════════════════
async function fetchYahooQuote(yahooSymbol) {
  try {
    const url = `/api/yahoo/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=1d&interval=1d`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;
    return {
      currentPrice: Math.round(meta.regularMarketPrice * 100) / 100,
      previousClose: Math.round((meta.chartPreviousClose || meta.regularMarketPrice) * 100) / 100,
      dayHigh: Math.round((meta.regularMarketDayHigh || meta.regularMarketPrice) * 100) / 100,
      dayLow: Math.round((meta.regularMarketDayLow || meta.regularMarketPrice) * 100) / 100,
    };
  } catch {
    return null;
  }
}

async function fetchStockPrices(holdings) {
  // Include stocks AND ETFs — both use Yahoo/AlphaVantage 
  const stockHoldings = holdings.filter(h => 
    (h.type === 'stock' || h.type === 'etf') && YAHOO_SYMBOL_MAP[h.symbol]
  );
  if (stockHoldings.length === 0) return {};

  if (stockCache.data && (Date.now() - stockCache.time) < CACHE_TTL) {
    return stockCache.data;
  }

  const results = {};
  const promises = stockHoldings.map(async (h) => {
    const quote = await fetchYahooQuote(YAHOO_SYMBOL_MAP[h.symbol]);
    if (quote) results[h.id] = quote;
  });
  await Promise.allSettled(promises);

  // Alpha Vantage fallback for missing stocks (not ETFs — Alpha Vantage doesn't have ETF data)
  if (ALPHA_VANTAGE_KEY && alphaVantageUsedToday < 20) {
    const missing = stockHoldings.filter(h => !results[h.id] && ALPHA_SYMBOL_MAP[h.symbol]);
    for (const h of missing.slice(0, 3)) {
      try {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ALPHA_SYMBOL_MAP[h.symbol]}&apikey=${ALPHA_VANTAGE_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        alphaVantageUsedToday++;
        if (data['Note'] || data['Information']) break;
        const q = data['Global Quote'];
        if (q?.['05. price']) {
          results[h.id] = {
            currentPrice: parseFloat(q['05. price']),
            previousClose: parseFloat(q['08. previous close']),
            dayHigh: parseFloat(q['03. high']),
            dayLow: parseFloat(q['04. low']),
          };
        }
        await new Promise(r => setTimeout(r, 300));
      } catch { break; }
    }
  }

  if (Object.keys(results).length > 0) {
    stockCache = { data: results, time: Date.now() };
    console.log(`[MarketData] 📈 Stocks/ETFs: ${Object.keys(results).length} live`);
  }
  return results;
}

// ═══════════════════════════════════════
// MUTUAL FUNDS — MFAPI (free, no key)
// ═══════════════════════════════════════
async function fetchMutualFundNAVs(holdings) {
  const mfHoldings = holdings.filter(h => h.type === 'mutualfund' && MFAPI_MAP[h.symbol]);
  if (mfHoldings.length === 0) return {};

  if (mfCache.data && (Date.now() - mfCache.time) < CACHE_TTL) {
    return mfCache.data;
  }

  try {
    const results = {};
    const promises = mfHoldings.map(async (h) => {
      const schemeCode = MFAPI_MAP[h.symbol];
      const url = `https://api.mfapi.in/mf/${schemeCode}/latest`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const latestNav = data?.data?.[0]?.nav;
      const prevNav = data?.data?.[1]?.nav;
      if (latestNav) {
        const nav = parseFloat(latestNav);
        const prev = prevNav ? parseFloat(prevNav) : nav;
        results[h.id] = {
          currentPrice: Math.round(nav * 100) / 100,
          previousClose: Math.round(prev * 100) / 100,
          dayHigh: Math.round(Math.max(nav, prev) * 100) / 100,
          dayLow: Math.round(Math.min(nav, prev) * 100) / 100,
        };
      }
    });
    await Promise.allSettled(promises);

    if (Object.keys(results).length > 0) {
      mfCache = { data: results, time: Date.now() };
      console.log(`[MarketData] 📊 Mutual Funds: MFAPI ✅ (${Object.keys(results).length} schemes)`);
    }
    return results;
  } catch (err) {
    console.warn('[MarketData] MFAPI failed:', err.message);
    return mfCache.data || {};
  }
}

// ═══════════════════════════════════════
// SIMULATION — Smart fallback
// ═══════════════════════════════════════
function simulatePrice(holding) {
  const { symbol, currentPrice, dayHigh, dayLow, type } = holding;
  if (!momentum[symbol]) momentum[symbol] = (Math.random() - 0.5) * 0.002;

  const vol = { crypto: 0.004, stock: 0.0015, mutualfund: 0.0005, etf: 0.001, forex: 0.0008 }[type] || 0.001;
  const mkt = (type === 'stock' && !isMarketOpen()) ? 0.1 : 1.0;

  const noise = (Math.random() - 0.5) * 2 * vol;
  momentum[symbol] = momentum[symbol] * 0.7 + noise * 0.3;
  let change = momentum[symbol] * mkt;

  const center = (dayHigh + dayLow) / 2;
  change -= ((currentPrice - center) / center) * 0.001;

  let newPrice = currentPrice * (1 + change);
  const ext = (dayHigh - dayLow) * 0.15;

  if (newPrice > dayHigh + ext) { newPrice = dayHigh + ext - Math.random() * ext * 0.5; momentum[symbol] *= -0.5; }
  if (newPrice < dayLow - ext) { newPrice = dayLow - ext + Math.random() * ext * 0.5; momentum[symbol] *= -0.5; }

  return {
    currentPrice: Math.round(newPrice * 100) / 100,
    dayHigh: Math.round(Math.max(dayHigh, newPrice) * 100) / 100,
    dayLow: Math.round(Math.min(dayLow, newPrice) * 100) / 100,
  };
}

// ═══════════════════════════════════════
// MAIN — Orchestrate all data sources
// ═══════════════════════════════════════
export async function getUpdatedPrices(holdings) {
  // Fetch from all sources in parallel
  const [cryptoQuotes, forexQuotes, stockQuotes, mfQuotes] = await Promise.all([
    fetchCryptoPrices(holdings).catch(() => ({})),
    fetchForexRates(holdings).catch(() => ({})),
    fetchStockPrices(holdings).catch(() => ({})),
    fetchMutualFundNAVs(holdings).catch(() => ({})),
  ]);

  // Merge all live data
  const liveQuotes = { ...cryptoQuotes, ...forexQuotes, ...stockQuotes, ...mfQuotes };

  // Build final: live where available, simulate the rest
  const updates = {};
  const liveSymbols = [];
  const simSymbols = [];

  holdings.forEach(h => {
    if (liveQuotes[h.id]) {
      updates[h.id] = liveQuotes[h.id];
      liveSymbols.push(h.symbol);
    } else {
      updates[h.id] = simulatePrice(h);
      simSymbols.push(h.symbol);
    }
  });

  const liveCount = liveSymbols.length;
  if (liveCount > 0 || simSymbols.length > 0) {
    console.log(`[MarketData] ✅ Live(${liveCount}): ${liveSymbols.join(', ') || 'none'} | 🔄 Sim(${simSymbols.length}): ${simSymbols.join(', ') || 'none'}`);
  }

  return {
    updates,
    dataSource: liveCount > 0 ? (liveCount === holdings.length ? 'live' : 'partial') : 'simulated',
    liveCount,
    totalCount: holdings.length,
    timestamp: Date.now(),
  };
}

// ═══════════════════════════════════════
// AUTO-REFRESH
// ═══════════════════════════════════════
export function startPriceUpdates(holdingsGetter, onUpdate, interval = REFRESH_INTERVAL) {
  let isRunning = true;
  const tick = async () => {
    if (!isRunning) return;
    try {
      const h = typeof holdingsGetter === 'function' ? holdingsGetter() : holdingsGetter;
      const result = await getUpdatedPrices(h);
      if (isRunning) onUpdate(result);
    } catch (err) {
      console.warn('[MarketData] Update failed:', err.message);
    }
  };
  const t1 = setTimeout(tick, 1500);
  const t2 = setInterval(tick, interval);
  return () => { isRunning = false; clearTimeout(t1); clearInterval(t2); };
}

export function getServiceInfo() {
  return { refreshInterval: REFRESH_INTERVAL, isMarketOpen: isMarketOpen() };
}

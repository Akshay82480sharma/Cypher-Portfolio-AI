/**
 * Market Data Service
 * Provides real-time price updates via smart simulation + optional Finnhub API
 * 
 * Simulation creates realistic price movements:
 * - Prices drift within dayHigh/dayLow range
 * - Momentum-based random walk (not just noise)
 * - Crypto has higher volatility than stocks
 * - Market hours awareness for Indian stocks
 */

const FINNHUB_API_KEY = null; // Set your key: 'your_api_key_here'
const REFRESH_INTERVAL = 30000; // 30 seconds
const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'SOL', 'DOGE', 'XRP'];

// Track momentum per symbol for realistic price movement
const momentum = {};

/**
 * Determine if Indian market is currently open
 * NSE: Mon-Fri, 9:15 AM - 3:30 PM IST
 */
function isMarketOpen() {
  const now = new Date();
  const istOffset = 5.5 * 60; // IST is UTC+5:30
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const istMinutes = utcMinutes + istOffset;

  const day = now.getUTCDay();
  // Adjust day for IST
  const istDay = istMinutes >= 1440 ? (day + 1) % 7 : day;
  const adjustedMinutes = istMinutes % 1440;

  const marketOpen = 9 * 60 + 15;  // 9:15 AM
  const marketClose = 15 * 60 + 30; // 3:30 PM

  return istDay >= 1 && istDay <= 5 && adjustedMinutes >= marketOpen && adjustedMinutes <= marketClose;
}

/**
 * Generate realistic price movement for a single holding
 */
function simulatePrice(holding) {
  const { symbol, currentPrice, dayHigh, dayLow, type } = holding;

  // Initialize momentum if not set
  if (!momentum[symbol]) {
    momentum[symbol] = (Math.random() - 0.5) * 0.002;
  }

  // Volatility based on asset type
  const volatilityMap = {
    crypto: 0.004,      // ±0.4% per tick
    stock: 0.0015,      // ±0.15% per tick
    mutualfund: 0.0005,  // ±0.05% per tick
    etf: 0.001,          // ±0.1% per tick
  };

  const volatility = volatilityMap[type] || 0.001;

  // For stocks, reduce movement outside market hours
  const marketMultiplier = (type === 'stock' && !isMarketOpen()) ? 0.1 : 1.0;

  // Random walk with momentum
  const noise = (Math.random() - 0.5) * 2 * volatility;
  momentum[symbol] = momentum[symbol] * 0.7 + noise * 0.3; // Smooth momentum

  let change = momentum[symbol] * marketMultiplier;

  // Mean-revert if price drifts too far from center of day range
  const dayCenter = (dayHigh + dayLow) / 2;
  const distFromCenter = (currentPrice - dayCenter) / dayCenter;
  change -= distFromCenter * 0.001; // Gentle pull toward center

  // Calculate new price
  let newPrice = currentPrice * (1 + change);

  // Soft-clamp within a slightly extended day range (allow minor breaches)
  const rangeExtension = (dayHigh - dayLow) * 0.15;
  const softMin = dayLow - rangeExtension;
  const softMax = dayHigh + rangeExtension;

  if (newPrice > softMax) {
    newPrice = softMax - Math.random() * rangeExtension * 0.5;
    momentum[symbol] *= -0.5; // Reverse momentum
  } else if (newPrice < softMin) {
    newPrice = softMin + Math.random() * rangeExtension * 0.5;
    momentum[symbol] *= -0.5;
  }

  // Update day high/low if breached
  const newDayHigh = Math.max(dayHigh, newPrice);
  const newDayLow = Math.min(dayLow, newPrice);

  return {
    currentPrice: Math.round(newPrice * 100) / 100,
    dayHigh: Math.round(newDayHigh * 100) / 100,
    dayLow: Math.round(newDayLow * 100) / 100,
  };
}

/**
 * Fetch live crypto prices from Finnhub (if API key is configured)
 */
async function fetchFinnhubCrypto(symbols) {
  if (!FINNHUB_API_KEY) return null;

  const results = {};
  const cryptoMappings = {
    'BTC': 'BINANCE:BTCUSDT',
    'ETH': 'BINANCE:ETHUSDT',
    'SOL': 'BINANCE:SOLUSDT',
    'DOGE': 'BINANCE:DOGEUSDT',
    'XRP': 'BINANCE:XRPUSDT',
  };

  // Approximate USD to INR rate
  const usdToInr = 83.5;

  try {
    const promises = symbols
      .filter(s => cryptoMappings[s])
      .map(async (symbol) => {
        const endpoint = cryptoMappings[symbol];
        const res = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${endpoint}&token=${FINNHUB_API_KEY}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.c) {
          results[symbol] = {
            currentPrice: Math.round(data.c * usdToInr * 100) / 100,
            dayHigh: Math.round(data.h * usdToInr * 100) / 100,
            dayLow: Math.round(data.l * usdToInr * 100) / 100,
            previousClose: Math.round(data.pc * usdToInr * 100) / 100,
          };
        }
      });

    await Promise.all(promises);
    return Object.keys(results).length > 0 ? results : null;
  } catch (err) {
    console.warn('[MarketData] Finnhub fetch failed:', err.message);
    return null;
  }
}

/**
 * Get updated prices for all holdings
 * Uses Finnhub for crypto (if key configured), simulation for everything else
 */
export async function getUpdatedPrices(holdings) {
  // Try fetching live crypto data
  const cryptoSymbols = holdings
    .filter(h => h.type === 'crypto')
    .map(h => h.symbol);

  const liveCrypto = await fetchFinnhubCrypto(cryptoSymbols);

  // Generate updates for each holding
  const updates = {};
  let hasLiveData = false;

  holdings.forEach(holding => {
    // Use live data for crypto if available
    if (liveCrypto && liveCrypto[holding.symbol]) {
      updates[holding.id] = liveCrypto[holding.symbol];
      hasLiveData = true;
    } else {
      // Use simulation
      updates[holding.id] = simulatePrice(holding);
    }
  });

  return {
    updates,
    dataSource: hasLiveData ? 'live' : 'simulated',
    timestamp: Date.now(),
  };
}

/**
 * Start auto-refresh price updates
 * holdingsGetter: function that returns the current holdings array
 * Returns a cleanup function to stop the interval
 */
export function startPriceUpdates(holdingsGetter, onUpdate, interval = REFRESH_INTERVAL) {
  let isRunning = true;

  const tick = async () => {
    if (!isRunning) return;
    try {
      const currentHoldings = typeof holdingsGetter === 'function' ? holdingsGetter() : holdingsGetter;
      const result = await getUpdatedPrices(currentHoldings);
      if (isRunning) {
        onUpdate(result);
      }
    } catch (err) {
      console.warn('[MarketData] Update failed:', err.message);
    }
  };

  // First update after a short delay (let UI render first)
  const initialTimeout = setTimeout(tick, 1500);

  // Subsequent updates at interval
  const intervalId = setInterval(tick, interval);

  // Return cleanup function
  return () => {
    isRunning = false;
    clearTimeout(initialTimeout);
    clearInterval(intervalId);
  };
}

/**
 * Get service configuration info
 */
export function getServiceInfo() {
  return {
    hasFinnhubKey: !!FINNHUB_API_KEY,
    refreshInterval: REFRESH_INTERVAL,
    isMarketOpen: isMarketOpen(),
  };
}

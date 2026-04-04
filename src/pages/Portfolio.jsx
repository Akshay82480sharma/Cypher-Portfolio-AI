import { useState, useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { calculatePnLPercent, calculatePnL } from '../utils/calculations';
import { formatCurrency, formatPercent, getChangeColor } from '../utils/formatters';
import { ASSET_TYPE_LABELS, ASSET_TYPE_COLORS, STOCK_SEARCH_DATA } from '../services/mockData';
import Modal from '../components/ui/Modal';
import { Plus, Search, Trash2, ArrowUpDown, Filter } from 'lucide-react';
import './Portfolio.css';

export default function Portfolio() {
  const { state, dispatch, computed } = usePortfolio();
  const [activeTab, setActiveTab] = useState('all');
  const [sortKey, setSortKey] = useState('value');
  const [sortDir, setSortDir] = useState('desc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [formData, setFormData] = useState({ quantity: '', avgPrice: '', currentPrice: '' });

  const tabs = [
    { id: 'all', label: 'All Assets' },
    { id: 'stock', label: 'Stocks' },
    { id: 'crypto', label: 'Crypto' },
    { id: 'mutualfund', label: 'Mutual Funds' },
    { id: 'etf', label: 'ETFs' },
  ];

  const filteredHoldings = useMemo(() => {
    let holdings = activeTab === 'all'
      ? state.holdings
      : state.holdings.filter(h => h.type === activeTab);

    return holdings.sort((a, b) => {
      let aVal, bVal;
      switch (sortKey) {
        case 'name': aVal = a.name; bVal = b.name; break;
        case 'value': aVal = a.currentPrice * a.quantity; bVal = b.currentPrice * b.quantity; break;
        case 'pnl': aVal = calculatePnLPercent(a.currentPrice, a.avgPrice); bVal = calculatePnLPercent(b.currentPrice, b.avgPrice); break;
        case 'allocation': aVal = (a.currentPrice * a.quantity); bVal = (b.currentPrice * b.quantity); break;
        default: aVal = a.currentPrice * a.quantity; bVal = b.currentPrice * b.quantity;
      }
      if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [state.holdings, activeTab, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return STOCK_SEARCH_DATA.filter(s =>
      s.name.toLowerCase().includes(q) || s.symbol.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery]);

  const handleAddHolding = () => {
    if (!selectedAsset || !formData.quantity || !formData.avgPrice) return;
    const currentPrice = formData.currentPrice || formData.avgPrice;
    dispatch({
      type: 'ADD_HOLDING',
      payload: {
        symbol: selectedAsset.symbol,
        name: selectedAsset.name,
        type: selectedAsset.type,
        exchange: selectedAsset.exchange,
        sector: selectedAsset.sector,
        quantity: parseFloat(formData.quantity),
        avgPrice: parseFloat(formData.avgPrice),
        currentPrice: parseFloat(currentPrice),
        week52High: parseFloat(currentPrice) * 1.15,
        week52Low: parseFloat(currentPrice) * 0.8,
      },
    });
    setShowAddModal(false);
    setSelectedAsset(null);
    setSearchQuery('');
    setFormData({ quantity: '', avgPrice: '', currentPrice: '' });
  };

  const handleRemove = (id) => {
    dispatch({ type: 'REMOVE_HOLDING', payload: id });
  };

  return (
    <div className="page-container portfolio-page">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>Portfolio</h1>
            <p>{state.holdings.length} holdings · {formatCurrency(computed.totalValue)}</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)} id="add-holding-btn">
            <Plus size={18} /> Add Holding
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="portfolio-tabs animate-fade-in">
        {tabs.map(tab => {
          const count = tab.id === 'all' ? state.holdings.length : state.holdings.filter(h => h.type === tab.id).length;
          return (
            <button
              key={tab.id}
              className={`portfolio-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.id !== 'all' && (
                <span className="tab-dot" style={{ background: ASSET_TYPE_COLORS[tab.id] }} />
              )}
              {tab.label}
              <span className="tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Holdings Table */}
      <div className="glass-card no-hover holdings-table-card animate-fade-in-up">
        <div className="holdings-table-wrapper">
          <table className="holdings-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('name')} className="sortable">
                  Asset <ArrowUpDown size={12} />
                </th>
                <th className="text-right">Qty</th>
                <th className="text-right">Avg Price</th>
                <th className="text-right">Current</th>
                <th onClick={() => toggleSort('value')} className="sortable text-right">
                  Value <ArrowUpDown size={12} />
                </th>
                <th onClick={() => toggleSort('pnl')} className="sortable text-right">
                  P&L <ArrowUpDown size={12} />
                </th>
                <th className="text-right">Alloc%</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredHoldings.map((h, idx) => {
                const pnl = calculatePnL(h.currentPrice, h.avgPrice, h.quantity);
                const pnlPct = calculatePnLPercent(h.currentPrice, h.avgPrice);
                const value = h.currentPrice * h.quantity;
                const alloc = (value / computed.totalValue) * 100;

                return (
                  <tr key={h.id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 0.03}s` }}>
                    <td>
                      <div className="holding-info">
                        <div className="holding-type-dot" style={{ background: ASSET_TYPE_COLORS[h.type] }} />
                        <div>
                          <div className="holding-symbol">{h.symbol.replace('.NS', '')}</div>
                          <div className="holding-name">{h.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-right text-mono">{h.quantity}</td>
                    <td className="text-right text-mono">{formatCurrency(h.avgPrice)}</td>
                    <td className="text-right text-mono">{formatCurrency(h.currentPrice)}</td>
                    <td className="text-right text-mono font-semibold">{formatCurrency(value)}</td>
                    <td className={`text-right text-mono font-semibold ${getChangeColor(pnl)}`}>
                      <div>{formatCurrency(pnl)}</div>
                      <div className="pnl-small">{formatPercent(pnlPct)}</div>
                    </td>
                    <td className="text-right text-mono">{alloc.toFixed(1)}%</td>
                    <td className="text-center">
                      <button className="btn btn-ghost btn-sm" onClick={() => handleRemove(h.id)} title="Remove">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredHoldings.length === 0 && (
          <div className="empty-state">
            <p>No holdings in this category</p>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
              <Plus size={14} /> Add your first holding
            </button>
          </div>
        )}
      </div>

      {/* Add Holding Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setSelectedAsset(null); setSearchQuery(''); }} title="Add Holding" size="md">
        {!selectedAsset ? (
          <div>
            <div className="form-group">
              <label className="form-label">Search Stock / Crypto / Fund</label>
              <div className="search-dropdown">
                <div className="search-input-wrapper">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    className="form-input search-input"
                    placeholder="e.g., Reliance, Bitcoin, Nifty ETF..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    id="search-asset-input"
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map(item => (
                      <div
                        key={item.symbol}
                        className="search-result-item"
                        onClick={() => { setSelectedAsset(item); setSearchQuery(''); }}
                      >
                        <div>
                          <div className="search-result-name">{item.name}</div>
                          <div className="search-result-meta">
                            <span className="search-result-type" style={{ color: ASSET_TYPE_COLORS[item.type] }}>
                              {ASSET_TYPE_LABELS[item.type]}
                            </span>
                            · {item.sector}
                          </div>
                        </div>
                        <span className="search-result-symbol">{item.symbol}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="selected-asset-header">
              <div className="selected-asset-info">
                <span className="holding-type-dot" style={{ background: ASSET_TYPE_COLORS[selectedAsset.type] }} />
                <div>
                  <div className="holding-symbol">{selectedAsset.symbol}</div>
                  <div className="holding-name">{selectedAsset.name}</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedAsset(null)}>Change</button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g., 10"
                  value={formData.quantity}
                  onChange={(e) => setFormData(p => ({ ...p, quantity: e.target.value }))}
                  id="quantity-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Avg Buy Price (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g., 2500"
                  value={formData.avgPrice}
                  onChange={(e) => setFormData(p => ({ ...p, avgPrice: e.target.value }))}
                  id="avg-price-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Current Price (₹) — optional</label>
              <input
                type="number"
                className="form-input"
                placeholder="Leave blank to use buy price"
                value={formData.currentPrice}
                onChange={(e) => setFormData(p => ({ ...p, currentPrice: e.target.value }))}
                id="current-price-input"
              />
            </div>

            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => { setShowAddModal(false); setSelectedAsset(null); }}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleAddHolding}
                disabled={!formData.quantity || !formData.avgPrice}
                id="confirm-add-btn"
              >
                <Plus size={16} /> Add to Portfolio
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

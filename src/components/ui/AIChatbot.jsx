import { useState, useRef, useEffect, useMemo } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { calculateHealthScore, detectRisks, generateRecommendations } from '../../services/aiEngine';
import { calculatePortfolioValue, calculateTotalInvested, calculateDailyChange, calculateTypeAllocations, calculateSectorAllocations } from '../../utils/calculations';
import { formatCurrency, formatCompactCurrency, formatPercent } from '../../utils/formatters';
import { MessageCircle, X, Send, Bot, User, Sparkles, ChevronDown } from 'lucide-react';
import './AIChatbot.css';

const GREETING = {
  role: 'assistant',
  content: "Hey! 👋 I'm **Cypher AI**, your portfolio assistant. Ask me anything about your investments!\n\nTry asking:\n• *\"How's my portfolio doing?\"*\n• *\"What are my risks?\"*\n• *\"Should I rebalance?\"*\n• *\"Top gainers today?\"*",
  timestamp: Date.now(),
};

/**
 * Generate AI response based on user query and portfolio context
 */
function generateResponse(query, holdings, computed) {
  const q = query.toLowerCase().trim();
  const healthScore = calculateHealthScore(holdings);
  const risks = detectRisks(holdings);
  const recommendations = generateRecommendations(holdings);
  const totalValue = computed.totalValue;
  const totalInvested = computed.totalInvested;
  const totalPnL = computed.totalPnL;
  const totalPnLPercent = computed.totalPnLPercent;
  const dailyChange = computed.dailyChange;
  const typeAllocations = computed.typeAllocations;
  const sectorAllocations = computed.sectorAllocations;

  // Portfolio overview
  if (q.match(/portfolio|overview|summary|how.*doing|status|net\s*worth/)) {
    const emoji = totalPnL >= 0 ? '📈' : '📉';
    const pnlEmoji = dailyChange.change >= 0 ? '🟢' : '🔴';
    return `${emoji} **Portfolio Overview**\n\n` +
      `**Net Worth:** ${formatCurrency(totalValue)}\n` +
      `**Invested:** ${formatCurrency(totalInvested)}\n` +
      `**Total P&L:** ${formatCurrency(totalPnL)} (${formatPercent(totalPnLPercent)})\n\n` +
      `${pnlEmoji} **Today:** ${formatCurrency(dailyChange.change)} (${formatPercent(dailyChange.changePercent)})\n\n` +
      `**Health Score:** ${healthScore.score}/10 ${healthScore.score >= 7 ? '✅' : healthScore.score >= 5 ? '⚠️' : '❌'}\n\n` +
      `You have **${holdings.length} holdings** across ${Object.keys(typeAllocations).length} asset types.`;
  }

  // Health score
  if (q.match(/health|score|rating|grade/)) {
    const bd = healthScore.breakdown;
    const emoji = healthScore.score >= 7 ? '✅' : healthScore.score >= 5 ? '⚠️' : '❌';
    return `${emoji} **Portfolio Health: ${healthScore.score}/10**\n\n` +
      `| Category | Score |\n|---|---|\n` +
      Object.values(bd).map(d => `| ${d.label} | ${d.score.toFixed(1)}/10 |`).join('\n') +
      `\n\n` +
      (healthScore.score < 7 ? `💡 *Tip: Focus on improving ${Object.values(bd).sort((a,b) => a.score - b.score)[0].label} — it's your weakest area.*` : `Great job! Your portfolio is well-balanced. 🎯`);
  }

  // Risks
  if (q.match(/risk|danger|problem|issue|concern|warning/)) {
    if (risks.length === 0) {
      return '✅ **No major risks detected!**\n\nYour portfolio looks healthy. Keep monitoring regularly.';
    }
    return `⚠️ **${risks.length} Risk${risks.length > 1 ? 's' : ''} Detected**\n\n` +
      risks.slice(0, 4).map((r, i) => {
        const icon = r.severity === 'critical' ? '🔴' : r.severity === 'warning' ? '🟡' : 'ℹ️';
        return `${icon} **${r.title}**\n   ${r.description}`;
      }).join('\n\n') +
      (risks.length > 4 ? `\n\n...and ${risks.length - 4} more. Check the **AI Advisor** page for full details.` : '');
  }

  // Recommendations
  if (q.match(/recommend|suggest|advice|should\s*i|what.*buy|what.*sell|rebalance/)) {
    if (recommendations.length === 0) {
      return '✅ No specific recommendations right now. Your portfolio looks well-positioned!';
    }
    return `💡 **AI Recommendations**\n\n` +
      recommendations.slice(0, 4).map(rec => {
        const actionEmoji = rec.action === 'BUY' ? '🟢' : rec.action === 'SELL' ? '🔴' : '🟡';
        return `${actionEmoji} **${rec.action} ${rec.symbol}**\n   ${rec.reason}`;
      }).join('\n\n') +
      `\n\n⚠️ *Not financial advice. Consult a SEBI-registered advisor.*`;
  }

  // Top gainers/losers
  if (q.match(/gainer|winner|best|top.*perform|mover/)) {
    const sorted = [...holdings].sort((a, b) => {
      const aChange = a.previousClose ? ((a.currentPrice - a.previousClose) / a.previousClose) : 0;
      const bChange = b.previousClose ? ((b.currentPrice - b.previousClose) / b.previousClose) : 0;
      return bChange - aChange;
    });
    const top3 = sorted.slice(0, 3);
    return `🏆 **Top Gainers Today**\n\n` +
      top3.map((h, i) => {
        const change = h.previousClose ? ((h.currentPrice - h.previousClose) / h.previousClose * 100) : 0;
        return `${i + 1}. **${h.symbol.replace('.NS', '')}** — ${formatCurrency(h.currentPrice)} (${formatPercent(change)})`;
      }).join('\n');
  }

  if (q.match(/loser|worst|bottom|decline|falling|drop/)) {
    const sorted = [...holdings].sort((a, b) => {
      const aChange = a.previousClose ? ((a.currentPrice - a.previousClose) / a.previousClose) : 0;
      const bChange = b.previousClose ? ((b.currentPrice - b.previousClose) / b.previousClose) : 0;
      return aChange - bChange;
    });
    const bottom3 = sorted.slice(0, 3);
    return `📉 **Biggest Losers Today**\n\n` +
      bottom3.map((h, i) => {
        const change = h.previousClose ? ((h.currentPrice - h.previousClose) / h.previousClose * 100) : 0;
        return `${i + 1}. **${h.symbol.replace('.NS', '')}** — ${formatCurrency(h.currentPrice)} (${formatPercent(change)})`;
      }).join('\n');
  }

  // Allocation
  if (q.match(/allocation|diversif|sector|split|breakdown|asset\s*type/)) {
    let response = '📊 **Portfolio Allocation**\n\n**By Asset Type:**\n';
    Object.entries(typeAllocations).forEach(([type, data]) => {
      const label = { stock: 'Stocks', crypto: 'Crypto', mutualfund: 'Mutual Funds', etf: 'ETFs' }[type] || type;
      response += `• ${label}: ${formatPercent(data.percentage).replace('+', '')} (${formatCompactCurrency(data.value)})\n`;
    });

    response += '\n**By Sector:**\n';
    Object.entries(sectorAllocations)
      .sort((a, b) => b[1].percentage - a[1].percentage)
      .forEach(([sector, data]) => {
        response += `• ${sector}: ${formatPercent(data.percentage).replace('+', '')}\n`;
      });

    return response;
  }

  // Specific stock query
  const stockMatch = holdings.find(h => 
    q.includes(h.symbol.toLowerCase().replace('.ns', '')) || 
    q.includes(h.name.toLowerCase())
  );
  if (stockMatch) {
    const h = stockMatch;
    const pnl = (h.currentPrice - h.avgPrice) * h.quantity;
    const pnlPct = ((h.currentPrice - h.avgPrice) / h.avgPrice) * 100;
    const dayChange = h.previousClose ? ((h.currentPrice - h.previousClose) / h.previousClose * 100) : 0;
    const allocation = (h.currentPrice * h.quantity) / totalValue * 100;

    return `📋 **${h.name}** (${h.symbol.replace('.NS', '')})\n\n` +
      `**Price:** ${formatCurrency(h.currentPrice)}\n` +
      `**Day Change:** ${formatPercent(dayChange)}\n` +
      `**Your P&L:** ${formatCurrency(pnl)} (${formatPercent(pnlPct)})\n` +
      `**Qty:** ${h.quantity} | **Avg:** ${formatCurrency(h.avgPrice)}\n` +
      `**Allocation:** ${allocation.toFixed(1)}%\n` +
      `**Day Range:** ${formatCurrency(h.dayLow)} – ${formatCurrency(h.dayHigh)}`;
  }

  // Help / greeting
  if (q.match(/help|hi|hello|hey|what.*can/)) {
    return `👋 I can help you with:\n\n` +
      `• **"Portfolio summary"** — Overview of your investments\n` +
      `• **"Health score"** — Portfolio health analysis\n` +
      `• **"Risks"** — Identify portfolio risks\n` +
      `• **"Recommendations"** — AI-powered suggestions\n` +
      `• **"Top gainers"** — Best performers today\n` +
      `• **"Allocation"** — Asset & sector breakdown\n` +
      `• **"Reliance"** — Info about a specific holding\n\n` +
      `Just type your question! 🚀`;
  }

  // Fallback
  return `🤔 I'm not sure about that. Try asking about:\n\n` +
    `• Portfolio overview\n• Health score\n• Risks & recommendations\n• Top gainers/losers\n• Allocation breakdown\n• Any specific stock (e.g., "TCS", "Bitcoin")\n\n` +
    `Type **"help"** for more options!`;
}

/**
 * Simple markdown-to-HTML for chat messages
 */
function renderMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>')
    .replace(/\|(.+)\|/g, (match) => {
      // Skip table formatting in chat, just clean it up
      return match.replace(/\|/g, ' ').replace(/---/g, '').trim();
    });
}

export default function AIChatbot() {
  const { state, computed } = usePortfolio();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Add user message
    const userMsg = { role: 'user', content: trimmed, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking delay
    setTimeout(() => {
      const response = generateResponse(trimmed, state.holdings, computed);
      const assistantMsg = { role: 'assistant', content: response, timestamp: Date.now() };
      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 600 + Math.random() * 800);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const unreadCount = 0; // Could be used for notification

  return (
    <>
      {/* Chat Window */}
      <div className={`chatbot-window ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <div className="chatbot-avatar">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="chatbot-name">Cypher AI</span>
              <span className="chatbot-status">
                <span className="chatbot-status-dot" />
                Online
              </span>
            </div>
          </div>
          <button className="chatbot-close" onClick={() => setIsOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="chatbot-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chatbot-message ${msg.role}`}>
              {msg.role === 'assistant' && (
                <div className="chatbot-msg-avatar">
                  <Bot size={14} />
                </div>
              )}
              <div className="chatbot-msg-bubble" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
              {msg.role === 'user' && (
                <div className="chatbot-msg-avatar user">
                  <User size={14} />
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="chatbot-message assistant">
              <div className="chatbot-msg-avatar">
                <Bot size={14} />
              </div>
              <div className="chatbot-msg-bubble typing">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chatbot-input-area">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask about your portfolio..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="chatbot-input"
          />
          <button 
            className="chatbot-send" 
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Floating Button */}
      <button 
        className={`chatbot-fab ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        id="ai-chatbot-toggle"
      >
        {isOpen ? (
          <ChevronDown size={24} />
        ) : (
          <>
            <MessageCircle size={24} />
            <span className="chatbot-fab-pulse" />
          </>
        )}
      </button>
    </>
  );
}

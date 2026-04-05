# Personal AI Portfolio Manager

**Your Intelligent AI-Powered Wealth Advisor**

Track, analyze, and grow your investments smarter. Not just another portfolio tracker — a full decision engine that thinks like a financial advisor.

![Dashboard Preview]((./public/dashboard.png)) 

## ✨ Features

### Core Features
- **Multi-Asset Tracking**
  - Indian Stocks (NSE/BSE)
  - Cryptocurrency (Binance, CoinGecko, etc.)
  - Mutual Funds & ETFs
  - Real-time portfolio valuation
  - Absolute & Percentage P&L tracking

- **🤖 AI Advisor (Main USP)**
  - Risk analysis & portfolio health scoring (e.g., 7.8/10)
  - Intelligent Buy/Sell/Hold recommendations
  - Detects overexposure to single stocks or sectors
  - Sector imbalance alerts

- **🎯 Goal-Based Investing**
  - Set financial goals (₹1 Cr corpus, house down payment, retirement)
  - Auto-calculated required SIP & ideal asset allocation

- **🚨 Smart Alerts**
  - Portfolio drop alerts
  - Rebalancing suggestions
  - Sector overweight warnings

- **📊 Beautiful Dashboard**
  - Net Worth overview
  - Daily P&L
  - Asset allocation pie chart
  - Performance comparison vs Nifty 50

### Upcoming Features
- What-If investment simulator
- One-click portfolio rebalancing
- Social investing (copy top portfolios)
- Voice AI assistant

## 🛠️ Tech Stack

- **Frontend**: React Native (Mobile App)
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL + Redis (for real-time caching)
- **AI/ML**: Rule-based engine (Phase 1) → LLM + PyTorch/TensorFlow (later)
- **Data Sources**: Yahoo Finance, Alpha Vantage, Zerodha Kite API (OAuth)
- **Real-time**: WebSockets

## 🔐 Security

- JWT Authentication
- End-to-end encryption for sensitive data
- OAuth-only broker integrations (never store passwords)
- Secure API practices

## 💰 Monetization (Planned)

- Freemium model
- Premium AI insights & advanced features (₹199–₹499/month)
- Broker affiliate partnerships

## 📋 MVP Roadmap

### Phase 1 (Done / In Progress)
- User authentication
- Manual portfolio entry (stocks, crypto, MFs)
- Basic portfolio dashboard + charts

### Phase 2
- Live price integration via APIs
- Smart notifications & alerts

### Phase 3
- Rule-based AI advisor (Buy/Sell/Hold + risk analysis)

### Phase 4+
- Advanced AI with LLMs
- Goal-based planning
- What-If simulator
- Rebalancing engine

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js / React Native environment
- PostgreSQL & Redis

### Installation

```bash
# Clone the repository
git clone (https://github.com/Akshay82480sharma/Cypher-Portfolio-AI.git)

# Backend setup
cd backend
pip install -r requirements.txt
cp .env.example .env

# Frontend setup
cd ../frontend
npm install

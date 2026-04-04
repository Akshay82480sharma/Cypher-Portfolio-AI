import { usePortfolio } from './context/PortfolioContext';
import Sidebar from './components/ui/Sidebar';
import AIChatbot from './components/ui/AIChatbot';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import AIAdvisor from './pages/AIAdvisor';
import Goals from './pages/Goals';
import Alerts from './pages/Alerts';
import Rebalance from './pages/Rebalance';
import Simulator from './pages/Simulator';

const pages = {
  dashboard: Dashboard,
  portfolio: Portfolio,
  advisor: AIAdvisor,
  goals: Goals,
  alerts: Alerts,
  rebalance: Rebalance,
  simulator: Simulator,
};

export default function AppLayout() {
  const { state } = usePortfolio();
  const PageComponent = pages[state.activePage] || Dashboard;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-content">
        <PageComponent />
      </main>
      <AIChatbot />
    </div>
  );
}

import { PortfolioProvider } from './context/PortfolioContext';
import AppLayout from './AppLayout';
import './index.css';

function App() {
  return (
    <PortfolioProvider>
      <AppLayout />
    </PortfolioProvider>
  );
}

export default App;

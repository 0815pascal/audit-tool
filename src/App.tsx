import './App.css';
import Header from './components/Header';
import TabNavigation from './components/TabNavigation';
import { OverviewTabContent, VerificationTabContent, IksTabContent } from './components/tabs';
import VerificationStatus from './components/VerificationStatus';
import { useVerificationHandlers } from './hooks/useVerificationHandlers';

function App() {
  const { activeTab, handleTabChange } = useVerificationHandlers();

  return (
    <div className="app">
      <Header />
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      <VerificationStatus />
      
      {activeTab === 'overview' && <OverviewTabContent />}
      {activeTab === 'verification' && <VerificationTabContent />}
      {activeTab === 'audit' && <IksTabContent />}
    </div>
  );
}

export default App;

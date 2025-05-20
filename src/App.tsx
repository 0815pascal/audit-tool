import './App.css';
import Header from './components/Header';
import TabNavigation from './components/TabNavigation';
import { AuditLogTabContent, IksTabContent } from './components/tabs';
import { useVerificationHandlers } from './hooks/useVerificationHandlers';
import { useAppSelector } from './store/hooks';
import { selectUserQuarterlyStatus, getCurrentQuarter } from './store/verificationSlice';

function App() {
  const { activeTab, handleTabChange } = useVerificationHandlers();
  const userQuarterlyStatus = useAppSelector(selectUserQuarterlyStatus);
  const { quarter, year } = useAppSelector(getCurrentQuarter);
  const currentQuarter = `${quarter}-${year}`;

  return (
    <div className="app">
      <Header />
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      
      {activeTab === 'auditLog' && <AuditLogTabContent />}
      {activeTab === 'iks' && <IksTabContent userQuarterlyStatus={userQuarterlyStatus} currentQuarter={currentQuarter} />}
    </div>
  );
}

export default App;

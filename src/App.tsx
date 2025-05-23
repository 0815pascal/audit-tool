import './App.css';
import Header from './components/Header';
import TabNavigation from './components/TabNavigation';
import { AuditLogTabContent, IksTabContent } from './components/tabs';
import UserListComponent from './components/UserListComponent';
import { useCaseAuditHandlers } from './hooks/useCaseAuditHandlers';
import { useAppSelector } from './store/hooks';
import { selectUserQuarterlyStatus, getCurrentQuarter } from './store/caseAuditSlice';
import { TabView } from './components/TabNavigationTypes';

function App() {
  const { activeTab, handleTabChange } = useCaseAuditHandlers();
  const userQuarterlyStatus = useAppSelector(selectUserQuarterlyStatus);
  const { quarter, year } = useAppSelector(getCurrentQuarter);
  const currentQuarter = `${quarter}-${year}`;

  return (
    <div className="app">
      <Header />
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      
      {activeTab === TabView.AUDIT_LOG && <AuditLogTabContent />}
      {activeTab === TabView.IKS && <IksTabContent userQuarterlyStatus={userQuarterlyStatus} currentQuarter={currentQuarter} />}
      {activeTab === TabView.USERS && <UserListComponent />}
    </div>
  );
}

export default App;

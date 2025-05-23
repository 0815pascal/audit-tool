import './App.css';
import Header from './components/Header';
import TabNavigation from './components/TabNavigation';
import { AuditLogTabContent, IksTabContent } from './components/tabs';
import UserListComponent from './components/UserListComponent';
import { useTabNavigation } from './hooks/useTabNavigation';
import { TabView } from './components/TabNavigationTypes';

function App() {
  const { activeTab, handleTabChange } = useTabNavigation();

  return (
    <div className="app" data-testid="app-container">
      <Header />
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      
      {activeTab === TabView.AUDIT_LOG && <AuditLogTabContent />}
      {activeTab === TabView.IKS && <IksTabContent />}
      {activeTab === TabView.USERS && <UserListComponent />}
    </div>
  );
}

export default App;

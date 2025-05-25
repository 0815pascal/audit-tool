import React from 'react';
import './App.css';
import TabNavigation from './components/TabNavigation';
import QuarterlySelectionComponent from './components/QuarterlySelectionComponent';
import UserListComponent from './components/UserListComponent';
import { Card } from './components/common';
import { useTabNavigation } from './hooks/useCaseAuditHandlers';
import { TAB_VIEW_ENUM } from './enums';

// Header component inlined
const Header: React.FC = () => {
  return (
    <header style={{ 
      backgroundColor: 'var(--primary-color)', 
      color: 'white',
      padding: '1rem',
      marginBottom: '2rem'
    }}>
      <div className="container">
        <h1 style={{ margin: 0, color: 'white' }}>CARA IKS</h1>
      </div>
    </header>
  );
};

function App() {
  const { activeTab, handleTabChange } = useTabNavigation();

  return (
    <div className="app" data-testid="app-container">
      <Header />
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      
      {activeTab === TAB_VIEW_ENUM.AUDIT_LOG && (
        <Card title="Audit Log" className="mb-4" fullWidth>
          <div className="p-4 text-center text-gray-500">
            This section is reserved for future implementation.
          </div>
        </Card>
      )}
      {activeTab === TAB_VIEW_ENUM.IKS && (
        <div className="iks-tab-content">
          <QuarterlySelectionComponent />
        </div>
      )}
      {activeTab === TAB_VIEW_ENUM.USERS && <UserListComponent />}
    </div>
  );
}

export default App;

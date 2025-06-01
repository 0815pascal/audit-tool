import React from 'react';
import './App.css';
import TabNavigation from './components/TabNavigation';
import QuarterlySelectionComponent from './components/QuarterlySelectionComponent';
import { Card } from './components/common';
import { useTabNavigation } from './hooks/useCaseAuditHandlers';
import { TAB_VIEW_ENUM } from './enums';

const App: React.FC = () => {
  const { activeTab, handleTabChange } = useTabNavigation();

  return (
    <div className="App" data-testid="app-container">
      <div className="container-fluid">
        <div className="row">
          <div className="col">
            <div className="d-flex justify-content-center mb-4">
              <h1 
                className="display-4 fw-bold text-center"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                IKS Audit Tool
              </h1>
            </div>
            
            <Card>
              <TabNavigation 
                activeTab={activeTab} 
                onTabChange={handleTabChange}
              />
              
              <div className="tab-content mt-4">
                {activeTab === TAB_VIEW_ENUM.IKS && <QuarterlySelectionComponent />}
                {activeTab === TAB_VIEW_ENUM.AUDIT_LOG && (
                  <div className="text-center py-5">
                    <h3>Audit Log</h3>
                    <p>Audit history and logs will be displayed here.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

import React from 'react';
import './App.css';
import QuarterlySelectionComponent from './components/QuarterlySelectionComponent';
import { Card } from './components/common';

const App: React.FC = () => {
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
              <QuarterlySelectionComponent />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

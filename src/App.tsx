import React from 'react';
import './App.css';
import QuarterlySelectionComponent from './components/QuarterlySelectionComponent';
import { Card } from './components/common';

const App: React.FC = () => {
  return (
    <div className="app min-h-screen flex flex-col" data-testid="app-container">
      <div id="root" className="max-w-2xl m-auto p-3xl text-center">
        <div className="flex justify-center mb-4">
          <h1 className="app__title text-xl font-bold text-center m-0">
                IKS Audit Tool
              </h1>
            </div>
            
        <main className="flex-1">
            <Card>
            <QuarterlySelectionComponent />
            </Card>
        </main>
      </div>
    </div>
  );
};

export default App;

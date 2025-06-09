import React from 'react';
import './App.css';
import QuarterlySelectionComponent from './components/QuarterlySelectionComponent';
import { Card, DebugDrawer } from './components/common';

const App: React.FC = () => {
  // Show debug controls in development mode or when explicitly enabled
  const showDebugControls = import.meta.env.MODE === 'development';

  return (
    <div className="app min-h-screen flex flex-col" data-testid="app-container">
      <div id="root" className="max-w-2xl m-auto p-3xl text-center">
        <main className="flex-1">
            <Card>
            <QuarterlySelectionComponent />
            </Card>
        </main>
      </div>
      
      {/* Debug drawer - positioned fixed on the right */}
      {showDebugControls && <DebugDrawer />}
    </div>
  );
};

export default App;

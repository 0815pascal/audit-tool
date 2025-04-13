import React from 'react';

export type TabView = 'overview' | 'verification';

interface TabNavigationProps {
  activeTab: TabView;
  onTabChange: (tab: TabView) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="mb-8" style={{ width: '100%' }}>
      <div 
        style={{ 
          display: 'flex', 
          width: '100%',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '1rem'
        }}
      >
        <TabButton 
          label="Overview" 
          isActive={activeTab === 'overview'} 
          onClick={() => onTabChange('overview')} 
        />
        <TabButton 
          label="Verification" 
          isActive={activeTab === 'verification'} 
          onClick={() => onTabChange('verification')} 
        />
      </div>
    </div>
  );
};

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.75rem 1.5rem',
        backgroundColor: isActive ? 'var(--primary-color)' : 'transparent',
        color: isActive ? 'white' : 'var(--primary-color)',
        border: 'none',
        borderBottom: isActive ? '3px solid var(--primary-color)' : 'none',
        cursor: 'pointer',
        fontWeight: 500,
        marginRight: '1rem',
        borderRadius: isActive ? '4px 4px 0 0' : '4px',
        transition: 'all 0.2s'
      }}
    >
      {label}
    </button>
  );
};

export default TabNavigation; 
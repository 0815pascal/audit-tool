import React from 'react';
import { TabView } from './TabNavigationTypes';
import { TAB_VIEWS_DISPLAY } from '../constants';

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
          label={TAB_VIEWS_DISPLAY[TabView.AUDIT_LOG]} 
          isActive={activeTab === TabView.AUDIT_LOG} 
          onClick={() => onTabChange(TabView.AUDIT_LOG)} 
        />
        <TabButton 
          label={TAB_VIEWS_DISPLAY[TabView.IKS]} 
          isActive={activeTab === TabView.IKS} 
          onClick={() => onTabChange(TabView.IKS)} 
        />
        <TabButton 
          label={TAB_VIEWS_DISPLAY[TabView.USERS]} 
          isActive={activeTab === TabView.USERS} 
          onClick={() => onTabChange(TabView.USERS)} 
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
        fontWeight: 'bold',
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
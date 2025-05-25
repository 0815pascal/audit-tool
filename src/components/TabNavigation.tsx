import React from 'react';
import { TAB_VIEW_ENUM } from '../enums';
import { TAB_VIEWS_DISPLAY } from '../constants';

// Tab view type alias
type TabView = TAB_VIEW_ENUM;

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
          label={TAB_VIEWS_DISPLAY[TAB_VIEW_ENUM.AUDIT_LOG]} 
          isActive={activeTab === TAB_VIEW_ENUM.AUDIT_LOG} 
          onClick={() => onTabChange(TAB_VIEW_ENUM.AUDIT_LOG)} 
        />
        <TabButton 
          label={TAB_VIEWS_DISPLAY[TAB_VIEW_ENUM.IKS]} 
          isActive={activeTab === TAB_VIEW_ENUM.IKS} 
          onClick={() => onTabChange(TAB_VIEW_ENUM.IKS)} 
        />
        <TabButton 
          label={TAB_VIEWS_DISPLAY[TAB_VIEW_ENUM.USERS]} 
          isActive={activeTab === TAB_VIEW_ENUM.USERS} 
          onClick={() => onTabChange(TAB_VIEW_ENUM.USERS)} 
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
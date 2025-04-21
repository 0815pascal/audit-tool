import { useState } from 'react';

export type TabType = 'overview' | 'verification';

export const useTabManagement = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const activateVerificationTab = () => {
    setActiveTab('verification');
  };

  const activateOverviewTab = () => {
    setActiveTab('overview');
  };

  return {
    activeTab,
    handleTabChange,
    activateVerificationTab,
    activateOverviewTab
  };
}; 
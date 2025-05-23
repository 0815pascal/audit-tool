import { useState } from 'react';
import { TabView } from '../components/TabNavigationTypes';
import { TAB_VIEWS } from '../constants';

/**
 * Lightweight hook for tab navigation
 * Extracted from useCaseAuditHandlers to prevent unnecessary API calls
 */
export const useTabNavigation = () => {
  const [activeTab, setActiveTab] = useState<TabView>(TAB_VIEWS.IKS);

  // Handle tab change
  const handleTabChange = (tab: TabView): void => {
    setActiveTab(tab);
  };

  return {
    activeTab,
    handleTabChange
  };
}; 
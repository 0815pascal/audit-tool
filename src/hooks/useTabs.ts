import { useState } from 'react'

export enum TabView {
  OVERVIEW = 'overview',
  VERIFICATION = 'verification',
}

export function useTabs() {
  const [activeTab, setActiveTab] = useState<TabView>(TabView.OVERVIEW)

  const handleTabChange = (tab: TabView) => {
    setActiveTab(tab)
  }

  return {
    activeTab,
    handleTabChange,
  }
} 
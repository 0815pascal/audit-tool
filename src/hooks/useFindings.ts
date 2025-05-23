import { useState, useCallback } from 'react';
import { 
  FindingsRecord, 
  FindingType, 
  DetailedFindingsRecord,
  SpecialFindingsRecord,
  createEmptyFindings,
  createEmptyDetailedFindings,
  createEmptySpecialFindings,
  isDetailedFinding,
  isSpecialFinding
} from '../types';

interface UseFindingsOptions {
  initialFindings?: FindingsRecord;
}

// Define the return type outside the hook for better reusability
export interface UseFindingsReturn {
  findings: FindingsRecord;
  toggleFinding: (finding: FindingType, value?: boolean) => void;
  setMultipleFindings: (updates: Partial<FindingsRecord>) => void;
  resetFindings: () => void;
  getDetailedFindings: () => DetailedFindingsRecord;
  getSpecialFindings: () => SpecialFindingsRecord;
  hasSelectedFindings: () => boolean;
  countDetailedFindings: () => number;
  countSpecialFindings: () => number;
}

/**
 * Hook for managing findings in a type-safe way
 */
export function useFindings(options: UseFindingsOptions = {}): UseFindingsReturn {
  const [findings, setFindings] = useState<FindingsRecord>(
    options.initialFindings || createEmptyFindings()
  );

  // Toggle a finding state
  const toggleFinding = useCallback((finding: FindingType, value?: boolean) => {
    setFindings(prev => ({
      ...prev,
      [finding]: value !== undefined ? value : !prev[finding]
    }));
  }, []);

  // Set multiple findings at once
  const setMultipleFindings = useCallback((updates: Partial<FindingsRecord>) => {
    setFindings(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Reset findings to default state
  const resetFindings = useCallback(() => {
    setFindings(createEmptyFindings());
  }, []);

  // Get just the detailed findings
  const getDetailedFindings = useCallback((): DetailedFindingsRecord => {
    const detailedFindings = createEmptyDetailedFindings();
    
    Object.keys(findings).forEach(key => {
      const finding = key as FindingType;
      if (isDetailedFinding(finding)) {
        detailedFindings[finding] = findings[finding];
      }
    });
    
    return detailedFindings;
  }, [findings]);

  // Get just the special findings
  const getSpecialFindings = useCallback((): SpecialFindingsRecord => {
    const specialFindings = createEmptySpecialFindings();
    
    Object.keys(findings).forEach(key => {
      const finding = key as FindingType;
      if (isSpecialFinding(finding)) {
        specialFindings[finding] = findings[finding];
      }
    });
    
    return specialFindings;
  }, [findings]);

  // Check if any finding is selected
  const hasSelectedFindings = useCallback((): boolean => {
    return Object.values(findings).some(Boolean);
  }, [findings]);

  // Count the number of selected detailed findings
  const countDetailedFindings = useCallback((): number => {
    return Object.entries(findings)
      .filter(([key]) => isDetailedFinding(key as FindingType))
      .filter(([, value]) => value)
      .length;
  }, [findings]);

  // Count the number of selected special findings
  const countSpecialFindings = useCallback((): number => {
    return Object.entries(findings)
      .filter(([key]) => isSpecialFinding(key as FindingType))
      .filter(([, value]) => value)
      .length;
  }, [findings]);

  // Use the explicit return type
  return {
    findings,
    toggleFinding,
    setMultipleFindings,
    resetFindings,
    getDetailedFindings,
    getSpecialFindings,
    hasSelectedFindings,
    countDetailedFindings,
    countSpecialFindings
  };
} 
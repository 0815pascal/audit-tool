import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectVerificationData,
  selectUserQuarterlyStatus,
  selectUsersNeedingVerification,
  selectUsersNeedingVerificationCount,
  applyVerificationDataToDossier,
  verifyDossier,
  rejectDossier,
  getCurrentQuarter,
  formatQuarterYear,
  initializeState,
  updateDossierStatus,
  selectQuarterlyDossiersForPeriod,
  selectUserRole,
  canUserVerifyDossier,
  selectQuarterlyDossiers,
  selectAllUserRoles
} from '../store/verificationSlice';
import { Dossier, User } from '../types';
import { getAuditsByQuarter, getAuditsByAuditor, selectCasesForAudit, AuditRecord } from '../services/auditService';
import { TabView } from '../components/TabNavigation';
import React from 'react';

// Convert API audit format to our internal Dossier format
const auditToDossier = (audit: AuditRecord): Dossier => {
  const { auditId, caseObj, quarter } = audit;
  const { caseNumber, claimOwner, coverageAmount } = caseObj || {};
  
  // Parse quarter and year from quarter string (e.g., "Q1-2023")
  const [quarterNum, yearStr] = quarter.split('-');
  const year = parseInt(yearStr);
  
  return {
    id: auditId.toString(),
    userId: claimOwner?.userId.toString() || '0',
    date: new Date().toISOString().split('T')[0],
    clientName: `Client ${caseNumber || 'Unknown'}`,
    policyNumber: `POL-${caseNumber || '0000'}`,
    caseNumber: caseNumber || 0,
    dossierRisk: Math.floor(Math.random() * 10) + 1,
    dossierName: `Case ${caseNumber || '0000'}`,
    totalAmount: coverageAmount || 1000,
    coverageAmount: coverageAmount || 1000,
    isVerified: false,
    isAkoReviewed: audit.isAkoReviewed || false,
    isSpecialist: claimOwner?.role === "SPECIALIST",
    quarter: quarterNum,
    year: year,
    claimsStatus: 'FULL_COVER',
    verifier: '',
    comment: '',
    rating: '',
    specialFindings: {},
    detailedFindings: {},
    caseType: 'USER_QUARTERLY'
  };
};

// Get a random audit for a user and convert to case format
const getRandomAuditForUser = async (userId: string, quarter?: string, year?: number): Promise<Dossier> => {
  // Remove all console.logs for less noise
  // Format as API expects (e.g., "Q1-2023")
  const quarterStr = quarter || `Q${new Date().getMonth() / 3 + 1}-${year || new Date().getFullYear()}`;
  
  // First try to get audits for this user
  const audits = await getAuditsByAuditor(parseInt(userId));
  
  // Find an audit for this quarter if possible
  const randomAudit = audits.length > 0 ? audits[Math.floor(Math.random() * audits.length)] : null;
  
  // Check if the audit was already reviewed by AKO Kredit
  if (randomAudit && randomAudit.isAkoReviewed) {
    // Try to find another audit that hasn't been reviewed
    const unreviewedAudit = audits.find(a => !a.isAkoReviewed);
    if (unreviewedAudit) {
      return auditToDossier(unreviewedAudit);
    }
  }

  if (randomAudit) {
    return auditToDossier(randomAudit);
  }

  // If no audits found, try to get available cases to create a new dossier
  const cases = await selectCasesForAudit(quarterStr);
  
  if (cases.length > 0) {
    const randomCase = cases[Math.floor(Math.random() * cases.length)];
    // Create a mock audit based on the case
    const mockAudit: AuditRecord = {
      auditId: Math.floor(Math.random() * 10000) + 1,
      caseObj: randomCase,
      quarter: quarterStr,
      isAkoReviewed: false,
      auditor: {
        userId: parseInt(userId),
        role: "SPECIALIST"
      }
    };

    return auditToDossier(mockAudit);
  }

  // Create a mock dossier as fallback
  const mockAudit: AuditRecord = {
    auditId: Math.floor(Math.random() * 10000) + 1,
    quarter: quarterStr,
    caseObj: {
      caseNumber: Math.floor(Math.random() * 10000),
      claimOwner: {
        userId: parseInt(userId),
        role: "SPECIALIST"
      },
      coverageAmount: Math.floor(Math.random() * 1000000) + 50000,
      claimsStatus: "FULL_COVER",
      caseStatus: "COMPENSATED"
    },
    isAkoReviewed: false,
    auditor: {
      userId: parseInt(userId),
      role: "SPECIALIST"
    }
  };

  return auditToDossier(mockAudit);
};

export const useVerificationHandlers = () => {
  const [activeTab, setActiveTab] = useState<TabView>('iks');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [currentDossier, setCurrentDossier] = useState<Dossier | null>(null);
  
  // Get user roles from Redux store
  const allUserRoles = useAppSelector(selectAllUserRoles);
  
  // Initialize user list with roles from Redux store instead of hardcoded values
  const [usersList, setUsersList] = useState<Array<User>>(() => {
    // Initial default user list
    const defaultUsers = [
      { id: '1', name: 'User 1', department: '5', role: 'SPECIALIST', isActive: true },
      { id: '2', name: 'User 2', department: '5', role: 'REGULAR', isActive: true },
      { id: '3', name: 'User 3', department: '5', role: 'REGULAR', isActive: true },
      { id: '4', name: 'User 4', department: '5', role: 'TEAM_LEADER', isActive: true },
      { id: '5', name: 'User 5', department: '5', role: 'REGULAR', isActive: true }
    ];
    
    // Update with roles from Redux if available
    return defaultUsers.map(emp => ({
      ...emp,
      role: allUserRoles[emp.id]?.role || emp.role
    }));
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [lastFetchedQuarter, setLastFetchedQuarter] = useState<string>('');
  
  // Get current quarter and year - memoize to prevent new object references
  const currentQuarterInfo = useMemo(() => getCurrentQuarter(), []);
  const { quarter, year } = currentQuarterInfo;
  const currentQuarterFormatted = useMemo(() => formatQuarterYear(quarter, year), [quarter, year]);
  
  // IKS specific state
  const [selectedQuarter, setSelectedQuarter] = useState<string>(currentQuarterFormatted);
  const [filteredYear, setFilteredYear] = useState<number>(year);
  const [currentUserId, setCurrentUserId] = useState<string>('4'); // Default as team leader

  // Memoize the usersList to prevent unnecessary selector recalculations
  const memoizedUsersList = useMemo(() => usersList, [usersList]);
  
  // Get verification data from Redux store
  const verificationData = useAppSelector(selectVerificationData);
  const userQuarterlyStatus = useAppSelector(selectUserQuarterlyStatus);
  const usersNeedingVerification = useAppSelector(state =>
    selectUsersNeedingVerification(state, memoizedUsersList)
  ).map(user => ({
    id: user.id,
    name: user.name,
    department: user.department,
    role: user.role,
    isActive: user.isActive
  })); // Extract just the user properties we need
  const usersNeedingVerificationCount = useAppSelector(state =>
    selectUsersNeedingVerificationCount(state, memoizedUsersList)
  );
  
  // Manually calculate the verification count to override the selector if needed
  const manualVerificationCount = useMemo(() => {
    // Get all dossiers for current quarter
    const currentQuarterDossiers = Object.values(verificationData).filter(d => 
      d.quarter === quarter && d.year === year
    );
    
    // If no dossiers for current quarter, all users need verification
    if (currentQuarterDossiers.length === 0) {
      return memoizedUsersList.length;
    }
    
    // Group dossiers by user
    const dossiersByUser: Record<string, typeof currentQuarterDossiers> = {};
    currentQuarterDossiers.forEach(dossier => {
      if (!dossiersByUser[dossier.userId]) {
        dossiersByUser[dossier.userId] = [];
      }
      dossiersByUser[dossier.userId].push(dossier);
    });
    
    // Count users that need verification:
    // 1. Users with no dossiers
    // 2. Users with no verified dossiers in the current quarter
    return memoizedUsersList.reduce((count, user) => {
      // If no dossiers, they need verification
      if (!dossiersByUser[user.id]) {
        return count + 1;
      }
      
      // Check if the user has any verified dossiers
      const hasVerifiedDossier = dossiersByUser[user.id].some(d => d.isVerified);
      
      // If they have no verified dossiers, they need verification
      if (!hasVerifiedDossier) {
        return count + 1;
      }
      
      return count;
    }, 0);
  }, [verificationData, memoizedUsersList, quarter, year]);
  
  // Use manual count instead of selector
  const verificationCount = manualVerificationCount;
  
  // Limit console logs to prevent spam
  // Commented out to reduce console noise

  const dispatch = useAppDispatch();
  
  // Check if currentUserId is TEAM_LEADER to display selection features
  const currentUserRole = useAppSelector(state => selectUserRole(state, currentUserId));

  // Fetch users and audits data - with caching to prevent loops
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Only fetch if we haven't fetched this quarter yet
        const quarterStr = `Q${quarter}-${year}`;
        if (quarterStr === lastFetchedQuarter && audits.length > 0) {
          return; // Skip if we've already fetched data for this quarter
        }
        
        setLoading(true);
        
        // Use a local variable to track if this effect is still valid
        let isMounted = true;
        
        // Get audits for the current quarter
        const auditRecords = await getAuditsByQuarter(quarterStr);
        
        // Check if component is still mounted before updating state
        if (!isMounted) return;
        
        // Ensure auditRecords is a valid array before using it
        if (!auditRecords || !Array.isArray(auditRecords)) {
          console.error("API returned non-array data:", auditRecords);
          // Use empty array as fallback
          setAudits([]);
          setLastFetchedQuarter(quarterStr);
          
          // We already have default users, no need to set them here
          setLoading(false);
          return;
        }
        
        setAudits(auditRecords);
        setLastFetchedQuarter(quarterStr);
        
        // Extract unique users from audits with default roles
        const users = Array.from(
          new Set(auditRecords.map(audit => audit.caseObj?.claimOwner?.userId.toString() || ''))
        ).filter(id => id !== '')
         .map(id => ({
           id,
           name: `User ${id}`,
           department: '5',
           role: (allUserRoles && allUserRoles[id]) ? allUserRoles[id].role : 'REGULAR' as const, // Get role from Redux if available
           isActive: true
         }));
        
        // Only update the users list if we actually found users
        if (users.length > 0) {
          // Keep existing roles from Redux when updating users
          setUsersList(prevList => {
            const prevMap = new Map(prevList.map(user => [user.id, user]));
            
            return users.map(user => {
              // If user already exists, keep its role from Redux
              const existingUser = prevMap.get(user.id);
              return {
                ...user,
                role: (allUserRoles && allUserRoles[user.id]) ? allUserRoles[user.id].role : 
                      existingUser ? existingUser.role : user.role
              };
            });
          });
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        // Don't reset the users list here, we already have default users
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
    
    // Cleanup function for useEffect
    return () => {
      // Nothing to clean up currently
    };
  }, [quarter, year, lastFetchedQuarter, audits.length, allUserRoles]);

  // Initialize state when the component mounts
  useEffect(() => {
    dispatch(initializeState());
  }, [dispatch]);

  // Update user roles when allUserRoles changes
  useEffect(() => {
    setUsersList(prevList =>
      prevList.map(user => ({
        ...user,
        role: allUserRoles[user.id]?.role || user.role
      }))
    );
  }, [allUserRoles]);

  const handleTabChange = (tab: TabView) => {
    setActiveTab(tab);
  };
  
  const handleUserChange = useCallback(async (userId: string) => {
    try {
      setCurrentUserId(userId);
      
      // Try to find a dossier for this user from Redux
      const userDossiers = Object.entries(verificationData)
        .filter(([_id, dossier]) => dossier.userId === userId)
        .map(([id, dossier]) => ({ id, ...dossier }));
      
      if (userDossiers.length > 0) {
        // If we have dossiers for this user in Redux, use the most recent one
        const latestDossier = userDossiers.reduce((latest, current) => {
          if (!latest.verificationDate) return current;
          if (!current.verificationDate) return latest;
          return new Date(current.verificationDate) > new Date(latest.verificationDate) ? current : latest;
        });
        
        // Create a proper Dossier object from the Redux data
        const dossierObject: Dossier = {
          id: latestDossier.id,
          userId: latestDossier.userId,
          date: new Date().toISOString().split('T')[0],
          clientName: `Client for ${latestDossier.id}`,
          policyNumber: `POL-${latestDossier.id}`,
          caseNumber: parseInt(latestDossier.id.replace(/\D/g, '')) || 0,
          dossierRisk: 0,
          dossierName: `Case ${latestDossier.id}`,
          totalAmount: latestDossier.coverageAmount,
          coverageAmount: latestDossier.coverageAmount,
          isVerified: latestDossier.isVerified,
          isAkoReviewed: latestDossier.isAkoReviewed,
          isSpecialist: false,
          quarter: latestDossier.quarter.toString(),
          year: latestDossier.year,
          claimsStatus: latestDossier.claimsStatus,
          verifier: latestDossier.verifier,
          comment: latestDossier.comment,
          rating: latestDossier.rating as Dossier['rating'],
          specialFindings: latestDossier.specialFindings,
          detailedFindings: latestDossier.detailedFindings,
          caseType: latestDossier.caseType
        };
        
        setCurrentDossier(dossierObject);
        return;
      }
      
      // Otherwise, fetch a new dossier for this user from the API
      setLoading(true);
      try {
        const caseData = await getRandomAuditForUser(userId, `Q${quarter}-${year}`, year);
        
        if (caseData) {
          const updatedCase = applyVerificationDataToDossier(caseData, verificationData);
          setCurrentDossier(updatedCase);
        } else {
          setCurrentDossier(null);
        }
      } catch (error) {
        console.error("Error selecting user:", error);
        setCurrentDossier(null);
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error in handleUserChange:", error);
    }
  }, [quarter, year, verificationData]);
  
  const handleSelectUser = useCallback(async (userId: string) => {
    setSelectedUser(userId);
    
    // Try to fetch a case for this user
    setLoading(true);
    try {
      const caseData = await getRandomAuditForUser(userId, `Q${quarter}-${year}`, year);
      if (caseData) {
        const updatedCase = applyVerificationDataToDossier(caseData, verificationData);
        setCurrentDossier(updatedCase);
      } else {
        setCurrentDossier(null);
      }
    } catch (error) {
      console.error("Error selecting user:", error);
      setCurrentDossier(null);
    } finally {
      setLoading(false);
    }
  }, [quarter, year, verificationData]);

  const handleVerify = (dossierId: string, verifier: string, verificationData: {
    comment: string;
    rating: string;
    specialFindings: Record<string, boolean>;
    detailedFindings: Record<string, boolean>;
  }) => {
    // Dispatch the verify action
    dispatch(verifyDossier({
      dossierId,
      isVerified: true,
      userId: selectedUser,
      verifier,
      comment: verificationData.comment,
      rating: verificationData.rating,
      specialFindings: verificationData.specialFindings,
      detailedFindings: verificationData.detailedFindings
    }));
  };
  
  const handleReject = (dossierId: string, verifier: string, verificationData: {
    comment: string;
    rating: string;
    specialFindings: Record<string, boolean>;
    detailedFindings: Record<string, boolean>;
  }) => {
    // Dispatch the reject action
    dispatch(rejectDossier({
      dossierId,
      userId: selectedUser,
      verifier,
      comment: verificationData.comment,
      rating: verificationData.rating,
      specialFindings: verificationData.specialFindings,
      detailedFindings: verificationData.detailedFindings
    }));
  };
  
  const handleQuarterChange = (quarterKey: string) => {
    setSelectedQuarter(quarterKey);
  };
  
  const handleYearChange = (year: number) => {
    setFilteredYear(year);
    
    // Create a quarter key with the new year but keep the same quarter
    const currentQuarter = parseInt(selectedQuarter.split('-')[0].replace('Q', ''));
    const newQuarterKey = `Q${currentQuarter}-${year}`;
    
    // Update the selected quarter with the new year
    setSelectedQuarter(newQuarterKey);
  };

  const handleStatusChange = (status: 'in-progress' | 'not-verified' | 'verified', dossierId: string) => {
    dispatch(updateDossierStatus({
      dossierId,
      status,
      userId: selectedUser
    }));
  };

  // Get quarterly selected dossiers (both user quarterly and random)
  const quarterlyDossiers = useAppSelector(state => 
    selectQuarterlyDossiersForPeriod(state, selectedQuarter)
  );

  // Create a memoized selector function for canVerifyDossier
  const canVerifyDossier = useCallback((dossierId: string): boolean => {
    // Create a mock redux state object to pass to canUserVerifyDossier
    const stateObject = {
      verification: {
        verifiedDossiers: verificationData,
        userRoles: { [currentUserId]: currentUserRole },
        userQuarterlyStatus: {},
        quarterlySelection: {},
        currentUserId
      }
    };
    
    return canUserVerifyDossier(stateObject, currentUserId, dossierId);
  }, [verificationData, currentUserId, currentUserRole]);

  // Handle selecting quarterly dossiers for verification
  const handleSelectQuarterlyDossiers = async (quarterKey: string) => {
    setLoading(true);
    try {
      // Get all active users
      const activeUsers = usersList.filter(user => user.isActive);
      
      // 1. Get one dossier per user for this quarter
      // For each user, get an appropriate dossier
      const userDossierPromises = activeUsers.map(async user => {
        // Get appropriate audits for this user that match requirements:
        // 1. For the selected quarter
        // 2. Not already AKO reviewed
        // 3. With coverage amount suitable for the user's role
        const userAudits = await getAuditsByAuditor(parseInt(user.id));
        const eligibleAudits = userAudits
          .filter(audit => 
            audit.quarter === quarterKey && 
            !audit.isAkoReviewed &&
            audit.caseObj?.coverageAmount && // Ensure coverageAmount exists
            (typeof audit.caseObj.coverageAmount === 'number') && // Ensure it's a number
            
            // Check role-specific coverage limits
            ((user.role === 'REGULAR' && audit.caseObj.coverageAmount <= 30000) ||
             (user.role === 'SPECIALIST' && audit.caseObj.coverageAmount <= 150000) ||
             (user.role === 'TEAM_LEADER')));
        
        // If we have eligible audits, select one randomly
        if (eligibleAudits.length > 0) {
          const selectedAudit = eligibleAudits[Math.floor(Math.random() * eligibleAudits.length)];
          return {
            dossierId: selectedAudit.auditId.toString(),
            userId: user.id,
            coverageAmount: selectedAudit.caseObj?.coverageAmount || 0,
            claimsStatus: 'FULL_COVER' as const,
            isAkoReviewed: false
          };
        }
        
        // If no eligible audits, create a mock dossier
        return {
          dossierId: `MOCK-${user.id}-${Date.now()}`,
          userId: user.id,
          coverageAmount: Math.floor(Math.random() * (user.role === 'REGULAR' ? 30000 : 150000)),
          claimsStatus: 'FULL_COVER' as const,
          isAkoReviewed: false
        };
      });
      
      // 2. Get random dossiers from previous quarter for quality control
      // For now, just create some mock dossiers
      const previousQuarterRandomDossiers = Array.from({ length: 3 }, (_, i) => ({
        dossierId: `PQR-${Date.now()}-${i}`,
        coverageAmount: Math.floor(Math.random() * 50000),
        claimsStatus: 'FULL_COVER' as const,
        isAkoReviewed: false
      }));
      
      // Wait for all user dossier promises to resolve
      const userQuarterlyDossiers = await Promise.all(userDossierPromises);
      
      // Dispatch action to store the selected dossiers
      dispatch(selectQuarterlyDossiers({
        quarterKey,
        userQuarterlyDossiers,
        previousQuarterRandomDossiers
      }));
    } catch (error) {
      console.error(`Error selecting dossiers for ${quarterKey}:`, error);
      alert(`Failed to select dossiers for ${quarterKey}`);
    } finally {
      setLoading(false);
    }
  };

  // Export quarterly verification results
  const exportQuarterlyResults = () => {
    // TODO: Implement export functionality
    console.log('Export quarterly results:', quarterlyDossiers);
    alert('Export functionality not implemented yet');
  };

  return {
    activeTab,
    currentDossier,
    selectedUser,
    usersList,
    currentUserId,
    selectedQuarter,
    filteredYear,
    currentUserRole,
    loading,
    quarterlyDossiers,
    usersNeedingVerification,
    usersNeedingVerificationCount: verificationCount,
    userQuarterlyStatus,
    
    // Methods
    handleTabChange,
    handleSelectUser,
    handleUserChange,
    handleVerify,
    handleReject,
    handleStatusChange,
    auditToDossier,
    getRandomAuditForUser,
    handleQuarterChange,
    handleYearChange,
    canVerifyDossier,
    handleSelectQuarterlyDossiers,
    exportQuarterlyResults
  };
}; 
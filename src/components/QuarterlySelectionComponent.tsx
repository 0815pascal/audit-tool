import React, {useState} from 'react';
import {
  CaseAudit,
  CaseAuditData,
  CaseType,
  ClaimsStatus,
  QuarterNumber,
  QuarterPeriod,
  RatingValue,
  User
} from '../types/types';
import {
  createCaseAuditId,
  createCaseId,
  createEmptyFindings,
  createISODateString,
  createPolicyId,
  ensureUserId,
  formatQuarterPeriod,
  isQuarterPeriod,
} from '../types/typeHelpers';
import {AUDIT_STATUS_ENUM, CASE_TYPE_ENUM, CLAIMS_STATUS_ENUM, DEFAULT_VALUE_ENUM, USER_ROLE_ENUM} from '../enums';
import {useCaseAuditHandlers} from '../hooks/useCaseAuditHandlers';
import {PruefensterModal} from './common';
import './QuarterlySelectionComponent.css';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {selectAuditData, selectUserRole, setCurrentUser, setUserRole} from '../store/caseAuditSlice';
import { CURRENCY } from '../types/currencyTypes';
import { AuditItem } from './QuarterlySelectionComponent.types';
import { generateNotificationDateForQuarterComponent } from '../mocks/mockData';

const QuarterlySelectionComponent: React.FC = () => {
  const {
    selectedQuarter,
    filteredYear,
    currentUserId,
    quarterlyAudits: quarterlyDossiers,
    handleSelectQuarterlyAudits: handleSelectQuarterlyDossiers,
    exportQuarterlyResults,
    handleQuarterChange,
    handleYearChange,
    handleUserChange: originalHandleUserChange,
    usersList,
    loading,
    canCompleteAudit,
    handleCompleteAudit
  } = useCaseAuditHandlers();
  
  const dispatch = useAppDispatch();
  
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [selectedAudit, setSelectedAudit] = useState<CaseAudit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Get available years (current year and 4 previous years)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11
  const currentQuarter = Math.floor(currentMonth / 3) + 1; // 1-4
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);
  
  // Filter quarters based on current date
  const getAvailableQuarters = (year: number) => {
    if (year < currentYear) {
      // For past years, show all quarters
      return [1, 2, 3, 4];
    } else if (year === currentYear) {
      // For current year, show only quarters up to the current one
      return Array.from({ length: currentQuarter }, (_, i) => i + 1);
    } else {
      // For future years (shouldn't happen with our UI), return empty array
      return [];
    }
  };
  
  const quarters = getAvailableQuarters(filteredYear);
  
        // Generate quarter options
  const quarterOptions = quarters.map(q => ({
    value: formatQuarterPeriod(q as QuarterNumber, filteredYear),
    label: `Q${q}-${filteredYear}`
  }));
  
  // Check if the current user is a team leader for button permission
  const reduxUserRole = useAppSelector(state => selectUserRole(state, currentUserId));
  const isTeamLeader = reduxUserRole?.role === USER_ROLE_ENUM.TEAM_LEADER;

  // Handle changing the current user (when dropdown changes) - override the hook version
  const handleUserChange = (userId: string) => {
    // Update Redux state first
    dispatch(setCurrentUser(userId));
    
    // Find the user in the users list and set their role immediately
    const user = usersList.find(u => u.id === userId);
    if (user) {
      dispatch(setUserRole({
        userId: userId,
        role: user.authorities,
        department: user.department ?? 'Unknown'
      }));
    }
    
    // Also call the original function from the hook
    originalHandleUserChange(userId);
  };
  
  // Get audit data from Redux to access latest completion data
  const auditData = useAppSelector(selectAuditData);
  
  // Handle auto-selection of audits for a quarter
  const handleAutoSelect = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // Check if user is a team leader
      if (!isTeamLeader) {
        setErrorMessage('Only team leaders can initiate quarterly audit selection.');
        return;
      }
      
      // Check if audits were already selected for this quarter
      if (quarterlyDossiers.userQuarterlyAudits.length > 0 || 
          quarterlyDossiers.previousQuarterRandomAudits.length > 0) {
        const confirmReselect = window.confirm(
          `Audits have already been selected for ${selectedQuarter}. Do you want to reselect?`
        );
        if (!confirmReselect) {
          return;
        }
      }
      
      await handleSelectQuarterlyDossiers(selectedQuarter);
    } catch (error) {
      console.error('Error selecting audits:', error);
      setErrorMessage('Failed to select audits. Please try again.');
    }
  };
  
  // Handle export of completion results
  const handleExport = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      await exportQuarterlyResults();
      setSuccessMessage(`Successfully exported results for ${selectedQuarter}`);
    } catch (error) {
      console.error('Error exporting results:', error);
      setErrorMessage('Failed to export results. Please try again.');
    }
  };
  
  // Find the user from usersList
  const findUserById = (userId: string) => {
    return usersList.find((user: User) => String(user.id) === String(userId));
  };
  
  // Handle closing the success message
  const handleCloseSuccessMessage = () => {
    setSuccessMessage('');
  };

  // Handle closing the error message
  const handleCloseErrorMessage = () => {
    setErrorMessage('');
  };
  
  // Helper function to get user initials by user ID
  const getUserInitials = (userId: string): string => {
    if (!userId) return '-';
    
    try {
      const user = usersList.find(u => u.id === userId);
      if (user && 'initials' in user && user.initials) {
        return user.initials;
      }
    } catch (error) {
      console.error(`Error finding initials for user ${userId}:`, error);
    }
    
    // If we can't find the user, generate initials from the userId
    return userId?.substring(0, 2).toUpperCase() || 'XX';
  };
  
  // Handle opening the completion modal
  const handleOpenCompletion = (auditId: string) => {
    try {
      // Find the audit in the quarterlyDossiers (including pre-loaded cases)
      const audit = [
        ...quarterlyDossiers.userQuarterlyAudits, 
        ...quarterlyDossiers.previousQuarterRandomAudits,
        ...(quarterlyDossiers.preLoadedCases || [])
      ].find(a => a.id === auditId) as AuditItem | undefined;
      
      if (!audit) {
        console.error('Audit not found for ID:', auditId);
        setErrorMessage('Audit nicht gefunden.');
        return;
      }

      // Get the latest audit data from Redux (which may include saved form state)
      const latestAuditData = auditData[audit.id];
      
      // Safely calculate notification date with error handling
      let notificationDate: string;
      try {
        const quarterToUse = (audit.quarter as string) || selectedQuarter;
        const [quarterStr, yearStr] = quarterToUse.split('-');
        const quarterNum = parseInt(quarterStr.replace('Q', '')) || 1;
        const year = parseInt(yearStr) || new Date().getFullYear();
        
        // Use centralized date generation function
        notificationDate = generateNotificationDateForQuarterComponent(quarterNum, year);
      } catch (error) {
        console.warn('Error calculating notification date, using fallback:', error);
        notificationDate = new Date().toISOString().split('T')[0];
      }
      
      // Convert to full CaseAudit object, merging with latest data from Redux
      const auditObject: CaseAudit = {
        id: createCaseAuditId(audit.id),
        userId: ensureUserId(audit.userId), // Ensure we have a proper UserId
        date: createISODateString(new Date()),
        clientName: `Client ${audit.id}`,
        policyNumber: createPolicyId( parseInt(audit.id.replace(/\D/g, '')) || DEFAULT_VALUE_ENUM.DEFAULT_POLICY_ID ),
        // Extract just the number from the ID or generate a random case number
        caseNumber: createCaseId(parseInt(audit.id.replace(/\D/g, '')) || DEFAULT_VALUE_ENUM.DEFAULT_CASE_NUMBER),
        dossierRisk: 0,
        dossierName: `Case ${audit.id}`,
        totalAmount: audit.coverageAmount || 0,
        coverageAmount: audit.coverageAmount || 0,
        isCompleted: Boolean(audit.isCompleted),
        isSpecialist: false,
        quarter: (audit.quarter as QuarterPeriod) || (selectedQuarter), // Use audit's quarter or fallback
        year: audit.year ?? parseInt(selectedQuarter?.split('-')[1] || String(new Date().getFullYear())),
        claimsStatus: (audit.claimsStatus as ClaimsStatus) || CLAIMS_STATUS_ENUM.FULL_COVER,
        auditor: audit.auditor ? ensureUserId(audit.auditor) : ensureUserId(currentUserId),
        status: audit.status ? (audit.status) : (audit.isCompleted ? AUDIT_STATUS_ENUM.COMPLETED : AUDIT_STATUS_ENUM.PENDING),
        // Use latest data from Redux if available, otherwise fall back to audit data
        comment: (latestAuditData?.comment || audit.comment) ?? '',
        rating: ((latestAuditData?.rating || audit.rating) ?? '') as RatingValue,
        specialFindings: latestAuditData?.specialFindings || audit.specialFindings || createEmptyFindings(),
        detailedFindings: latestAuditData?.detailedFindings || audit.detailedFindings || createEmptyFindings(),
        caseType: CASE_TYPE_ENUM.USER_QUARTERLY as CaseType,
        notificationDate,
        // Use the notified currency from the audit data, fallback to CHF
        notifiedCurrency: audit.notifiedCurrency ?? CURRENCY.CHF
      };
      
      // Set audit and open modal with slight delay to ensure DOM is ready
      setSelectedAudit(auditObject);
      
      // Use requestAnimationFrame to ensure state is updated before opening modal
      requestAnimationFrame(() => {
        setIsModalOpen(true);
      });
      
    } catch (error) {
      console.error('Error in handleOpenCompletion:', error);
      setErrorMessage('Fehler beim Öffnen des Prüffensters.');
    }
  };
  
  // Handle complete audit
  const handleCompleteAuditAction = async (auditId: string, auditorId: string, caseAuditData: CaseAuditData) => {
    try {
      // Call the audit completion handler (now async)
      await handleCompleteAudit(auditId, auditorId, caseAuditData);
      
      // Close the modal
      setIsModalOpen(false);
      setSelectedAudit(null);
      
      // Show success message
      setSuccessMessage('Audit erfolgreich verifiziert!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error completing audit:', error);
      // Show error message
      setErrorMessage('Fehler beim Verifizieren des Audits');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };
  
  
  return (
    <div className="quarterly-selection">
      <h2>IKS Quarterly Audit Selection</h2>
      
      <div className="quarterly-selection__controls">
        <div className="quarterly-selection__control-group">
          <select 
            id="year-select"
            value={filteredYear || ''}
            onChange={e => handleYearChange(parseInt(e.target.value))}
            disabled={loading}
          >
            <option value="" disabled>Year</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        
        <div className="quarterly-selection__control-group">
          <select
            id="quarter-select"
            value={selectedQuarter || ''}
            onChange={async (e) => {
              const value = e.target.value;
              if (isQuarterPeriod(value)) {
                await handleQuarterChange(value);
              } else {
                console.warn('Invalid quarter period format:', value);
              }
            }}
            disabled={loading}
          >
            <option value="" disabled>Quarter</option>
            {quarterOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        
        <div className="quarterly-selection__control-group">
          <select
            id="user-select"
            value={currentUserId}
            onChange={e => handleUserChange(e.target.value)}
            disabled={loading}
          >
            <option value="" disabled>Current User:</option>
            {usersList.map((user: User) => (
              <option key={user.id} value={user.id}>
                {user.displayName} ({user.authorities})
              </option>
            ))}
          </select>
        </div>
        <div className="quarterly-selection__button-group">
        <button 
          onClick={handleAutoSelect}
          disabled={loading || !isTeamLeader}
          className="primary-button"
        >
          {loading ? 'Loading...' : 'Auto-Select Audits'}
        </button>
        
        <button 
          onClick={handleExport}
          disabled={loading}
          className="secondary-button"
        >
          Export Results
        </button>
      </div>
      </div>
      
      {errorMessage && (
        <div className="quarterly-selection__error-message">
          <span className="quarterly-selection__error-text">{errorMessage}</span>
          <button 
            className="quarterly-selection__close-button" 
            onClick={handleCloseErrorMessage}
            aria-label="Close error message"
            title="Close"
          >
            ✕
          </button>
        </div>
      )}
      {successMessage && (
        <div className="quarterly-selection__success-message">
          <span className="quarterly-selection__success-text">{successMessage}</span>
          <button 
            className="quarterly-selection__close-button" 
            onClick={handleCloseSuccessMessage}
            aria-label="Close success message"
            title="Close"
          >
            ✕
          </button>
        </div>
      )}
      
      {/* Audit Tables */}
      <div className="audit-tables">
        <div className="audit-table">
          {quarterlyDossiers.userQuarterlyAudits.length === 0 && quarterlyDossiers.previousQuarterRandomAudits.length === 0 ? (
            // Show current pre-loaded cases and quarter display cases, but indicate no quarterly selection has been made
            <div>
              {/* Show pre-loaded cases if available */}
              {quarterlyDossiers.preLoadedCases && quarterlyDossiers.preLoadedCases.length > 0 && (
                <div>
                  <h3>Current Cases</h3>
                  <table>
                    <thead>
                      <tr>
                        <th data-testid="case-id-header">CaseID</th>
                        <th data-testid="quarter-header">Quartal</th>
                        <th data-testid="responsible-user-header">Verantwortlicher Fallbearbeiter</th>
                        <th data-testid="completion-result-header">Prüfergebnis</th>
                        <th data-testid="verifier-header">Prüfer</th>
                        <th data-testid="actions-header">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quarterlyDossiers.preLoadedCases.map((audit: AuditItem) => {
                        const user = findUserById(audit.userId);
                        const latestAuditData = auditData[audit.id];
                        const currentStatus = latestAuditData?.status || audit.status;
                        const currentAuditor = latestAuditData?.auditor || audit.auditor;
                        let canComplete = false;
                        try {
                          canComplete = canCompleteAudit(audit.id);
                        } catch {
                          // If canCompleteAudit throws an error, keep canComplete as false
                        }
                        return (
                          <tr key={audit.id}>
                            <td>{audit.id}</td>
                            <td>{audit.quarter}</td>
                            <td>{user ? user.displayName : 'Unknown'}</td>
                            <td>{currentStatus as AUDIT_STATUS_ENUM === AUDIT_STATUS_ENUM.COMPLETED ? 'Geprüft' : 
                                 currentStatus as AUDIT_STATUS_ENUM === AUDIT_STATUS_ENUM.IN_PROGRESS ? 'In Bearbeitung' : 'Nicht geprüft'}</td>
                            <td>{getUserInitials(currentAuditor ?? '')}</td>
                            <td>
                              <button
                                className="complete-button"
                                onClick={() => handleOpenCompletion(audit.id)}
                                disabled={!canComplete}
                              >
                                {currentStatus as AUDIT_STATUS_ENUM === AUDIT_STATUS_ENUM.COMPLETED ? 'Ansehen' : 'Prüfen'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Show quarter display cases if available */}
              {quarterlyDossiers.quarterDisplayCases && quarterlyDossiers.quarterDisplayCases.length > 0 && (
                <div>
                  <h3>All Cases for {selectedQuarter}</h3>
                  <table>
                    <thead>
                      <tr>
                        <th data-testid="case-id-header">CaseID</th>
                        <th data-testid="quarter-header">Quartal</th>
                        <th data-testid="responsible-user-header">Verantwortlicher Fallbearbeiter</th>
                        <th data-testid="coverage-amount-header">Schadenssumme</th>
                        <th data-testid="claims-status-header">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quarterlyDossiers.quarterDisplayCases.map((caseItem: AuditItem) => {
                        const user = findUserById(caseItem.userId);
                        return (
                          <tr key={caseItem.id}>
                            <td>{caseItem.id}</td>
                            <td>{caseItem.quarter}</td>
                            <td>{user ? user.displayName : 'Unknown'}</td>
                            <td>{caseItem.coverageAmount?.toLocaleString()} {caseItem.notifiedCurrency ?? CURRENCY.CHF}</td>
                            <td>{caseItem.claimsStatus}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Always show this message when no quarterly audits have been selected */}
              <p className="no-data">Keine Audits für dieses Quartal ausgewählt.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th data-testid="case-id-header">CaseID</th>
                  <th data-testid="quarter-header">Quartal</th>
                  <th data-testid="responsible-user-header">Verantwortlicher Fallbearbeiter</th>
                  <th data-testid="completion-result-header">Prüfergebnis</th>
                  <th data-testid="verifier-header">Prüfer</th>
                  <th data-testid="actions-header">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {/* Preloaded Cases (verified and in-progress cases) */}
                {quarterlyDossiers.preLoadedCases && quarterlyDossiers.preLoadedCases.map((audit: AuditItem) => {
                  const user = findUserById(audit.userId);
                  // Get the latest audit data from Redux to ensure we show current status
                  const latestAuditData = auditData[audit.id];
                  
                  // Use Redux data for status if available, otherwise fallback to audit data
                  const currentStatus = latestAuditData?.status || audit.status;
                  const currentAuditor = latestAuditData?.auditor || audit.auditor;
                  
                  // Store the result of canCompleteAudit in a variable with a default false value for safety
                  let canComplete = false;
                  try {
                    canComplete = canCompleteAudit(audit.id);
                  } catch {
                    // If canCompleteAudit throws an error, keep canComplete as false
                  }
                  return (
                    <tr key={audit.id}>
                      <td>{audit.id}</td>
                      <td>{audit.quarter}</td>
                      <td>{user ? user.displayName : 'Unknown'}</td>
                      <td>{currentStatus as AUDIT_STATUS_ENUM === AUDIT_STATUS_ENUM.COMPLETED ? 'Geprüft' : 
                           currentStatus as AUDIT_STATUS_ENUM === AUDIT_STATUS_ENUM.IN_PROGRESS ? 'In Bearbeitung' : 'Nicht geprüft'}</td>
                      <td>{getUserInitials(currentAuditor ?? '')}</td>
                      <td>
                        <button
                          className="complete-button"
                          onClick={() => handleOpenCompletion(audit.id)}
                          disabled={!canComplete}
                        >
                          {currentStatus as AUDIT_STATUS_ENUM === AUDIT_STATUS_ENUM.COMPLETED ? 'Ansehen' : 'Prüfen'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                
                {/* User Quarterly Audits */}
                {quarterlyDossiers.userQuarterlyAudits.map((audit: AuditItem) => {
                  const user = findUserById(audit.userId);
                  // Get the latest audit data from Redux to ensure we show current status
                  const latestAuditData = auditData[audit.id];
                  
                  // Use Redux data for status if available, otherwise fallback to audit data
                  const currentStatus = latestAuditData?.status || audit.status;
                  const currentAuditor = latestAuditData?.auditor || audit.auditor;
                  
                  // Store the result of canCompleteAudit in a variable with a default false value for safety
                  let canComplete = false;
                  try {
                    canComplete = canCompleteAudit(audit.id);
                  } catch {
                    // If canCompleteAudit throws an error, keep canComplete as false
                  }
                  return (
                    <tr key={audit.id}>
                      <td>{audit.id}</td>
                      <td>{audit.quarter}</td>
                      <td>{user ? user.displayName : 'Unknown'}</td>
                      <td>{currentStatus as AUDIT_STATUS_ENUM === AUDIT_STATUS_ENUM.COMPLETED ? 'Geprüft' : 
                           currentStatus as AUDIT_STATUS_ENUM === AUDIT_STATUS_ENUM.IN_PROGRESS ? 'In Bearbeitung' : 'Nicht geprüft'}</td>
                      <td>{getUserInitials(currentAuditor ?? '')}</td>
                      <td>
                        <button
                          className="complete-button"
                          onClick={() => handleOpenCompletion(audit.id)}
                          disabled={!canComplete}
                        >
                          {currentStatus as AUDIT_STATUS_ENUM === AUDIT_STATUS_ENUM.COMPLETED ? 'Ansehen' : 'Prüfen'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                
                {/* Random Previous Quarter Audits */}
                {quarterlyDossiers.previousQuarterRandomAudits.map((audit: AuditItem) => {
                  const user = findUserById(audit.userId);
                  // Get the latest audit data from Redux to ensure we show current status
                  const latestAuditData = auditData[audit.id];
                  
                  // Use Redux data for status if available, otherwise fallback to audit data
                  const currentStatus = latestAuditData?.status || audit.status;
                  const currentAuditor = latestAuditData?.auditor || audit.auditor;
                  
                  // Store the result of canCompleteAudit in a variable with a default false value for safety
                  let canComplete = false;
                  try {
                    canComplete = canCompleteAudit(audit.id);
                  } catch {
                    // If canCompleteAudit throws an error, keep canComplete as false
                  }
                  
                  return (
                    <tr key={audit.id}>
                      <td>{audit.id}</td>
                      <td>{audit.quarter}</td>
                      <td>{user ? user.displayName : audit.userId}</td>
                      <td>{currentStatus as AUDIT_STATUS_ENUM === AUDIT_STATUS_ENUM.COMPLETED ? 'Geprüft' : 
                           currentStatus as AUDIT_STATUS_ENUM === AUDIT_STATUS_ENUM.IN_PROGRESS ? 'In Bearbeitung' : 'Nicht geprüft'}</td>
                      <td>{getUserInitials(currentAuditor ?? '')}</td>
                      <td>
                        <button
                          className="complete-button"
                          onClick={() => handleOpenCompletion(audit.id)}
                          disabled={!canComplete}
                        >
                          {currentStatus as AUDIT_STATUS_ENUM === AUDIT_STATUS_ENUM.COMPLETED ? 'Ansehen' : 'Prüfen'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* Completion Modal */}
      {selectedAudit && (
        <PruefensterModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          audit={selectedAudit}
          onVerify={handleCompleteAuditAction}
        />
      )}
    </div>
  );
};

export default QuarterlySelectionComponent;
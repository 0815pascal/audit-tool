import React, { useState } from 'react';
import { 
  ClaimsStatus, CaseType, RatingValue, QuarterNumber, 
  QuarterPeriod,
  User, FindingsRecord,
  CaseAuditStatus,
  CaseAudit,
  CaseAuditData
} from '../types/types';
import {
  ensureUserId, 
  createISODateString,
  createPolicyId, 
  createCaseId,
  createEmptyFindings,
  isQuarterPeriod,
  createCaseAuditId,
} from '../types/typeHelpers';
import { USER_ROLE_ENUM, CASE_TYPE_ENUM, AUDIT_STATUS_ENUM, DEFAULT_VALUE_ENUM, CLAIMS_STATUS_ENUM } from '../enums';
import { useCaseAuditHandlers } from '../hooks/useCaseAuditHandlers';
import { PruefensterModal } from './common';
import './QuarterlySelectionComponent.css';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  selectUserRole,
  setCurrentUser,
  selectAuditData,
  formatQuarterYear
} from '../store/caseAuditSlice';
import { QUARTER_CALCULATIONS } from '../constants';

// Define an interface for what we actually get from the API/store
// This interface is compatible with both CaseAuditStatus and AUDIT_STATUS_ENUM
interface AuditItem {
  id: string;
  userId: string;
  status: CaseAuditStatus | AUDIT_STATUS_ENUM;
  auditor?: string;
  coverageAmount: number;
  isCompleted: boolean;
  isAkoReviewed?: boolean;
  claimsStatus?: ClaimsStatus;
  comment?: string;
  rating?: string;
  specialFindings?: FindingsRecord;
  detailedFindings?: FindingsRecord;  
  quarter?: string;
  year?: number;
  caseType?: string;
  notifiedCurrency?: string;
}

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
    value: formatQuarterYear(q as QuarterNumber, filteredYear),
    label: `Q${q}-${filteredYear}`
  }));
  
  // Check if the current user is a team leader for button permission
  const reduxUserRole = useAppSelector(state => selectUserRole(state, currentUserId));
  const isTeamLeader = reduxUserRole?.role === USER_ROLE_ENUM.TEAM_LEADER;

  // Handle changing the current user (when dropdown changes) - override the hook version
  const handleUserChange = (userId: string) => {
    dispatch(setCurrentUser(userId));
    originalHandleUserChange(userId); // Also call the original function
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
  const handleExport = () => {
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      exportQuarterlyResults();
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
    // Find the audit in the quarterlyDossiers
    const audit = [...quarterlyDossiers.userQuarterlyAudits, ...quarterlyDossiers.previousQuarterRandomAudits]
      .find(a => a.id === auditId) as AuditItem | undefined;
    
    if (audit) {
      // Check if isAkoReviewed exists in the audit and ensure it's a boolean
      const isAkoReviewed = typeof audit.isAkoReviewed === 'boolean' ? audit.isAkoReviewed : false;
      
      // Get the latest audit data from Redux (which may include saved form state)
      const latestAuditData = auditData[auditId];
      
      console.log('=== DEBUG: handleOpenCompletion ===');
      console.log('auditId:', auditId);
      console.log('audit from quarterlyDossiers:', audit);
      console.log('latestAuditData from Redux:', latestAuditData);
      console.log('audit.rating:', audit.rating);
      console.log('latestAuditData?.rating:', latestAuditData?.rating);
      
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
        totalAmount: audit.coverageAmount,
        coverageAmount: audit.coverageAmount,
        isCompleted: audit.isCompleted,
        isAkoReviewed,
        isSpecialist: false,
        quarter: (audit.quarter as QuarterPeriod) || (selectedQuarter), // Use audit's quarter or fallback
        year: audit.year ?? parseInt(selectedQuarter.split('-')[1]),
        claimsStatus: (audit.claimsStatus as ClaimsStatus) || CLAIMS_STATUS_ENUM.FULL_COVER,
        auditor: audit.auditor ? ensureUserId(audit.auditor) : ensureUserId(currentUserId),
        status: audit.status ? (audit.status as CaseAuditStatus) : (audit.isCompleted ? AUDIT_STATUS_ENUM.COMPLETED : AUDIT_STATUS_ENUM.PENDING),
        // Use latest data from Redux if available, otherwise fall back to audit data
        comment: latestAuditData?.comment || audit.comment || '',
        rating: (latestAuditData?.rating || audit.rating || '') as RatingValue,
        specialFindings: latestAuditData?.specialFindings || audit.specialFindings || createEmptyFindings(),
        detailedFindings: latestAuditData?.detailedFindings || audit.detailedFindings || createEmptyFindings(),
        caseType: CASE_TYPE_ENUM.USER_QUARTERLY as CaseType,
        // Calculate notification date from quarter information
        notificationDate: (() => {
          const quarterToUse = (audit.quarter as string) || selectedQuarter;
          const [quarterStr, yearStr] = quarterToUse.split('-');
          const quarterNum = parseInt(quarterStr.replace('Q', ''));
          const year = parseInt(yearStr);
          
          // Generate a realistic date within the quarter
          // Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec
          const startMonth = (quarterNum - 1) * QUARTER_CALCULATIONS.MONTHS_PER_QUARTER; // 0-indexed month
          const randomDay = Math.floor(Math.random() * QUARTER_CALCULATIONS.RANDOM_DAY_LIMIT) + 1; // 1-28 to avoid month-end issues
          const randomMonth = startMonth + Math.floor(Math.random() * QUARTER_CALCULATIONS.MONTHS_PER_QUARTER); // Random month within quarter
          
          const notificationDate = new Date(year, randomMonth, randomDay);
          return notificationDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
        })(),
        // Use the notified currency from the audit data, fallback to CHF
        notifiedCurrency: audit.notifiedCurrency ?? 'CHF'
      };
      
      console.log('Final auditObject.rating:', auditObject.rating);
      console.log('Final auditObject.notifiedCurrency:', auditObject.notifiedCurrency);
      console.log('Original audit.notifiedCurrency:', audit.notifiedCurrency);
      console.log('=== END DEBUG ===');
      
      setSelectedAudit(auditObject);
      setIsModalOpen(true);
    }
  };
  
  // Handle complete audit
  const handleCompleteAuditAction = (auditId: string, auditorId: string, caseAuditData: CaseAuditData) => {
    console.log('=== Complete Audit Debug ===');
    console.log('auditId:', auditId);
    console.log('auditorId:', auditorId);
    console.log('caseAuditData:', caseAuditData);
    
    // Call the audit completion handler
    handleCompleteAudit(auditId, auditorId, caseAuditData);
    
    // Close the modal
    setIsModalOpen(false);
    setSelectedAudit(null);
    
    // Show success message
    setSuccessMessage('Audit erfolgreich verifiziert!');
    setTimeout(() => setSuccessMessage(''), 3000);
    console.log('=== End Complete Audit Debug ===');
  };
  
  const convertToAuditStatus = (status: CaseAuditStatus | AUDIT_STATUS_ENUM): AUDIT_STATUS_ENUM => {
    // Handle both string statuses and enum values
    const statusString = typeof status === 'string' ? status : String(status);
    
    // Check if it's already an AUDIT_STATUS_ENUM value
    if (Object.values(AUDIT_STATUS_ENUM).includes(statusString as AUDIT_STATUS_ENUM)) {
      return statusString as AUDIT_STATUS_ENUM;
    }
    
    // Map CaseAuditStatus to AUDIT_STATUS_ENUM
    switch (statusString) {
      case AUDIT_STATUS_ENUM.COMPLETED:
        return AUDIT_STATUS_ENUM.COMPLETED;
      case AUDIT_STATUS_ENUM.IN_PROGRESS:
        return AUDIT_STATUS_ENUM.IN_PROGRESS;
      case AUDIT_STATUS_ENUM.PENDING:
        return AUDIT_STATUS_ENUM.PENDING;
      default:
        return AUDIT_STATUS_ENUM.PENDING;
    }
  };
  
  return (
    <div className="quarterly-selection">
      <h2>IKS Quarterly Audit Selection</h2>
      
      <div className="selection-controls">
        <div className="control-group">
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
        
        <div className="control-group">
          <select
            id="quarter-select"
            value={selectedQuarter || ''}
            onChange={e => {
              const value = e.target.value;
              if (isQuarterPeriod(value)) {
                handleQuarterChange(value);
              } else {
                console.warn('Invalid quarter period format:', value);
              }
            }}            disabled={loading}
          >
            <option value="" disabled>Quarter</option>
            {quarterOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
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
        <div className="button-group">
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
        <div className="error-message">
          <span className="error-text">{errorMessage}</span>
          <button 
            className="close-button" 
            onClick={handleCloseErrorMessage}
            aria-label="Close error message"
            title="Close"
          >
            ✕
          </button>
        </div>
      )}
      {successMessage && (
        <div className="success-message">
          <span className="success-text">{successMessage}</span>
          <button 
            className="close-button" 
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
            <p className="no-data">Keine Audits für dieses Quartal ausgewählt.</p>
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
                      <td>{convertToAuditStatus(currentStatus) === AUDIT_STATUS_ENUM.COMPLETED ? 'Geprüft' : 
                           convertToAuditStatus(currentStatus) === AUDIT_STATUS_ENUM.IN_PROGRESS ? 'In Bearbeitung' : 'Nicht geprüft'}</td>
                      <td>{getUserInitials(currentAuditor ?? '')}</td>
                      <td>
                        <button
                          className="complete-button"
                          onClick={() => handleOpenCompletion(audit.id)}
                          disabled={!canComplete}
                        >
                          {convertToAuditStatus(currentStatus) === AUDIT_STATUS_ENUM.COMPLETED ? 'Ansehen' : 'Prüfen'}
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
                      <td>{convertToAuditStatus(currentStatus) === AUDIT_STATUS_ENUM.COMPLETED ? 'Geprüft' : 
                           convertToAuditStatus(currentStatus) === AUDIT_STATUS_ENUM.IN_PROGRESS ? 'In Bearbeitung' : 'Nicht geprüft'}</td>
                      <td>{getUserInitials(currentAuditor ?? '')}</td>
                      <td>
                        <button
                          className="complete-button"
                          onClick={() => handleOpenCompletion(audit.id)}
                          disabled={!canComplete}
                        >
                          {convertToAuditStatus(currentStatus) === AUDIT_STATUS_ENUM.COMPLETED ? 'Ansehen' : 'Prüfen'}
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

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(QuarterlySelectionComponent);
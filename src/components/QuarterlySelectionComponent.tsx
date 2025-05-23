import React, { useState } from 'react';
import { 
  ClaimsStatus, CaseType, RatingValue, QuarterNumber, 
  QuarterPeriod,
  ensureUserId, createISODateString,
  createPolicyId, createCaseId,
  User, FindingsRecord, createEmptyFindings
} from '../types';
import {
  CaseAudit,
  createCaseAuditId,
  CaseAuditStatus,
  CaseAuditData
} from '../caseAuditTypes';
import { USER_ROLE_ENUM, CASE_TYPE_ENUM, VERIFICATION_STATUS_ENUM, DEFAULT_VALUE_ENUM } from '../enums';
import { useCaseAuditHandlers } from '../hooks/useCaseAuditHandlers';
import { formatQuarterYear } from '../store/caseAuditSlice';
import { PruefensterModal } from './common/PruefensterModal';
import './QuarterlySelectionComponent.css';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  selectUserRole,
  setCurrentUser,
  selectAuditData
} from '../store/caseAuditSlice';

// Import the users directly from the mock data for initials conversion
import { users } from '../mocks/handlers';

// Define an interface for what we actually get from the API/store
// This interface is compatible with both CaseAuditStatus and VERIFICATION_STATUS_ENUM
interface AuditItem {
  id: string;
  userId: string;
  status: CaseAuditStatus | VERIFICATION_STATUS_ENUM;
  verifier?: string;
  coverageAmount: number;
  isVerified: boolean;
  isAkoReviewed?: boolean;
  claimsStatus?: ClaimsStatus;
  comment?: string;
  rating?: string;
  specialFindings?: FindingsRecord;
  detailedFindings?: FindingsRecord;  
  quarter?: string;
  year?: number;
  caseType?: string;
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
    handleVerify,
    canVerifyAudit
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
  
  // Get audit data from Redux to access latest verification data
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
      setSuccessMessage(`Successfully selected audits for ${selectedQuarter}`);
    } catch (error) {
      console.error('Error selecting audits:', error);
      setErrorMessage('Failed to select audits. Please try again.');
    }
  };
  
  // Handle export of verification results
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
      const user = users.find(u => u.id === userId);
      if (user && 'initials' in user && user.initials) {
        return user.initials;
      }
    } catch (error) {
      console.error(`Error finding initials for user ${userId}:`, error);
    }
    
    // If we can't find the user, generate initials from the userId
    return userId?.substring(0, 2).toUpperCase() || 'XX';
  };
  
  // Handle opening the verification modal
  const handleOpenVerification = (auditId: string) => {
    // Find the audit in the quarterlyDossiers
    const audit = [...quarterlyDossiers.userQuarterlyAudits, ...quarterlyDossiers.previousQuarterRandomAudits]
      .find(a => a.id === auditId) as AuditItem | undefined;
    
    if (audit) {
      // Check if isAkoReviewed exists in the audit and ensure it's a boolean
      const isAkoReviewed = typeof audit.isAkoReviewed === 'boolean' ? audit.isAkoReviewed : false;
      
      // Get the latest audit data from Redux (which may include saved form state)
      const latestAuditData = auditData[auditId];
      
      console.log('=== DEBUG: handleOpenVerification ===');
      console.log('auditId:', auditId);
      console.log('audit from quarterlyDossiers:', audit);
      console.log('latestAuditData from Redux:', latestAuditData);
      console.log('audit.rating:', audit.rating);
      console.log('latestAuditData?.rating:', latestAuditData?.rating);
      
      // Convert to full CaseAudit object, merging with latest data from Redux
      const auditObject: CaseAudit = {
        id: typeof audit.id === 'string' ? createCaseAuditId(audit.id) : audit.id,
        userId: ensureUserId(audit.userId), // Ensure we have a proper UserId
        date: createISODateString(new Date()),
        clientName: `Client ${audit.id}`,
        policyNumber: createPolicyId(typeof audit.id === 'string' ? parseInt(audit.id.replace(/\D/g, '')) || DEFAULT_VALUE_ENUM.DEFAULT_POLICY_ID : DEFAULT_VALUE_ENUM.DEFAULT_POLICY_ID),
        // Extract just the number from the ID or generate a random case number
        caseNumber: createCaseId(typeof audit.id === 'string' ? parseInt(audit.id.replace(/\D/g, '')) || DEFAULT_VALUE_ENUM.DEFAULT_CASE_NUMBER : DEFAULT_VALUE_ENUM.DEFAULT_CASE_NUMBER),
        dossierRisk: 0,
        dossierName: `Case ${audit.id}`,
        totalAmount: audit.coverageAmount,
        coverageAmount: audit.coverageAmount,
        isVerified: audit.isVerified,
        isAkoReviewed,
        isSpecialist: false,
        quarter: selectedQuarter as QuarterPeriod, // Cast to QuarterPeriod
        year: parseInt(selectedQuarter.split('-')[1]),
        claimsStatus: (audit.claimsStatus as ClaimsStatus) || ('FULL_COVER' as ClaimsStatus),
        verifier: audit.verifier ? ensureUserId(audit.verifier) : ensureUserId(currentUserId),
        // Use latest data from Redux if available, otherwise fall back to audit data
        comment: latestAuditData?.comment || audit.comment || '',
        rating: (latestAuditData?.rating || audit.rating || '') as RatingValue,
        specialFindings: latestAuditData?.specialFindings || audit.specialFindings || createEmptyFindings(),
        detailedFindings: latestAuditData?.detailedFindings || audit.detailedFindings || createEmptyFindings(),
        caseType: CASE_TYPE_ENUM.USER_QUARTERLY as CaseType
      };
      
      console.log('Final auditObject.rating:', auditObject.rating);
      console.log('=== END DEBUG ===');
      
      setSelectedAudit(auditObject);
      setIsModalOpen(true);
    }
  };
  
  // Handle verify audit
  const handleVerifyAudit = (auditId: string, verifierId: string, caseAuditData: CaseAuditData) => {
    console.log('=== Verify Audit Debug ===');
    console.log('auditId:', auditId);
    console.log('verifierId:', verifierId);
    console.log('caseAuditData:', caseAuditData);
    
    // Call the audit verification handler
    handleVerify(auditId, verifierId, caseAuditData);
    
    // Close the modal
    setIsModalOpen(false);
    setSelectedAudit(null);
    
    // Show success message
    setSuccessMessage('Audit erfolgreich verifiziert!');
    setTimeout(() => setSuccessMessage(''), 3000);
    console.log('=== End Verify Debug ===');
  };
  
  // Note: Reject functionality removed - audit outcomes are now handled through the Prüfergebnis dropdown
  // where users can select "Überwiegend nicht erfüllt" for failed audits
  
  const convertToVerificationStatus = (status: CaseAuditStatus | VERIFICATION_STATUS_ENUM): VERIFICATION_STATUS_ENUM => {
    // Handle both string statuses and enum values
    const statusString = typeof status === 'string' ? status : String(status);
    
    // Check if it's already a VERIFICATION_STATUS_ENUM value
    if (Object.values(VERIFICATION_STATUS_ENUM).includes(statusString as VERIFICATION_STATUS_ENUM)) {
      return statusString as VERIFICATION_STATUS_ENUM;
    }
    
    // Map CaseAuditStatus to VERIFICATION_STATUS_ENUM 
    switch (statusString) {
      case CaseAuditStatus.VERIFIED:
        return VERIFICATION_STATUS_ENUM.VERIFIED;
      case CaseAuditStatus.IN_PROGRESS:
        return VERIFICATION_STATUS_ENUM.IN_PROGRESS;
      case CaseAuditStatus.NOT_VERIFIED:
        return VERIFICATION_STATUS_ENUM.NOT_VERIFIED;
      default:
        console.warn(`Unknown status: ${statusString}, defaulting to NOT_VERIFIED`);
        return VERIFICATION_STATUS_ENUM.NOT_VERIFIED;
    }
  };
  
  return (
    <div className="quarterly-selection">
      <h2>IKS Quarterly Audit Selection</h2>
      
      <div className="selection-controls">
        <div className="control-group">
          <label htmlFor="year-select">Year:</label>
          <select 
            id="year-select"
            value={filteredYear}
            onChange={e => handleYearChange(parseInt(e.target.value))}
            disabled={loading}
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label htmlFor="quarter-select">Quarter:</label>
          <select
            id="quarter-select"
            value={selectedQuarter}
            onChange={e => handleQuarterChange(e.target.value)}
            disabled={loading}
          >
            {quarterOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label htmlFor="user-select">Current User:</label>
          <select
            id="user-select"
            value={currentUserId}
            onChange={e => handleUserChange(e.target.value)}
            disabled={loading}
          >
            {usersList.map((user: User) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.role})
              </option>
            ))}
          </select>
        </div>
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
      
      <div className="quarterly-status">
        <h3>Status for {selectedQuarter}</h3>
        <div className="status-summary">
          <div className="status-item">
            <span className="status-label">User Audits:</span>
            <span className="status-value">{quarterlyDossiers.userQuarterlyAudits.length}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Random Previous Quarter Audits:</span>
            <span className="status-value">{quarterlyDossiers.previousQuarterRandomAudits.length}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Total Audits:</span>
            <span className="status-value">
              {quarterlyDossiers.userQuarterlyAudits.length + 
               quarterlyDossiers.previousQuarterRandomAudits.length}
            </span>
          </div>
        </div>
      </div>
      
      {/* Audit Tables */}
      <div className="audit-tables">
        <div className="audit-table">
          <h3>Quartals-Check {selectedQuarter}</h3>
          {quarterlyDossiers.userQuarterlyAudits.length === 0 && quarterlyDossiers.previousQuarterRandomAudits.length === 0 ? (
            <p className="no-data">Keine Audits für dieses Quartal ausgewählt.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th data-testid="case-id-header">CaseID</th>
                  <th data-testid="quarter-header">Quartal</th>
                  <th data-testid="responsible-user-header">Verantwortlicher Fallbearbeiter</th>
                  <th data-testid="verification-result-header">Prüfergebnis</th>
                  <th data-testid="verifier-header">Prüfer</th>
                  <th data-testid="actions-header">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {/* User Quarterly Audits */}
                {quarterlyDossiers.userQuarterlyAudits.map((audit: AuditItem) => {
                  const user = findUserById(audit.userId);
                  // Store the result of canVerifyAudit in a variable with a default false value for safety
                  let canVerify = false;
                  if (audit && audit.id) {
                    try {
                      canVerify = canVerifyAudit(audit.id);
                    } catch (error) {
                      console.error(`Error checking if audit can be verified:`, error);
                    }
                  }
                  return (
                    <tr key={audit.id}>
                      <td>{audit.id}</td>
                      <td>{audit.quarter}</td>
                      <td>{user ? user.name : 'Unknown'}</td>
                      <td>{convertToVerificationStatus(audit.status) === VERIFICATION_STATUS_ENUM.VERIFIED ? 'Geprüft' : 
                           convertToVerificationStatus(audit.status) === VERIFICATION_STATUS_ENUM.IN_PROGRESS ? 'In Bearbeitung' : 'Nicht geprüft'}</td>
                      <td>{getUserInitials(audit.verifier || '')}</td>
                      <td>
                        <button
                          className="verify-button"
                          onClick={() => handleOpenVerification(audit.id)}
                          disabled={!canVerify}
                        >
                          {convertToVerificationStatus(audit.status) === VERIFICATION_STATUS_ENUM.VERIFIED ? 'Ansehen' : 'Prüfen'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                
                {/* Random Previous Quarter Audits */}
                {quarterlyDossiers.previousQuarterRandomAudits.map((audit: AuditItem) => {
                  const user = findUserById(audit.userId);
                  // Store the result of canVerifyAudit in a variable with a default false value for safety
                  let canVerify = false;
                  if (audit && audit.id) {
                    try {
                      canVerify = canVerifyAudit(audit.id);
                    } catch (error) {
                      console.error(`Error checking if audit ${audit.id} can be verified:`, error);
                    }
                  }
                  
                  return (
                    <tr key={audit.id}>
                      <td>{audit.id}</td>
                      <td>{audit.quarter}</td>
                      <td>{user ? user.name : audit.userId}</td>
                      <td>{convertToVerificationStatus(audit.status) === VERIFICATION_STATUS_ENUM.VERIFIED ? 'Geprüft' : 
                           convertToVerificationStatus(audit.status) === VERIFICATION_STATUS_ENUM.IN_PROGRESS ? 'In Bearbeitung' : 'Nicht geprüft'}</td>
                      <td>{getUserInitials(audit.verifier || '')}</td>
                      <td>
                        <button
                          className="verify-button"
                          onClick={() => handleOpenVerification(audit.id)}
                          disabled={!canVerify}
                        >
                          {convertToVerificationStatus(audit.status) === VERIFICATION_STATUS_ENUM.VERIFIED ? 'Ansehen' : 'Prüfen'}
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
      
      {/* Verification Modal */}
      {selectedAudit && (
        <PruefensterModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          audit={selectedAudit}
          onVerify={handleVerifyAudit}
        />
      )}
    </div>
  );
};

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(QuarterlySelectionComponent);
import React, { useState } from 'react';
import { 
  ClaimsStatus, CaseType, RatingValue, QuarterNumber, 
  QuarterPeriod,
  ensureUserId, createISODateString,
  createPolicyId, createCaseId
} from '../types';
import {
  CaseAudit,
  CaseAuditId,
  createCaseAuditId
} from '../caseAuditTypes';
import { USER_ROLE_ENUM, CASE_TYPE_ENUM, VERIFICATION_STATUS_ENUM } from '../enums';
import { useCaseAuditHandlers } from '../hooks/useCaseAuditHandlers';
import { formatQuarterYear } from '../store/caseAuditSlice';
import { PruefensterModal } from './common/PruefensterModal';
import './QuarterlySelectionComponent.css';

const QuarterlySelectionComponent: React.FC = () => {
  const { 
    selectedQuarter, 
    filteredYear,
    currentUserId,
    currentUserRole,
    quarterlyAudits: quarterlyDossiers,
    handleSelectQuarterlyAudits: handleSelectQuarterlyDossiers,
    exportQuarterlyResults,
    handleQuarterChange,
    handleYearChange,
    handleUserChange,
    usersList,
    loading,
    handleVerify,
    handleReject,
    canVerifyAudit
  } = useCaseAuditHandlers();
  
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
  
  // Handle opening the verification modal
  const handleOpenVerification = (auditId: string) => {
    // Find the audit in the quarterlyDossiers
    const audit = [...quarterlyDossiers.userQuarterlyAudits, ...quarterlyDossiers.previousQuarterRandomAudits]
      .find(a => a.id === auditId);
    
    if (audit) {
      // Convert to full CaseAudit object
      const auditObject: CaseAudit = {
        id: typeof audit.id === 'string' ? createCaseAuditId(audit.id) : audit.id,
        userId: audit.userId,
        date: createISODateString(new Date()),
        clientName: `Client ${audit.id}`,
        policyNumber: createPolicyId(typeof audit.id === 'string' ? parseInt(audit.id.replace(/\D/g, '')) || 10000 : 10000),
        // Extract just the number from the ID or generate a random case number
        caseNumber: createCaseId(typeof audit.id === 'string' ? parseInt(audit.id.replace(/\D/g, '')) || 30000000 : 30000000),
        dossierRisk: 0,
        dossierName: `Case ${audit.id}`,
        totalAmount: audit.coverageAmount,
        coverageAmount: audit.coverageAmount,
        isVerified: audit.isVerified,
        isAkoReviewed: audit.isAkoReviewed,
        isSpecialist: false,
        quarter: selectedQuarter as QuarterPeriod, // Cast to QuarterPeriod
        year: parseInt(selectedQuarter.split('-')[1]),
        claimsStatus: (audit.claimsStatus as ClaimsStatus) || ('FULL_COVER' as ClaimsStatus),
        verifier: audit.verifier || ensureUserId(currentUserId),
        comment: audit.comment || '',
        rating: (audit.rating || '') as RatingValue,
        specialFindings: audit.specialFindings || {},
        detailedFindings: audit.detailedFindings || {},
        caseType: CASE_TYPE_ENUM.USER_QUARTERLY as CaseType
      };
      
      setSelectedAudit(auditObject);
      setIsModalOpen(true);
    }
  };
  
  // Handle verify audit
  const handleVerifyAudit = (auditId: string) => {
    if (selectedAudit) {
      handleVerify(
        auditId,
        selectedAudit.verifier || '',
        {
          comment: selectedAudit.comment || '',
          rating: selectedAudit.rating || '',
          specialFindings: selectedAudit.specialFindings || {},
          detailedFindings: selectedAudit.detailedFindings || {}
        }
      );
      setIsModalOpen(false);
      setSelectedAudit(null);
      setSuccessMessage(`Successfully verified audit ${auditId}`);
    }
  };
  
  // Handle reject audit
  const handleRejectAudit = (auditId: string) => {
    if (selectedAudit) {
      handleReject(
        auditId,
        selectedAudit.verifier || '',
        {
          comment: selectedAudit.comment || '',
          rating: selectedAudit.rating || '',
          specialFindings: selectedAudit.specialFindings || {},
          detailedFindings: selectedAudit.detailedFindings || {}
        }
      );
      setIsModalOpen(false);
      setSelectedAudit(null);
    }
  };
  
  // Handle auto-selection of audits for a quarter
  const handleAutoSelect = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // Check if user is a team leader
      if (!currentUserRole || currentUserRole.role !== USER_ROLE_ENUM.TEAM_LEADER) {
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
  
  // Code for the JSX in the select control for users
  const userSelectOptions = usersList.map(user => (
    <option key={user.id} value={user.id}>
      {user.name} ({user.role})
    </option>
  ));
  
  // Find the user from usersList
  const findUserById = (userId: string) => {
    return usersList.find(user => user.id === userId);
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
            {userSelectOptions}
          </select>
        </div>
      </div>
      
      <div className="button-group">
        <button 
          onClick={handleAutoSelect}
          disabled={loading || !currentUserRole || currentUserRole.role !== USER_ROLE_ENUM.TEAM_LEADER}
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
      
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
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
          <div className="status-item">
            <span className="status-label">Last Selection Date:</span>
            <span className="status-value">
              {quarterlyDossiers.lastSelectionDate 
                ? new Date(quarterlyDossiers.lastSelectionDate).toLocaleString() 
                : 'Not selected yet'}
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
                  <th>CaseID</th>
                  <th>Verantwortlicher Fallbearbeiter</th>
                  <th>Prüfergebnis</th>
                  <th>Prüfer</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {/* User Quarterly Audits */}
                {quarterlyDossiers.userQuarterlyAudits.map((audit) => {
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
                      <td>{user ? user.name : audit.userId}</td>
                      <td>{audit.status === VERIFICATION_STATUS_ENUM.VERIFIED ? 'Geprüft' : 
                           audit.status === VERIFICATION_STATUS_ENUM.IN_PROGRESS ? 'In Bearbeitung' : 'Nicht geprüft'}</td>
                      <td>{audit.verifier || '-'}</td>
                      <td>
                        <button
                          className="verify-button"
                          onClick={() => handleOpenVerification(audit.id)}
                          disabled={!canVerify}
                        >
                          {audit.status === VERIFICATION_STATUS_ENUM.VERIFIED ? 'Ansehen' : 'Prüfen'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                
                {/* Random Previous Quarter Audits */}
                {quarterlyDossiers.previousQuarterRandomAudits.map((audit) => {
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
                      <td>Zufällige Prüfung (Vorquartal)</td>
                      <td>{audit.status === VERIFICATION_STATUS_ENUM.VERIFIED ? 'Geprüft' : 
                           audit.status === VERIFICATION_STATUS_ENUM.IN_PROGRESS ? 'In Bearbeitung' : 'Nicht geprüft'}</td>
                      <td>{audit.verifier || '-'}</td>
                      <td>
                        <button
                          className="verify-button"
                          onClick={() => handleOpenVerification(audit.id)}
                          disabled={!canVerify}
                        >
                          {audit.status === VERIFICATION_STATUS_ENUM.VERIFIED ? 'Ansehen' : 'Prüfen'}
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
          onReject={handleRejectAudit}
        />
      )}
    </div>
  );
};

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(QuarterlySelectionComponent); 
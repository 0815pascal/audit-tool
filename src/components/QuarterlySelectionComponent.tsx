import React, { useState } from 'react';
import { useVerificationHandlers } from '../hooks/useVerificationHandlers';
import { formatQuarterYear } from '../store/verificationSlice';
import { PruefensterModal } from './common/PruefensterModal';
import { Dossier } from '../types';
import './QuarterlySelectionComponent.css';

const QuarterlySelectionComponent: React.FC = () => {
  const { 
    selectedQuarter, 
    filteredYear,
    currentUserId,
    currentUserRole,
    quarterlyDossiers,
    handleSelectQuarterlyDossiers,
    exportQuarterlyResults,
    handleQuarterChange,
    handleYearChange,
    handleUserChange,
    usersList,
    loading,
    handleVerify,
    handleReject,
    canVerifyDossier
  } = useVerificationHandlers();
  
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
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
    value: formatQuarterYear(q, filteredYear),
    label: `Q${q}-${filteredYear}`
  }));
  
  // Handle opening the verification modal
  const handleOpenVerification = (dossierId: string) => {
    // Find the dossier in the quarterlyDossiers
    const dossier = [...quarterlyDossiers.userQuarterlyDossiers, ...quarterlyDossiers.previousQuarterRandomDossiers]
      .find(d => d.id === dossierId);
    
    if (dossier) {
      // Convert to full Dossier object
      const fullDossier: Dossier = {
        id: dossier.id,
        userId: dossier.userId || '',
        date: new Date().toISOString().split('T')[0],
        clientName: `Client for ${dossier.id}`,
        policyNumber: `POL-${dossier.id}`,
        caseNumber: parseInt(dossier.id.replace(/\D/g, '')) || 0,
        dossierRisk: 0,
        dossierName: `Case ${dossier.id}`,
        totalAmount: dossier.coverageAmount || 0,
        coverageAmount: dossier.coverageAmount || 0,
        isVerified: dossier.status === 'verified',
        isAkoReviewed: dossier.isAkoReviewed || false,
        isSpecialist: false,
        quarter: selectedQuarter.split('-')[0].replace('Q', ''),
        year: parseInt(selectedQuarter.split('-')[1]),
        claimsStatus: dossier.claimsStatus || 'FULL_COVER',
        verifier: currentUserId,
        comment: dossier.comment || '',
        rating: dossier.rating as Dossier['rating'] || '',
        specialFindings: dossier.specialFindings || {},
        detailedFindings: dossier.detailedFindings || {},
        caseType: 'USER_QUARTERLY'
      };
      
      setSelectedDossier(fullDossier);
      setIsModalOpen(true);
    }
  };
  
  // Handle verify dossier
  const handleVerifyDossier = (dossierId: string) => {
    if (selectedDossier) {
      handleVerify(
        dossierId,
        selectedDossier.verifier || '',
        {
          comment: selectedDossier.comment || '',
          rating: selectedDossier.rating || '',
          specialFindings: selectedDossier.specialFindings || {},
          detailedFindings: selectedDossier.detailedFindings || {}
        }
      );
      setIsModalOpen(false);
      setSelectedDossier(null);
      setSuccessMessage(`Successfully verified dossier ${dossierId}`);
    }
  };
  
  // Handle reject dossier
  const handleRejectDossier = (dossierId: string) => {
    if (selectedDossier) {
      handleReject(
        dossierId,
        selectedDossier.verifier || '',
        {
          comment: selectedDossier.comment || '',
          rating: selectedDossier.rating || '',
          specialFindings: selectedDossier.specialFindings || {},
          detailedFindings: selectedDossier.detailedFindings || {}
        }
      );
      setIsModalOpen(false);
      setSelectedDossier(null);
    }
  };
  
  // Handle auto-selection of dossiers for a quarter
  const handleAutoSelect = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // Check if user is a team leader
      if (currentUserRole.role !== 'TEAM_LEADER') {
        setErrorMessage('Only team leaders can initiate quarterly dossier selection.');
        return;
      }
      
      // Check if dossiers were already selected for this quarter
      if (quarterlyDossiers.userQuarterlyDossiers.length > 0 || 
          quarterlyDossiers.previousQuarterRandomDossiers.length > 0) {
        const confirmReselect = window.confirm(
          `Dossiers have already been selected for ${selectedQuarter}. Do you want to reselect?`
        );
        if (!confirmReselect) {
          return;
        }
      }
      
      await handleSelectQuarterlyDossiers(selectedQuarter);
      setSuccessMessage(`Successfully selected dossiers for ${selectedQuarter}`);
    } catch (error) {
      console.error('Error selecting dossiers:', error);
      setErrorMessage('Failed to select dossiers. Please try again.');
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
      <h2>IKS Quarterly Dossier Selection</h2>
      
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
          disabled={loading || currentUserRole.role !== 'TEAM_LEADER'}
          className="primary-button"
        >
          {loading ? 'Loading...' : 'Auto-Select Dossiers'}
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
            <span className="status-label">User Dossiers:</span>
            <span className="status-value">{quarterlyDossiers.userQuarterlyDossiers.length}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Random Previous Quarter Dossiers:</span>
            <span className="status-value">{quarterlyDossiers.previousQuarterRandomDossiers.length}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Total Dossiers:</span>
            <span className="status-value">
              {quarterlyDossiers.userQuarterlyDossiers.length + 
               quarterlyDossiers.previousQuarterRandomDossiers.length}
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
      
      {/* Dossier Tables */}
      <div className="dossier-tables">
        <div className="dossier-table">
          <h3>Quartals-Check {selectedQuarter}</h3>
          {quarterlyDossiers.userQuarterlyDossiers.length === 0 && quarterlyDossiers.previousQuarterRandomDossiers.length === 0 ? (
            <p className="no-data">Keine Dossiers für dieses Quartal ausgewählt.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Case-ID</th>
                  <th>Verantwortlicher Fallbearbeiter</th>
                  <th>Prüfergebnis</th>
                  <th>Prüfer</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {/* User Quarterly Dossiers */}
                {quarterlyDossiers.userQuarterlyDossiers.map(dossier => {
                  const user = findUserById(dossier.userId);
                  // Store the result of canVerifyDossier in a variable with a default false value for safety
                  let canVerify = false;
                  if (dossier && dossier.id) {
                    try {
                      canVerify = canVerifyDossier(dossier.id);
                    } catch (error) {
                      console.error(`Error checking if dossier ${dossier.id} can be verified:`, error);
                    }
                  }
                  
                  return (
                    <tr key={dossier.id}>
                      <td>{dossier.id}</td>
                      <td>{user ? user.name : dossier.userId}</td>
                      <td>{dossier.status === 'verified' ? 'Geprüft' : 
                           dossier.status === 'in-progress' ? 'In Bearbeitung' : 'Nicht geprüft'}</td>
                      <td>{dossier.verifier || '-'}</td>
                      <td>
                        <button
                          className="verify-button"
                          onClick={() => handleOpenVerification(dossier.id)}
                          disabled={!canVerify}
                        >
                          {dossier.status === 'verified' ? 'Ansehen' : 'Prüfen'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                
                {/* Random Previous Quarter Dossiers */}
                {quarterlyDossiers.previousQuarterRandomDossiers.map(dossier => {
                  // Store the result of canVerifyDossier in a variable with a default false value for safety
                  let canVerify = false;
                  if (dossier && dossier.id) {
                    try {
                      canVerify = canVerifyDossier(dossier.id);
                    } catch (error) {
                      console.error(`Error checking if dossier ${dossier.id} can be verified:`, error);
                    }
                  }
                  
                  return (
                    <tr key={dossier.id}>
                      <td>{dossier.id}</td>
                      <td>Zufällige Prüfung (Vorquartal)</td>
                      <td>{dossier.status === 'verified' ? 'Geprüft' : 
                           dossier.status === 'in-progress' ? 'In Bearbeitung' : 'Nicht geprüft'}</td>
                      <td>{dossier.verifier || '-'}</td>
                      <td>
                        <button
                          className="verify-button"
                          onClick={() => handleOpenVerification(dossier.id)}
                          disabled={!canVerify}
                        >
                          {dossier.status === 'verified' ? 'Ansehen' : 'Prüfen'}
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
      {selectedDossier && (
        <PruefensterModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          dossier={selectedDossier}
          onVerify={handleVerifyDossier}
          onReject={handleRejectDossier}
        />
      )}
    </div>
  );
};

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(QuarterlySelectionComponent); 
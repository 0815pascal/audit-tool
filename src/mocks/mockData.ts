import { 
  User
} from '../types/types';
import {
  createUserId,
  createEmptyDetailedFindings,
  createEmptySpecialFindings
} from '../types/typeHelpers';
import { 
  CASE_TYPES
} from '../constants';
import { USER_ROLE_ENUM, Department, CLAIMS_STATUS_ENUM } from '../enums';
import { MockCaseData } from './mockTypes';

// Mock users data
export const users: User[] = [
  { id: createUserId('1'), displayName: 'John Smith', department: Department.Claims, authorities: USER_ROLE_ENUM.SPECIALIST, enabled: true, initials: 'JS' },
  { id: createUserId('2'), displayName: 'Jane Doe', department: Department.Claims, authorities: USER_ROLE_ENUM.STAFF, enabled: true, initials: 'JD' },
  { id: createUserId('3'), displayName: 'Robert Johnson', department: Department.Claims, authorities: USER_ROLE_ENUM.STAFF, enabled: true, initials: 'RJ' },
  { id: createUserId('4'), displayName: 'Emily Davis', department: Department.Claims, authorities: USER_ROLE_ENUM.TEAM_LEADER, enabled: true, initials: 'ED' },
  { id: createUserId('5'), displayName: 'Michael Brown', department: Department.Claims, authorities: USER_ROLE_ENUM.STAFF, enabled: true, initials: 'MB' },
  { id: createUserId('6'), displayName: 'Sarah Wilson', department: Department.Claims, authorities: USER_ROLE_ENUM.SPECIALIST, enabled: true, initials: 'SW' },
  { id: createUserId('7'), displayName: 'David Thompson', department: Department.Claims, authorities: USER_ROLE_ENUM.STAFF, enabled: true, initials: 'DT' },
  { id: createUserId('8'), displayName: 'Lisa Garcia', department: Department.Claims, authorities: USER_ROLE_ENUM.STAFF, enabled: true, initials: 'LG' },
];

// Mock cases data
export const mockCases: MockCaseData[] = [
  {
    id: '1',
    userId: '1',
    notificationDate: '2025-04-20', // Q2 2025
    clientName: 'Thomas Anderson',
    policyNumber: 12345,
    caseNumber: 30045678,
    dossierRisk: 123456,
    dossierName: 'Matrix Incorporated',
    totalAmount: 525,
    isCompleted: false,
    claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
    coverageAmount: 525,
    auditor: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '2',
    year: 2025,
    isAkoReviewed: false,
    isSpecialist: true,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: 'CHF'
  },
  {
    id: '2',
    userId: '2',
    notificationDate: '2025-04-25', // Q2 2025
    clientName: 'Alice Johnson',
    policyNumber: 67890,
    caseNumber: 30046789,
    dossierRisk: 234567,
    dossierName: 'Wonderland Holdings',
    totalAmount: 360,
    isCompleted: false,
    claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
    coverageAmount: 360,
    auditor: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '2',
    year: 2025,
    isAkoReviewed: false,
    isSpecialist: false,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: 'EUR'
  },
  {
    id: '3',
    userId: '3',
    notificationDate: '2025-05-15', // Q2 2025
    clientName: 'Mark Wilson',
    policyNumber: 34567,
    caseNumber: 30047891,
    dossierRisk: 345678,
    dossierName: 'Wilson Family Trust',
    totalAmount: 440,
    isCompleted: false,
    claimsStatus: CLAIMS_STATUS_ENUM.PARTIAL_COVER,
    coverageAmount: 440,
    auditor: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '2',
    year: 2025,
    isAkoReviewed: false,
    isSpecialist: false,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: 'USD'
  },
  {
    id: '4',
    userId: '4',
    notificationDate: '2025-06-10', // Q2 2025
    clientName: 'Sarah Miller',
    policyNumber: 89012,
    caseNumber: 30048012,
    dossierRisk: 456789,
    dossierName: 'Miller Automotive Group',
    totalAmount: 875,
    isCompleted: false,
    claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
    coverageAmount: 875,
    auditor: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '2',
    year: 2025,
    isAkoReviewed: false,
    isSpecialist: true,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: 'CHF'
  },
  {
    id: '5',
    userId: '5',
    notificationDate: '2025-01-15', // Q1 2025 (previous quarter)
    clientName: 'David Brown',
    policyNumber: 45678,
    caseNumber: 30049234,
    dossierRisk: 567890,
    dossierName: 'Brown Medical Associates',
    totalAmount: 970,
    isCompleted: false,
    claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
    coverageAmount: 970,
    auditor: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '1',
    year: 2025,
    isAkoReviewed: false,
    isSpecialist: false,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: 'EUR'
  },
  {
    id: '6',
    userId: '6',
    notificationDate: '2025-02-10', // Q1 2025 (previous quarter)
    clientName: 'Jennifer Wilson',
    policyNumber: 78901,
    caseNumber: 30050345,
    dossierRisk: 678901,
    dossierName: 'Wilson Tech Solutions',
    totalAmount: 1250,
    isCompleted: false,
    claimsStatus: CLAIMS_STATUS_ENUM.PARTIAL_COVER,
    coverageAmount: 1250,
    auditor: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '1',
    year: 2025,
    isAkoReviewed: false,
    isSpecialist: true,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: 'USD'
  },
  {
    id: '7',
    userId: '7',
    notificationDate: '2025-03-20', // Q1 2025 (previous quarter)
    clientName: 'Michael Thompson',
    policyNumber: 23456,
    caseNumber: 30051456,
    dossierRisk: 789012,
    dossierName: 'Thompson Industries',
    totalAmount: 800,
    isCompleted: false,
    claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
    coverageAmount: 800,
    auditor: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '1',
    year: 2025,
    isAkoReviewed: false,
    isSpecialist: false,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: 'CHF'
  },
  {
    id: '8',
    userId: '8',
    notificationDate: '2025-03-25', // Q1 2025 (previous quarter)
    clientName: 'Lisa Garcia',
    policyNumber: 56789,
    caseNumber: 30052567,
    dossierRisk: 890123,
    dossierName: 'Garcia Consulting',
    totalAmount: 650,
    isCompleted: false,
    claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
    coverageAmount: 650,
    auditor: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '1',
    year: 2025,
    isAkoReviewed: false,
    isSpecialist: false,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: 'EUR'
  }
];

// Export the existing array as the main case audits data
export const MOCK_CASE_AUDITS = mockCases; 
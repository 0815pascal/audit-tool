import {createEmptyDetailedFindings, createEmptySpecialFindings, createUserId, User} from '../types';
import {CASE_TYPES} from '../constants';
import {CASE_TYPE_ENUM, CLAIMS_STATUS_ENUM, Department, RATING_VALUE_ENUM, USER_ROLE_ENUM} from '../enums';
import {MockCaseData} from './mockTypes';
import { CURRENCY } from '../types/currencyTypes';
import { createCaseId } from '../types';
import { ValidCurrency } from '../types/currencyTypes';
import { CLAIMS_STATUS, CASE_STATUS_MAPPING } from '../constants';
import { ApiCaseResponse } from './mockTypes';

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

// Comprehensive static mock cases data covering all quarters and scenarios
export const mockCases: MockCaseData[] = [
  // ===== Q2 2025 CASES (Current Quarter) =====
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
    isSpecialist: true,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: CURRENCY.CHF
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
    isSpecialist: false,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: CURRENCY.EUR
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
    isSpecialist: false,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: CURRENCY.USD
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
    isSpecialist: true,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: CURRENCY.CHF
  },
  {
    id: '11',
    userId: '5',
    notificationDate: '2025-05-22', // Q2 2025
    clientName: 'Michael Brown Jr.',
    policyNumber: 91234,
    caseNumber: 30053678,
    dossierRisk: 901234,
    dossierName: 'Brown Construction Ltd',
    totalAmount: 1100,
    isCompleted: false,
    claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
    coverageAmount: 1100,
    auditor: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '2',
    year: 2025,
    isSpecialist: false,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: CURRENCY.CHF
  },
  {
    id: '12',
    userId: '6',
    notificationDate: '2025-06-18', // Q2 2025
    clientName: 'Sarah Wilson',
    policyNumber: 12367,
    caseNumber: 30054789,
    dossierRisk: 123456,
    dossierName: 'Wilson Financial Services',
    totalAmount: 950,
    isCompleted: false,
    claimsStatus: CLAIMS_STATUS_ENUM.PARTIAL_COVER,
    coverageAmount: 950,
    auditor: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '2',
    year: 2025,
    isSpecialist: true,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: CURRENCY.USD
  },
  {
    id: '16',
    userId: '7',
    notificationDate: '2025-04-05', // Q2 2025
    clientName: 'David Thompson Sr.',
    policyNumber: 15975,
    caseNumber: 30058000,
    dossierRisk: 147258,
    dossierName: 'Thompson Legal Group',
    totalAmount: 2100,
    isCompleted: false,
    claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
    coverageAmount: 2100,
    auditor: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '2',
    year: 2025,
    isSpecialist: false,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: CURRENCY.EUR
  },
  {
    id: '17',
    userId: '8',
    notificationDate: '2025-06-30', // Q2 2025
    clientName: 'Lisa Garcia Martinez',
    policyNumber: 95173,
    caseNumber: 30059111,
    dossierRisk: 852963,
    dossierName: 'Garcia & Associates',
    totalAmount: 750,
    isCompleted: false,
    claimsStatus: CLAIMS_STATUS_ENUM.PARTIAL_COVER,
    coverageAmount: 750,
    auditor: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '2',
    year: 2025,
    isSpecialist: false,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: CURRENCY.CHF
  },

  // ===== Q1 2025 CASES (Previous Quarter) =====
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
    isSpecialist: false,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: CURRENCY.EUR
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
    isCompleted: false, // IN-PROGRESS CASE
    claimsStatus: CLAIMS_STATUS_ENUM.PARTIAL_COVER,
    coverageAmount: 1250,
    auditor: '4', // Being audited by Emily Davis (User ID 4, Team Leader)
    comment: 'Audit in progress - Jennifer Wilson case being reviewed by Emily Davis.',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '1',
    year: 2025,
    isSpecialist: true,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: CURRENCY.USD
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
    isSpecialist: false,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: CURRENCY.CHF
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
    isSpecialist: false,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: CURRENCY.EUR
  },
  {
    id: '18',
    userId: '1',
    notificationDate: '2025-01-08', // Q1 2025
    clientName: 'John Smith Jr.',
    policyNumber: 37462,
    caseNumber: 30060222,
    dossierRisk: 741852,
    dossierName: 'Smith Enterprises',
    totalAmount: 1800,
    isCompleted: false,
    claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
    coverageAmount: 1800,
    auditor: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '1',
    year: 2025,
    isSpecialist: true,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: CURRENCY.USD
  },
  {
    id: '19',
    userId: '2',
    notificationDate: '2025-02-14', // Q1 2025
    clientName: 'Jane Doe Industries',
    policyNumber: 84629,
    caseNumber: 30061333,
    dossierRisk: 963852,
    dossierName: 'Doe Manufacturing',
    totalAmount: 1375,
    isCompleted: false,
    claimsStatus: CLAIMS_STATUS_ENUM.PARTIAL_COVER,
    coverageAmount: 1375,
    auditor: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '1',
    year: 2025,
    isSpecialist: false,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: CURRENCY.CHF
  },

  // ===== Q4 2024 CASES =====
  {
    id: '20',
    userId: '3',
    notificationDate: '2024-10-15', // Q4 2024
    clientName: 'Robert Johnson Corp',
    policyNumber: 73951,
    caseNumber: 30062444,
    dossierRisk: 159753,
    dossierName: 'Johnson Holdings',
    totalAmount: 2250,
    isCompleted: false,
    claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
    coverageAmount: 2250,
    auditor: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '4',
    year: 2024,
    isSpecialist: false,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: CURRENCY.EUR
  },
  {
    id: '21',
    userId: '4',
    notificationDate: '2024-11-22', // Q4 2024
    clientName: 'Emily Davis & Co',
    policyNumber: 62840,
    caseNumber: 30063555,
    dossierRisk: 357159,
    dossierName: 'Davis Financial',
    totalAmount: 925,
    isCompleted: false,
    claimsStatus: CLAIMS_STATUS_ENUM.PARTIAL_COVER,
    coverageAmount: 925,
    auditor: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '4',
    year: 2024,
    isSpecialist: true,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: CURRENCY.CHF
  },

  // ===== Q3 2024 CASES =====
  {
    id: '22',
    userId: '1',
    notificationDate: '2024-07-18', // Q3 2024
    clientName: 'Matrix Corp Alpha',
    policyNumber: 51739,
    caseNumber: 30064666,
    dossierRisk: 753951,
    dossierName: 'Matrix Alpha Division',
    totalAmount: 3200,
    isCompleted: false,
    claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
    coverageAmount: 3200,
    auditor: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '3',
    year: 2024,
    isSpecialist: true,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: CURRENCY.USD
  },
  {
    id: '23',
    userId: '5',
    notificationDate: '2024-08-25', // Q3 2024
    clientName: 'Brown Industries Ltd',
    policyNumber: 40628,
    caseNumber: 30065777,
    dossierRisk: 951357,
    dossierName: 'Brown Manufacturing',
    totalAmount: 1680,
    isCompleted: false,
    claimsStatus: CLAIMS_STATUS_ENUM.PARTIAL_COVER,
    coverageAmount: 1680,
    auditor: '',
    comment: '',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '3',
    year: 2024,
    isSpecialist: false,
    caseType: CASE_TYPES.USER_QUARTERLY,
    notifiedCurrency: CURRENCY.EUR
  },

  // ===== PRE-LOADED CASES: These will be shown in the table upon component loading =====
  {
    id: '13',
    userId: '1', 
    notificationDate: '2025-06-25', // Q2 2025
    clientName: 'Neo Anderson',
    policyNumber: 13579,
    caseNumber: 30055900,
    dossierRisk: 987654,
    dossierName: 'Zion Technologies',
    totalAmount: 1500,
    isCompleted: true, // VERIFIED CASE
    claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
    coverageAmount: 1500,
    auditor: '4', // Verified by Emily Davis (User ID 4, Team Leader)
    comment: 'Audit completed successfully with excellent documentation and proper procedures followed.',
    rating: RATING_VALUE_ENUM.SUCCESSFULLY_FULFILLED,
    specialFindings: { 
      ...createEmptySpecialFindings(),
      feedback: true,
      communication: true
    },
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '2',
    year: 2025,
    isSpecialist: true,
    caseType: CASE_TYPE_ENUM.PRE_LOADED,
    notifiedCurrency: CURRENCY.CHF
  },
  {
    id: '14',
    userId: '4',
    notificationDate: '2025-06-20', // Q2 2025  
    clientName: 'Trinity Moss',
    policyNumber: 24680,
    caseNumber: 30056011,
    dossierRisk: 654321,
    dossierName: 'Nebuchadnezzar Corp',
    totalAmount: 775,
    isCompleted: false, // IN-PROGRESS CASE
    claimsStatus: CLAIMS_STATUS_ENUM.PARTIAL_COVER,
    coverageAmount: 775,
    auditor: '6', // In progress by Sarah Wilson (User ID 6, Specialist)
    comment: 'Audit in progress - Emily Davis case being reviewed by Sarah Wilson.',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '2',
    year: 2025,
    isSpecialist: false,
    caseType: CASE_TYPE_ENUM.PRE_LOADED,
    notifiedCurrency: CURRENCY.EUR
  },
  // Add a third preloaded case for Emily's in-progress work (for E2E test)
  {
    id: '15',
    userId: '3', // Robert Johnson's case
    notificationDate: '2025-06-15', // Q2 2025  
    clientName: 'Morpheus Johnson',
    policyNumber: 35791,
    caseNumber: 30057122,
    dossierRisk: 321987,
    dossierName: 'Red Pill Industries',
    totalAmount: 1200,
    isCompleted: false, // IN-PROGRESS by Emily for E2E test
    claimsStatus: CLAIMS_STATUS_ENUM.FULL_COVER,
    coverageAmount: 1200,
    auditor: '4', // In progress by Emily Davis (User ID 4, Team Leader) - for E2E test
    comment: 'Emily is working on this audit - data persistence test case.',
    rating: '',
    specialFindings: createEmptySpecialFindings(),
    detailedFindings: createEmptyDetailedFindings(),
    quarter: '2',
    year: 2025,
    isSpecialist: false,
    caseType: CASE_TYPE_ENUM.PRE_LOADED,
    notifiedCurrency: CURRENCY.CHF
  }
];

// Static quarterly audit selection data for common quarters
const quarterlyAuditSelectionData: Record<string, Array<{
  caseNumber: number;
  claimOwner: {
    userId: string;
    displayName: string;
  };
  coverageAmount: number;
  claimsStatus: typeof CLAIMS_STATUS.FULL_COVER;
  notificationDate: string;
  notifiedCurrency: ValidCurrency;
}>> = {
  'Q1-2025': [
    {
      caseNumber: 30049234,
      claimOwner: { userId: '5', displayName: 'Michael Brown' },
      coverageAmount: 970,
      claimsStatus: CLAIMS_STATUS.FULL_COVER,
      notificationDate: '2025-01-15',
      notifiedCurrency: CURRENCY.EUR
    },
    {
      caseNumber: 30050345,
      claimOwner: { userId: '6', displayName: 'Sarah Wilson' },
      coverageAmount: 1250,
      claimsStatus: CLAIMS_STATUS.FULL_COVER,
      notificationDate: '2025-02-10',
      notifiedCurrency: CURRENCY.USD
    },
    {
      caseNumber: 30051456,
      claimOwner: { userId: '7', displayName: 'David Thompson' },
      coverageAmount: 800,
      claimsStatus: CLAIMS_STATUS.FULL_COVER,
      notificationDate: '2025-03-20',
      notifiedCurrency: CURRENCY.CHF
    },
    {
      caseNumber: 30052567,
      claimOwner: { userId: '8', displayName: 'Lisa Garcia' },
      coverageAmount: 650,
      claimsStatus: CLAIMS_STATUS.FULL_COVER,
      notificationDate: '2025-03-25',
      notifiedCurrency: CURRENCY.EUR
    },
    {
      caseNumber: 30060222,
      claimOwner: { userId: '1', displayName: 'John Smith' },
      coverageAmount: 1800,
      claimsStatus: CLAIMS_STATUS.FULL_COVER,
      notificationDate: '2025-01-08',
      notifiedCurrency: CURRENCY.USD
    },
    {
      caseNumber: 30061333,
      claimOwner: { userId: '2', displayName: 'Jane Doe' },
      coverageAmount: 1375,
      claimsStatus: CLAIMS_STATUS.FULL_COVER,
      notificationDate: '2025-02-14',
      notifiedCurrency: CURRENCY.CHF
    }
  ],
  'Q2-2025': [
    {
      caseNumber: 30045678,
      claimOwner: { userId: '1', displayName: 'John Smith' },
      coverageAmount: 525,
      claimsStatus: CLAIMS_STATUS.FULL_COVER,
      notificationDate: '2025-04-20',
      notifiedCurrency: CURRENCY.CHF
    },
    {
      caseNumber: 30046789,
      claimOwner: { userId: '2', displayName: 'Jane Doe' },
      coverageAmount: 360,
      claimsStatus: CLAIMS_STATUS.FULL_COVER,
      notificationDate: '2025-04-25',
      notifiedCurrency: CURRENCY.EUR
    },
    {
      caseNumber: 30047891,
      claimOwner: { userId: '3', displayName: 'Robert Johnson' },
      coverageAmount: 440,
      claimsStatus: CLAIMS_STATUS.FULL_COVER,
      notificationDate: '2025-05-15',
      notifiedCurrency: CURRENCY.USD
    },
    {
      caseNumber: 30048012,
      claimOwner: { userId: '4', displayName: 'Emily Davis' },
      coverageAmount: 875,
      claimsStatus: CLAIMS_STATUS.FULL_COVER,
      notificationDate: '2025-06-10',
      notifiedCurrency: CURRENCY.CHF
    },
    {
      caseNumber: 30053678,
      claimOwner: { userId: '5', displayName: 'Michael Brown' },
      coverageAmount: 1100,
      claimsStatus: CLAIMS_STATUS.FULL_COVER,
      notificationDate: '2025-05-22',
      notifiedCurrency: CURRENCY.CHF
    },
    {
      caseNumber: 30054789,
      claimOwner: { userId: '6', displayName: 'Sarah Wilson' },
      coverageAmount: 950,
      claimsStatus: CLAIMS_STATUS.FULL_COVER,
      notificationDate: '2025-06-18',
      notifiedCurrency: CURRENCY.USD
    },
    {
      caseNumber: 30058000,
      claimOwner: { userId: '7', displayName: 'David Thompson' },
      coverageAmount: 2100,
      claimsStatus: CLAIMS_STATUS.FULL_COVER,
      notificationDate: '2025-04-05',
      notifiedCurrency: CURRENCY.EUR
    },
    {
      caseNumber: 30059111,
      claimOwner: { userId: '8', displayName: 'Lisa Garcia' },
      coverageAmount: 750,
      claimsStatus: CLAIMS_STATUS.FULL_COVER,
      notificationDate: '2025-06-30',
      notifiedCurrency: CURRENCY.CHF
    }
  ],
  'Q3-2024': [
    {
      caseNumber: 30064666,
      claimOwner: { userId: '1', displayName: 'John Smith' },
      coverageAmount: 3200,
      claimsStatus: CLAIMS_STATUS.FULL_COVER,
      notificationDate: '2024-07-18',
      notifiedCurrency: CURRENCY.USD
    },
    {
      caseNumber: 30065777,
      claimOwner: { userId: '5', displayName: 'Michael Brown' },
      coverageAmount: 1680,
      claimsStatus: CLAIMS_STATUS.FULL_COVER,
      notificationDate: '2024-08-25',
      notifiedCurrency: CURRENCY.EUR
    }
  ],
  'Q4-2024': [
    {
      caseNumber: 30062444,
      claimOwner: { userId: '3', displayName: 'Robert Johnson' },
      coverageAmount: 2250,
      claimsStatus: CLAIMS_STATUS.FULL_COVER,
      notificationDate: '2024-10-15',
      notifiedCurrency: CURRENCY.EUR
    },
    {
      caseNumber: 30063555,
      claimOwner: { userId: '4', displayName: 'Emily Davis' },
      coverageAmount: 925,
      claimsStatus: CLAIMS_STATUS.FULL_COVER,
      notificationDate: '2024-11-22',
      notifiedCurrency: CURRENCY.CHF
    }
  ]
};

// Static audit findings data (no more random generation)
const staticAuditFindings: Record<number, Array<{
  findingId: string;
  type: string;
  description: string;
}>> = {
  1: [
    { findingId: 'finding-1', type: 'DOCUMENTATION_MISSING', description: 'Missing client signature on approval form' },
    { findingId: 'finding-2', type: 'AMOUNT_DISCREPANCY', description: 'Coverage amount calculation error of 2.5%' }
  ],
  2: [
    { findingId: 'finding-1', type: 'PROCESS_VIOLATION', description: 'Approval workflow step bypassed without authorization' }
  ],
  3: [
    { findingId: 'finding-1', type: 'DOCUMENTATION_MISSING', description: 'Policy verification documents incomplete' },
    { findingId: 'finding-2', type: 'AMOUNT_DISCREPANCY', description: 'Incorrect deductible applied' },
    { findingId: 'finding-3', type: 'PROCESS_VIOLATION', description: 'Review timeline exceeded by 5 days' }
  ]
};

// Static completion data (no more random generation)
const staticCompletionData: Record<number, {
  auditId: number;
  status: string;
  verifierId: number;
  rating: string;
  comment: string;
  findings: unknown[];
}> = {
  1: { auditId: 1, status: 'not_completed', verifierId: 1, rating: '', comment: '', findings: [] },
  2: { auditId: 2, status: 'completed', verifierId: 4, rating: 'SUCCESSFULLY_FULFILLED', comment: 'Audit completed successfully', findings: [] },
  3: { auditId: 3, status: 'not_completed', verifierId: 1, rating: '', comment: '', findings: [] }
};

// Static user quarterly audits (one for each user per quarter)
const staticUserQuarterlyAudits: Record<string, Array<{
  id: number;
  auditId: number;
  dossierId: number;
  userId: string;
  coverageAmount: number;
  claimsStatus: string;
  quarter: string;
  year: number;
  caseType: string;
}>> = {
  'Q2-2025': [
    { id: 40001, auditId: 40001, dossierId: 40001, userId: 'user-1', coverageAmount: 25000, claimsStatus: CLAIMS_STATUS.FULL_COVER, quarter: 'Q2-2025', year: 2025, caseType: 'USER_QUARTERLY' },
    { id: 40002, auditId: 40002, dossierId: 40002, userId: 'user-2', coverageAmount: 18000, claimsStatus: CLAIMS_STATUS.FULL_COVER, quarter: 'Q2-2025', year: 2025, caseType: 'USER_QUARTERLY' },
    { id: 40003, auditId: 40003, dossierId: 40003, userId: 'user-3', coverageAmount: 22000, claimsStatus: CLAIMS_STATUS.FULL_COVER, quarter: 'Q2-2025', year: 2025, caseType: 'USER_QUARTERLY' },
    { id: 40004, auditId: 40004, dossierId: 40004, userId: 'user-4', coverageAmount: 35000, claimsStatus: CLAIMS_STATUS.FULL_COVER, quarter: 'Q2-2025', year: 2025, caseType: 'USER_QUARTERLY' },
    { id: 40005, auditId: 40005, dossierId: 40005, userId: 'user-5', coverageAmount: 15000, claimsStatus: CLAIMS_STATUS.FULL_COVER, quarter: 'Q2-2025', year: 2025, caseType: 'USER_QUARTERLY' },
    { id: 40006, auditId: 40006, dossierId: 40006, userId: 'user-6', coverageAmount: 28000, claimsStatus: CLAIMS_STATUS.FULL_COVER, quarter: 'Q2-2025', year: 2025, caseType: 'USER_QUARTERLY' },
    { id: 40007, auditId: 40007, dossierId: 40007, userId: 'user-7', coverageAmount: 20000, claimsStatus: CLAIMS_STATUS.FULL_COVER, quarter: 'Q2-2025', year: 2025, caseType: 'USER_QUARTERLY' },
    { id: 40008, auditId: 40008, dossierId: 40008, userId: 'user-8', coverageAmount: 16000, claimsStatus: CLAIMS_STATUS.FULL_COVER, quarter: 'Q2-2025', year: 2025, caseType: 'USER_QUARTERLY' }
  ],
  'Q1-2025': [
    { id: 40101, auditId: 40101, dossierId: 40101, userId: 'user-1', coverageAmount: 24000, claimsStatus: CLAIMS_STATUS.FULL_COVER, quarter: 'Q1-2025', year: 2025, caseType: 'USER_QUARTERLY' },
    { id: 40102, auditId: 40102, dossierId: 40102, userId: 'user-2', coverageAmount: 19000, claimsStatus: CLAIMS_STATUS.FULL_COVER, quarter: 'Q1-2025', year: 2025, caseType: 'USER_QUARTERLY' }
  ]
};

// Static previous quarter random audits
const staticPreviousQuarterAudits: Record<string, Array<{
  id: number;
  dossierId: number;
  auditId: number;
  userId: string;
  coverageAmount: number;
  claimsStatus: string;
  quarter: string;
  year: number;
  caseType: string;
}>> = {
  'Q1-2025': [
    { id: 30101, dossierId: 30101, auditId: 30101, userId: 'user-3', coverageAmount: 45000, claimsStatus: CLAIMS_STATUS.FULL_COVER, quarter: 'Q1-2025', year: 2025, caseType: 'PREVIOUS_QUARTER_RANDOM' },
    { id: 30102, dossierId: 30102, auditId: 30102, userId: 'user-5', coverageAmount: 38000, claimsStatus: CLAIMS_STATUS.FULL_COVER, quarter: 'Q1-2025', year: 2025, caseType: 'PREVIOUS_QUARTER_RANDOM' }
  ],
  'Q4-2024': [
    { id: 30201, dossierId: 30201, auditId: 30201, userId: 'user-1', coverageAmount: 52000, claimsStatus: CLAIMS_STATUS.FULL_COVER, quarter: 'Q4-2024', year: 2024, caseType: 'PREVIOUS_QUARTER_RANDOM' },
    { id: 30202, dossierId: 30202, auditId: 30202, userId: 'user-7', coverageAmount: 41000, claimsStatus: CLAIMS_STATUS.FULL_COVER, quarter: 'Q4-2024', year: 2024, caseType: 'PREVIOUS_QUARTER_RANDOM' }
  ]
};

// =======================================================
// STATIC UTILITY FUNCTIONS (No More Generation)
// =======================================================

/**
 * Get current quarter string in Q{N}-{YYYY} format
 */
export const getCurrentQuarterString = (): string => {
  const now = new Date();
  const currentQuarter = Math.floor((now.getMonth()) / 3) + 1;
  return `Q${currentQuarter}-${now.getFullYear()}`;
};

/**
 * Get current date string in YYYY-MM-DD format
 */
export const getCurrentDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Get current timestamp in ISO format
 */
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Static case generator for current quarter (fixed data instead of random)
 */
export const generateMockCurrentQuarterCase = (
  index: number, 
  quarterNum: number, 
  year: number, 
  users: User[]
): ApiCaseResponse => {
  const user = users[index % users.length];
  
  return {
    caseNumber: createCaseId(40000000 + index),
    claimOwner: {
      userId: user.id,
      role: user.authorities
    },
    claimsStatus: index % 2 === 0 ? CLAIMS_STATUS.FULL_COVER : CLAIMS_STATUS.PARTIAL_COVER,
    coverageAmount: [1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500][index % 8], // Fixed amounts
    caseStatus: CASE_STATUS_MAPPING.COMPENSATED,
    notificationDate: `${year}-${String(quarterNum * 3).padStart(2, '0')}-15`, // Fixed date in quarter
    notifiedCurrency: [CURRENCY.CHF, CURRENCY.EUR, CURRENCY.USD][index % 3] as ValidCurrency
  };
};

/**
 * Static case generator for previous quarter (fixed data instead of random)
 */
export const generateMockPreviousQuarterCase = (
  index: number, 
  quarterNum: number, 
  year: number, 
  users: User[]
): ApiCaseResponse => {
  const user = users[index % users.length];
  
  return {
    caseNumber: createCaseId(30000000 + index),
    claimOwner: {
      userId: user.id,
      role: user.authorities
    },
    claimsStatus: index % 2 === 0 ? CLAIMS_STATUS.FULL_COVER : CLAIMS_STATUS.PARTIAL_COVER,
    coverageAmount: [5000, 5500, 6000, 6500, 7000, 7500, 8000, 8500][index % 8], // Fixed amounts
    caseStatus: CASE_STATUS_MAPPING.COMPENSATED,
    notificationDate: `${year}-${String(quarterNum * 3).padStart(2, '0')}-15`, // Fixed date in quarter
    notifiedCurrency: [CURRENCY.CHF, CURRENCY.EUR, CURRENCY.USD][index % 3] as ValidCurrency
  };
};

// =======================================================
// STATIC LOOKUP FUNCTIONS (Replace Generation)
// =======================================================

/**
 * Get static completion data for an audit (no generation)
 */
export const getCompletionData = (auditId: number) => {
  return staticCompletionData[auditId] ?? {
    auditId,
    status: 'not_completed' as const,
    verifierId: 1,
    rating: '',
    comment: '',
    findings: []
  };
};

/**
 * Get static audit findings (no generation)
 */
export const getAuditFindings = (auditId: number): Array<{
  findingId: string;
  type: string;
  description: string;
}> => {
  return staticAuditFindings[auditId] ?? [];
};

/**
 * Get static quarterly audit selection cases (no generation)
 */
export const getQuarterlyAuditSelectionCases = (quarterPeriod: string) => {
  return quarterlyAuditSelectionData[quarterPeriod] ?? [];
};

/**
 * Get static user quarterly audits (no generation)
 */
export const getUserQuarterlyAudits = (quarterKey: string) => {
  return staticUserQuarterlyAudits[quarterKey] ?? [];
};

/**
 * Get static previous quarter audits (no generation)
 */
export const getPreviousQuarterRandomAudits = (quarterKey: string) => {
  return staticPreviousQuarterAudits[quarterKey] ?? [];
};

/**
 * Create audit completion response with static data
 */
export const createAuditCompletionResponse = (
  auditId: number,
  requestData: {
    auditor?: string;
    rating?: string;
    comment?: string;
    specialFindings?: Record<string, boolean>;
    detailedFindings?: Record<string, boolean>;
    status?: string;
    isCompleted?: boolean;
  }
) => ({
  success: true,
  auditId,
  auditor: requestData.auditor ?? '',
  rating: requestData.rating ?? '',
  comment: requestData.comment ?? '',
  specialFindings: requestData.specialFindings ?? {},
  detailedFindings: requestData.detailedFindings ?? {},
  status: requestData.status ?? 'completed',
  isCompleted: requestData.isCompleted ?? true,
  completionDate: getCurrentTimestamp(),
  message: 'Audit completed successfully'
});

/**
 * Get fallback completion response (static)
 */
export const getFallbackCompletionResponse = (auditId: number, requestData: Record<string, unknown>) => ({
  auditId,
  status: requestData?.status ?? 'not_completed',
  verifierId: requestData?.verifierId ?? 1,
  rating: requestData?.rating ?? '',
  comment: requestData?.comment ?? '',
  completionDate: requestData?.status === 'completed' ? getCurrentTimestamp() : undefined,
  findings: requestData?.findings ?? []
});

/**
 * Get fallback audit object (static)
 */
export const getFallbackAudit = () => ({
  auditId: 9999, // Fixed fallback ID
  quarter: getCurrentQuarterString(),
  caseObj: {
    caseNumber: 40009999, // Fixed fallback case number
    claimOwner: {
      userId: 1,
      role: USER_ROLE_ENUM.TEAM_LEADER
    },
    claimsStatus: CLAIMS_STATUS.FULL_COVER,
    coverageAmount: 10000.00,
    caseStatus: CASE_STATUS_MAPPING.COMPENSATED,
    notificationDate: getCurrentDateString(),
    notifiedCurrency: CURRENCY.CHF
  },
  auditor: {
    userId: 2,
    role: USER_ROLE_ENUM.SPECIALIST
  }
});

/**
 * Extract numeric ID from string/number (simplified, no generation)
 */
export const extractNumericId = (id?: string | number): number => {
  if (!id) return 1; // Fixed fallback instead of random
  const matches = RegExp(/\d+/).exec(id.toString());
  return matches ? parseInt(matches[0]) : 1; // Fixed fallback instead of random
};

/**
 * Get static notification date for quarter component (simplified)
 */
export const getNotificationDateForQuarter = (quarterNum: number, year: number): string => {
  // Return fixed dates for quarters instead of random generation
  const quarterDates: Record<string, string> = {
    [`${quarterNum}-${year}`]: {
      1: `${year}-02-15`, // Q1: Mid February
      2: `${year}-05-15`, // Q2: Mid May  
      3: `${year}-08-15`, // Q3: Mid August
      4: `${year}-11-15`, // Q4: Mid November
    }[quarterNum] ?? getCurrentDateString()
  };
  
  return quarterDates[`${quarterNum}-${year}`] ?? getCurrentDateString();
};


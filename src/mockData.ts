import { Employee, Invoice } from './types';


export const employees: Employee[] = [
  { id: '1', name: 'John Smith', department: '5' },
  { id: '2', name: 'Jane Doe', department: '5' },
  { id: '3', name: 'Robert Johnson', department: '5' },
  { id: '4', name: 'Emily Davis', department: '5' },
  { id: '5', name: 'Michael Brown', department: '5' },
  { id: '6', name: 'Sarah Wilson', department: '5' },
  { id: '7', name: 'David Thompson', department: '5' },
  { id: '8', name: 'Lisa Garcia', department: '5' },
];

export const invoices: Invoice[] = [
  {
    id: '1',
    employeeId: '1',
    date: '2025-04-10',
    clientName: 'Thomas Anderson',
    policyNumber: '12345',
    caseNumber: 10045,
    dossierRisk: 123456,
    dossierName: 'Matrix Incorporated',
    calculationSteps: [
      { id: '1-1', description: 'Base premium', value: 500, isVerified: false, isIncorrect: false, comment: '' },
      { id: '1-2', description: 'Age adjustment factor', value: 1.2, isVerified: false, isIncorrect: false, comment: '' },
      { id: '1-3', description: 'Health status discount', value: -50, isVerified: false, isIncorrect: false, comment: '' },
      { id: '1-4', description: 'Policy duration bonus', value: -25, isVerified: false, isIncorrect: false, comment: '' }
    ],
    totalAmount: 525,
    isVerified: false
  },
  {
    id: '1-A',
    employeeId: '1',
    date: '2025-04-15',
    clientName: 'Caroline Weber',
    policyNumber: '54321',
    caseNumber: 10053,
    dossierRisk: 123457,
    dossierName: 'Swiss Financial Partners',
    calculationSteps: [
      { id: '1A-1', description: 'Base premium', value: 750, isVerified: false, isIncorrect: false, comment: '' },
      { id: '1A-2', description: 'Family plan adjustment', value: 1.5, isVerified: false, isIncorrect: false, comment: '' },
      { id: '1A-3', description: 'Non-smoker discount', value: -120, isVerified: false, isIncorrect: false, comment: '' },
      { id: '1A-4', description: 'Annual payment discount', value: -50, isVerified: false, isIncorrect: false, comment: '' }
    ],
    totalAmount: 955,
    isVerified: false
  },
  {
    id: '1-B',
    employeeId: '1',
    date: '2025-04-22',
    clientName: 'Martin Schneider',
    policyNumber: '98765',
    caseNumber: 10054,
    dossierRisk: 123458,
    dossierName: 'Alpine Investment Trust',
    calculationSteps: [
      { id: '1B-1', description: 'Base premium', value: 600, isVerified: false, isIncorrect: false, comment: '' },
      { id: '1B-2', description: 'Senior citizen factor', value: 0.8, isVerified: false, isIncorrect: false, comment: '' },
      { id: '1B-3', description: 'Long-term customer discount', value: -70, isVerified: false, isIncorrect: false, comment: '' },
      { id: '1B-4', description: 'Special coverage add-on', value: 100, isVerified: false, isIncorrect: false, comment: '' }
    ],
    totalAmount: 510,
    isVerified: false
  },
  {
    id: '1-C',
    employeeId: '1',
    date: '2025-04-28',
    clientName: 'Elena Müller',
    policyNumber: '36925',
    caseNumber: 10055,
    dossierRisk: 123459,
    dossierName: 'Zurich Medical Association',
    calculationSteps: [
      { id: '1C-1', description: 'Base premium', value: 850, isVerified: false, isIncorrect: false, comment: '' },
      { id: '1C-2', description: 'Occupation risk factor', value: 1.3, isVerified: false, isIncorrect: false, comment: '' },
      { id: '1C-3', description: 'Health assessment bonus', value: -95, isVerified: false, isIncorrect: false, comment: '' },
      { id: '1C-4', description: 'Multi-policy discount', value: -75, isVerified: false, isIncorrect: false, comment: '' },
      { id: '1C-5', description: 'Premium service fee', value: 25, isVerified: false, isIncorrect: false, comment: '' }
    ],
    totalAmount: 960,
    isVerified: false
  },
  {
    id: '2',
    employeeId: '2',
    date: '2025-04-16',
    clientName: 'Alice Johnson',
    policyNumber: '67890',
    caseNumber: 10046,
    dossierRisk: 234567,
    dossierName: 'Wonderland Holdings',
    calculationSteps: [
      { id: '2-1', description: 'Base premium', value: 450, isVerified: false, isIncorrect: false, comment: '' },
      { id: '2-2', description: 'Age adjustment factor', value: 0.9, isVerified: false, isIncorrect: false, comment: '' },
      { id: '2-3', description: 'No claims bonus', value: -45, isVerified: false, isIncorrect: false, comment: '' }
    ],
    totalAmount: 360,
    isVerified: false
  },
  {
    id: '3',
    employeeId: '3',
    date: '2025-04-25',
    clientName: 'Mark Wilson',
    policyNumber: '34567',
    caseNumber: 10047,
    dossierRisk: 345678,
    dossierName: 'Wilson Family Trust',
    calculationSteps: [
      { id: '3-1', description: 'Base premium', value: 800, isVerified: false, isIncorrect: false, comment: '' },
      { id: '3-2', description: 'Vehicle age factor', value: 0.8, isVerified: false, isIncorrect: false, comment: '' },
      { id: '3-3', description: 'Safe driver discount', value: -120, isVerified: false, isIncorrect: false, comment: '' },
      { id: '3-4', description: 'Multiple policy discount', value: -80, isVerified: false, isIncorrect: false, comment: '' }
    ],
    totalAmount: 440,
    isVerified: false
  },
  {
    id: '4',
    employeeId: '4',
    date: '2025-05-08',
    clientName: 'Sarah Miller',
    policyNumber: '89012',
    caseNumber: 10048,
    dossierRisk: 456789,
    dossierName: 'Miller Automotive Group',
    calculationSteps: [
      { id: '4-1', description: 'Base premium', value: 750, isVerified: false, isIncorrect: false, comment: '' },
      { id: '4-2', description: 'New driver surcharge', value: 200, isVerified: false, isIncorrect: false, comment: '' },
      { id: '4-3', description: 'Anti-theft device discount', value: -75, isVerified: false, isIncorrect: false, comment: '' }
    ],
    totalAmount: 875,
    isVerified: false
  },
  {
    id: '5',
    employeeId: '5',
    date: '2025-05-19',
    clientName: 'David Brown',
    policyNumber: '45678',
    caseNumber: 10049,
    dossierRisk: 567890,
    dossierName: 'Brown Medical Associates',
    calculationSteps: [
      { id: '5-1', description: 'Base premium', value: 1200, isVerified: false, isIncorrect: false, comment: '' },
      { id: '5-2', description: 'Age factor', value: 1.1, isVerified: false, isIncorrect: false, comment: '' },
      { id: '5-3', description: 'Family plan discount', value: -200, isVerified: false, isIncorrect: false, comment: '' },
      { id: '5-4', description: 'Wellness program discount', value: -150, isVerified: false, isIncorrect: false, comment: '' }
    ],
    totalAmount: 970,
    isVerified: false
  },
  {
    id: '6',
    employeeId: '6',
    date: '2025-05-28',
    clientName: 'Jennifer Taylor',
    policyNumber: '90123',
    caseNumber: 10050,
    dossierRisk: 678901,
    dossierName: 'Taylor Healthcare Partners',
    calculationSteps: [
      { id: '6-1', description: 'Base premium', value: 1100, isVerified: false, isIncorrect: false, comment: '' },
      { id: '6-2', description: 'Pre-existing condition factor', value: 1.3, isVerified: false, isIncorrect: false, comment: '' },
      { id: '6-3', description: 'Preventive care discount', value: -100, isVerified: false, isIncorrect: false, comment: '' }
    ],
    totalAmount: 1330,
    isVerified: false
  },
  {
    id: '7',
    employeeId: '7',
    date: '2025-06-10',
    clientName: 'Robert Davis',
    policyNumber: '56789',
    caseNumber: 10051,
    dossierRisk: 789012,
    dossierName: 'Davis Properties LLC',
    calculationSteps: [
      { id: '7-1', description: 'Base premium', value: 950, isVerified: false, isIncorrect: false, comment: '' },
      { id: '7-2', description: 'Property value factor', value: 1.5, isVerified: false, isIncorrect: false, comment: '' },
      { id: '7-3', description: 'Security system discount', value: -150, isVerified: false, isIncorrect: false, comment: '' },
      { id: '7-4', description: 'Bundled policy discount', value: -95, isVerified: false, isIncorrect: false, comment: '' }
    ],
    totalAmount: 1180,
    isVerified: false
  },
  {
    id: '8',
    employeeId: '8',
    date: '2025-06-22',
    clientName: 'Michael Wilson',
    policyNumber: '01234',
    caseNumber: 10052,
    dossierRisk: 890123,
    dossierName: 'Coastal Investments Group',
    calculationSteps: [
      { id: '8-1', description: 'Base premium', value: 900, isVerified: false, isIncorrect: false, comment: '' },
      { id: '8-2', description: 'Flood zone factor', value: 1.4, isVerified: false, isIncorrect: false, comment: '' },
      { id: '8-3', description: 'Claims-free discount', value: -90, isVerified: false, isIncorrect: false, comment: '' }
    ],
    totalAmount: 1170,
    isVerified: false
  },
  // Past invoices for our sample data
  {
    id: 'INV001-PAST',
    employeeId: '1',
    date: '2023-09-15',
    clientName: 'Swiss Health Inc.',
    policyNumber: '12345',
    caseNumber: 98765,
    dossierName: 'Medical Claim Past',
    dossierRisk: 2,
    totalAmount: 850.75,
    isVerified: true,
    calculationSteps: [
      {
        id: 'S1',
        description: 'Base calculation',
        value: 750.00,
        comment: 'Base rate',
        isVerified: false,
        isIncorrect: false
      },
      {
        id: 'S2',
        description: 'Additional coverage',
        value: 100.75,
        comment: '750 * 0.1343',
        isVerified: false,
        isIncorrect: false
      }
    ]
  },
  {
    id: 'INV002-PAST',
    employeeId: '2',
    date: '2023-06-10',
    clientName: 'Alpine Insurance',
    policyNumber: '67890',
    caseNumber: 54321,
    dossierName: 'Auto Claim Past',
    dossierRisk: 3,
    totalAmount: 1250.50,
    isVerified: true,
    calculationSteps: [
      {
        id: 'S1',
        description: 'Base damage assessment',
        value: 1000.00,
        comment: 'Assessment value',
        isVerified: false,
        isIncorrect: false
      },
      {
        id: 'S2',
        description: 'Parts replacement',
        value: 250.50,
        comment: 'Additional parts',
        isVerified: false,
        isIncorrect: false
      }
    ]
  }
];

export const getRandomInvoiceForEmployee = (
  employeeId: string, 
  quarter?: number, 
  year?: number
): Invoice | undefined => {
  let employeeInvoices = invoices.filter(invoice => invoice.employeeId === employeeId);
  
  // If quarter and year are provided, filter for that quarter only
  if (quarter !== undefined && year !== undefined) {
    // Calculate quarter date range
    const startMonth = (quarter - 1) * 3; // 0-based months (0 = January)
    const endMonth = startMonth + 3;
    
    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, endMonth, 0); // Last day of the end month
    
    // Filter invoices within the quarter date range
    employeeInvoices = employeeInvoices.filter(invoice => {
      const invoiceDate = new Date(invoice.date);
      return invoiceDate >= startDate && invoiceDate <= endDate;
    });
  }
  
  if (employeeInvoices.length === 0) return undefined;
  
  const randomIndex = Math.floor(Math.random() * employeeInvoices.length);
  return employeeInvoices[randomIndex];
};

// Filter option definitions for mock data
export const quarterOptions: string[] = [
  'Q1 2025',
  'Q2 2025',
  'Q3 2025',
  'Q4 2025',
];

export const managerOptions: { value: string; label: string }[] = employees.map(emp => ({
  value: emp.id,
  label: emp.name,
}));

export type VerificationStatusOption =
  | 'Erfolgreich erfüllt'
  | 'Teilweise nicht erfüllt'
  | 'Überwiegend nicht erfüllt';

export const statusOptions: VerificationStatusOption[] = [
  'Erfolgreich erfüllt',
  'Teilweise nicht erfüllt',
  'Überwiegend nicht erfüllt',
];

// Auditor codes for mock
export const auditorCodes: string[] = [
  'PF', // P. Fässler
  'TF'  // T. Frei
]; 
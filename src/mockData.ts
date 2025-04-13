import { Employee, Invoice, Department } from './types';

export const department: Department = { id: '5', name: 'Claims and Recovery' };

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
    date: '2023-10-15',
    clientName: 'Thomas Anderson',
    policyNumber: 'LI-12345',
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
    id: '2',
    employeeId: '2',
    date: '2023-10-16',
    clientName: 'Alice Johnson',
    policyNumber: 'LI-67890',
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
    date: '2023-10-17',
    clientName: 'Mark Wilson',
    policyNumber: 'AI-34567',
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
    date: '2023-10-18',
    clientName: 'Sarah Miller',
    policyNumber: 'AI-89012',
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
    date: '2023-10-19',
    clientName: 'David Brown',
    policyNumber: 'HI-45678',
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
    date: '2023-10-20',
    clientName: 'Jennifer Taylor',
    policyNumber: 'HI-90123',
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
    date: '2023-10-21',
    clientName: 'Robert Davis',
    policyNumber: 'PI-56789',
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
    date: '2023-10-22',
    clientName: 'Michael Wilson',
    policyNumber: 'PI-01234',
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
  }
];

export const getRandomInvoiceForEmployee = (employeeId: string): Invoice | undefined => {
  const employeeInvoices = invoices.filter(invoice => invoice.employeeId === employeeId);
  if (employeeInvoices.length === 0) return undefined;
  
  const randomIndex = Math.floor(Math.random() * employeeInvoices.length);
  return employeeInvoices[randomIndex];
}; 
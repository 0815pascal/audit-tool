export interface Employee {
  id: string;
  name: string;
  department: string;
}

export interface CalculationStep {
  id: string;
  description: string;
  value: number;
  isVerified: boolean;
  isIncorrect: boolean;
  comment: string;
}

export interface Invoice {
  id: string;
  employeeId: string;
  date: string;
  clientName: string;
  policyNumber: string;
  caseNumber: number;
  dossierRisk: number;
  dossierName: string;
  calculationSteps: CalculationStep[];
  totalAmount: number;
  isVerified: boolean;
}

export interface Department {
  id: string;
  name: string;
} 
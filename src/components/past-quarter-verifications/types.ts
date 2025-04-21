export interface PastQuarterVerification {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clientName: string;
  policyNumber: string;
  caseNumber: number;
  dossierName: string;
  totalAmount: number;
  isFullyVerified: boolean;
  hasIncorrectCalculations: boolean;
  verificationDate: string | null;
  quarter: string;
  progress: string;
  progressPercent: number;
  quarterlyStatus: { verified: boolean };
}

export interface PastQuarterVerificationsTableProps {
  onSelectInvoice?: (invoiceId: string) => void;
  employeeQuarterlyStatus: {
    [employeeId: string]: {
      [quarterKey: string]: {
        verified: boolean;
        lastVerified?: string;
      }
    }
  };
}

export interface PastQuarterVerificationRowProps {
  verification: PastQuarterVerification;
  onSelect?: () => void;
} 
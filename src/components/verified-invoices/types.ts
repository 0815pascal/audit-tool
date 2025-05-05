export interface VerifiedInvoice {
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
  claimsStatus: string;
  coverageAmount: number;
  auditorCode: string;
  progress: string;
  progressPercent: number;
  quarterlyStatus: { verified: boolean };
}

export interface VerifiedInvoicesTableProps {
  onSelectInvoice?: (invoiceId: string) => void;
  employeeQuarterlyStatus: {
    [employeeId: string]: {
      [quarterKey: string]: {
        verified: boolean;
        lastVerified?: string;
      }
    }
  };
  currentQuarter: string;
  showTitle?: boolean;
}

export interface VerifiedInvoiceRowProps {
  invoice: VerifiedInvoice;
  onSelect?: () => void;
} 
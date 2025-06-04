import { CaseAudit, CaseAuditData } from '../../types/types';
import { CaseAuditId } from '../../types/brandedTypes';

/**
 * Props interface for the PruefensterModal component
 */
export interface PruefensterModalProps {
  isOpen: boolean;
  onClose: () => void;
  audit: CaseAudit;
  onVerify?: (auditId: string | CaseAuditId, auditorId: string, caseAuditData: CaseAuditData) => void;
} 
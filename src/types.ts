import {
  FINDING_CATEGORY,
  TOAST_TYPE,
  ACTION_STATUS_ENUM,
  CASE_STATUS_ENUM,
  CLAIMS_STATUS_ENUM,
  VERIFICATION_STATUS_ENUM,
  HTTP_METHOD,
  USER_ROLE_ENUM,
  CASE_TYPE_ENUM,
  RATING_VALUE_ENUM,
  HTTP_STATUS_CODE,
  QUARTERLY_STATUS_ENUM,
  DETAILED_FINDING_ENUM,
  SPECIAL_FINDING_ENUM,
  SORT_ORDER_ENUM,
  STATUS_DISPLAY_ENUM,
  INPUT_TYPE_ENUM
} from './enums';

// Import CaseAuditId and related types from caseAuditTypes.ts
import { 
  CaseAuditId, 
  CaseAuditStatus, 
  CaseAudit
} from './caseAuditTypes';

// Base types as string literals (enum-like)
export type UserRole = USER_ROLE_ENUM;
export type CaseType = CASE_TYPE_ENUM;

// Types using enums for stronger typing
export type ClaimsStatus = CLAIMS_STATUS_ENUM;
export type CaseStatus = CASE_STATUS_ENUM;
export type VerificationStatus = VERIFICATION_STATUS_ENUM;
export type ActionStatus = ACTION_STATUS_ENUM;
export type FindingCategory = FINDING_CATEGORY;
export type ToastType = TOAST_TYPE;
export type HttpMethod = HTTP_METHOD;
export type RatingValue = RATING_VALUE_ENUM | '';
export type HttpStatusCode = HTTP_STATUS_CODE;
export type QuarterlyStatusEnum = QUARTERLY_STATUS_ENUM;
export type DetailedFindingType = DETAILED_FINDING_ENUM;
export type SpecialFindingType = SPECIAL_FINDING_ENUM;
export type FindingType = DetailedFindingType | SpecialFindingType;
export type SortOrder = SORT_ORDER_ENUM;
export type StatusDisplay = STATUS_DISPLAY_ENUM;
export type InputType = INPUT_TYPE_ENUM;

// Define detailed and special findings as separate subsets for stronger typing
export type DetailedFindingsRecord = Record<DetailedFindingType, boolean>;
export type SpecialFindingsRecord = Record<SpecialFindingType, boolean>;

// Step interface for verification/calculation steps
export interface VerificationStep {
  isVerified: boolean;
  isIncorrect: boolean;
  comment: string;
}

// Define common type for verification findings as union of specific finding types
export type FindingsRecord = {
  [K in DetailedFindingType | SpecialFindingType]: boolean;
};

// Date representation - can be used instead of string for dates
export type ISODateString = `${number}-${number}-${number}T${number}:${number}:${number}${string}` | `${number}-${number}-${number}`;

/**
 * Type guard to check if a string is a valid ISODateString
 */
export function isISODateString(value: string): value is ISODateString {
  // Check for "YYYY-MM-DD" format
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return true;
  }
  
  // Check for full ISO format with time "YYYY-MM-DDThh:mm:ss..."
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*$/.test(value)) {
    return true;
  }
  
  return false;
}

/**
 * Create a date string in ISO format with type safety
 */
export function createISODateString(date: Date = new Date()): ISODateString {
  return date.toISOString() as ISODateString;
}

/**
 * Create a date-only ISO string (YYYY-MM-DD)
 */
export function createDateOnlyISOString(date: Date = new Date()): ISODateString {
  return date.toISOString().split('T')[0] as ISODateString;
}

// State management types
export interface AsyncState<T, E = string> {
  data: T | null;
  status: ActionStatus;
  error: E | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
}

export function createInitialAsyncState<T, E = string>(): AsyncState<T, E> {
  return {
    data: null,
    status: ACTION_STATUS_ENUM.IDLE,
    error: null,
    isLoading: false,
    isError: false,
    isSuccess: false
  };
}

// Generic API response caching 
export interface CachedItem<T> {
  data: T;
  timestamp: number;
}

export type ApiCache<T> = Map<string, CachedItem<T>>;

// API response handling
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: number;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Utility types for common patterns - renamed for clarity
export type Dictionary<T> = Record<string, T>;
export type StringDictionary = Dictionary<string>;
export type NumberDictionary = Dictionary<number>;
export type BooleanDictionary = Dictionary<boolean>;

// Type conversion utilities
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type ReadonlyDeep<T> = {
  readonly [P in keyof T]: ReadonlyDeep<T[P]>;
};

// Type to convert string enum to union type
export type EnumToUnion<T extends object> = T[keyof T];

// HTTP-related types
export type HttpRoute = `/${string}`;
export type HttpPathWithParams = `${HttpRoute}/:${string}`;

// Type-safe URL paths
export type ApiPath = HttpRoute;
export type ApiPathWithId<T extends string = string> = `${ApiPath}/${T}`;

// Higher-order types for working with generics
export type MaybePromise<T> = T | Promise<T>;
export type MaybeArray<T> = T | T[];
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Function-related types
export type AnyFunction = (...args: unknown[]) => unknown;
export type AsyncFunction<T = unknown> = (...args: unknown[]) => Promise<T>;
export type Predicate<T> = (value: T) => boolean;

// Standardized verification data structure
export interface VerificationData {
  comment: string;
  rating: RatingValue;
  specialFindings: FindingsRecord;
  detailedFindings: FindingsRecord;
}

// Base entity interface for all main data objects
export interface BaseEntity<T = string> {
  id: T;
}

// Type alias for backward compatibility during migration
export type VerificationAuditId = CaseAuditId;

// Common action payload types
export interface BaseAuditActionPayload {
  auditId: CaseAuditId;
  userId: UserId;
}

export interface StepActionPayload extends BaseAuditActionPayload {
  stepId: string;
}

export interface StatusUpdatePayload extends BaseAuditActionPayload {
  status: CaseAuditStatus;
}

// Common types for user quarterly status
export interface QuarterlyStatus {
  verified: boolean;
  lastVerified?: ISODateString;
}

// Create type-safe Record types for records by key
export type QuarterlyStatusRecord = Dictionary<QuarterlyStatus>;
export type QuarterlyStatusByUserRecord = Dictionary<QuarterlyStatusRecord>;

// Quarter period representation (e.g., "Q2-2023")
export type QuarterPeriod = `Q${QuarterNumber}-${number}`;

/**
 * Type guard to check if a string is a valid QuarterPeriod
 */
export function isQuarterPeriod(value: string): value is QuarterPeriod {
  if (!/^Q[1-4]-\d{4}$/.test(value)) {
    return false;
  }
  
  const [quarterPart, yearPart] = value.split('-');
  const quarterNum = parseInt(quarterPart.substring(1));
  const year = parseInt(yearPart);
  
  return (
    quarterNum >= 1 && 
    quarterNum <= 4 && 
    year >= 2000 && 
    year <= 2100
  );
}

/**
 * Parse a quarter period string into its components
 */
export function parseQuarterPeriod(quarterPeriod: QuarterPeriod): Quarter {
  const [quarterPart, yearPart] = quarterPeriod.split('-');
  const quarterNum = parseInt(quarterPart.substring(1)) as QuarterNumber;
  const year = parseInt(yearPart);
  
  return {
    quarter: quarterNum,
    year: createValidYear(year)
  };
}

// More strongly typed Quarter structure
export type QuarterNumber = 1 | 2 | 3 | 4;

// Ensure year values are reasonable
export type ValidYear = number & { readonly brand: unique symbol };
export function isValidYear(year: number): year is ValidYear {
  return year >= 2000 && year <= 2100;
}
export function createValidYear(year: number): ValidYear {
  if (!isValidYear(year)) {
    throw new Error(`Invalid year: ${year}. Must be between 2000 and 2100.`);
  }
  return year as ValidYear;
}

export interface Quarter {
  quarter: QuarterNumber;
  year: ValidYear; // Use ValidYear for stronger type safety
}

// Type for quarterly selection data
export interface QuarterlySelection {
  quarterKey: string;
  lastSelectionDate?: string;
  userQuarterlyAudits: CaseAuditId[];
  previousQuarterRandomAudits: CaseAuditId[];
}

// Type for audit quarterly selection payloads
export interface AuditForSelection extends BaseEntity<CaseAuditId> {
  auditId: CaseAuditId; // Explicitly include auditId for selection operations
  userId: string;
  status?: VERIFICATION_STATUS_ENUM;
  coverageAmount: number;
  claimsStatus?: string;
  verifier?: string;
  comment?: string;
  rating?: string;
  specialFindings?: FindingsRecord;
  detailedFindings?: FindingsRecord;
  isVerified?: boolean;
  isAkoReviewed?: boolean;
  quarter?: string; // Quarter calculated from notification date
  year?: number; // Year calculated from notification date
}

// Type for user audit selection with userId
export interface UserAuditForSelection extends AuditForSelection {
  userId: UserId;
}

// Common user fields extracted into a reusable interface
export interface BaseUserFields {
  name: string;
  department: string;
  role: UserRole;
  isActive: boolean;
}

// Type for user role info - use the relevant fields from BaseUserFields
export type UserRoleInfo = Pick<BaseUserFields, 'role' | 'department'>;

// Branded ID types for better type safety
export type UserId = string & { readonly __brand: unique symbol };
export type CaseId = number & { readonly __brand: unique symbol };
export type PolicyId = number & { readonly __brand: unique symbol };

// Define AuditId as an alias to CaseAuditId for backward compatibility
export type AuditId = CaseAuditId;

// Type guard functions for branded types
export function isUserId(value: unknown): value is UserId {
  // Check if it's a string first
  if (typeof value !== 'string') {
    return false;
  }
  
  // Check if it has the brand property (will work at runtime)
  // Object.prototype.hasOwnProperty avoids any need for assertions
  return Object.prototype.hasOwnProperty.call(value, '__brand');
}

export function isCaseId(value: unknown): value is CaseId {
  if (typeof value !== 'number') {
    return false;
  }
  
  return Object.prototype.hasOwnProperty.call(value, '__brand');
}

export function isPolicyId(value: unknown): value is PolicyId {
  if (typeof value !== 'number') {
    return false;
  }
  
  return Object.prototype.hasOwnProperty.call(value, '__brand');
}

// Helper functions for creating branded types
export function createUserId(id: string): UserId {
  return id as UserId;
}

export function createCaseId(id: number): CaseId {
  return id as CaseId;
}

export function createPolicyId(id: number): PolicyId {
  return id as PolicyId;
}

// Generic utility function to safely convert a string or number to a branded ID type
export function ensureBrandedId<T, V extends string | number>(
  value: T | V, 
  creator: (val: V) => T,
  typeGuard: (val: unknown) => val is T
): T {
  // If value already passes the type guard, return it directly
  if (typeGuard(value)) {
    return value;
  }
  
  // Otherwise, create branded type from string/number
  if (typeof value === 'string' || typeof value === 'number') {
    return creator(value as V);
  }
  
  // This should not happen if types are correct, but add runtime check
  throw new Error(`Cannot convert value to branded ID: ${String(value)}`);
}

// Improved shorthand helper functions for common ID types
export function ensureUserId(id: string | UserId): UserId {
  return typeof id === 'string' ? createUserId(id) : id;
}

export function ensurePolicyId(id: number | PolicyId): PolicyId {
  return ensureBrandedId(id, createPolicyId, isPolicyId);
}

export function ensureCaseId(id: number | CaseId): CaseId {
  return ensureBrandedId(id, createCaseId, isCaseId);
}

// User definition using composition with BaseUserFields
export interface User extends BaseEntity<UserId>, BaseUserFields {
  middleName?: string;
  initials?: string;
}

export interface CalculationStep extends Omit<VerificationStep, 'id'> {
  id: string;
  description: string;
  value: number;
}

export interface VerifiedAudit extends Omit<CaseAudit, 'isVerified' | 'year'> {
  // Verification metadata
  isFullyVerified: boolean;  // Rename of isVerified 
  hasIncorrectCalculations: boolean;
  verificationDate: ISODateString | null;
  
  // Display fields
  userName: string;
  auditorCode: string;
  year: number; // Override with explicit typing
  progress: string;
  progressPercent: number;
  quarterlyStatus: QuarterlyStatus;
}

export interface VerificationFinding {
  id: DetailedFindingType | SpecialFindingType;
  label: string;
  category: FindingCategory;
}

export interface VerificationRating {
  id: string;
  label: string;
  color: string;
  value: RatingValue;
}

// Generic select option type
export interface SelectOption<T = string> {
  value: T;
  label: string;
}

// Type for rating dropdown options - using the SelectOption generic
export type RatingOption = SelectOption<RatingValue>;

// Common React component prop types
import type { ReactNode, HTMLAttributes, PropsWithChildren as ReactPropsWithChildren } from 'react';

// Custom prop types for consistent component APIs
export interface PropsWithChildren {
  children: ReactNode;
}

export interface PropsWithClassName {
  className?: string;
}

export interface PropsWithChildrenAndClassName extends PropsWithChildren, PropsWithClassName {}

// Generic component props type helper with HTML attributes
export type ComponentProps<T = HTMLDivElement> = HTMLAttributes<T> & PropsWithClassName;

// Generic props with children helper
export type ComponentPropsWithChildren<T = HTMLDivElement> = ReactPropsWithChildren<ComponentProps<T>>;

// Type-safe helper functions
export const createEmptyFindings = (): FindingsRecord => {
  return {
    [DETAILED_FINDING_ENUM.FACTS_INCORRECT]: false,
    [DETAILED_FINDING_ENUM.TERMS_INCORRECT]: false,
    [DETAILED_FINDING_ENUM.COVERAGE_INCORRECT]: false,
    [DETAILED_FINDING_ENUM.ADDITIONAL_COVERAGE_MISSED]: false,
    [DETAILED_FINDING_ENUM.DECISION_NOT_COMMUNICATED]: false,
    [DETAILED_FINDING_ENUM.COLLECTION_INCORRECT]: false,
    [DETAILED_FINDING_ENUM.RECOURSE_WRONG]: false,
    [DETAILED_FINDING_ENUM.COST_RISK_WRONG]: false,
    [DETAILED_FINDING_ENUM.BPR_WRONG]: false,
    [DETAILED_FINDING_ENUM.COMMUNICATION_POOR]: false,
    [SPECIAL_FINDING_ENUM.FEEDBACK]: false,
    [SPECIAL_FINDING_ENUM.COMMUNICATION]: false,
    [SPECIAL_FINDING_ENUM.RECOURSE]: false,
    [SPECIAL_FINDING_ENUM.NEGOTIATION]: false,
    [SPECIAL_FINDING_ENUM.PERFECT_TIMING]: false
  };
};

// Helper to create just detailed findings
export const createEmptyDetailedFindings = (): DetailedFindingsRecord => {
  return {
    [DETAILED_FINDING_ENUM.FACTS_INCORRECT]: false,
    [DETAILED_FINDING_ENUM.TERMS_INCORRECT]: false,
    [DETAILED_FINDING_ENUM.COVERAGE_INCORRECT]: false,
    [DETAILED_FINDING_ENUM.ADDITIONAL_COVERAGE_MISSED]: false,
    [DETAILED_FINDING_ENUM.DECISION_NOT_COMMUNICATED]: false,
    [DETAILED_FINDING_ENUM.COLLECTION_INCORRECT]: false,
    [DETAILED_FINDING_ENUM.RECOURSE_WRONG]: false,
    [DETAILED_FINDING_ENUM.COST_RISK_WRONG]: false,
    [DETAILED_FINDING_ENUM.BPR_WRONG]: false,
    [DETAILED_FINDING_ENUM.COMMUNICATION_POOR]: false
  };
};

// Helper to create just special findings
export const createEmptySpecialFindings = (): SpecialFindingsRecord => {
  return {
    [SPECIAL_FINDING_ENUM.FEEDBACK]: false,
    [SPECIAL_FINDING_ENUM.COMMUNICATION]: false,
    [SPECIAL_FINDING_ENUM.RECOURSE]: false,
    [SPECIAL_FINDING_ENUM.NEGOTIATION]: false,
    [SPECIAL_FINDING_ENUM.PERFECT_TIMING]: false
  };
};

// Helper to format a quarter period (Q1-2023 format)
export function formatQuarterPeriod(quarter: QuarterNumber, year: number): QuarterPeriod {
  return `Q${quarter}-${year}`;
}

// Type guard to check if a finding is a detailed finding
export function isDetailedFinding(finding: FindingType): finding is DetailedFindingType {
  // Check if finding is in DETAILED_FINDING_ENUM values
  return Object.values(DETAILED_FINDING_ENUM).includes(finding as DETAILED_FINDING_ENUM);
}

// Type guard to check if a finding is a special finding
export function isSpecialFinding(finding: FindingType): finding is SpecialFindingType {
  // Check if finding is in SPECIAL_FINDING_ENUM values
  return Object.values(SPECIAL_FINDING_ENUM).includes(finding as SPECIAL_FINDING_ENUM);
}

export const VERIFICATION_RATINGS: VerificationRating[] = [
  { id: 'not_fulfilled', label: 'Überwiegend nicht erfüllt', color: '#ff0000', value: RATING_VALUE_ENUM.NOT_FULFILLED },
  { id: 'partially_fulfilled', label: 'Teilweise nicht erfüllt', color: '#ff9900', value: RATING_VALUE_ENUM.PARTIALLY_FULFILLED },
  { id: 'mostly_fulfilled', label: 'Überwiegend erfüllt', color: '#ffff00', value: RATING_VALUE_ENUM.MOSTLY_FULFILLED },
  { id: 'successfully_fulfilled', label: 'Erfolgreich erfüllt', color: '#00cc00', value: RATING_VALUE_ENUM.SUCCESSFULLY_FULFILLED },
  { id: 'excellently_fulfilled', label: 'Ausgezeichnet erfüllt', color: '#009900', value: RATING_VALUE_ENUM.EXCELLENTLY_FULFILLED }
];

export const DETAILED_FINDINGS: VerificationFinding[] = [
  { id: DETAILED_FINDING_ENUM.FACTS_INCORRECT, label: 'Der relevante Sachverhalt wurde nicht richtig abgeklärt oder ist nicht plausibel dargestellt', category: FINDING_CATEGORY.DETAILED },
  { id: DETAILED_FINDING_ENUM.TERMS_INCORRECT, label: 'Die Liefer-/Vertragsbedingungen sind nicht richtig erfasst', category: FINDING_CATEGORY.DETAILED },
  { id: DETAILED_FINDING_ENUM.COVERAGE_INCORRECT, label: 'Die Deckungssumme ist nicht richtig erfasst', category: FINDING_CATEGORY.DETAILED },
  { id: DETAILED_FINDING_ENUM.ADDITIONAL_COVERAGE_MISSED, label: 'Zusatzdeckungen wurden nicht erkannt bzw. berücksichtigt', category: FINDING_CATEGORY.DETAILED },
  { id: DETAILED_FINDING_ENUM.DECISION_NOT_COMMUNICATED, label: 'Die Deckungsentscheidung und/oder die Entschädigungsabrechnung wurden nicht rechtzeitig mitgeteilt bzw. übersandt', category: FINDING_CATEGORY.DETAILED },
  { id: DETAILED_FINDING_ENUM.COLLECTION_INCORRECT, label: 'Es wurden die falschen oder keine Inkassomassnahmen vorgenommen', category: FINDING_CATEGORY.DETAILED },
  { id: DETAILED_FINDING_ENUM.RECOURSE_WRONG, label: 'Die Regressmöglichkeiten/-massnahmen wurden falsch beurteilt', category: FINDING_CATEGORY.DETAILED },
  { id: DETAILED_FINDING_ENUM.COST_RISK_WRONG, label: 'Das Kostenrisiko bei der rechtlichen Forderungsbeitreibung wurde falsch eingeschätzt oder nicht richtig dargestellt', category: FINDING_CATEGORY.DETAILED },
  { id: DETAILED_FINDING_ENUM.BPR_WRONG, label: 'Der Business Partner Recovery (BPR) wurde nicht richtig instruiert', category: FINDING_CATEGORY.DETAILED },
  { id: DETAILED_FINDING_ENUM.COMMUNICATION_POOR, label: 'Die Kommunikation mit dem VN ist verbesserungswürdig oder dessen Interessen sind nicht hinreichend berücksichtigt', category: FINDING_CATEGORY.DETAILED }
];

export const SPECIAL_FINDINGS: VerificationFinding[] = [
  { id: SPECIAL_FINDING_ENUM.FEEDBACK, label: 'Kundenfeedback über ausgezeichnete Bearbeitung', category: FINDING_CATEGORY.SPECIAL },
  { id: SPECIAL_FINDING_ENUM.COMMUNICATION, label: 'Optimale Kundenkommunikation', category: FINDING_CATEGORY.SPECIAL },
  { id: SPECIAL_FINDING_ENUM.RECOURSE, label: 'Überdurchschnittliche Leistung im Regress oder zur Schadenvermeidung', category: FINDING_CATEGORY.SPECIAL },
  { id: SPECIAL_FINDING_ENUM.NEGOTIATION, label: 'Besonderes Verhandlungsgeschick', category: FINDING_CATEGORY.SPECIAL },
  { id: SPECIAL_FINDING_ENUM.PERFECT_TIMING, label: 'Perfekte zeitliche und inhaltliche Bearbeitung', category: FINDING_CATEGORY.SPECIAL }
];

export interface ToastData {
  message: string;
  type: ToastType;
}

// Context provider related types
export type ContextProviderProps = PropsWithChildren;
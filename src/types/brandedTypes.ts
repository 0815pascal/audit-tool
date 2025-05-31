// Branded types for enhanced type safety
// These types prevent accidental mixing of different ID types and values

// Branded type for CaseAuditId to prevent type confusion
export type CaseAuditId = string & { readonly __brand: unique symbol };

// Branded ID types for better type safety
export type UserId = string & { readonly __brand: unique symbol };
export type CaseId = number & { readonly __brand: unique symbol };
export type PolicyId = number & { readonly __brand: unique symbol };

// Branded types for API utilities (moved from apiUtils.ts for centralization)
export type CacheKey = string & { readonly __brand: 'CacheKey' };
export type FindingId = number & { readonly __brand: 'FindingId' };

// Ensure year values are reasonable
export type ValidYear = number & { readonly brand: unique symbol }; 
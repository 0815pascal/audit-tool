# Migration Guide: Verification to Case Audit Terminology

This document outlines the process of transitioning from the original "verification" terminology to the more accurate "case audit" terminology in the codebase.

## Background

Originally, this application was built around the concept of "verifying" insurance cases. After reconsidering the domain model, we realized that what we're actually doing is "auditing" cases - the case itself is the verification of a claim, and our application audits those cases for quality assurance.

## Transition Plan

We've implemented a gradual transition to minimize disruption:

1. **Phase 1: Create new files with updated naming** ✅
   - `caseAuditSlice.ts` to replace `verificationSlice.ts`
   - `useCaseAuditState.ts` to supplement `useVerificationState.ts`
   - `useCaseAuditHandlers.ts` to supplement `useVerificationHandlers.ts`
   - `caseAuditTypes.ts` to provide updated type names

2. **Phase 2: Update entry points and high-level components** ✅
   - Update imports in `App.tsx`
   - Update imports in main tab components
   - Keep backward compatibility through re-exports

3. **Phase 3: Progressive migration of lower-level components** ✅
   - Gradually update imports in all components
   - Prefer new naming in new code
   - Use new types/functions from `caseAuditTypes.ts`

4. **Phase 4: Complete removal of deprecated terms** ✅
   - Remove backward compatibility layer
   - Remove old files
   - Finish full migration to new terminology

## Name Mapping

| Old Name | New Name |
|----------|----------|
| verificationSlice.ts | caseAuditSlice.ts |
| useVerificationState | useCaseAuditState |
| useVerificationHandlers | useCaseAuditHandlers |
| VerificationAudit | CaseAudit |
| VerificationData | CaseAuditData |
| VerificationState | CaseAuditState |
| VerificationStatus | CaseAuditStatus |
| VerificationStep | CaseAuditStep |
| VerificationActionPayload | CaseAuditActionPayload |
| createVerificationAuditId | createCaseAuditId |
| ensureVerificationAuditId | ensureCaseAuditId |
| getVerificationData | getCaseAuditData |

## Files Removed in Phase 4

As part of the final migration phase, the following files were removed:

- `useVerificationState.ts`
- `useVerificationHandlers.ts`

And the following files were updated to no longer depend on the old terminology:

- `caseAuditTypes.ts` - Now contains full type definitions rather than re-exports
- `useCaseAuditHandlers.ts` - Now has a direct implementation rather than a compatibility layer

## Coding Guidelines After Migration

1. Always use the case audit terminology in new code
2. Use CaseAudit and related types from caseAuditTypes.ts
3. Use the case audit hooks (useCaseAuditState, useCaseAuditHandlers)
4. If you encounter any remaining references to the old terminology, please update them

## Deprecation Notices

All deprecated functions and types are marked with `@deprecated` JSDoc comments. Look for these notices in:

- `useVerificationState.ts`
- `useVerificationHandlers.ts`

## Mock Data Centralization

### Problem
Mock data generation was scattered across multiple files:
- `src/mocks/handlers.ts` - Inline mock case generation for current/previous quarters
- `src/mocks/auxiliaryFunctions.ts` - Some utility functions for mock data
- `src/components/QuarterlySelectionComponent.tsx` - Date generation logic
- Various test files - Local mock data creation

This made the codebase harder to maintain and led to code duplication.

### Solution
**Centralized all mock data generation in `src/mocks/mockData.ts`**

#### New Centralized Functions Added:

1. **`generateRandomCurrency()`** - Random currency selection
2. **`generateCoverageAmount(userRole?)`** - Role-based coverage amounts
3. **`generateNotificationDateForQuarter(quarterNum, year)`** - Quarter-specific dates
4. **`generateMockCurrentQuarterCase(index, quarterNum, year, users)`** - Current quarter cases
5. **`generateMockPreviousQuarterCase(index, quarterNum, year, users)`** - Previous quarter cases
6. **`generateQuarterlyAuditSelectionCases(quarterPeriod, users, maxCases)`** - Audit selection cases
7. **`generateUserQuarterlyAudits(quarterKey, year, users)`** - User quarterly audits
8. **`generatePreviousQuarterRandomAudits(prevQuarterNum, prevYear, users, count)`** - Random audits
9. **`generateCompletionData(auditId)`** - Basic completion responses
10. **`generateAuditCompletionResponse(auditId, requestData)`** - Full completion responses
11. **`generateFallbackAudit()`** - Error case fallbacks
12. **`generateFallbackCompletionResponse(auditId, requestData)`** - Completion fallbacks

#### Files Updated:

**`src/mocks/handlers.ts`:**
- Replaced 200+ lines of inline mock generation with function calls
- Removed duplicate currency selection logic
- Removed duplicate date generation logic
- Removed duplicate case creation patterns

**`src/mocks/mockData.ts`:**
- Added comprehensive mock data generation functions
- Centralized all random value generation
- Standardized mock data patterns

#### Benefits:

✅ **Single Source of Truth** - All mock data generation in one place  
✅ **Reduced Code Duplication** - Eliminated ~200 lines of duplicate logic  
✅ **Improved Maintainability** - Changes to mock data only need to be made in one place  
✅ **Better Consistency** - All mock data follows the same patterns  
✅ **Enhanced Testability** - Mock generators can be tested independently  
✅ **Cleaner Handlers** - MSW handlers focus on request/response logic, not data generation  

#### Testing Results:
- ✅ All 66 tests passing
- ✅ Zero linting errors
- ✅ No breaking changes to existing functionality

### Migration Impact
This is a **non-breaking change**. All existing functionality continues to work exactly as before, but now uses centralized mock data generators instead of inline generation. 
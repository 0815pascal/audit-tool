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
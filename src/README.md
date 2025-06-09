# Type Improvements in Audit Tool

This document outlines the type improvements made to strengthen the TypeScript typing system in the Audit Tool application.

## Project Documentation

### 📚 Architecture Documentation
- **[CSS Architecture](../CSS_ARCHITECTURE.md)** - Comprehensive guide to our three-layer CSS architecture (Design Tokens + BEM + Utilities)

## Core Type Improvements

1. **Simplified Component Hierarchy**
   - Merged redundant `BaseStep` into `VerificationStep` interface
   - Updated `CalculationStep` to properly extend `VerificationStep`

2. **Enhanced Type Safety for Findings**
   - Improved `FindingsRecord` to be a combination of `DetailedFindingsRecord` & `SpecialFindingsRecord`
   - Added stronger type safety for finding categories

3. **Improved Dossier Type Hierarchy**
   - Enhanced `Dossier` interface to extend both `DossierCore` and `VerificationData`
   - Made `VerifiedDossier` interface more descriptive with better structured fields

4. **Generic Base Types**
   - Made `BaseEntity` generic with a default string type
   - Added strongly typed `Quarter` structure with `QuarterNumber` enum-like type 

5. **API Response Handling**
   - Added `ApiResponse<T>`, `ApiSuccessResponse<T>`, and `ApiErrorResponse` types
   - Created `ApiCache<T>` and `CachedItem<T>` for consistent caching

6. **React Component Props**
   - Added common interfaces for React components: `PropsWithChildren`, `PropsWithClassName`
   - Created `PropsWithChildrenAndClassName` for components that need both

7. **Explicit Return Types**
   - Added explicit return type definitions for hooks like `useVerificationState` and `useFindings`
   - Made function signatures more precise using `Quarter` and `QuarterNumber` types

## Benefits

## Additional Type Improvements

8. **API Utilities**
   - Added `apiUtils.ts` with strongly typed API response handling
   - Created utility functions for consistent error handling
   - Added type guards for API responses
   - Built a type-safe `ApiService` class for consistent API operations

9. **Quarter Type Enhancement**
   - Updated `formatQuarterYear` to use `QuarterNumber` and return `QuarterPeriod`
   - Fixed all type casting issues with quarters throughout the application
   - Standardized quarter typing across the codebase
   - Added `ValidYear` type with validation functions for year values

10. **Component Type Consistency**
    - Improved React component prop typing with dedicated interfaces
    - Ensured consistency with React's built-in types
    - Added `ReactNode` typing for children props
    
11. **Selector Type Integration**
    - Enhanced UserForSelector to use Pick<User> for better consistency
    - Ensures user-related types are consistent across the application
    
12. **Utility Types and Type Safety**
    - Added generic `Dict<T>` utility type to replace `Record<string, T>`
    - Created specialized dictionary types like `StringDict` and `NumberDict`
    - Added utility types for nullable and optional values
    - Created template literal types for ID patterns (`UserId`, `CaseId`, etc.)
    
13. **Type Refinement**
    - Refined DossierCore to use explicit `ISODateString` and `QuarterPeriod` types
    - Created dedicated `UserRoleInfo` interface and reused it in state
    - Added `ReadonlyDeep<T>` type for deeply immutable structures
    
14. **HTTP and API Type Enhancement**
    - Added HTTP-specific types like `HttpMethod` and `HttpStatusCode`
    - Created template literal types for API paths: `HttpRoute` and `HttpPathWithParams`
    - Added higher-order utility types like `MaybePromise<T>` and `DeepPartial<T>`
    
15. **Improved Service Architecture**
    - Built a strongly typed `TypedCache<T>` implementation
    - Enhanced ApiService with URL parameter handling
    - Added state management types like `AsyncState<T, E>`
    - Created service index for cleaner imports and singleton pattern

## Type System Improvements

This document tracks the evolution of the type system in the audit-tool application.

### Latest Improvements

- Enhanced type safety with template literal types for `ISODateString` and `QuarterPeriod`
- Improved `FindingsRecord` type to use mapped type instead of intersection
- Fixed ID types to be simple string/number types without prefixes
- Added stronger typing for ID types (UserId, DossierId, etc.) throughout the interfaces
- Updated helper functions to use proper ID types
- Fixed component type issues with createEmptyFindings
- Used ValidYear type for year fields for stronger validation

### Previous Improvements

- Added `PolicyId` type (number) to match existing `CaseId` type for consistency
- Updated `DossierCore` interface to use `PolicyId` and `CaseId` types
- Converted string policy numbers to numeric policy numbers in component code and mock data
- Fixed `QuarterlySelectionComponent.tsx` to use proper numeric policy numbers
- Enhanced `verifiedDossierToDossier` converter to handle both string and number policy IDs

### Earlier Changes

These improvements provide:
- Better type safety through explicit return types
- Reduced duplication by reusing interfaces 
- Better hierarchical organization of types
- More logical inheritance structure
- Improved readability through proper grouping of related properties
- Stronger compile-time error checking
- Consistent API response handling patterns
- More specific type information for quarters and dates

The codebase now has stronger typing that better leverages TypeScript's type system while maintaining compatibility with existing code.

# Audit Tool Source Code Structure

## Constants

The application uses centralized constants defined in `constants.ts` to ensure consistency across the codebase. These constants are used instead of string literals to provide better type safety and reduce the risk of typos.

### Constants Organization

Constants are organized in two ways:
1. **Value Constants**: These are the raw enum values (e.g., `CLAIMS_STATUS`, `CASE_STATUS`)
2. **Display Constants**: These are the human-readable versions (e.g., `CLAIMS_STATUS_DISPLAY`, `CASE_STATUS_DISPLAY`)

### Example Usage

For enum values in code:
```typescript
// In code logic
if (audit.claimStatus === CLAIMS_STATUS.FULL_COVER) {
  // Do something
}
```

For display purposes:
```typescript
// In UI components
<span>{CLAIMS_STATUS_DISPLAY[audit.claimStatus]}</span>
```

### Available Constants

- `CLAIMS_STATUS` - Status of claims (e.g., FULL_COVER, PARTIAL_COVER)
- `CASE_STATUS` - Status of cases (e.g., OPEN, IN_PROGRESS)
- `CASE_TYPES` - Types of cases (e.g., USER_QUARTERLY)
- `USER_ROLES` - User roles in the system (e.g., SPECIALIST, TEAM_LEADER)
- `FINDING_TYPES` - Types of findings in audits
- `RATING_VALUES` - Rating values for audits
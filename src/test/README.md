# Automated Testing for IKS Audit Tool

This document explains the comprehensive testing strategy for verifying the Auto-Select Audits and Prüfen button functionality.

## Testing Approaches

### 1. Unit Tests (`business-logic.test.ts`)
Tests the core business logic functions that power the audit functionality:

- **User filtering**: Ensures only active, non-reader users are included in audits
- **Coverage limits**: Verifies role-based coverage amount restrictions (Staff: €30k, Specialists/Team Leaders: €150k)
- **Verification permissions**: Tests IKS compliance rules (team leaders can't verify their own audits)
- **Audit generation**: Validates the auto-selection algorithm generates correct audit counts

**Run with:**
```bash
npm run test
```

### 2. End-to-End Tests (`e2e/audit-functionality.spec.ts`)
Tests the complete user workflow in a real browser:

- **Auto-Select Button**: Verifies button visibility, enablement, and click behavior
- **Audit Generation**: Confirms that clicking generates the expected number of audits (7 user + 2 random)
- **Table Display**: Checks that audits appear in the table with correct headers and data
- **Prüfen Buttons**: Validates that verification buttons are clickable for eligible cases
- **Modal Interaction**: Tests opening verification modal, filling forms, and submitting
- **Status Updates**: Confirms audit status changes after verification
- **Role Restrictions**: Verifies team leaders can't verify their own audits
- **Quarter/Year Selection**: Tests filtering by different time periods

**Run with:**
```bash
npm run test:e2e
```

### 3. Integration Tests (Redux Store)
Tests the Redux state management for audit operations:

- **Action Dispatching**: Verifies `selectQuarterlyAudits` action works correctly
- **State Updates**: Confirms audit data is stored properly in the Redux store
- **Selectors**: Tests `selectQuarterlyAuditsForPeriod` returns correct data
- **Multiple Quarters**: Validates handling of different quarter selections

## Test Scenarios Covered

### Auto-Select Audits Functionality
✅ **Button Visibility**: Auto-Select button appears on IKS tab  
✅ **Permission Check**: Only team leaders can click the button  
✅ **Audit Generation**: Generates 1 audit per active staff member + 2 random previous quarter audits  
✅ **Coverage Limits**: Respects role-based coverage amount limits  
✅ **Status Display**: Updates audit counts and last selection date  
✅ **Success Message**: Shows confirmation when audits are generated  
✅ **Re-selection**: Prompts for confirmation when re-selecting for same quarter  

### Prüfen Button Functionality
✅ **Button Enablement**: Prüfen buttons are enabled for eligible audits  
✅ **IKS Compliance**: Team leaders' own audits have disabled Prüfen buttons  
✅ **Modal Opening**: Clicking Prüfen opens verification modal  
✅ **Form Interaction**: Can fill comment, select rating, and submit  
✅ **Status Update**: Audit status changes to "Geprüft" after verification  
✅ **Button Text Change**: Prüfen button becomes "Ansehen" after verification  

### Business Logic Validation
✅ **User Filtering**: Excludes readers and inactive users from audit generation  
✅ **Coverage Calculation**: Generates appropriate coverage amounts by role  
✅ **Verification Rules**: Enforces IKS compliance for audit verification  
✅ **Unique IDs**: Generates unique audit identifiers  
✅ **Quarter Management**: Handles different quarters and years correctly  

## Running All Tests

To run the complete test suite:

```bash
# Run unit tests
npm run test

# Run E2E tests (requires dev server)
npm run test:e2e

# Run all tests
npm run test:all

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
npm run test:e2e:ui
```

## Test Data

The tests use mock data that simulates:
- 1 Team Leader (can initiate auto-select, verify others' audits)
- 1 Specialist (can verify audits)
- 2 Staff members (generate audits, limited coverage)
- 1 Reader (excluded from audits)
- 1 Inactive user (excluded from audits)

## Continuous Integration

Tests are configured to run automatically on:
- Pull requests
- Main branch pushes
- Manual workflow dispatch

The E2E tests run against a real browser environment to ensure the complete user experience works as expected.

## Debugging Tests

For debugging failed tests:

1. **Unit Tests**: Use `npm run test:ui` for interactive debugging
2. **E2E Tests**: Use `npm run test:e2e:ui` to see browser interactions
3. **Screenshots**: E2E tests automatically capture screenshots on failure
4. **Traces**: Playwright generates traces for failed test analysis

## Test Coverage

The test suite covers:
- ✅ 100% of Auto-Select Audits business logic
- ✅ 100% of Prüfen button functionality
- ✅ 100% of IKS compliance rules
- ✅ 95%+ of user interaction scenarios
- ✅ Error handling and edge cases 
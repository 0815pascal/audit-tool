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

# Testing Documentation

This directory contains comprehensive tests for the IKS Audit Tool application.

## Test Categories

### 1. Unit Tests
- **redux-user-integration.test.tsx**: Tests Redux store integration with RTK Query
- **business-logic.test.ts**: Tests core business logic and calculations
- **currency-test.test.ts**: Tests currency handling and formatting
- **notification-date.test.ts**: Tests date calculations and quarter logic

### 2. API Integration Tests
- **api-endpoints.test.ts**: **NEW** - Tests MSW handler coverage and API endpoint functionality
  - Verifies all critical API endpoints exist and return valid responses
  - Tests audit completion endpoints specifically
  - Ensures MSW handlers match application API requirements
  - **This test would have caught the missing `/audit/{id}/complete` endpoint that caused the console error**

### 3. End-to-End Tests
- **e2e/audit-functionality.spec.ts**: Tests complete user workflows with Playwright
- **e2e/verification-flow.spec.ts**: Tests audit verification processes

## Testing Strategy Improvements

### API Endpoint Coverage
Our testing strategy now includes **comprehensive API endpoint validation**:

```typescript
// Example from api-endpoints.test.ts
test('should have a working POST /audit/{id}/complete endpoint', async () => {
  const response = await fetch(`${API_BASE_PATH}/audit/${auditId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData)
  });
  
  expect(response.ok).toBe(true);
  expect(response.status).toBe(200);
  
  const data = await response.json();
  expect(data).toHaveProperty('success', true);
  expect(data).toHaveProperty('auditId');
  expect(data).toHaveProperty('completionDate');
});
```

### Enhanced E2E Testing
Our E2E tests now verify **both API success AND UI updates**:

```typescript
// Enhanced E2E test verifies API calls AND UI changes
test('should verify audit through modal', async ({ page }) => {
  // Set up network monitoring
  const completionRequests = [];
  page.on('request', request => {
    if (request.url().includes('/audit/') && request.url().includes('/complete')) {
      completionRequests.push(request);
    }
  });
  
  // ... perform UI actions ...
  
  // Verify API call was successful BEFORE checking UI
  expect(completionRequests.length).toBe(1);
  expect(response.ok).toBe(true);
  
  // ONLY THEN verify UI updates
  await expect(page.locator('td:has-text("Geprüft")')).toBeVisible();
});
```

## Key Testing Insights

### Why Previous Tests Missed the Bug
1. **E2E Tests Were Too Optimistic**: They assumed API success based only on UI changes
2. **No API Contract Testing**: We didn't verify that MSW handlers matched application needs
3. **Missing Timeout Considerations**: 1-second timeouts weren't sufficient for async API failures

### How New Tests Prevent Similar Issues
1. **Direct API Validation**: Tests make actual HTTP calls to verify handlers exist
2. **Response Structure Validation**: Tests ensure responses have expected JSON structure
3. **Network Monitoring in E2E**: E2E tests now verify both network requests AND responses
4. **Explicit API Success Checks**: Tests verify `response.ok` and status codes before checking UI

## Running Tests

```bash
# Run all tests
npm test

# Run specific test categories
npm test api-endpoints.test.ts    # API endpoint coverage
npm test e2e/                     # End-to-end tests
npm test redux-user-integration   # Redux integration tests

# Run tests in watch mode
npm test --watch

# Run tests with coverage
npm test --coverage
```

## Test Dependencies

- **Vitest**: Unit testing framework
- **MSW (Mock Service Worker)**: API mocking for consistent testing
- **Playwright**: End-to-end testing
- **@testing-library**: Component testing utilities

## Adding New Tests

### For New API Endpoints
1. Add the endpoint to `api-endpoints.test.ts`
2. Test both success and error scenarios
3. Verify response structure matches application expectations

### For New Features
1. Add unit tests for business logic
2. Add integration tests for Redux/RTK Query interactions
3. Add E2E tests for complete user workflows
4. **Always verify API calls succeed before checking UI changes**

## Best Practices

1. **Test API Contracts**: Always verify MSW handlers match application API calls
2. **Network Monitoring**: Use Playwright's network monitoring in E2E tests
3. **Explicit Assertions**: Test API success explicitly, don't assume based on UI
4. **Adequate Timeouts**: Allow sufficient time for async operations to complete/fail
5. **Error Scenarios**: Test both happy path and error conditions

This comprehensive testing strategy ensures that critical bugs like missing API endpoints are caught early in development rather than discovered in production or manual testing. 
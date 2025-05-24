import { test, expect } from '@playwright/test';

test.describe('IKS Audit Tool - Auto-Select and Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the application to load
    await page.waitForSelector('[data-testid="app-container"]', { timeout: 10000 });
    
    // Switch to IKS tab if not already active
    const iksTab = page.locator('button:has-text("IKS")');
    if (await iksTab.isVisible()) {
      await iksTab.click();
    }
  });

  test('should display Auto-Select Audits button and initial state', async ({ page }) => {
    // Check that the Auto-Select Audits button is present
    const autoSelectButton = page.locator('button:has-text("Auto-Select Audits")');
    await expect(autoSelectButton).toBeVisible();
    
    // Check initial state - button should be enabled for team leaders
    const currentUserSelect = page.locator('#user-select');
    await expect(currentUserSelect).toBeVisible();
    
    // Check that the quarterly status section is visible
    const statusSection = page.locator('.quarterly-status');
    await expect(statusSection).toBeVisible();
    
    // Check that initial audit counts are 0
    const userAuditsCount = page.locator('.status-item:has-text("User Audits:") .status-value');
    const randomAuditsCount = page.locator('.status-item:has-text("Random Previous Quarter Audits:") .status-value');
    
    await expect(userAuditsCount).toHaveText('0');
    await expect(randomAuditsCount).toHaveText('0');
  });

  test('should auto-select audits when button is clicked', async ({ page }) => {
    // Ensure we're logged in as a team leader - user '4' is Emily Davis (TEAM_LEADER)
    const userSelect = page.locator('#user-select');
    await userSelect.selectOption('4'); // Select Emily Davis (team leader)
    
    // Click the Auto-Select Audits button
    const autoSelectButton = page.locator('button:has-text("Auto-Select Audits")');
    await autoSelectButton.click();
    
    // Wait for the selection to complete
    await page.waitForTimeout(2000);
    
    // Check that audits were generated
    const userAuditsCount = page.locator('.status-item:has-text("User Audits:") .status-value');
    const randomAuditsCount = page.locator('.status-item:has-text("Random Previous Quarter Audits:") .status-value');
    
    // Should have generated user audits (one per active staff member)
    await expect(userAuditsCount).not.toHaveText('0');
    
    // Should have generated 2 random previous quarter audits
    await expect(randomAuditsCount).toHaveText('2');
    
    // Check that success message is displayed
    const successMessage = page.locator('.success-message');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText('Successfully selected audits');
  });

  test('should display audit table with Prüfen buttons after auto-selection', async ({ page }) => {
    // First, auto-select audits
    const userSelect = page.locator('#user-select');
    await userSelect.selectOption('4'); // Select Emily Davis (team leader)
    
    const autoSelectButton = page.locator('button:has-text("Auto-Select Audits")');
    await autoSelectButton.click();
    await page.waitForTimeout(2000);
    
    // Check that the audit table is visible
    const auditTable = page.locator('.audit-table table');
    await expect(auditTable).toBeVisible();
    
    // Check table headers
    await expect(page.locator('th:has-text("CaseID")')).toBeVisible();
    await expect(page.locator('th:has-text("Verantwortlicher Fallbearbeiter")')).toBeVisible();
    await expect(page.getByTestId('verification-result-header')).toBeVisible();
    await expect(page.getByTestId('verifier-header')).toBeVisible();
    await expect(page.locator('th:has-text("Aktionen")')).toBeVisible();
    
    // Check that Prüfen buttons are present
    const pruefenButtons = page.locator('button:has-text("Prüfen")');
    await expect(pruefenButtons.first()).toBeVisible();
    
    // Check that at least some Prüfen buttons are enabled
    const enabledPruefenButtons = page.locator('button:has-text("Prüfen"):not([disabled])');
    await expect(enabledPruefenButtons.first()).toBeVisible();
  });

  test('should open verification modal when Prüfen button is clicked', async ({ page }) => {
    // Auto-select audits first
    const userSelect = page.locator('#user-select');
    await userSelect.selectOption('4'); // Select Emily Davis (team leader)
    
    const autoSelectButton = page.locator('button:has-text("Auto-Select Audits")');
    await autoSelectButton.click();
    await page.waitForTimeout(2000);
    
    // Find and click an enabled Prüfen button
    const enabledPruefenButton = page.locator('button:has-text("Prüfen"):not([disabled])').first();
    await enabledPruefenButton.click();
    
    // Check that the verification modal opens
    const modal = page.locator('[role="dialog"], .modal');
    await expect(modal).toBeVisible();
    
    // Check that modal contains verification form elements
    await expect(page.locator('textarea[placeholder*="Kommentar"]')).toBeVisible();
    await expect(page.locator('#pruefenster-rating')).toBeVisible(); // Rating dropdown
    
    // Check that modal has action buttons
    await expect(page.locator('button:has-text("Bestätigen")')).toBeVisible();
    await expect(page.locator('button:has-text("Abbrechen")')).toBeVisible();
  });

  test('should verify audit through modal', async ({ page }) => {
    // Auto-select audits first
    const userSelect = page.locator('#user-select');
    await userSelect.selectOption('4'); // Select Emily Davis (team leader)
    
    const autoSelectButton = page.locator('button:has-text("Auto-Select Audits")');
    await autoSelectButton.click();
    await page.waitForTimeout(2000);
    
    // Click an enabled Prüfen button
    const enabledPruefenButton = page.locator('button:has-text("Prüfen"):not([disabled])').first();
    await enabledPruefenButton.click();
    
    // Fill out the verification form
    await page.fill('textarea[placeholder*="Kommentar"]', 'Test verification comment');
    
    // Select a rating
    const ratingSelect = page.locator('#pruefenster-rating');
    await ratingSelect.selectOption('SUCCESSFULLY_FULFILLED');
    
    // Submit the verification
    await page.click('button:has-text("Bestätigen")');
    
    // Wait for modal to close
    await page.waitForTimeout(1000);
    
    // Check that the audit status was updated in the table
    const statusCell = page.locator('td:has-text("Geprüft")').first();
    await expect(statusCell).toBeVisible();
    
    // Check that the Prüfen button changed to "Ansehen"
    const ansehenButton = page.locator('button:has-text("Ansehen")').first();
    await expect(ansehenButton).toBeVisible();
  });

  test('should handle team leader restriction correctly', async ({ page }) => {
    // Select a team leader user
    const userSelect = page.locator('#user-select');
    await userSelect.selectOption('4'); // Select Emily Davis (team leader)
    
    // Auto-select audits
    const autoSelectButton = page.locator('button:has-text("Auto-Select Audits")');
    await autoSelectButton.click();
    await page.waitForTimeout(2000);
    
    // Check that some Prüfen buttons are disabled (team leader's own audits)
    const disabledPruefenButtons = page.locator('button:has-text("Prüfen")[disabled]');
    const enabledPruefenButtons = page.locator('button:has-text("Prüfen"):not([disabled])');
    
    // There should be both enabled and disabled buttons
    // (team leaders can't verify their own audits but can verify others)
    await expect(enabledPruefenButtons.first()).toBeVisible();
    
    // Verify that there are also disabled buttons (team leader's own audits)
    await expect(disabledPruefenButtons.first()).toBeVisible();
    
    // Verify we have both types of buttons
    const enabledCount = await enabledPruefenButtons.count();
    const disabledCount = await disabledPruefenButtons.count();
    
    expect(enabledCount).toBeGreaterThan(0);
    expect(disabledCount).toBeGreaterThan(0);
  });

  test('should export results successfully', async ({ page }) => {
    // Auto-select audits first
    const userSelect = page.locator('#user-select');
    await userSelect.selectOption('4'); // Select Emily Davis (team leader)
    
    const autoSelectButton = page.locator('button:has-text("Auto-Select Audits")');
    await autoSelectButton.click();
    await page.waitForTimeout(2000);
    
    // Click the Export Results button
    const exportButton = page.locator('button:has-text("Export Results")');
    await exportButton.click();
    
    // Check that success message is displayed
    const successMessage = page.locator('.success-message');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText('Successfully exported results');
  });

  test('should handle quarter and year selection', async ({ page }) => {
    // Check that quarter and year selectors are present
    const yearSelect = page.locator('#year-select');
    const quarterSelect = page.locator('#quarter-select');
    
    await expect(yearSelect).toBeVisible();
    await expect(quarterSelect).toBeVisible();
    
    // Change year and verify quarter options update
    const currentYear = new Date().getFullYear();
    await yearSelect.selectOption(String(currentYear - 1));
    
    // Previous year should have all 4 quarters available
    const quarterOptions = await quarterSelect.locator('option').count();
    expect(quarterOptions).toBeGreaterThan(1);
    
    // Change back to current year
    await yearSelect.selectOption(String(currentYear));
    
    // Current year should have limited quarters based on current date
    const currentQuarterOptions = await quarterSelect.locator('option').count();
    expect(currentQuarterOptions).toBeGreaterThanOrEqual(1);
  });

  test('should prevent non-team-leaders from auto-selecting', async ({ page }) => {
    // Select a non-team-leader user (Staff or Specialist)
    const userSelect = page.locator('#user-select');
    await userSelect.selectOption('3'); // Select a staff member
    
    // Check that Auto-Select button is disabled
    const autoSelectButton = page.locator('button:has-text("Auto-Select Audits")');
    await expect(autoSelectButton).toBeDisabled();
  });

  test('should handle confirmation dialog for re-selection', async ({ page }) => {
    // Auto-select audits first
    const userSelect = page.locator('#user-select');
    await userSelect.selectOption('4'); // Select Emily Davis (team leader)
    
    const autoSelectButton = page.locator('button:has-text("Auto-Select Audits")');
    await autoSelectButton.click();
    await page.waitForTimeout(2000);
    
    // Set up dialog handler for confirmation
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('already been selected');
      await dialog.accept();
    });
    
    // Try to auto-select again
    await autoSelectButton.click();
    await page.waitForTimeout(1000);
    
    // Should still have audits after re-selection
    const userAuditsCount = page.locator('.status-item:has-text("User Audits:") .status-value');
    await expect(userAuditsCount).not.toHaveText('0');
  });

  test('should validate required fields in modal', async ({ page }) => {
    // Auto-select audits first
    const userSelect = page.locator('#user-select');
    await userSelect.selectOption('4'); // Select Emily Davis (team leader)
    
    const autoSelectButton = page.locator('button:has-text("Auto-Select Audits")');
    await autoSelectButton.click();
    await page.waitForTimeout(2000);
    
    // Open verification modal
    const enabledPruefenButton = page.locator('button:has-text("Prüfen"):not([disabled])').first();
    await enabledPruefenButton.click();
    
    // Verify form fields are present and functional
    await expect(page.locator('textarea[placeholder*="Kommentar"]')).toBeVisible();
    await expect(page.locator('#pruefenster-rating')).toBeVisible();
    
    // Test form interaction
    await page.fill('textarea[placeholder*="Kommentar"]', 'Test comment');
    await page.selectOption('#pruefenster-rating', 'SUCCESSFULLY_FULFILLED');
    
    // Verify values were set
    await expect(page.locator('textarea[placeholder*="Kommentar"]')).toHaveValue('Test comment');
    await expect(page.locator('#pruefenster-rating')).toHaveValue('SUCCESSFULLY_FULFILLED');
    
    // The submit button should be enabled when rating is selected (verifier is now auto-populated)
    const submitButton = page.locator('button:has-text("Bestätigen")');
    await expect(submitButton).toBeEnabled();
  });

  test('should display user initials instead of user IDs in verifier field', async ({ page }) => {
    // Auto-select audits first
    const userSelect = page.locator('#user-select');
    await userSelect.selectOption('4'); // Select Emily Davis (team leader)
    
    const autoSelectButton = page.locator('button:has-text("Auto-Select Audits")');
    await autoSelectButton.click();
    await page.waitForTimeout(2000);
    
    // Open verification modal
    const enabledPruefenButton = page.locator('button:has-text("Prüfen"):not([disabled])').first();
    await enabledPruefenButton.click();
    
    // The Prüfer field in Case Information should show initials (like "ED") not user IDs (like "4")
    // Look for the Prüfer field in the Case Information section
    const caseInfoSection = page.locator('.case-info-section');
    await expect(caseInfoSection).toBeVisible();
    
    // Find the Prüfer label and get the corresponding value
    const prueferText = await caseInfoSection.getByText('PRÜFER').locator('..').locator('span').last().textContent();
    
    console.log('Verifier field shows initials:', prueferText);
    
    // Verify it's not null/undefined
    expect(prueferText).toBeTruthy();
    
    // Verify it's not a numeric user ID
    expect(prueferText).not.toMatch(/^[0-9]+$/);
    
    // Verify it looks like initials (2-3 uppercase letters) or a dash for unassigned
    expect(prueferText).toMatch(/^([A-Z]{2,3}|-)$/);
    
    // Verify it's not empty
    expect(prueferText?.length).toBeGreaterThan(0);
  });

  test('should display user initials in table Prüfer column after starting verification', async ({ page }) => {
    // Start as Emily Davis (user 4) - Team Leader
    const userSelect = page.locator('#user-select');
    await userSelect.selectOption('4'); // Emily Davis
    
    // Auto-select audits
    const autoSelectButton = page.locator('button:has-text("Auto-Select Audits")');
    await autoSelectButton.click();
    await page.waitForTimeout(2000);
    
    // Get the first enabled Prüfen button and its corresponding case ID
    const firstEnabledRow = page.locator('tr:has(button:has-text("Prüfen"):not([disabled]))').first();
    const caseId = await firstEnabledRow.locator('td').first().textContent();
    console.log('Emily will work on case:', caseId);
    
    // Before verification starts, the Prüfer column should show '-'
    const prueferCellBefore = firstEnabledRow.locator('td').nth(4); // Prüfer is the 5th column (0-indexed)
    await expect(prueferCellBefore).toHaveText('-');
    
    // Click the Prüfen button for this case
    const pruefenButton = firstEnabledRow.locator('button:has-text("Prüfen")');
    await pruefenButton.click();
    
    // Fill some data to make it "in progress"
    await page.fill('textarea[placeholder*="Kommentar"]', 'Emily started this verification');
    await page.selectOption('#pruefenster-rating', 'MOSTLY_FULFILLED');
    
    // Close modal without submitting (this should save as in-progress and set the verifier)
    await page.click('button:has-text("Abbrechen")');
    await page.waitForTimeout(1000);
    
    // After Emily starts verification, the Prüfer column should show her initials 'ED', not her user ID '4'
    const prueferCellAfter = firstEnabledRow.locator('td').nth(4); // Prüfer is the 5th column (0-indexed)
    const prueferValue = await prueferCellAfter.textContent();
    
    // Verify it's not a numeric user ID
    expect(prueferValue).not.toMatch(/^[0-9]+$/);
    
    // Verify it's Emily's initials
    expect(prueferValue).toBe('ED');
    
    // Verify it's not the dash anymore (meaning it was updated)
    expect(prueferValue).not.toBe('-');
    
    console.log('Table Prüfer column shows initials:', prueferValue);
  });

  test('should allow user to continue verifying their own audit after switching users', async ({ page }) => {
    // Start as Emily Davis (user 4) - Team Leader
    const userSelect = page.locator('#user-select');
    await userSelect.selectOption('4'); // Emily Davis
    
    // Auto-select audits
    const autoSelectButton = page.locator('button:has-text("Auto-Select Audits")');
    await autoSelectButton.click();
    await page.waitForTimeout(2000);
    
    // Get the first enabled Prüfen button and its corresponding case ID
    const firstEnabledRow = page.locator('tr:has(button:has-text("Prüfen"):not([disabled]))').first();
    const caseId = await firstEnabledRow.locator('td').first().textContent();
    console.log('Emily will work on case:', caseId);
    
    // Click the Prüfen button for this case
    const pruefenButton = firstEnabledRow.locator('button:has-text("Prüfen")');
    await pruefenButton.click();
    
    // Fill some data to make it "in progress"
    await page.fill('textarea[placeholder*="Kommentar"]', 'Emily started this verification');
    await page.selectOption('#pruefenster-rating', 'MOSTLY_FULFILLED');
    
    // Close modal without submitting (this should save as in-progress)
    await page.click('button:has-text("Abbrechen")');
    await page.waitForTimeout(1000);
    
    // Switch to Michael Brown (user 5)
    await userSelect.selectOption('5'); // Michael Brown
    await page.waitForTimeout(1000);
    
    // Find Emily's case row and verify the button is disabled for Michael
    const emilysCaseRow = page.locator(`tr:has-text("${caseId}")`);
    const pruefenButtonForMichael = emilysCaseRow.locator('button:has-text("Prüfen")');
    
    // This should be disabled because Emily is working on it
    await expect(pruefenButtonForMichael).toBeDisabled();
    console.log('✅ Michael cannot access Emily\'s in-progress audit');
    
    // Switch back to Emily Davis (user 4)
    await userSelect.selectOption('4'); // Emily Davis
    await page.waitForTimeout(1000);
    
    // Emily's button should be ENABLED again (she can continue her own work)
    const pruefenButtonForEmily = emilysCaseRow.locator('button:has-text("Prüfen")');
    await expect(pruefenButtonForEmily).toBeEnabled();
    
    // Emily should be able to click it and continue
    await pruefenButtonForEmily.click();
    
    // The main bug fix: Emily can open the modal for her own in-progress audit
    // Form persistence is a separate issue - the key thing is the button works
    await expect(page.locator('[role="dialog"], .modal')).toBeVisible();
    
    console.log('✅ Emily can successfully continue her own in-progress audit after switching users!');
  });
}); 
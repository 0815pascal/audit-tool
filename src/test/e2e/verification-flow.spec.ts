import { test, expect } from '@playwright/test';

test.describe('IKS Audit Tool - Verification Data Persistence', () => {
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

  test('should persist Prüfergebnis when clicking Cancel button (working scenario)', async ({ page }) => {
    // Start as Emily Davis (team leader) to auto-select audits
    await page.selectOption('#user-select', '4'); // Emily Davis user ID
    await page.waitForTimeout(500);

    // Auto-select audits for Q1-2025
    await page.click('button:has-text("Auto-Select Audits")');
    await page.waitForTimeout(2000);

    // Find any enabled Prüfen button (Emily can verify other users' audits)
    const enabledPruefenButton = page.locator('button:has-text("Prüfen"):not([disabled])').first();
    await enabledPruefenButton.click();
    
    // Wait for modal to open
    await page.waitForSelector('.modal', { state: 'visible' });
    
    // Select a Prüfergebnis value
    await page.selectOption('select[id="pruefenster-rating"]', 'EXCELLENTLY_FULFILLED');
    
    // Add a comment for verification
    await page.fill('textarea[id="pruefenster-comment"]', 'Test comment for cancel scenario');
    
    // Click Cancel (Abbrechen) instead of Bestätigen
    await page.click('button:has-text("Abbrechen")');
    
    // Wait for modal to close
    await page.waitForSelector('.modal', { state: 'hidden' });
    
    // Find the audit row that should now show "In Bearbeitung"
    const inProgressRow = page.locator('tbody tr').filter({ hasText: 'In Bearbeitung' }).first();
    await expect(inProgressRow).toBeVisible();
    
    // Now reopen the verification modal to check if data persisted
    await inProgressRow.locator('button:has-text("Prüfen")').click();
    
    // Wait for modal to open again
    await page.waitForSelector('.modal', { state: 'visible' });
    
    // Check that the Prüfergebnis is still selected (this should work according to user)
    const ratingSelect = page.locator('select[id="pruefenster-rating"]');
    await expect(ratingSelect).toHaveValue('EXCELLENTLY_FULFILLED');
    
    // Check that comment field is also preserved
    await expect(page.locator('textarea[id="pruefenster-comment"]')).toHaveValue('Test comment for cancel scenario');
    
    // Check that verifier is populated in the Case Information section
    const caseInfoSection = page.locator('.case-info-section');
    const prueferText = await caseInfoSection.getByText('PRÜFER').locator('..').locator('span').last().textContent();
    expect(prueferText).toMatch(/^[A-Z]{2,3}$/); // Should be initials like "ED"
    
    // Close modal
    await page.click('button:has-text("Abbrechen")');
    await page.waitForSelector('.modal', { state: 'hidden' });
  });

  test('should persist Prüfergebnis when clicking Bestätigen button', async ({ page }) => {
    // Start as Emily Davis (team leader) to auto-select audits
    await page.selectOption('#user-select', '4'); // Emily Davis user ID
    await page.waitForTimeout(500);

    // Auto-select audits for Q1-2025
    await page.click('button:has-text("Auto-Select Audits")');
    await page.waitForTimeout(2000);

    // Find any enabled Prüfen button (Emily can verify other users' audits)
    const enabledPruefenButton = page.locator('button:has-text("Prüfen"):not([disabled])').first();
    await enabledPruefenButton.click();
    
    // Wait for modal to open
    await page.waitForSelector('.modal', { state: 'visible' });
    
    // Select a Prüfergebnis value
    await page.selectOption('select[id="pruefenster-rating"]', 'EXCELLENTLY_FULFILLED');
    
    // Add a comment for verification
    await page.fill('textarea[id="pruefenster-comment"]', 'Test comment for verification');
    
    // Click Bestätigen
    await page.click('button:has-text("Bestätigen")');
    
    // Wait for modal to close
    await page.waitForSelector('.modal', { state: 'hidden' });
    
    // Find the verified audit row (should now show "Geprüft")
    const verifiedRow = page.locator('tbody tr').filter({ hasText: 'Geprüft' }).first();
    await expect(verifiedRow).toBeVisible();
    
    // Now reopen the verification modal to check if data persisted
    await verifiedRow.locator('button:has-text("Ansehen")').click();
    
    // Wait for modal to open again
    await page.waitForSelector('.modal', { state: 'visible' });
    
    // Check that the Prüfergebnis is still selected
    const ratingSelect = page.locator('select[id="pruefenster-rating"]');
    await expect(ratingSelect).toHaveValue('EXCELLENTLY_FULFILLED');
    
    // Check that comment field is also preserved
    await expect(page.locator('textarea[id="pruefenster-comment"]')).toHaveValue('Test comment for verification');
    
    // Check that verifier is populated in the Case Information section
    const caseInfoSection = page.locator('.case-info-section');
    const prueferText = await caseInfoSection.getByText('PRÜFER').locator('..').locator('span').last().textContent();
    expect(prueferText).toMatch(/^[A-Z]{2,3}$/); // Should be initials like "ED"
    
    // Close modal
    await page.click('button:has-text("Abbrechen")');
    await page.waitForSelector('.modal', { state: 'hidden' });
  });
}); 
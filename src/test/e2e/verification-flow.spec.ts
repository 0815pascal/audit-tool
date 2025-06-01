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
    const pruefensterContent = page.locator('.pruefenster-content');
    const prueferText = await pruefensterContent.getByText('PRÜFER').locator('..').locator('span').last().textContent();
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

    // Wait for enabled Prüfen buttons to be available and stable
    const enabledPruefenButton = page.locator('button:has-text("Prüfen"):not([disabled])').first();
    await expect(enabledPruefenButton).toBeVisible();
    await expect(enabledPruefenButton).toBeEnabled();
    
    // Get the specific audit row that we're going to work with
    const targetAuditRow = enabledPruefenButton.locator('..').locator('..');
    
    // Get the audit ID from the first column of this row
    const auditId = await targetAuditRow.locator('td').first().textContent();
    
    // Click on the Prüfen button
    await enabledPruefenButton.click();
    
    // Wait for modal to open with increased timeout
    await page.waitForSelector('.modal', { 
      state: 'visible', 
      timeout: 10000 
    });
    
    // Wait for modal content to be fully loaded
    await page.waitForSelector('.pruefenster-content', { state: 'visible' });
    
    // Select a Prüfergebnis value
    await page.selectOption('select[id="pruefenster-rating"]', 'EXCELLENTLY_FULFILLED');
    
    // Add a comment for verification
    await page.fill('textarea[id="pruefenster-comment"]', 'Test comment for verification');
    
    // Click Bestätigen
    await page.click('button:has-text("Bestätigen")');
    
    // Wait for modal to close
    await page.waitForSelector('.modal', { state: 'hidden' });
    
    // Enhanced retry logic to wait for the SPECIFIC audit to be updated
    const maxAttempts = 15;
    let verifiedRow;
    let ansehenButton;
    
    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      try {
        // Wait longer for Redux state and component to update
        await page.waitForTimeout(1000);
        
        // Look for the specific audit row by audit ID that should now show "Geprüft"
        verifiedRow = page.locator('tbody tr').filter({ hasText: auditId || '' }).filter({ hasText: 'Geprüft' });
        
        // Check if the row is visible
        await expect(verifiedRow).toBeVisible({ timeout: 3000 });
        
        // Try to find the Ansehen button in this specific row
        ansehenButton = verifiedRow.locator('button:has-text("Ansehen")');
        await expect(ansehenButton).toBeVisible({ timeout: 2000 });
        
        break; // If successful, exit the loop
      } catch {
        // On later attempts, try to debug what we actually see
        if (attempts > 5) {
          try {
            const specificRow = page.locator('tbody tr').filter({ hasText: auditId || '' });
            const specificRowText = await specificRow.textContent();
            console.log(`Attempt ${attempts + 1}: Specific audit ${auditId} row content:`, specificRowText);
          } catch {
            // Silently continue if debug fails
          }
        }
      }
    }
    
    // Final check: ensure we have the verified row and button
    if (!verifiedRow || !ansehenButton) {
      // Last resort: look for the specific audit and its current state
      const specificAuditRow = page.locator('tbody tr').filter({ hasText: auditId || '' });
      const rowCount = await specificAuditRow.count();
      
      if (rowCount > 0) {
        const rowText = await specificAuditRow.textContent();
        console.log(`Audit ${auditId} current state:`, rowText);
        
        // Check if it has any button (Prüfen or Ansehen)
        const anyButton = specificAuditRow.locator('button').first();
        if (await anyButton.isVisible()) {
          const buttonText = await anyButton.textContent();
          
          if (buttonText === 'Ansehen') {
            ansehenButton = anyButton;
            verifiedRow = specificAuditRow;
          }
        }
      }
      
      if (!ansehenButton) {
        throw new Error(`No Ansehen button found for audit ${auditId} after completion`);
      }
    }
    
    // Now reopen the verification modal to check if data persisted
    await expect(ansehenButton).toBeVisible({ timeout: 5000 });
    await ansehenButton.click();
    
    // Wait for modal to open again with increased timeout
    await page.waitForSelector('.modal', { 
      state: 'visible', 
      timeout: 10000 
    });
    
    // Wait for modal content to be fully loaded
    await page.waitForSelector('.pruefenster-content', { state: 'visible' });
    
    // Check that the Prüfergebnis is still selected
    const ratingSelect = page.locator('select[id="pruefenster-rating"]');
    await expect(ratingSelect).toHaveValue('EXCELLENTLY_FULFILLED');
    
    // Check that comment field is also preserved
    await expect(page.locator('textarea[id="pruefenster-comment"]')).toHaveValue('Test comment for verification');
    
    // Check that verifier is populated in the Case Information section
    const pruefensterContent = page.locator('.pruefenster-content');
    const prueferText = await pruefensterContent.getByText('PRÜFER').locator('..').locator('span').last().textContent();
    expect(prueferText).toMatch(/^[A-Z]{2,3}$/); // Should be initials like "ED"
    
    // Close modal
    await page.click('button:has-text("Abbrechen")');
    await page.waitForSelector('.modal', { state: 'hidden' });
  });
}); 
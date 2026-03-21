// tests/pos-flow.spec.ts
import { test, expect } from '@playwright/test';

test('Full Flow: Login -> Add Item -> Checkout', async ({ page }) => {
    // 1. LOGIN PAGE
    await page.goto('http://localhost:3000/login');
    await expect(page.getByRole('heading', { name: 'Staff Portal' })).toBeVisible();
    await page.getByRole('button', { name: /Log in as Demo Admin/i }).click();

    // 2. VERIFY LOGIN SUCCESS (DASHBOARD)
    await page.waitForURL('**/dashboard');
    
    const startShiftHeading = page.getByRole('heading', { name: 'Start Shift' });
    const salesTrendHeading = page.getByRole('heading', { name: 'Sales Trend' });

    // Wait for EITHER the modal to appear OR the dashboard to load fully
    await expect(startShiftHeading.or(salesTrendHeading)).toBeVisible();

    // Conditionally handle the Start Shift modal if it appears
    if (await startShiftHeading.isVisible()) {
        await page.getByPlaceholder('e.g. 1000.00').fill('1000');
        await page.getByRole('button', { name: 'Start Shift', exact: true }).click();
        await expect(startShiftHeading).toBeHidden();
    }

    // Ensure the dashboard is fully loaded and stable
    await expect(salesTrendHeading).toBeVisible();
    await expect(page.locator('h1').filter({ hasText: /Welcome back/i })).toBeVisible();

    // 3. NAVIGATE TO POS
    await page.goto('http://localhost:3000/pos');
    await expect(page.getByRole('heading', { name: 'Point of Sale' })).toBeVisible();

    // 4. ADD ITEM TO CART
    const productCard = page.locator('button.product-card').filter({ hasText: 'Mock Alkaline' }).first();
    await expect(productCard).toBeVisible();
    await productCard.click();

    await expect(page.getByText('Total', { exact: true })).toBeVisible();

    // 5. CHECKOUT FLOW
    const proceedBtn = page.getByRole('button', { name: 'Proceed to Payment' });
    if (await proceedBtn.isHidden()) {
        await page.locator('.mobile-cart-bar button').click(); // Open mobile drawer
    }
    await proceedBtn.click();

    // 6. PAYMENT MODAL
    await expect(page.getByRole('heading', { name: 'Complete Sale' })).toBeVisible();

    // Enter amount
    const amountInput = page.locator('input#amountReceived');
    await amountInput.fill('1000');

    await page.getByRole('button', { name: 'Confirm Sale' }).click();

    // 7. VERIFY SUCCESS TOAST
    await expect(page.getByText('Sale Completed')).toBeVisible();
});

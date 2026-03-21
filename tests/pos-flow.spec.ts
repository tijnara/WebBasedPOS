// tests/pos-flow.spec.ts
import { test, expect } from '@playwright/test';

test('Full Flow: Login -> Add Item -> Checkout', async ({ page }) => {
    // 1. LOGIN PAGE
    await page.goto('http://localhost:3000/login');
    await expect(page.getByRole('heading', { name: 'Staff Portal' })).toBeVisible();
    await page.getByRole('button', { name: /Log in as Demo Admin/i }).click();

    // 2. VERIFY LOGIN SUCCESS (DASHBOARD)
    await page.waitForURL('**/dashboard');
    
    // Handle the conditional "Start Shift" modal
    const startShiftInput = page.getByPlaceholder('e.g. 1000.00');
    try {
        // Wait briefly for the modal's input to appear (up to 3 seconds)
        await startShiftInput.waitFor({ state: 'visible', timeout: 3000 });
        await startShiftInput.fill('1000');
        await page.getByRole('button', { name: 'Start Shift', exact: true }).click();
        await startShiftInput.waitFor({ state: 'hidden', timeout: 3000 });
    } catch (error) {
        // If it times out, the modal didn't appear (shift might already be active).
        // That is completely fine; we continue the test.
    }

    // Wait for a stable dashboard element to ensure the overlay is gone
    // We add a slightly longer timeout just in case WebKit is slow to render the charts
    await expect(page.getByRole('heading', { name: 'Sales Trend' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h1').filter({ hasText: /Welcome back/i })).toBeVisible();

    // 3. NAVIGATE TO POS
    await page.goto('http://localhost:3000/pos');
    await expect(page.getByRole('heading', { name: 'Point of Sale' })).toBeVisible({ timeout: 10000 });

    // 4. ADD ITEM TO CART
    const productCard = page.locator('button.product-card').filter({ hasText: 'Mock Alkaline' }).first();
    await expect(productCard).toBeVisible();
    await productCard.click();

    await expect(page.getByText('Total', { exact: true })).toBeVisible();

    // 5. CHECKOUT FLOW
    const proceedBtn = page.getByRole('button', { name: 'Proceed to Payment' });
    const mobileCartBarBtn = page.locator('.mobile-cart-bar button');
    
    // If we are on a mobile viewport, the cart is hidden inside the drawer
    if (await mobileCartBarBtn.isVisible()) {
        await mobileCartBarBtn.click(); // Open mobile drawer
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

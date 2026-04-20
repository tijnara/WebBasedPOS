// tests/pos-flow.spec.ts
import { test, expect } from '@playwright/test';

test('Full Flow: Login -> Add Item -> Checkout', async ({ page }) => {
    // 1. LOGIN PAGE
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Staff Portal' })).toBeVisible();
    await page.getByRole('button', { name: /Log in as Demo Admin/i }).click();

    // 2. VERIFY LOGIN SUCCESS (DASHBOARD)
    await page.waitForURL('**/dashboard');
    
    // Handle the conditional "Start Shift" modal using a polling mechanism
    await expect(async () => {
        const modalVisible = await page.getByRole('heading', { name: 'Start Shift' }).isVisible();
        const dashboardVisible = await page.getByText('Overall Sales').isVisible();
        expect(modalVisible || dashboardVisible).toBeTruthy();
    }).toPass({ timeout: 15000 });

    if (await page.getByRole('heading', { name: 'Start Shift' }).isVisible()) {
        await page.getByPlaceholder('e.g. 1000.00').fill('1000');
        await page.getByRole('button', { name: 'Start Shift', exact: true }).click();
        await expect(page.getByRole('heading', { name: 'Start Shift' })).toBeHidden();
    }

    // Ensure the dashboard is fully loaded and stable
    await expect(page.getByText('Overall Sales')).toBeVisible({ timeout: 10000 });

    // 3. NAVIGATE TO POS
    await page.goto('http://localhost:3000/pos');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Point of Sale' })).toBeVisible({ timeout: 10000 });

    // 4. ADD ITEM TO CART
    const productCard = page.getByTestId('product-card').filter({ hasText: 'Mock Alkaline' }).first();
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

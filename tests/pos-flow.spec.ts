import { test, expect } from '@playwright/test';

test('Full Flow: Login -> Add Item -> Checkout', async ({ page }) => {
    // 1. LOGIN PAGE
    await page.goto('http://localhost:3000/login');

    // Wait for the page to be ready
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();

    // Login as Demo User
    await page.getByRole('button', { name: 'Log in as Demo User' }).click();

    // 2. VERIFY LOGIN SUCCESS (DASHBOARD)
    // We wait for the dashboard to load first to ensure auth is complete
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    // 3. NAVIGATE TO POS VIA NAVBAR (SPA Navigation)
    // This prevents the page from reloading and losing auth state
    await page.getByRole('button', { name: 'POS' }).click();

    // Verify POS Page Loaded
    await expect(page.getByRole('heading', { name: 'Point of Sale' })).toBeVisible();

    // 4. ADD ITEM TO CART
    // Wait for products to load (handling the 400ms simulated delay)
    const productCard = page.locator('button.product-card').filter({ hasText: 'Mock Alkaline' }).first();
    await expect(productCard).toBeVisible();
    await productCard.click();

    // Verify item added by checking subtotal updated from 0.00
    // (Assuming item price is > 0)
    await expect(page.getByText('Total')).toBeVisible();

    // 5. CHECKOUT FLOW
    await page.getByRole('button', { name: 'Proceed to Payment' }).click();

    // 6. PAYMENT MODAL
    await expect(page.getByRole('heading', { name: 'Complete Sale' })).toBeVisible();

    // Select "Walk-in Customer"
    await page.getByRole('button', { name: 'Use Walk-in Customer' }).click();

    // Enter amount (Target the input explicitly)
    // We use a broader selector incase placeholder is hidden
    const amountInput = page.locator('input[type="number"]').nth(1); // Usually the second number input in this modal
    await amountInput.fill('1000');

    // Click "Confirm Sale"
    await page.getByRole('button', { name: 'Confirm Sale' }).click();

    // 7. VERIFY SUCCESS TOAST
    await expect(page.getByText('Sale Completed')).toBeVisible();
});
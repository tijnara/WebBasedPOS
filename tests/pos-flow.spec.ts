import { test, expect } from '@playwright/test';

test('Full Flow: Login -> Add Item -> Checkout', async ({ page }) => {
    // 1. LOGIN PAGE
    await page.goto('http://localhost:3000/login');

    // Wait for the page to be ready (Look for actual text from LoginPage.jsx)
    await expect(page.getByRole('heading', { name: 'Staff Portal' })).toBeVisible();

    // Login as Demo Admin (Matches the actual button text)
    await page.getByRole('button', { name: /Log in as Demo Admin/i }).click();

    // 2. VERIFY LOGIN SUCCESS (DASHBOARD)
    // Dashboard heading contains "Welcome back"
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();

    // 3. NAVIGATE TO POS
    // Direct navigation is safer than clicking the hamburger menu in tests
    await page.goto('http://localhost:3000/pos');

    // Verify POS Page Loaded
    await expect(page.getByRole('heading', { name: 'Point of Sale' })).toBeVisible();

    // 4. ADD ITEM TO CART
    const productCard = page.locator('button.product-card').filter({ hasText: 'Mock Alkaline' }).first();
    await expect(productCard).toBeVisible();
    await productCard.click();

    // Verify item added
    await expect(page.getByText('Total', { exact: true })).toBeVisible();

    // 5. CHECKOUT FLOW
    const proceedBtn = page.getByRole('button', { name: 'Proceed to Payment' });

    // If testing on a mobile viewport, the button is inside the cart drawer
    if (await proceedBtn.isHidden()) {
        await page.locator('.mobile-cart-bar button').click(); // Open mobile drawer
    }
    await proceedBtn.click();

    // 6. PAYMENT MODAL
    await expect(page.getByRole('heading', { name: 'Complete Sale' })).toBeVisible();

    // Select "Walk-in Customer"
    await page.getByRole('button', { name: /Use Walk-in Customer/i }).click();

    // Enter amount using the specific ID from PaymentModal.jsx
    const amountInput = page.locator('input#amountReceived');
    await amountInput.fill('1000');

    // Click "Confirm Sale"
    await page.getByRole('button', { name: 'Confirm Sale' }).click();

    // 7. VERIFY SUCCESS TOAST
    await expect(page.getByText('Sale Completed')).toBeVisible();
});
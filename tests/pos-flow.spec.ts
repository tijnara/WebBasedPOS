import { test, expect } from '@playwright/test';

test('Full Flow: Login -> Add Item -> Checkout', async ({ page }) => {
    // 1. LOGIN PAGE
    // Go to the login page (ensure your local server is running on port 3000)
    await page.goto('http://localhost:3000/login');

    // Verify we are on the login page by checking for the main heading
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();

    // Click the "Log in as Demo User" button
    // (We use this to bypass complex auth and load the Mock Data defined in your hooks)
    await page.getByRole('button', { name: 'Log in as Demo User' }).click();

    // 2. DASHBOARD / POS PAGE
    // Wait for navigation to the POS page.
    // Note: Your app redirects to /dashboard first, but we want to test the POS at /
    await page.waitForURL('**/dashboard');
    await page.goto('http://localhost:3000/');

    // Verify POS header is visible
    await expect(page.getByRole('heading', { name: 'Point of Sale' })).toBeVisible();

    // 3. ADD ITEM TO CART
    // Find the product card "Mock Alkaline" (from useProducts.js mock data) and click it
    await page.getByText('Mock Alkaline').first().click();

    // Verify the item appeared in the cart by checking if "Subtotal" is visible
    // or checking that the "Proceed to Payment" button is now enabled/visible
    await expect(page.getByRole('button', { name: 'Proceed to Payment' })).toBeVisible();

    // 4. CHECKOUT FLOW
    // Click "Proceed to Payment" in the cart drawer/sidebar
    await page.getByRole('button', { name: 'Proceed to Payment' }).click();

    // 5. PAYMENT MODAL
    // Wait for the "Complete Sale" modal header
    await expect(page.getByRole('heading', { name: 'Complete Sale' })).toBeVisible();

    // Select "Walk-in Customer" to bypass customer search
    await page.getByRole('button', { name: 'Use Walk-in Customer' }).click();

    // Enter an amount large enough to cover the bill (e.g., 1000)
    // We target the input by its placeholder "0.00"
    const amountInput = page.getByPlaceholder('0.00');
    await amountInput.fill('1000');

    // Click "Confirm Sale"
    await page.getByRole('button', { name: 'Confirm Sale' }).click();

    // 6. VERIFY SUCCESS
    // Look for the success toast message
    await expect(page.getByText('Sale Completed')).toBeVisible();
});
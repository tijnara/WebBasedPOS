import { createDirectus, rest, authentication } from '@directus/sdk';

const BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8055';

// Create a global client instance
const directus = createDirectus(BASE)
    .with(rest())
    .with(authentication({
        // This is true by default, but good to be explicit.
        // The SDK will automatically handle refreshing the access token.
        autoRefresh: true,

        // By default, the SDK uses storage('localStorage')
        // which automatically persists the auth token.
        // No need to manually set it from your store.
        mode: 'json', // Explicitly set the mode to 'json'
    }));

//
// --- Removed All Zustand Logic ---
//
// The client no longer needs to know about your Zustand store.
//
// Your login flow is already correct:
// 1. `api.login()` calls `directus.login()`.
// 2. The SDK saves the token to localStorage automatically.
// 3. `api.login()` returns the user and token to your `LoginPage`.
// 4. `LoginPage` calls `setAuth(token, user)` to update your Zustand store.
//
// On a page refresh:
// 1. The SDK client initializes and automatically loads the token from localStorage.
// 2. Your Zustand store initializes and loads its state from its own persistence (localStorage).
//
// Both systems stay in sync without needing to be manually tied together here.
//

export default directus;
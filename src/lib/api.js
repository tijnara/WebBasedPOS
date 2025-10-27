import { useStore } from '../store/useStore';
import directus from './directus'; // Import the new SDK client

// ---IMPORTANT---
// handleRes and getAuthHeaders are no longer needed,
// the Directus SDK handles responses and auth headers automatically.

export async function login(email, password) {
    // Use the SDK's login method. It automatically handles errors.
    await directus.login(email, password, { mode: 'json' });

    // Fetch the user data
    const user = await directus.users.me.read();

    // Get the token from the SDK
    const token = await directus.getToken();

    return { token, user };
}

export async function fetchCurrentUser(token) {
    // If a token is passed, set it first
    // (Though our new directus.js setup should handle this)
    if (token) {
        directus.setToken(token);
    }
    const user = await directus.users.me.read();
    return user;
}

// All other functions (fetchUsers, fetchProducts, createSale, etc.)
// are now removed from this file.
// They will be replaced by custom TanStack Query hooks
// (e.g., useProducts, useCreateSale) in their own files.

export default {
    login,
    fetchCurrentUser,
};
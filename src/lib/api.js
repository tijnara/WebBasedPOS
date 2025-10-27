import { useStore } from '../store/useStore';
import directus from './directus'; // Import the new SDK client

// ---IMPORTANT---
// handleRes and getAuthHeaders are no longer needed,
// the Directus SDK handles responses and auth headers automatically.

export async function login({ email, password }) {
    try {
        // Attempt to log in with a valid mode (e.g., 'json')
        console.log('Logging in with:', { email, password });
        await directus.login({ email, password, mode: 'json' });

        // Verify if the login was successful
        const token = await directus.getToken();
        if (!token) {
            throw new Error('Authentication failed: No token received.');
        }

        // Fetch the user data
        const user = await directus.users.me.read();
        if (!user) {
            throw new Error('Failed to retrieve user data after login.');
        }

        return { token, user };
    } catch (error) {
        console.error('Login failed:', error);
        throw new Error(error.message || 'Login failed. Please check your credentials.');
    }
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
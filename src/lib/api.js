// src/lib/api.js
import { supabase } from './supabaseClient'; // Import the Supabase client

// --- INSECURE LOGIN - FOR DEMONSTRATION ONLY ---
// Assumes passwords in the 'users' table are NOT hashed securely.
// ** DO NOT USE IN PRODUCTION without server-side hashing **
export async function login({ email, password }) {
    if (!email || !password) {
        throw new Error('Email and password are required.');
    }

    // --- FIX: Normalize email to match database lookup ---
    const normalizedEmail = email.trim().toLowerCase();

    try {
        // Query the 'users' table for a matching email
        const { data: user, error } = await supabase
            .from('users') // Your custom users table name
            .select('*') // Select columns needed for the app state
            .eq('email', normalizedEmail) // Use the normalized email
            .single(); // Expect only one user with this email

        // Handle errors during the query
        if (error) {
            // PGRST116 means no rows were found, which we treat as invalid credentials
            if (error.code === 'PGRST116') {
                throw new Error('Invalid email or password.');
            } else {
                // Other database errors
                throw new Error(error.message || 'Database query failed during login.');
            }
        }

        // Check if user exists and if the password matches
        // --- THIS IS THE INSECURE PART if passwords are plain text ---
        if (user && user.password === password) {
            // Return the user data fetched from the table
            // Exclude the password field from being returned to the client/store
            const { password: _, ...userData } = user;

            // Basic validation of essential returned data
            if (!userData.id || !userData.email || !userData.name) {
                throw new Error('Login succeeded but user data is incomplete.');
            }
            // --- Robust: Map isadmin to role, tolerant of string/boolean/case/whitespace ---
            let role = 'User';
            if (
                (typeof user.isadmin === 'string' && user.isadmin.trim().toLowerCase() === 'true') ||
                user.isadmin === true
            ) {
                role = 'Admin';
            }
            // Always clear and re-save user in localStorage to avoid stale data
            if (typeof window !== 'undefined') {
                localStorage.removeItem('pos_custom_user');
            }
            return { ...userData, role };
        } else {
            throw new Error('Invalid email or password.'); // Generic error for security
        }
    } catch (err) {
            // Use the handleError function to process the error
            const errorMessage = handleError(err);
            throw new Error(errorMessage);
    }
}

// --- Logout (Simplified - Synchronous) ---
// Since we are not using Supabase Auth sessions, logout just clears client state.
export function logout() {
    // Actual state clearing happens in useStore.logout() which calls this.
    // No Supabase call needed.
}


// --- No Session Management ---
// getCurrentSession and getUserProfile related to Supabase Auth are removed
// as we are bypassing that system.

export function handleError(error) {
    if (!error) return 'An unknown error occurred.';

    // Check for Supabase-specific errors
    if (error.code) {
        switch (error.code) {
            case 'PGRST116':
                return 'No matching record found.';
            case 'PGRST204':
                return "The specified column doesn't exist in the database schema.";
            case '406':
                return 'Invalid request. Please check your query or payload.';
            default:
                return error.message || 'An unexpected database error occurred.';
        }
    }

    // Generic error handling
    if (error.message === 'Invalid email or password.') {
        return 'The email or password you entered is incorrect. Please try again.';
    }

    return error.message || 'An unexpected error occurred.';
}

export default {
    login,
    logout,
};
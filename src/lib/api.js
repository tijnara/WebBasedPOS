// src/lib/api.js
import { supabase } from './supabaseClient'; // Import the Supabase client

// --- INSECURE LOGIN - FOR DEMONSTRATION ONLY ---
// Assumes passwords in the 'users' table are NOT hashed securely.
// ** DO NOT USE IN PRODUCTION without server-side hashing **
export async function login({ email, password }) {
    // REMOVE CONFIDENTIAL LOGS
    // console.log('Attempting custom table login with:', { email }); // Don't log password in real apps

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
                console.error(`No user found with email: ${normalizedEmail}`);
                throw new Error('Invalid email or password.');
            } else {
                // Other database errors
                console.error('Supabase query error during login:', error);
                throw new Error(error.message || 'Database query failed during login.');
            }
        }

        // Check if user exists and if the password matches
        // --- THIS IS THE INSECURE PART if passwords are plain text ---
        if (user && user.password === password) {
            // console.log('Custom table login successful for:', email);
            // Return the user data fetched from the table
            // Exclude the password field from being returned to the client/store
            const { password: _, ...userData } = user;

            // Basic validation of essential returned data
            if (!userData.id || !userData.email || !userData.name) {
                console.error("User data fetched is missing essential fields (id, email, name):", userData);
                throw new Error('Login succeeded but user data is incomplete.');
            }
            return userData; // Return the user data object directly
        } else {
            // Log specifically if user was found but password didn't match
            if(user && user.password !== password) {
                // console.log(`Custom table login failed for: ${normalizedEmail} - Password incorrect.`);
            }
            throw new Error('Invalid email or password.'); // Generic error for security
        }
    } catch (err) {
            // Use the handleError function to process the error
            const errorMessage = handleError(err);
            console.error('Custom login function error:', errorMessage);
            throw new Error(errorMessage);
    }
}

// --- Logout (Simplified - Synchronous) ---
// Since we are not using Supabase Auth sessions, logout just clears client state.
export function logout() {
    // console.log('Performing client-side logout (clearing state via store).');
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
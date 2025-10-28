// src/lib/api.js
import { supabase } from './supabaseClient'; // Import the Supabase client

// --- INSECURE LOGIN - FOR DEMONSTRATION ONLY ---
// Assumes passwords in the 'users' table are NOT hashed securely.
// ** DO NOT USE IN PRODUCTION without server-side hashing **
export async function login({ email, password }) {
    console.log('Attempting custom table login with:', { email }); // Don't log password in real apps

    if (!email || !password) {
        throw new Error('Email and password are required.');
    }

    // Ensure the email is trimmed and converted to lowercase for case-insensitive matching
    const normalizedEmail = email.trim().toLowerCase();

    try {
        // Query the 'users' table for a matching email
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', normalizedEmail)
            .single();

        // Handle errors during the query
        if (error) {
            if (error.code === 'PGRST116') {
                console.error(`No user found with email: ${normalizedEmail}`);
                throw new Error('Invalid email or password.');
            } else {
                console.error('Supabase query error during login:', error);
                throw new Error(error.message || 'Database query failed during login.');
            }
        }

        // Check if user exists and if the password matches
        if (user && user.password === password) {
            console.log(`Login successful for email: ${normalizedEmail}`);
            const { password: _, ...userData } = user;

            if (!userData.id || !userData.email || !userData.name) {
                console.error("User data fetched is missing essential fields (id, email, name):", userData);
                throw new Error('Login succeeded but user data is incomplete.');
            }
            return userData;
        } else {
            console.log(`Login failed for email: ${normalizedEmail} - ${user ? 'Password incorrect.' : 'User not found.'}`);
            throw new Error('Invalid email or password.');
        }
    } catch (err) {
        console.error('Custom login function error:', err);
        throw err;
    }
}

// --- Logout (Simplified - Synchronous) ---
// Since we are not using Supabase Auth sessions, logout just clears client state.
export function logout() {
    console.log('Performing client-side logout (clearing state via store).');
    // Actual state clearing happens in useStore.logout() which calls this.
    // No Supabase call needed.
}


// --- No Session Management ---
// getCurrentSession and getUserProfile related to Supabase Auth are removed
// as we are bypassing that system.

export default {
    login,
    logout,
};
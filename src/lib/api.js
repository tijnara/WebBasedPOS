// src/lib/api.js
import { supabase } from './supabaseClient';

export async function login({ email, password }) {
    if (!email || !password) {
        throw new Error('Email and password are required.');
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', normalizedEmail)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new Error('Invalid email or password.');
            } else {
                throw new Error(error.message || 'Database query failed during login.');
            }
        }

        if (user && user.password === password) {
            const { password: _, ...userData } = user;

            if (!userData.id || !userData.email || !userData.name) {
                throw new Error('Login succeeded but user data is incomplete.');
            }

            // Prioritize the actual role column from the database
            let role = user.role || 'Staff';

            // Fallback for legacy isadmin column just in case
            if (
                role !== 'Admin' && role !== 'admin' &&
                ((typeof user.isadmin === 'string' && user.isadmin.trim().toLowerCase() === 'true') ||
                    user.isadmin === true)
            ) {
                role = 'Admin';
            }

            if (typeof window !== 'undefined') {
                localStorage.removeItem('pos_custom_user');
            }
            return { ...userData, role };
        } else {
            throw new Error('Invalid email or password.');
        }
    } catch (err) {
        const errorMessage = handleError(err);
        throw new Error(errorMessage);
    }
}

export function logout() {
    // Actual state clearing happens in useStore.logout() which calls this.
    // No Supabase call needed.
}

export function handleError(error) {
    if (!error) return 'An unknown error occurred.';

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

    if (error.message === 'Invalid email or password.') {
        return 'The email or password you entered is incorrect. Please try again.';
    }

    return error.message || 'An unexpected error occurred.';
}

export default {
    login,
    logout,
};
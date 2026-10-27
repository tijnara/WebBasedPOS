// src/lib/api.js
import { supabase } from './supabaseClient';

/**
 * Authenticates user credentials server-side via the authenticate_user RPC.
 * Accepts either an object ({ email, password }) or positional arguments (identifier, password).
 */
export async function login(credentials, fallbackPassword) {
    let identifier = '';
    let password = '';

    if (typeof credentials === 'object' && credentials !== null) {
        identifier = credentials.email || credentials.name || credentials.username || credentials.identifier || '';
        password = credentials.password || '';
    } else if (typeof credentials === 'string') {
        identifier = credentials;
        password = fallbackPassword || '';
    }

    if (!identifier || !password) {
        throw new Error('Email and password are required.');
    }

    const normalizedIdentifier = identifier.trim().toLowerCase();

    try {
        const { data, error } = await supabase.rpc('authenticate_user', {
            p_email: normalizedIdentifier,
            p_password: password
        });

        if (error) {
            throw error;
        }

        // Support both nested { success: true, user: { ... } } and flat { id: 1, ... }
        const user = data?.user || (data?.id ? data : null);

        if (!user || !user.id || data?.success === false) {
            throw new Error(data?.message || 'Invalid email or password.');
        }

        if (data?.status === 'PENDING_APPROVAL' || (user.is_approved === false && !user.isadmin && user.role !== 'Admin')) {
            const pendingErr = new Error(data?.message || 'Your account is pending administrator approval before you can access the system.');
            pendingErr.status = 'PENDING_APPROVAL';
            throw pendingErr;
        }

        // Determine user role with fallback for isadmin
        let role = user.role || 'Staff';
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

        return {
            ...user,
            role,
            isAdmin: role === 'Admin',
            isadmin: role === 'Admin'
        };
    } catch (err) {
        console.error('Login API Error:', err);
        const errorMessage = handleError(err);
        throw new Error(errorMessage);
    }
}

/**
 * Registers a new staff user via create_new_user RPC with server-side bcrypt hashing.
 */
export async function register({
                                   name,
                                   password,
                                   email = null,
                                   phone = null,
                                   categoryId = 2,
                                   color = '#3B82F6',
                                   isAdmin = false,
                                   isApproved = false
                               }) {
    if (!name || !password) {
        throw new Error('Name and password are required.');
    }

    try {
        const { data, error } = await supabase.rpc('create_new_user', {
            p_name: name.trim(),
            p_password: password,
            p_email: email ? email.trim() : null,
            p_phone: phone ? phone.trim() : null,
            p_category_id: categoryId,
            p_color: color,
            p_isadmin: isAdmin,
            p_is_approved: isApproved
        });

        if (error) throw error;
        if (!data || !data.success) {
            throw new Error(data?.message || 'Could not register user.');
        }

        return data;
    } catch (err) {
        console.error('Register API Error:', err);
        throw new Error(handleError(err));
    }
}

export function logout() {
    // State clearing is handled inside useStore.logout()
}

export function handleError(error) {
    if (!error) return 'An unknown error occurred.';

    console.error('Handling Error:', error);

    if (error.code) {
        switch (error.code) {
            case 'PGRST116':
                return 'No matching record found.';
            case 'PGRST204':
                return "The specified column doesn't exist in the database schema.";
            case '406':
                return 'Invalid request. Please check your query or payload.';
            case '42501':
                return 'Access denied by row-level security policy.';
            default:
                return error.message || 'An unexpected database error occurred.';
        }
    }

    if (error.message === 'Invalid email or password.' || error.message === 'Invalid credentials') {
        return 'The email or password you entered is incorrect. Please try again.';
    }

    return error.message || 'An unexpected error occurred.';
}

export const loginUser = login;
export const registerUser = register;

export default {
    login,
    logout,
    register,
    handleError,
};
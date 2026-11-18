// src/lib/api.js
import { supabase } from './supabaseClient';
import { logActivity } from '../hooks/useActivityLogs';

/**
 * Authenticates user credentials server-side via the authenticate_user RPC.
 * Accepts either an object ({ email, password }) or positional arguments (identifier, password).
 * Returns structured status objects so UI handlers can render blended notices without runtime error overlays.
 */
export async function login(credentials, fallbackPassword) {
    let identifier = '';
    let password = '';

    if (typeof credentials === 'object' && credentials !== null) {
        identifier =
            credentials.email ||
            credentials.name ||
            credentials.username ||
            credentials.identifier ||
            '';
        password = credentials.password || '';
    } else if (typeof credentials === 'string') {
        identifier = credentials;
        password = fallbackPassword || '';
    }

    if (!identifier || !password) {
        return {
            status: 'INVALID_CREDENTIALS',
            message: 'Email and password are required.'
        };
    }

    const normalizedIdentifier = identifier.trim().toLowerCase();

    try {
        const { data, error } = await supabase.rpc('authenticate_user', {
            p_email: normalizedIdentifier,
            p_password: password
        });

        if (error) {
            return {
                status: 'ERROR',
                message: handleError(error)
            };
        }

        // Support both nested { success: true, user: { ... } } and flat { id: 1, ... }
        const user = data?.user || (data?.id ? data : null);

        // 1. Check Pending Administrator Approval FIRST (RPC returns success: false with PENDING_APPROVAL status)
        const isPendingApproval =
            data?.status === 'PENDING_APPROVAL' ||
            (typeof data?.message === 'string' &&
                data.message.toLowerCase().includes('pending administrator approval')) ||
            (user && user.is_approved === false && !user.isadmin && user.role !== 'Admin');

        if (isPendingApproval) {
            return {
                status: 'PENDING_APPROVAL',
                message:
                    data?.message ||
                    'Your account is pending administrator approval before you can access the system.',
                user: user || null
            };
        }

        // 2. Check Invalid Credentials
        if (!user || !user.id || data?.success === false) {
            return {
                status: 'INVALID_CREDENTIALS',
                message:
                    data?.message ||
                    'The email or password you entered is incorrect. Please try again.'
            };
        }

        // 3. Determine user role with fallback for isadmin
        let role = user.role || 'Staff';
        if (
            role !== 'Admin' &&
            role !== 'admin' &&
            ((typeof user.isadmin === 'string' && user.isadmin.trim().toLowerCase() === 'true') ||
                user.isadmin === true)
        ) {
            role = 'Admin';
        }

        if (typeof window !== 'undefined') {
            localStorage.removeItem('pos_custom_user');
        }

        const finalUser = {
            ...user,
            status: 'SUCCESS',
            role,
            isAdmin: role === 'Admin',
            isadmin: role === 'Admin'
        };

        await logActivity({
            user: finalUser,
            action: 'LOGIN',
            entity_type: 'AUTH',
            description: `${finalUser.name || finalUser.email} signed in (${role})`
        });

        return finalUser;
    } catch (err) {
        return {
            status: 'ERROR',
            message: handleError(err)
        };
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

        await logActivity({
            user: {
                id: data.user_id || data.id || null,
                name: name.trim(),
                email: email ? email.trim() : null,
                role: isAdmin ? 'Admin' : 'Staff'
            },
            action: 'CREATE',
            entity_type: 'USER',
            description: `New staff registration submitted: ${name.trim()} (${email || phone || 'No contact'}) — awaiting approval`
        });

        return data;
    } catch (err) {
        throw new Error(handleError(err));
    }
}

export function logout() {
    // State clearing is handled inside useStore.logout()
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
    handleError
};
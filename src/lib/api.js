// src/lib/api.js
import { supabase } from './supabaseClient'; // Import the Supabase client

// Logs in the user using Supabase email/password auth
export async function login({ email, password }) {
    console.log('Attempting Supabase login with:', { email, password }); // Log email and password for debugging

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    console.log('Supabase response:', { data, error }); // Log Supabase response for debugging

    if (error) {
        console.error('Supabase Login error:', error);
        // Provide more specific error messages if possible
        let errorMessage = 'Login failed. Please check credentials.';
        if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password.';
        } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Please confirm your email address first.';
        }
        throw new Error(errorMessage);
    }

    // data contains { user, session }
    console.log('Supabase Login successful:', data);
    if (!data.user || !data.session) {
        throw new Error('Login succeeded but no user/session data received.');
    }
    return { user: data.user, session: data.session };
}

// Logs out the user from Supabase
export async function logout() {
    console.log('Attempting Supabase logout');
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Supabase Logout error:', error);
        throw new Error(error.message || 'Logout failed.');
    }
    console.log('Supabase Logout successful');
}

// Fetches the current user session from Supabase
// This gets the session from Supabase's internal storage (e.g., localStorage)
export async function getCurrentSession() {
    // console.log("api.js: Getting current session..."); // Can be noisy, enable if needed
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        console.error('Error fetching session in api.js:', error);
        return { session: null, user: null };
    }
    // console.log("api.js: Session data received:", data.session); // Can be noisy
    return { session: data.session, user: data.session?.user ?? null };
}

// Optional: Get user profile data from your 'profiles' table
// Assumes you have a 'profiles' table with a column 'id' that matches auth.users.id
export async function getUserProfile(userId) {
    if (!userId) {
        console.log("getUserProfile: No userId provided.");
        return null;
    }
    console.log("getUserProfile: Fetching profile for user ID:", userId);
    const { data, error } = await supabase
        .from('profiles') // Adjust if your table name is different
        .select('*')      // Select specific columns like 'id, full_name, role' for efficiency
        .eq('id', userId)
        .single();        // Use .single() if 'id' is unique

    if (error) {
        // It's common for a profile to not exist initially after signup
        if (error.code === 'PGRST116') { // code for "requested range not satisfiable" -> no rows found
            console.log("getUserProfile: No profile found for user ID:", userId);
            return null;
        }
        console.error('Error fetching user profile:', error);
        // Depending on your app logic, you might want to throw the error or return null
        // throw error;
        return null;
    }
    console.log("getUserProfile: Profile data found:", data);
    return data;
}


export default {
    login,
    logout,
    getCurrentSession,
    getUserProfile // Export if you use it
};
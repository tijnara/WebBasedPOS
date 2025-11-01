// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';
import * as https from "node:https";

if (typeof window === 'undefined') {
    require('dotenv').config();
}

// Ensure these environment variables are set in your .env.local file

// Ensure these environment variables are set in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a single Supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

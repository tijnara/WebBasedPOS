import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
        realtime: {
            params: {
                eventsPerSecond: 10,
            },
            headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            },
            timeout: 15000, // Increase timeout to 15 seconds
        },
    }
);

export { supabase };

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

const ViewCounter = () => {
    const [viewCount, setViewCount] = useState(null);

    useEffect(() => {
        const initCounter = async () => {
            if (!sessionStorage.getItem('has_viewed_seaside')) {
                const { data, error } = await supabase.rpc('increment_page_view');
                if (!error && data !== null) {
                    setViewCount(data);
                    sessionStorage.setItem('has_viewed_seaside', 'true');

                    await supabase.from('page_views_log').insert([{ viewed_at: new Date().toISOString() }]);
                }
            } else {
                const { data, error } = await supabase.rpc('get_page_views');
                if (!error && data !== null) {
                    setViewCount(data);
                }
            }
        };
        initCounter();
    }, []);

    return null; // This component does not render anything
};

export default ViewCounter;

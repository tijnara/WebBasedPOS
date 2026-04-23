import HistoryPage from '../src/components/pages/HistoryPage';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { supabase } from '../src/lib/supabaseClient';

export default HistoryPage;

export async function getServerSideProps(context) {
    const queryClient = new QueryClient();

    // Prefetch the core data your hook (e.g., useSales) relies on.
    await queryClient.prefetchQuery({
        queryKey: ['sales'], 
        queryFn: async () => {
            const { data, error } = await supabase
                .from('sales')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            
            if (error) throw new Error(error.message);
            return data;
        }
    });

    return {
        props: {
            // Dehydrate the cache and pass it to _app.js via props
            dehydratedState: dehydrate(queryClient),
        },
    };
}

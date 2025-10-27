import { createDirectus, rest, authentication } from '@directus/sdk';
import { useStore } from '../store/useStore';

const BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8055';

// Create a global client instance
const directus = createDirectus(BASE)
    .with(rest())
    .with(authentication());

// This function will automatically set the token on our client
// whenever the token changes in our Zustand store.
export const setupDirectusClient = () => {
    // Get the token from the Zustand store
    const token = useStore.getState().token;

    if (token) {
        // Set the static token for all future requests
        directus.setToken(token);
    } else {
        // Clear the token
        directus.setToken(null);
    }
};

// This is a key part:
// We subscribe to the Zustand store. If the token ever changes (login/logout),
// we automatically update the Directus client.
useStore.subscribe(
    (state) => state.token,
    (token) => {
        if (token) {
            directus.setToken(token);
        } else {
            directus.setToken(null);
        }
    }
);

// Call it once on initial load to set the token if it's already in localStorage
setupDirectusClient();

export default directus;
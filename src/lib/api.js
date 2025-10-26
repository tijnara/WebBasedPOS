import { useStore } from '../store/useStore';

const BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8055';

// --- IMPORTANT ---
// You must get this token from your backend.
// This is the fix for the '403 Forbidden' error.
// For testing, you can use a static Admin API token from your Directus backend.
// const API_TOKEN = 'YOUR_API_TOKEN_HERE';
// -----------------

async function handleRes(res) {
    const text = await res.text();
    let json;

    try {
        // Try to parse the response text as JSON
        json = text ? JSON.parse(text) : {};
    } catch (e) {
        // If parsing fails but the status was OK, return the raw text
        if (res.ok) {
            return text;
        }
        // If parsing fails and status is not OK, throw an error
        console.error(`API Error: ${res.url} (JSON parse failed)`, res.statusText);
        throw new Error(res.statusText);
    }

    // If the response was NOT ok (e.g., 401, 403, 500)
    if (!res.ok) {
        // *** FIX: Check for 401 Unauthorized ***
        if (res.status === 401) {
            console.warn('API call unauthorized (401). Token might be expired. Logging out.');

            // Get the logout function from the zustand store
            useStore.getState().logout();

            // Force a reload to the login page.
            // The AuthGate in _app.js will handle the redirect.
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }

            // Throw a specific error to stop further processing
            throw new Error('Unauthorized. Logging out.');
        }

        // Handle other errors (403, 500, etc.)
        const errorMsg = json?.errors?.[0]?.message || json?.error || json?.message || res.statusText;
        console.error(`API Error: ${res.url}`, errorMsg, json);
        throw new Error(errorMsg);
    }

    // If the response was OK, return the parsed JSON
    return json;
}

// Helper to get auth headers
const getAuthHeaders = () => {
    const token = useStore.getState().token;
    if (!token) {
        console.warn('API call made without token');
        // If there's no token, we can pre-emptively log out
        // although AuthGate should ideally prevent this.
        // This is a good safeguard.
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            useStore.getState().logout();
            window.location.href = '/login';
        }
        return { 'Content-Type': 'application/json' };
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export async function login(email, password) {
    const res = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, mode: 'json' }),
    });
    const json = await handleRes(res);
    const token = json.data.access_token;
    const user = await fetchCurrentUser(token);
    return { token, user };
}

export async function fetchCurrentUser(token) {
    const res = await fetch(`${BASE}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await handleRes(res);
    return json.data;
}

export async function fetchUsers() {
    const res = await fetch(`${BASE}/items/users`, { headers: getAuthHeaders() });
    const json = await handleRes(res);
    return Array.isArray(json.data) ? json.data.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        dateAdded: new Date(u.dateAdded),
    })) : [];
}

export async function fetchRoles() {
    const res = await fetch(`${BASE}/roles`, { headers: getAuthHeaders() });
    const json = await handleRes(res);
    return Array.isArray(json.data) ? json.data : [];
}

export async function createUser(payload) {
    const res = await fetch(`${BASE}/items/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ data: payload }), // Assuming payload is correct, Directus 9+ uses root
    });
    const json = await handleRes(res);
    return json.data;
}

export async function updateUser(id, payload) {
    const res = await fetch(`${BASE}/items/users/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload), // Directus 9+ updates just use the payload
    });
    const json = await handleRes(res);
    return json.data;
}

export async function deleteUser(id) {
    const res = await fetch(`${BASE}/items/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    // Directus delete returns 204 No Content, handleRes will handle this
    return await handleRes(res);
}

// --- Products, Customers, Sales ---

export async function fetchProducts() {
    // Note: This endpoint is public (no getAuthHeaders())
    const res = await fetch(`${BASE}/items/products`);
    const json = await handleRes(res);
    return Array.isArray(json.data) ? json.data : [];
}

export async function fetchCustomers() {
    // Note: This endpoint is public (no getAuthHeaders())
    const res = await fetch(`${BASE}/items/customers`);
    const json = await handleRes(res);
    return Array.isArray(json.data) ? json.data : [];
}

export async function fetchSales() {
    // Note: This endpoint is public (no getAuthHeaders())
    // You may want to add `getAuthHeaders()` here if sales data should be private
    const res = await fetch(`${BASE}/items/sales`);
    const json = await handleRes(res);
    return Array.isArray(json.data) ? json.data : [];
}

export async function createCustomer(payload) {
    const res = await fetch(`${BASE}/items/customers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload), // Directus 9+
    });
    const json = await handleRes(res);
    return json.data;
}

export async function createProduct(payload) {
    // Validate payload
    if (!payload || typeof payload !== 'object') {
        throw new Error('Invalid payload: Payload must be a non-empty object');
    }

    // Add required fields validation
    if (!payload.id || !payload.name || !payload.price || !payload.category || payload.stock == null) {
        throw new Error('Invalid payload: Missing required fields (id, name, price, category, stock)');
    }

    try {
        const res = await fetch(`${BASE}/items/products`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload), // Directus 9+
        });

        // handleRes will throw if !res.ok
        const json = await handleRes(res);
        return json.data;

    } catch (error) {
        console.error('createProduct failed:', error);
        throw error;
    }
}

export async function createSale(payload) {
    // payload should contain: totalAmount, customerId, customerName, saleTimestamp, items (array)
    const res = await fetch(`${BASE}/items/sales`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload), // Directus 9+
    });
    const json = await handleRes(res);
    return json.data;
}

// New: update and delete helpers for basic CRUD
export async function updateItem(collectionName, id, payload) {
    try {
        const res = await fetch(`${BASE}/items/${collectionName}/${id}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload), // Directus 9+
        });

        const json = await handleRes(res);
        return json.data;
    } catch (error) {
        console.error('updateItem failed:', error);
        throw error;
    }
}

export async function deleteItem(collectionName, id) {
    const res = await fetch(`${BASE}/items/${collectionName}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(), // Add auth header for deletion
    });
    // handleRes will handle the 204 No Content response
    return await handleRes(res);
}

export default {
    login,
    fetchCurrentUser,
    fetchUsers,
    fetchRoles,
    createUser,
    updateUser,
    deleteUser,
    fetchProducts,
    fetchCustomers,
    fetchSales,
    createCustomer,
    createProduct,
    createSale,
    updateItem,
    deleteItem,
};
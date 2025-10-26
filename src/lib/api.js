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
    try {
        if (!text) {
            return res.ok ? {} : Promise.reject(new Error(res.statusText));
        }
        const json = JSON.parse(text);
        if (!res.ok) {
            console.error(`API Error: ${res.url}`, json);
            throw new Error(json?.errors?.[0]?.message || json?.error || json?.message || res.statusText);
        }
        return json;
    } catch (e) {
        if (!res.ok) {
            console.error(`API Error: ${res.url}`, e.message);
            throw new Error(res.statusText || e.message);
        }
        // if parsing error but ok, return text
        return text;
    }
}

// Helper to get auth headers
const getAuthHeaders = () => {
    const token = useStore.getState().token;
    if (!token) {
        console.warn('API call made without token');
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
    const res = await fetch(`${BASE}/users?fields=*,role.name`, { headers: getAuthHeaders() });
    const json = await handleRes(res);
    return Array.isArray(json.data) ? json.data.map(u => ({ ...u, role_name: u.role?.name || 'N/A' })) : [];
}

export async function fetchRoles() {
    const res = await fetch(`${BASE}/roles`, { headers: getAuthHeaders() });
    const json = await handleRes(res);
    return Array.isArray(json.data) ? json.data : [];
}

export async function createUser(payload) {
    const res = await fetch(`${BASE}/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });
    const json = await handleRes(res);
    return json.data;
}

export async function updateUser(id, payload) {
    const res = await fetch(`${BASE}/users/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });
    const json = await handleRes(res);
    return json.data;
}

export async function deleteUser(id) {
    const res = await fetch(`${BASE}/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    return await handleRes(res);
}

// --- Products, Customers, Sales ---

export async function fetchProducts() {
    const res = await fetch(`${BASE}/items/products`);
    const json = await handleRes(res);
    return Array.isArray(json.data) ? json.data : [];
}

export async function fetchCustomers() {
    const res = await fetch(`${BASE}/items/customers`);
    const json = await handleRes(res);
    return Array.isArray(json.data) ? json.data : [];
}

export async function fetchSales() {
    const res = await fetch(`${BASE}/items/sales`);
    const json = await handleRes(res);
    return Array.isArray(json.data) ? json.data : [];
}

export async function createCustomer(payload) {
    const res = await fetch(`${BASE}/items/customers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ data: payload }),
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
            // FIX: Wrap in { data: ... } to be consistent with other calls
            body: JSON.stringify({ data: payload }),
        });

        if (!res.ok) {
            const errorText = await res.text(); // Log server response for debugging
            console.error('API Error:', res.status, res.statusText, errorText);
            try {
                const errorJson = JSON.parse(errorText);
                const serverMessage = errorJson?.errors?.[0]?.message || errorJson?.error || errorJson?.message;
                if (serverMessage) {
                    throw new Error(serverMessage); // Throw the *actual* server error
                }
            } catch (e) {
                // Ignore parsing error
            }
            throw new Error(`API Error: ${res.status} ${res.statusText}`);
        }

        const json = await res.json();
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
        body: JSON.stringify({ data: payload }),
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
            body: JSON.stringify({ data: payload }),
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error(`API Error: ${res.url}`, {
                status: res.status,
                statusText: res.statusText,
                response: errorText,
                payload,
            });
            throw new Error(`API Error: ${res.status} ${res.statusText}`);
        }
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
    // Directus returns data for delete; handle accordingly
    const json = await handleRes(res);
    return json.data;
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
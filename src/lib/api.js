const BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8055';

async function handleRes(res) {
  const text = await res.text();
  try {
    const json = JSON.parse(text || '{}');
    if (!res.ok) throw new Error(json?.errors?.[0]?.message || json?.error || json?.message || res.statusText);
    return json;
  } catch (e) {
    if (!res.ok) throw new Error(res.statusText || e.message);
    // if parsing error but ok, return text
    return text;
  }
}

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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: payload }),
  });
  const json = await handleRes(res);
  return json.data;
}

export async function createProduct(payload) {
  const res = await fetch(`${BASE}/items/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: payload }),
  });
  const json = await handleRes(res);
  return json.data;
}

export async function createSale(payload) {
  // payload should contain: totalAmount, customerId, customerName, saleTimestamp, items (array)
  const res = await fetch(`${BASE}/items/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: payload }),
  });
  const json = await handleRes(res);
  return json.data;
}

// New: update and delete helpers for basic CRUD
export async function updateItem(collectionName, id, payload) {
  const res = await fetch(`${BASE}/items/${collectionName}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: payload }),
  });
  const json = await handleRes(res);
  return json.data;
}

export async function deleteItem(collectionName, id) {
  const res = await fetch(`${BASE}/items/${collectionName}/${id}`, {
    method: 'DELETE',
  });
  // Directus returns data for delete; handle accordingly
  const json = await handleRes(res);
  return json.data;
}

export default {
  fetchProducts,
  fetchCustomers,
  fetchSales,
  createCustomer,
  createProduct,
  createSale,
  updateItem,
  deleteItem,
};

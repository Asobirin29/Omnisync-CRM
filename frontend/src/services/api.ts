import type { ChatSession, ChatMessage, Product, Customer } from '../types';

const API_BASE = '/api';

export async function fetchChats(params?: {
  platform?: string;
  status?: string;
  urgency?: string;
  search?: string;
}): Promise<ChatSession[]> {
  const query = new URLSearchParams();
  if (params?.platform && params.platform !== 'all') query.append('platform', params.platform);
  if (params?.status && params.status !== 'all') query.append('status', params.status);
  if (params?.urgency && params.urgency !== 'all') query.append('urgency', params.urgency);
  if (params?.search) query.append('search', params.search);

  const res = await fetch(`${API_BASE}/chats?${query.toString()}`);
  if (!res.ok) throw new Error('Gagal mengambil daftar percakapan');
  const json = await res.json();
  return json.data;
}

export async function fetchChatMessages(
  sessionId: number
): Promise<{ session: ChatSession; messages: ChatMessage[] }> {
  const res = await fetch(`${API_BASE}/chats/${sessionId}/messages`);
  if (!res.ok) throw new Error('Gagal mengambil pesan percakapan');
  const json = await res.json();
  return json.data;
}

export async function sendCSMessage(
  sessionId: number,
  body: string
): Promise<{ message: ChatMessage; session: ChatSession }> {
  const res = await fetch(`${API_BASE}/chats/${sessionId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal mengirim pesan');
  }
  const json = await res.json();
  return json.data;
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/products`);
  if (!res.ok) throw new Error('Gagal mengambil katalog produk');
  const json = await res.json();
  return json.data;
}

export async function fetchCustomers(): Promise<Customer[]> {
  const res = await fetch(`${API_BASE}/customers`);
  if (!res.ok) throw new Error('Gagal mengambil daftar pelanggan');
  const json = await res.json();
  return json.data;
}

export async function fetchCustomer(customerId: number): Promise<Customer> {
  const res = await fetch(`${API_BASE}/customers/${customerId}`);
  if (!res.ok) throw new Error('Gagal mengambil data pelanggan');
  const json = await res.json();
  return json.data;
}

export async function createManualOrder(data: {
  customer_id: number;
  items: { variant_id?: number; sku?: string; qty: number }[];
  status?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/orders/manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Gagal membuat pesanan manual');
  }
  return json.data;
}

export async function updateOrderStatus(orderId: number, status: string): Promise<any> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Gagal mengubah status pesanan');
  }
  return json.data;
}

export async function sendMockMessage(
  platform: string,
  customer: { name: string; phone: string },
  message: string,
  urgency: 'low' | 'medium' | 'high' = 'medium'
): Promise<any> {
  const res = await fetch(`${API_BASE}/webhooks/${platform}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer, message, urgency })
  });
  if (!res.ok) throw new Error('Gagal mengirim webhook pesan');
  return await res.json();
}

export async function sendMockOrder(
  platform: string,
  payload: {
    external_order_id: string;
    customer: { name: string; phone: string };
    items: { sku: string; qty: number }[];
    status?: string;
  }
): Promise<any> {
  const res = await fetch(`${API_BASE}/webhooks/${platform}/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  return {
    status: res.status,
    ok: res.ok,
    data: json,
  };
}

export async function fetchDashboardAnalytics(): Promise<any> {
  const res = await fetch(`${API_BASE}/analytics/dashboard`);
  if (!res.ok) throw new Error('Gagal mengambil data analitik dashboard');
  const json = await res.json();
  return json.data;
}

export async function resetDemoData(): Promise<any> {
  const res = await fetch(`${API_BASE}/demo/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Gagal mereset data demo');
  return await res.json();
}

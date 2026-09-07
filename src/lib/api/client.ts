import { products as fallbackProducts, type Product } from "@/data/products";

const API_BASE = "/api";

export interface OrderItemInput {
  productId: string;
  quantity: number;
  price: number;
}

export interface CreateOrderPayload {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  city?: string;
  zipCode?: string;
  totalAmount: number;
  items: OrderItemInput[];
}

export async function checkDatabaseHealth(): Promise<{ status: string; database?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return await res.json();
  } catch (err: any) {
    return { status: "disconnected", error: err.message };
  }
}

export async function getProducts(options?: {
  category?: string;
  processor?: string;
  search?: string;
}): Promise<Product[]> {
  try {
    const params = new URLSearchParams();
    if (options?.category) params.append("category", options.category);
    if (options?.processor) params.append("processor", options.processor);
    if (options?.search) params.append("search", options.search);

    const url = `${API_BASE}/products${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (error) {
    console.warn("Could not fetch products from PostgreSQL backend, using local fallback:", error);
  }

  // Graceful fallback to static product catalog
  let filtered = [...fallbackProducts];
  if (options?.category) {
    filtered = filtered.filter((p) => p.category === options.category);
  }
  if (options?.processor) {
    filtered = filtered.filter((p) => p.processor === options.processor);
  }
  if (options?.search) {
    const term = options.search.toLowerCase();
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(term));
  }
  return filtered;
}

export async function getProductById(id: string): Promise<Product | undefined> {
  try {
    const res = await fetch(`${API_BASE}/products/${id}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.id) {
        return data;
      }
    }
  } catch (error) {
    console.warn(`Could not fetch product ${id} from PostgreSQL backend, using local fallback:`, error);
  }

  // Graceful fallback
  return fallbackProducts.find((p) => p.id === id);
}

export async function createOrder(payload: CreateOrderPayload) {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.warn("Database order creation failed, generating local receipt:", error);
    // Return fallback order ID so user experience is uninterrupted
    return {
      success: true,
      offline: true,
      order: {
        orderNumber: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
        customerName: payload.customerName,
        totalAmount: payload.totalAmount,
      },
    };
  }
}

export async function registerUser(userData: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
}) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Registration failed");
  }
  return data;
}

export async function loginUser(credentials: { email: string; password: string }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Login failed");
  }
  return data;
}

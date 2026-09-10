import { products as fallbackProducts, type Product } from "@/data/products";
import { initialFeedbacks, type FeedbackItem } from "@/data/feedbacks";

const API_BASE = "/api";
const LOCAL_FEEDBACK_KEY = "sellora_community_feedback";

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
  ram?: string;
  gpu?: string;
  search?: string;
}): Promise<Product[]> {
  try {
    const params = new URLSearchParams();
    if (options?.category) params.append("category", options.category);
    if (options?.processor) params.append("processor", options.processor);
    if (options?.ram) params.append("ram", options.ram);
    if (options?.gpu) params.append("gpu", options.gpu);
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
  if (options?.ram) {
    filtered = filtered.filter((p) => p.ram.toLowerCase().includes(options.ram!.toLowerCase()));
  }
  if (options?.gpu) {
    filtered = filtered.filter((p) => p.gpu.toLowerCase().includes(options.gpu!.toLowerCase()));
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

export async function getFeedbacks(): Promise<FeedbackItem[]> {
  try {
    const res = await fetch(`${API_BASE}/feedback`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Also update local cache
        localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify(data));
        return data;
      }
    }
  } catch (error) {
    console.warn("Could not fetch feedback from backend, checking local storage:", error);
  }

  // Graceful fallback to localStorage or default reviews
  try {
    const stored = localStorage.getItem(LOCAL_FEEDBACK_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // Ignore storage parse error
  }

  return initialFeedbacks;
}

export async function submitFeedback(payload: {
  name: string;
  role: string;
  rigModel: string;
  category: "Gaming" | "Ultrabook" | "Workstation" | "General";
  rating: number;
  message: string;
}): Promise<FeedbackItem> {
  const newFeedback: FeedbackItem = {
    id: `fb-${Date.now()}`,
    name: payload.name.trim(),
    role: payload.role.trim() || "Hardware Operator",
    rigModel: payload.rigModel.trim() || "Sellora Machine",
    category: payload.category || "General",
    rating: Number(payload.rating) || 5,
    message: payload.message.trim(),
    verifiedPurchase: true,
    date: "Just now",
    likes: 1,
  };

  // Optimistically store in localStorage first
  try {
    const existing = await getFeedbacks();
    const updated = [newFeedback, ...existing.filter((f) => f.id !== newFeedback.id)];
    localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("Could not cache feedback locally:", e);
  }

  // Also submit to backend server
  try {
    const res = await fetch(`${API_BASE}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.feedback) {
        return data.feedback;
      }
    }
  } catch (error) {
    console.warn("Backend feedback submission failed, using local item:", error);
  }

  return newFeedback;
}

export async function likeFeedback(id: string): Promise<number> {
  let newLikes = 1;
  try {
    const existing = await getFeedbacks();
    const found = existing.find((f) => f.id === id);
    if (found) {
      found.likes += 1;
      newLikes = found.likes;
      localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify(existing));
    }
  } catch (e) {
    // ignore
  }

  try {
    const res = await fetch(`${API_BASE}/feedback/${id}/like`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.likes === "number") {
        newLikes = data.likes;
      }
    }
  } catch (error) {
    // backend silent fail
  }

  return newLikes;
}

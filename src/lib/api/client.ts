import { products as fallbackProducts, type Product } from "@/data/products";
import type { UserSession } from "@/lib/auth";
import { initialFeedbacks, type FeedbackItem } from "@/data/feedbacks";
import {
  OrderRequestError,
  requestOrderJson,
  updateOrderTracking,
  type OrderTrackingUpdate,
} from "./order-tracking";
export { getOrderTracking, type OrderTracking, type OrderTrackingEvent } from "./order-tracking";

const API_BASE = "/api";
const LOCAL_FEEDBACK_KEY = "sellora_community_feedback";

export { createOrder } from "./checkout";
export type { CreateOrderPayload, OrderItemInput } from "./checkout";
/**
 * Safely parses JSON from a fetch Response without throwing
 * "Failed to execute 'json' on 'Response': Unexpected end of JSON input"
 * when the response body is empty, 204 No Content, proxy 502/504 error, or HTML.
 */
export async function safeParseJson<T>(res: Response, fallback: T): Promise<T> {
  try {
    const text = await res.text();
    if (!text || !text.trim()) {
      return fallback;
    }
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}


export async function checkDatabaseHealth(): Promise<{ status: string; database?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const parsed = await safeParseJson<{ status: string; database?: string; error?: string } | null>(res, null);
    if (parsed) return parsed;
    return { status: "disconnected", error: `HTTP ${res.status}` };
  } catch (err: any) {
    return { status: "disconnected", error: err.message };
  }
}

export async function getAdminStats(): Promise<{
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalProducts: number;
  approvedProducts: number;
  pendingProducts: number;
  totalUsers: number;
  totalCustomers: number;
  totalSellers: number;
  pendingSellers: number;
  recentOrders: any[];
  dbStatus: { connected: boolean; engine: string; latencyMs: number };
} | null> {
  try {
    const res = await fetch(`${API_BASE}/admin/stats`);
    if (res.ok) {
      return await safeParseJson<Awaited<ReturnType<typeof getAdminStats>>>(res, null);
    }
  } catch (err) {
    console.warn("Failed to fetch admin stats from backend:", err);
  }
  return null;
}

export interface SalesAnalyticsResponse {
  totalRevenue: number;
  completedRevenue: number;
  platformCommission: number;
  totalOrders: number;
  totalUnits: number;
  avgOrderValue: number;
  timeline: Array<{
    date: string;
    displayDate: string;
    revenue: number;
    orders: number;
    units: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    category: string;
    img: string;
    units: number;
    revenue: number;
  }>;
  categoryData: Array<{
    name: string;
    revenue: number;
    units: number;
  }>;
  statusMap: Record<string, number>;
  recentSales: any[];
}

export async function getSalesAnalytics(): Promise<SalesAnalyticsResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/admin/sales-analytics`);
    if (res.ok) {
      return await safeParseJson<SalesAnalyticsResponse | null>(res, null);
    }
  } catch (err) {
    console.warn("Failed to fetch sales analytics from backend:", err);
  }
  return null;
}

export async function getProducts(options?: {
  category?: string;
  processor?: string;
  ram?: string;
  gpu?: string;
  search?: string;
  status?: string;
  all?: boolean;
}): Promise<Product[]> {
  try {
    const params = new URLSearchParams();
    if (options?.category) params.append("category", options.category);
    if (options?.processor) params.append("processor", options.processor);
    if (options?.ram) params.append("ram", options.ram);
    if (options?.gpu) params.append("gpu", options.gpu);
    if (options?.search) params.append("search", options.search);
    if (options?.status) params.append("status", options.status);
    if (options?.all) params.append("all", "true");

    const url = `${API_BASE}/products${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await fetch(url);

    if (res.ok) {
      const data = await safeParseJson(res, []);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
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

export type ProductWritePayload = Omit<Partial<Product>, "detailedSpecs"> & {
  detailedSpecs?: Partial<NonNullable<Product["detailedSpecs"]>>;
};

export async function createProduct(payload: ProductWritePayload) {
  const res = await fetch(`${API_BASE}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await safeParseJson<{ product?: Product; error?: string }>(res, {});
  if (!res.ok || !data.product) {
    throw new Error(data.error || "Failed to create product");
  }
  return data.product;
}

export async function updateProduct(id: string, payload: ProductWritePayload) {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await safeParseJson<{ product?: Product; error?: string }>(res, {});
  if (!res.ok || !data.product) {
    throw new Error(data.error || "Failed to update product");
  }
  return data.product;
}

export async function updateProductStatus(id: string, status: "APPROVED" | "PENDING_APPROVAL" | "REJECTED") {
  const res = await fetch(`${API_BASE}/products/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const data = await safeParseJson<{ product?: Product; error?: string }>(res, {});
  if (!res.ok || !data.product) {
    throw new Error(data.error || "Failed to update product status");
  }
  return data.product;
}

export async function updateProductStock(id: string, params: { stock?: number; delta?: number }) {
  const res = await fetch(`${API_BASE}/products/${id}/stock`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await safeParseJson<{ product?: Product; error?: string }>(res, {});
  if (!res.ok || !data.product) {
    throw new Error(data.error || "Failed to update product stock");
  }
  return data.product;
}

export async function deleteProduct(id: string) {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: "DELETE",
  });
  const data = await safeParseJson<{ error?: string }>(res, {});
  if (!res.ok) {
    throw new Error(data.error || "Failed to delete product");
  }
  return data;
}

export async function getProductById(id: string): Promise<Product | undefined> {
  try {
    const res = await fetch(`${API_BASE}/products/${id}`);
    if (res.ok) {
      const data = await safeParseJson<Product | null>(res, null);
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

export interface AdminOrderRecord extends CustomerOrderRecord {
  carrierName?: string | null;
  trackingNumber?: string | null;
  estimatedDelivery?: string | null;
  user?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    role?: string;
  } | null;
}

export async function getOrders(): Promise<AdminOrderRecord[]> {
  const data = await requestOrderJson("/orders");
  if (!Array.isArray(data)) throw new OrderRequestError("invalid-response");
  return data;
}

export async function updateOrderStatus(
  id: string,
  status: OrderTrackingUpdate["status"] | OrderTrackingUpdate,
) {
  return (await updateOrderTracking(id, typeof status === "string" ? { status } : (status ?? {})))
    .order;
}

export async function deleteOrder(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/orders/${id}`, {
    method: "DELETE",
  });
  const data = await safeParseJson<{ error?: string }>(res, {});
  if (!res.ok) {
    throw new Error(data.error || "Failed to delete order");
  }
}

export async function registerUser(userData: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  role?: "customer" | "seller" | "admin" | string;
  storeName?: string;
  storeBio?: string;
}) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  const data = await safeParseJson<{ user?: UserSession; error?: string }>(res, {});
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

  const data = await safeParseJson<{ user?: UserSession; error?: string }>(res, {});
  if (!res.ok) {
    throw new Error(data.error || "Login failed");
  }
  return data;
}

export async function getFeedbacks(): Promise<FeedbackItem[]> {
  try {
    const res = await fetch(`${API_BASE}/feedback`);
    if (res.ok) {
      const data = await safeParseJson(res, []);
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
      const data = await safeParseJson<{ feedback?: FeedbackItem }>(res, {});
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
      const data = await safeParseJson<{ likes?: number }>(res, {});
      if (data && typeof data.likes === "number") {
        newLikes = data.likes;
      }
    }
  } catch (error) {
    // backend silent fail
  }

  return newLikes;
}

// ==============================================================================
// USERS MANAGEMENT CLIENT (A5.1)
// ==============================================================================

export interface UserRecord {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  address?: string | null;
  role: "customer" | "seller" | "admin" | string;
  storeName?: string | null;
  storeBio?: string | null;
  sellerStatus?: "NONE" | "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    orders: number;
    reviews: number;
  };
}

export interface UpdateUserPayload {
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
  phone?: string | null;
  address?: string | null;
  role?: string;
  storeName?: string | null;
  storeBio?: string | null;
  sellerStatus?: string;
  isActive?: boolean;
}

export async function getUsers(): Promise<UserRecord[]> {
  try {
    const res = await fetch(`${API_BASE}/users`);
    if (res.ok) {
      return await safeParseJson(res, []);
    }
  } catch (err) {
    console.error("Failed to fetch users from server:", err);
  }
  return [];
}

export async function updateUser(
  id: string,
  data: UpdateUserPayload
): Promise<{ success: boolean; user?: UserRecord; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await safeParseJson(res, { success: false, error: "Failed to update user" });
  } catch (err: any) {
    console.error("Failed to update user:", err);
    return { success: false, error: err.message };
  }
}

export async function updateUserRole(
  id: string,
  role: string
): Promise<{ success: boolean; user?: UserRecord; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/users/${id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    return await safeParseJson(res, { success: false, error: "Failed to update user role" });
  } catch (err: any) {
    console.error("Failed to update user role:", err);
    return { success: false, error: err.message };
  }
}

export async function updateUserStatus(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; user?: UserRecord; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/users/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    return await safeParseJson(res, { success: false, error: "Failed to update user status" });
  } catch (err: any) {
    console.error("Failed to update user status:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteUser(
  id: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: "DELETE",
    });
    return await safeParseJson(res, { success: false, error: "Failed to delete user" });
  } catch (err: any) {
    console.error("Failed to delete user:", err);
    return { success: false, error: err.message };
  }
}

// ==============================================================================
// SELLER VERIFICATION & SANCTIONS CLIENT (A3.1 & A3.2)
// ==============================================================================

export interface SellerRecord {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  address?: string | null;
  role: string;
  storeName?: string | null;
  storeBio?: string | null;
  sellerStatus: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  products?: {
    id: string;
    name: string;
    price: number;
    category: string;
    status: string;
    img?: string;
  }[];
  _count?: {
    products: number;
    orders: number;
  };
}

export async function getAdminSellers(): Promise<SellerRecord[]> {
  try {
    const res = await fetch(`${API_BASE}/admin/sellers`);
    if (res.ok) {
      return await safeParseJson(res, []);
    }
  } catch (err) {
    console.error("Failed to fetch sellers from backend:", err);
  }
  return [];
}

export async function updateSellerVerification(
  id: string,
  sellerStatus: "APPROVED" | "REJECTED" | "SUSPENDED" | "PENDING" | string,
  rejectionReason?: string
): Promise<{ success: boolean; message?: string; seller?: SellerRecord; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/admin/sellers/${id}/verification`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerStatus, rejectionReason }),
    });
    return await safeParseJson(res, { success: false, error: "Failed to update seller verification" });
  } catch (err: any) {
    console.error("Failed to update seller verification:", err);
    return { success: false, error: err.message };
  }
}

// ==============================================================================
// PLATFORM SETTINGS CLIENT (A5.4)
// ==============================================================================

export interface PlatformSettings {
  storeName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
  currency: string;
  freeShippingThreshold: number;
  taxRatePercent: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  autoApproveProducts: boolean;
  autoApproveSellers: boolean;
  requireEmailVerification: boolean;
  orderNotifications: boolean;
  security2FA: boolean;
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    const res = await fetch(`${API_BASE}/admin/settings`);
    if (res.ok) {
      const data = await safeParseJson<PlatformSettings | null>(res, null);
      if (data) return data;
    }
  } catch (err) {
    console.error("Failed to fetch platform settings:", err);
  }
  return {
    storeName: "SELLORA",
    tagline: "Next-Gen Computing. Unleashed.",
    supportEmail: "support@sellora.dev",
    supportPhone: "+94 11 234 5678",
    address: "No. 45 Galle Road, Colombo 03, Sri Lanka",
    currency: "LKR",
    freeShippingThreshold: 500000,
    taxRatePercent: 0,
    maintenanceMode: false,
    maintenanceMessage: "SELLORA is currently undergoing scheduled infrastructure upgrades. Storefront access will resume shortly.",
    autoApproveProducts: false,
    autoApproveSellers: false,
    requireEmailVerification: true,
    orderNotifications: true,
    security2FA: false,
  };
}

export async function updatePlatformSettings(
  data: Partial<PlatformSettings>
): Promise<{ success: boolean; settings?: PlatformSettings; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await safeParseJson(res, { success: false, error: "Failed to update settings" });
  } catch (err: any) {
    console.error("Failed to update platform settings:", err);
    return { success: false, error: err.message };
  }
}

export async function clearSystemCache(): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/admin/cache/clear`, {
      method: "POST",
    });
    return await safeParseJson(res, { success: false, message: "Cache clear failed" });
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

// ==========================================
// SELLER HUB CLIENT FUNCTIONS (S1.1 & S2.1)
// ==========================================

export interface SellerStatsResponse {
  seller: {
    id: string;
    email: string;
    storeName?: string | null;
    storeBio?: string | null;
    sellerStatus?: string;
    role?: string;
    phone?: string | null;
    address?: string | null;
  };
  stats: {
    totalGrossRevenue: number;
    totalUnitsSold: number;
    pendingFulfillments: number;
    deliveredCount: number;
    totalProducts: number;
    approvedProducts: number;
    pendingProducts: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    status: string;
    createdAt: string;
    items: Array<{
      productName: string;
      img?: string;
      quantity: number;
      price: number;
    }>;
    sellerSubtotal: number;
  }>;
}

export async function getSellerStats(sellerId: string): Promise<SellerStatsResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/seller/stats/${sellerId}`);
    if (res.ok) {
      return await safeParseJson<SellerStatsResponse | null>(res, null);
    }
  } catch (err) {
    console.error("Failed to fetch seller stats:", err);
  }
  return null;
}

export async function getSellerProducts(sellerId: string): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE}/seller/products/${sellerId}`);
    if (res.ok) {
      return await safeParseJson<Product[]>(res, []);
    }
  } catch (err) {
    console.error("Failed to fetch seller products:", err);
  }
  return [];
}

export interface SellerOrderRecord {
  id: string;
  orderNumber: string;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  shippingAddress: string;
  city?: string | null;
  zipCode?: string | null;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  sellerItems: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      category: string;
      price: number;
      img: string;
      cpu: string;
      ram: string;
      gpu: string;
    };
  }>;
  sellerSubtotal: number;
}

export async function getSellerOrders(sellerId: string): Promise<SellerOrderRecord[]> {
  try {
    const res = await fetch(`${API_BASE}/seller/orders/${sellerId}`);
    if (res.ok) {
      return await safeParseJson<SellerOrderRecord[]>(res, []);
    }
  } catch (err) {
    console.error("Failed to fetch seller orders:", err);
  }
  return [];
}

export async function updateSellerOrderFulfillment(
  orderId: string,
  payload: {
    status: string;
    sellerId: string;
    trackingNumber?: string;
    carrierNotes?: string;
  }
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/seller/orders/${orderId}/fulfillment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await safeParseJson(res, { success: false, error: "Failed to update seller order fulfillment" });
  } catch (err: any) {
    console.error("Failed to update seller order fulfillment:", err);
    return { success: false, error: err.message };
  }
}

export async function updateSellerProfile(
  sellerId: string,
  data: {
    storeName?: string;
    storeBio?: string;
    phone?: string;
    address?: string;
    firstName?: string;
    lastName?: string;
  }
): Promise<{ success: boolean; message?: string; user?: any; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/seller/profile/${sellerId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await safeParseJson(res, { success: false, error: "Failed to update seller profile" });
  } catch (err: any) {
    console.error("Failed to update seller profile:", err);
    return { success: false, error: err.message };
  }
}

// S5.1 Vendor Earnings & Payout Ledger
export interface SellerEarningsRecord {
  grossRevenue: number;
  platformFeePercent: number;
  totalPlatformFee: number;
  netEarnings: number;
  pendingPayout: number;
  completedPayout: number;
  transactions: Array<{
    id: string;
    orderId: string;
    orderNumber: string;
    date: string;
    customerName: string;
    productName: string;
    quantity: number;
    grossAmount: number;
    platformFee: number;
    netPayout: number;
    status: "CLEARED" | "ESCROW_PENDING" | string;
    orderStatus: string;
  }>;
}

export async function getSellerEarnings(sellerId: string): Promise<SellerEarningsRecord | null> {
  try {
    const res = await fetch(`${API_BASE}/seller/earnings/${sellerId}`);
    if (res.ok) {
      return await safeParseJson<SellerEarningsRecord | null>(res, null);
    }
  } catch (err) {
    console.error("Failed to fetch seller earnings:", err);
  }
  return null;
}

// ==============================================================================
// PRODUCT REVIEWS API CLIENT
// ==============================================================================

export interface ProductReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  };
  order: {
    orderNumber: string;
    createdAt: string;
    status: string;
  };
}

export interface ProductReviewsResponse {
  productId: string;
  totalCount: number;
  averageRating: number;
  distribution: Record<number, number>;
  reviews: ProductReview[];
}

export async function getProductReviews(productId: string): Promise<ProductReviewsResponse> {
  try {
    const res = await fetch(`${API_BASE}/products/${productId}/reviews`);
    if (res.ok) {
      const data = await safeParseJson<ProductReviewsResponse | null>(res, null);
      if (data && Array.isArray(data.reviews)) {
        return data;
      }
    }
  } catch (err) {
    console.error("Failed to fetch product reviews:", err);
  }
  return {
    productId,
    totalCount: 0,
    averageRating: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    reviews: [],
  };
}

export async function checkReviewEligibility(
  productId: string,
  params: { email?: string; userId?: string }
): Promise<{
  eligible: boolean;
  alreadyReviewed?: boolean;
  orderId?: string;
  orderNumber?: string;
  orderStatus?: string;
  message?: string;
}> {
  try {
    const q = new URLSearchParams();
    if (params.email) q.append("email", params.email);
    if (params.userId) q.append("userId", params.userId);

    const res = await fetch(`${API_BASE}/products/${productId}/review-eligibility?${q.toString()}`);
    if (res.ok) {
      return await safeParseJson(res, { eligible: false });
    }
  } catch (err) {
    console.error("Failed to check eligibility:", err);
  }
  return { eligible: false };
}

export async function submitProductReview(
  productId: string,
  payload: {
    rating: number;
    comment: string;
    userId?: string;
    email?: string;
    orderId?: string;
  }
): Promise<{ success: boolean; review?: ProductReview; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/products/${productId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await safeParseJson(res, { success: false, error: "Failed to submit review" });
  } catch (err: any) {
    console.error("Failed to submit review:", err);
    return { success: false, error: err.message };
  }
}

// ==============================================================================
// CUSTOMER HUB CLIENT FUNCTIONS (C1.1, C2.1, C3.1)
// ==============================================================================

export interface CustomerOrderRecord {
  id: string;
  orderNumber: string;
  userId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  shippingAddress: string;
  city?: string | null;
  zipCode?: string | null;
  totalAmount: number;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: number;
    product: Product;
  }>;
  reviews?: Array<{
    id: string;
    productId: string;
    rating: number;
    comment: string;
  }>;
}

export interface CustomerReviewRecord {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    img: string;
    price: number;
    category: string;
    cpu: string;
    gpu: string;
    ram: string;
    seller?: { storeName?: string | null } | null;
  };
  order: {
    id: string;
    orderNumber: string;
    createdAt: string;
    status: string;
  };
}

export async function getCustomerOrders(_params?: { userId?: string; email?: string }): Promise<CustomerOrderRecord[]> {
  // Identity comes from the verified session cookie, never a userId/email query.
  const data = await requestOrderJson("/customer/orders");
  if (!Array.isArray(data)) throw new OrderRequestError("invalid-response");
  return data;
}

export async function getCustomerReviews(params: { userId?: string; email?: string }): Promise<CustomerReviewRecord[]> {
  try {
    const q = new URLSearchParams();
    if (params.userId) q.append("userId", params.userId);
    if (params.email) q.append("email", params.email);

    const res = await fetch(`${API_BASE}/customer/reviews?${q.toString()}`);
    if (res.ok) {
      return await safeParseJson<CustomerReviewRecord[]>(res, []);
    }
  } catch (err) {
    console.error("Failed to fetch customer reviews:", err);
  }
  return [];
}

export async function updateCustomerReview(
  reviewId: string,
  payload: { rating: number; comment: string }
): Promise<{ success: boolean; review?: any; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/customer/reviews/${reviewId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await safeParseJson(res, { success: false, error: "Failed to update review" });
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteCustomerReview(reviewId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/reviews/${reviewId}`, {
      method: "DELETE",
    });
    return await safeParseJson(res, { success: false, error: "Failed to delete review" });
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateCustomerProfile(
  userId: string,
  payload: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
  }
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/customer/profile/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await safeParseJson(res, { success: false, error: "Failed to update profile" });
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export interface CustomerAddressRecord {
  id: string;
  userId: string;
  label: string;
  recipientName: string;
  phone: string;
  streetAddress: string;
  city: string;
  postalCode?: string | null;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const LOCAL_ADDRESSES_KEY = "sellora_customer_addresses";

function getLocalAddresses(): CustomerAddressRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const s = localStorage.getItem(LOCAL_ADDRESSES_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

function saveLocalAddresses(addrs: CustomerAddressRecord[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_ADDRESSES_KEY, JSON.stringify(addrs));
  } catch {}
}

export async function getCustomerAddresses(params: { userId?: string; email?: string }): Promise<CustomerAddressRecord[]> {
  let addresses: CustomerAddressRecord[] = [];
  try {
    const q = new URLSearchParams();
    if (params.userId) q.append("userId", params.userId);
    if (params.email) q.append("email", params.email);

    const res = await fetch(`${API_BASE}/customer/addresses?${q.toString()}`);
    if (res.ok) {
      addresses = await safeParseJson<CustomerAddressRecord[]>(res, []);
    }
  } catch (err) {
    console.error("Failed to fetch customer addresses:", err);
  }

  // Fallback to local storage if API returned empty or failed
  if (addresses.length === 0) {
    addresses = getLocalAddresses();
  }

  return addresses;
}

export async function createCustomerAddress(payload: {
  userId?: string;
  email?: string;
  label?: string;
  recipientName: string;
  phone: string;
  streetAddress: string;
  city: string;
  postalCode?: string;
  isDefault?: boolean;
}): Promise<{ success: boolean; address?: CustomerAddressRecord; error?: string }> {
  const localAddr: CustomerAddressRecord = {
    id: "addr-" + Date.now(),
    userId: payload.userId || "guest",
    label: payload.label || "Home",
    recipientName: payload.recipientName,
    phone: payload.phone,
    streetAddress: payload.streetAddress,
    city: payload.city,
    postalCode: payload.postalCode || null,
    isDefault: !!payload.isDefault,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const res = await fetch(`${API_BASE}/customer/addresses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await safeParseJson<{ success: boolean; address?: CustomerAddressRecord; error?: string }>(
      res,
      { success: false, error: "Network error" }
    );
    if (result && result.success && result.address) {
      const locals = getLocalAddresses().filter((a) => a.id !== result.address!.id);
      saveLocalAddresses([result.address, ...locals]);
      return result;
    }
  } catch (err: any) {
    console.warn("Backend address creation failed, storing locally:", err);
  }

  // Local fallback
  const locals = getLocalAddresses();
  if (localAddr.isDefault) {
    locals.forEach((a) => (a.isDefault = false));
  }
  saveLocalAddresses([localAddr, ...locals]);
  return { success: true, address: localAddr };
}

export async function updateCustomerAddress(
  id: string,
  payload: {
    label?: string;
    recipientName?: string;
    phone?: string;
    streetAddress?: string;
    city?: string;
    postalCode?: string;
    isDefault?: boolean;
  }
): Promise<{ success: boolean; address?: CustomerAddressRecord; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/customer/addresses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await safeParseJson<{ success: boolean; address?: CustomerAddressRecord; error?: string }>(
      res,
      { success: false, error: "Network error" }
    );
    if (result && result.success && result.address) {
      const locals = getLocalAddresses().map((a) => (a.id === id ? result.address! : a));
      saveLocalAddresses(locals);
      return result;
    }
  } catch (err: any) {
    console.warn("Backend address update failed, updating locally:", err);
  }

  // Local fallback
  const locals = getLocalAddresses();
  const idx = locals.findIndex((a) => a.id === id);
  if (idx !== -1) {
    if (payload.isDefault) {
      locals.forEach((a) => (a.isDefault = false));
    }
    locals[idx] = {
      ...locals[idx],
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    saveLocalAddresses(locals);
    return { success: true, address: locals[idx] };
  }

  return { success: false, error: "Address not found" };
}

export async function setDefaultCustomerAddress(id: string): Promise<{ success: boolean; address?: CustomerAddressRecord; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/customer/addresses/${id}/default`, {
      method: "PATCH",
    });
    const result = await safeParseJson<{ success: boolean; address?: CustomerAddressRecord; error?: string }>(
      res,
      { success: false, error: "Network error" }
    );
    if (result && result.success) {
      const locals = getLocalAddresses().map((a) => ({
        ...a,
        isDefault: a.id === id,
      }));
      saveLocalAddresses(locals);
      return result;
    }
  } catch (err: any) {
    console.warn("Backend set default address failed, updating locally:", err);
  }

  const locals = getLocalAddresses();
  let updated: CustomerAddressRecord | undefined;
  locals.forEach((a) => {
    if (a.id === id) {
      a.isDefault = true;
      updated = a;
    } else {
      a.isDefault = false;
    }
  });
  saveLocalAddresses(locals);
  return { success: true, address: updated };
}

export async function deleteCustomerAddress(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/customer/addresses/${id}`, {
      method: "DELETE",
    });
    const result = await safeParseJson<{ success: boolean; message?: string; error?: string }>(
      res,
      { success: false, error: "Network error" }
    );
    if (result && result.success) {
      const locals = getLocalAddresses().filter((a) => a.id !== id);
      saveLocalAddresses(locals);
      return result;
    }
  } catch (err: any) {
    console.warn("Backend address deletion failed, updating locally:", err);
  }

  const locals = getLocalAddresses().filter((a) => a.id !== id);
  saveLocalAddresses(locals);
  return { success: true, message: "Address deleted" };
}








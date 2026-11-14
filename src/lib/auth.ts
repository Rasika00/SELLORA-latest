export interface UserSession {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  address?: string | null;
  role: "admin" | "seller" | "customer" | string;
  storeName?: string | null;
  storeBio?: string | null;
  sellerStatus?: "NONE" | "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | string;
  isActive?: boolean;
}

const STORAGE_KEY = "sellora_user";

export function getCurrentUser(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse stored user", e);
    return null;
  }
}

export function setCurrentUser(user: UserSession | null): void {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  // Dispatch custom event to sync across components
  window.dispatchEvent(new Event("sellora-auth-change"));
}

export function logout(): void {
  setCurrentUser(null);
}

export function isAdmin(user: UserSession | null): boolean {
  return !!user && user.role === "admin";
}

export function isSeller(user: UserSession | null): boolean {
  return !!user && (user.role === "seller" || user.role === "admin");
}


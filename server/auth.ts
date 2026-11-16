import { createHmac, timingSafeEqual } from "node:crypto";
import type { RequestHandler, Response } from "express";
import { prisma } from "./db";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

export type AuthUser = {
  id: string;
  role: string;
  sellerStatus: string;
  isActive: boolean;
};

type SessionUser = AuthUser & { password: string };
const SESSION_SECONDS = 8 * 60 * 60;
const cookieName = () =>
  process.env.NODE_ENV === "production" ? "__Host-sellora_session" : "sellora_session";

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value || Buffer.byteLength(value) < 32) {
    throw new ApiError(
      503,
      "Server authentication is not configured. AUTH_SECRET must contain at least 32 bytes.",
    );
  }
  return value;
}

export function assertAuthConfigured(): void {
  secret();
}

const sign = (value: string, key: string) =>
  createHmac("sha256", key).update(value).digest("base64url");

export function createSessionToken(user: SessionUser, now = Date.now()): string {
  const key = secret();
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      exp: Math.floor(now / 1000) + SESSION_SECONDS,
      version: sign(user.password, key),
    }),
  ).toString("base64url");
  return `${payload}.${sign(payload, key)}`;
}

export function verifySessionToken(
  token: string,
  now = Date.now(),
): { sub: string; version: string } {
  const key = secret();
  const parts = token.split(".");
  if (parts.length !== 2 || token.length > 2048)
    throw new ApiError(401, "Invalid session. Please log in again.");
  const expected = Buffer.from(sign(parts[0], key));
  const received = Buffer.from(parts[1]);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    throw new ApiError(401, "Invalid session. Please log in again.");
  }
  let payload;
  try {
    payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
  } catch {
    throw new ApiError(401, "Invalid session. Please log in again.");
  }
  if (
    !payload ||
    typeof payload.sub !== "string" ||
    !payload.sub ||
    typeof payload.version !== "string" ||
    !Number.isSafeInteger(payload.exp) ||
    payload.exp <= Math.floor(now / 1000)
  ) {
    throw new ApiError(401, "Session expired. Please log in again.");
  }
  return payload;
}

export function setSessionCookie(res: Response, user: SessionUser): void {
  res.cookie(cookieName(), createSessionToken(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS * 1000,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(cookieName(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
}

// Cookies are sent automatically. Reject cross-origin writes as well as using SameSite=Strict.
export const checkRequestOrigin: RequestHandler = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  try {
    if (req.get("sec-fetch-site") === "cross-site")
      throw new ApiError(403, "Cross-site requests are not allowed.");
    const origin = req.get("origin");
    if (origin) {
      const url = new URL(origin);
      const configured = (process.env.AUTH_TRUSTED_ORIGINS || "")
        .split(",")
        .map((value) => value.trim());
      const local =
        process.env.NODE_ENV !== "production" &&
        ["localhost", "127.0.0.1"].includes(url.hostname) &&
        ["localhost", "127.0.0.1"].includes(req.hostname);
      if (url.host !== req.get("host") && !configured.includes(url.origin) && !local) {
        throw new ApiError(403, "Request origin is not allowed.");
      }
    }
    next();
  } catch (error) {
    sendApiError(res, error);
  }
};

export const optionalAuth: RequestHandler = async (req, res, next) => {
  try {
    const cookies = (req.headers.cookie || "").split(";").map((cookie) => cookie.trim());
    const sessions = cookies.filter((cookie) => cookie.startsWith(`${cookieName()}=`));
    if (!sessions.length) return next();
    if (sessions.length !== 1) throw new ApiError(401, "Invalid session.");
    const token = sessions[0].slice(cookieName().length + 1);
    const payload = verifySessionToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, sellerStatus: true, isActive: true, password: true },
    });
    if (!user || !user.isActive || sign(user.password, secret()) !== payload.version) {
      throw new ApiError(401, "Session is no longer valid. Please log in again.");
    }
    res.locals.auth = {
      id: user.id,
      role: user.role,
      sellerStatus: user.sellerStatus,
      isActive: user.isActive,
    } satisfies AuthUser;
    next();
  } catch (error) {
    sendApiError(res, error);
  }
};

export const requireAuth: RequestHandler = (req, res, next) => {
  optionalAuth(req, res, () => {
    try {
      secret();
      if (!res.locals.auth) throw new ApiError(401, "Please log in to access this resource.");
      res.setHeader("Cache-Control", "no-store");
      next();
    } catch (error) {
      sendApiError(res, error);
    }
  });
};

export function authenticatedUser(res: Response): AuthUser {
  if (!res.locals.auth) throw new ApiError(401, "Please log in.");
  return res.locals.auth;
}

export const requireAdmin: RequestHandler = (_req, res, next) => {
  if (authenticatedUser(res).role !== "admin")
    return res.status(403).json({ error: "Admin access required." });
  next();
};

export function approvedSeller(user: AuthUser): boolean {
  return user.role === "seller" && user.sellerStatus === "APPROVED" && user.isActive;
}

export const requireSellerOrAdmin: RequestHandler = (_req, res, next) => {
  const user = authenticatedUser(res);
  if (user.role !== "admin" && !approvedSeller(user))
    return res.status(403).json({ error: "Approved seller or admin access required." });
  next();
};

export function requireSelfOrAdmin(parameter: string): RequestHandler {
  return (req, res, next) => {
    const user = authenticatedUser(res);
    if (user.role !== "admin" && req.params[parameter] !== user.id)
      return res.status(403).json({ error: "Access denied." });
    next();
  };
}

// Ownership writes must be protected too, or an attacker could claim an ordered product.
export const requireProductWriter: RequestHandler = async (req, res, next) => {
  try {
    const user = authenticatedUser(res);
    if (user.role === "admin") return next();
    if (!approvedSeller(user)) throw new ApiError(403, "Approved seller access required.");
    const product = await prisma.product.findUnique({
      where: { id: String(req.params.id) },
      select: { sellerId: true, status: true },
    });
    if (!product || product.sellerId !== user.id) throw new ApiError(404, "Product not found.");
    if (req.body?.sellerId !== undefined && req.body.sellerId !== user.id)
      throw new ApiError(403, "Product ownership cannot be reassigned.");
    if (
      req.body?.status !== undefined &&
      req.body.status !== product.status &&
      req.body.status !== "PENDING_APPROVAL"
    ) {
      throw new ApiError(403, "Only admins can approve or reject products.");
    }
    next();
  } catch (error) {
    sendApiError(res, error);
  }
};

export function requireOwnedRecord(
  model: "review" | "address",
  allowAdmin = false,
): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = authenticatedUser(res);
      if (allowAdmin && user.role === "admin") return next();
      const query = { where: { id: String(req.params.id) }, select: { userId: true } };
      const record =
        model === "review"
          ? await prisma.review.findUnique(query)
          : await prisma.address.findUnique(query);
      if (!record || record.userId !== user.id) throw new ApiError(404, "Resource not found.");
      next();
    } catch (error) {
      sendApiError(res, error);
    }
  };
}

export function sendApiError(res: Response, error: unknown): void {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }
  console.error("API request failed:", error);
  res.status(500).json({ error: "The request could not be completed." });
}

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "mb_session";
const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-insecure-secret-change-me";
const secretKey = new TextEncoder().encode(SESSION_SECRET);
const MAX_AGE = 60 * 60 * 24 * 7; // 7 gün

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
}

// --- Şifre ---
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// --- JWT ---
export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey);
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as "USER" | "ADMIN",
    };
  } catch {
    return null;
  }
}

// --- Çerez yönetimi (server actions / route handlers) ---
export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await signSession(user);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

// Mevcut oturumdaki kullanıcı (server component / route handler)
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;

// --- Kayıt / giriş iş mantığı ---
export async function registerUser(email: string, password: string, name: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) throw new Error("Bu e-posta zaten kayıtlı.");

  const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const role = normalizedEmail === adminEmail ? "ADMIN" : "USER";

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
      name: name.trim() || normalizedEmail.split("@")[0],
      role,
    },
  });
  return user;
}

export async function authenticateUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  return user;
}

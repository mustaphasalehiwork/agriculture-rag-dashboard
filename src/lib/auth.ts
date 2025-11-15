import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "default-secret-key-change-in-production"
);

export interface SessionData {
  username: string;
  isAuthenticated: boolean;
}

export async function createSession(username: string): Promise<string> {
  const token = await new SignJWT({ username, isAuthenticated: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SESSION_SECRET);

  return token;
}

export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    return payload as unknown as SessionData;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  console.log('cookieStore =>', cookieStore)
  const token = cookieStore.get("token")?.value;
  console.log('token =>', token)

  if (!token) {
    return null;
  }

  return verifySession(token);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: false, // Set to true only when using HTTPS
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export function validateCredentials(username: string, password: string): boolean {
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin";

  return username === adminUsername && password === adminPassword;
}

export async function requireAuth(): Promise<SessionData> {
  const session = await getSession();

  if (!session || !session.isAuthenticated) {
    throw new Error("Unauthorized");
  }

  return session;
}
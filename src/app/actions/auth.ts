"use server";

import { cookies } from "next/headers";

const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ktiskagara2026";
const COOKIE_NAME = "admin_session";
const SESSION_SECRET = "kti_skagara_secure_session_token_2026";

export async function loginAdmin(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const targetPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

    if (!password || password.trim() !== targetPassword.trim()) {
      return { success: false, error: "Password / PIN Admin salah!" };
    }

    // Set secure HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, SESSION_SECRET, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal login.",
    };
  }
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  return session?.value === SESSION_SECRET;
}

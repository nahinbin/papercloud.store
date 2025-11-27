import { cookies } from "next/headers";
import { getUserBySessionToken, PublicUser } from "@/lib/authDb";
import { hasPermission, PermissionKey } from "@/lib/permissions";
import { NextResponse } from "next/server";

export interface AuthResult {
  user: PublicUser | null;
  error: string | null;
  status: number;
}

/**
 * Check if user is authenticated and has a specific permission
 * This is the secure way to check permissions on API routes
 */
export async function requirePermission(
  permission: PermissionKey
): Promise<AuthResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const user = await getUserBySessionToken(token);
  
  if (!user) {
    return { user: null, error: "Unauthorized", status: 401 };
  }
  
  const hasAccess = await hasPermission(user, permission);
  if (!hasAccess) {
    return { user: null, error: "Forbidden: You don't have permission to access this resource", status: 403 };
  }
  
  return { user, error: null, status: 200 };
}

/**
 * Check if user is authenticated (any user, not just admin)
 * Also checks if email is verified (required for account access)
 */
export async function requireAuth(): Promise<AuthResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const user = await getUserBySessionToken(token);
  
  if (!user) {
    return { user: null, error: "Unauthorized", status: 401 };
  }
  
  // Check if email is verified (required for account access)
  if (user.email && !user.emailVerifiedAt) {
    return { 
      user: null, 
      error: "Email verification required. Please verify your email to access your account.", 
      status: 403 
    };
  }
  
  return { user, error: null, status: 200 };
}

/**
 * Check if user is super admin
 */
export async function requireSuperAdmin(): Promise<AuthResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const user = await getUserBySessionToken(token);
  
  if (!user) {
    return { user: null, error: "Unauthorized", status: 401 };
  }
  
  const isAdmin = user.isAdmin || user.username === "@admin" || user.username === "admin";
  if (!isAdmin) {
    return { user: null, error: "Forbidden: Super admin access required", status: 403 };
  }
  
  return { user, error: null, status: 200 };
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(error: string, status: number): NextResponse {
  return NextResponse.json(
    { error, message: error },
    { 
      status,
      headers: {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
      }
    }
  );
}

/**
 * Create a success response with security headers
 */
export function createSuccessResponse(data: any, status: number = 200): NextResponse {
  const response = NextResponse.json(data, { status });
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  return response;
}


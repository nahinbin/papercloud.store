import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserBySessionToken } from "@/lib/authDb";
import { hasPermission, initializePermissions } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/permissions";

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const user = await getUserBySessionToken(token);
  
  if (!user) {
    return { error: "Unauthorized", status: 401, user: null };
  }
  
  const canView = await hasPermission(user, "roles.view");
  if (!canView) {
    return { error: "Forbidden", status: 403, user: null };
  }
  
  return { error: null, status: 200, user };
}

export async function GET() {
  const adminCheck = await checkAdmin();
  if (adminCheck.error) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  // Initialize permissions if they don't exist (first time setup)
  try {
    await initializePermissions();
  } catch (error) {
    console.error("Error initializing permissions:", error);
    // Continue anyway - permissions might already exist
  }

  // Return all available permissions grouped by category
  const permissionsByCategory: Record<string, Array<{ key: string; name: string; description?: string }>> = {};
  
  for (const [key, data] of Object.entries(PERMISSIONS)) {
    const category = data.category || "other";
    if (!permissionsByCategory[category]) {
      permissionsByCategory[category] = [];
    }
    permissionsByCategory[category].push({
      key,
      name: data.name,
      description: data.name,
    });
  }

  return NextResponse.json({ permissions: PERMISSIONS, permissionsByCategory });
}


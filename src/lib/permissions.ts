import { prisma } from "@/lib/prisma";
import { PublicUser } from "@/lib/authDb";

// Define all available permissions
export const PERMISSIONS = {
  // Dashboard
  "dashboard.view": { name: "View Dashboard", category: "dashboard" },
  
  // Products
  "products.view": { name: "View Products", category: "products" },
  "products.create": { name: "Create Products", category: "products" },
  "products.edit": { name: "Edit Products", category: "products" },
  "products.delete": { name: "Delete Products", category: "products" },
  
  // Orders
  "orders.view": { name: "View Orders", category: "orders" },
  "orders.edit": { name: "Edit Orders", category: "orders" },
  "orders.delete": { name: "Delete Orders", category: "orders" },
  
  // Users
  "users.view": { name: "View Users", category: "users" },
  "users.edit": { name: "Edit Users", category: "users" },
  "users.delete": { name: "Delete Users", category: "users" },
  
  // Content Management
  "banners.view": { name: "View Banners", category: "content" },
  "banners.create": { name: "Create Banners", category: "content" },
  "banners.edit": { name: "Edit Banners", category: "content" },
  "banners.delete": { name: "Delete Banners", category: "content" },
  
  "catalogues.view": { name: "View Categories", category: "content" },
  "catalogues.create": { name: "Create Categories", category: "content" },
  "catalogues.edit": { name: "Edit Categories", category: "content" },
  "catalogues.delete": { name: "Delete Categories", category: "content" },
  
  // Roles & Permissions
  "roles.view": { name: "View Roles", category: "admin" },
  "roles.create": { name: "Create Roles", category: "admin" },
  "roles.edit": { name: "Edit Roles", category: "admin" },
  "roles.delete": { name: "Delete Roles", category: "admin" },
  "roles.assign": { name: "Assign Roles", category: "admin" },
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

/**
 * Check if a user has a specific permission
 * Super admins (@admin or isAdmin=true) have all permissions
 */
export async function hasPermission(
  user: PublicUser | null,
  permission: PermissionKey
): Promise<boolean> {
  if (!user) return false;
  
  // Super admins have all permissions
  if (user.isAdmin || user.username === "@admin" || user.username === "admin") {
    return true;
  }
  
  // Check user's roles and their permissions
  const userWithRoles = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });
  
  if (!userWithRoles) return false;
  
  // Check if any of the user's roles have this permission
  for (const userRole of userWithRoles.roles) {
    for (const rolePermission of userRole.role.permissions) {
      if (rolePermission.permission.key === permission) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(user: PublicUser | null): Promise<PermissionKey[]> {
  if (!user) return [];
  
  // Super admins have all permissions
  if (user.isAdmin || user.username === "@admin" || user.username === "admin") {
    return Object.keys(PERMISSIONS) as PermissionKey[];
  }
  
  const userWithRoles = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });
  
  if (!userWithRoles) return [];
  
  const permissions = new Set<PermissionKey>();
  
  for (const userRole of userWithRoles.roles) {
    for (const rolePermission of userRole.role.permissions) {
      permissions.add(rolePermission.permission.key as PermissionKey);
    }
  }
  
  return Array.from(permissions);
}

/**
 * Initialize default permissions in the database
 */
export async function initializePermissions() {
  for (const [key, data] of Object.entries(PERMISSIONS)) {
    await prisma.permission.upsert({
      where: { key },
      update: {
        name: data.name,
        category: data.category,
      },
      create: {
        key,
        name: data.name,
        category: data.category,
        description: data.name,
      },
    });
  }
}


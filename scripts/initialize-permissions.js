/**
 * Initialize permissions in the database
 * Run this after running Prisma migrations
 * Usage: node scripts/initialize-permissions.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const PERMISSIONS = {
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
  
  "catalogues.view": { name: "View Catalogues", category: "content" },
  "catalogues.create": { name: "Create Catalogues", category: "content" },
  "catalogues.edit": { name: "Edit Catalogues", category: "content" },
  "catalogues.delete": { name: "Delete Catalogues", category: "content" },
  
  // Coupons
  "coupons.view": { name: "View Coupons", category: "products" },
  "coupons.create": { name: "Create Coupons", category: "products" },
  "coupons.update": { name: "Update Coupons", category: "products" },
  "coupons.delete": { name: "Delete Coupons", category: "products" },
  
  // Roles & Permissions
  "roles.view": { name: "View Roles", category: "admin" },
  "roles.create": { name: "Create Roles", category: "admin" },
  "roles.edit": { name: "Edit Roles", category: "admin" },
  "roles.delete": { name: "Delete Roles", category: "admin" },
  "roles.assign": { name: "Assign Roles", category: "admin" },
};

async function initializePermissions() {
  console.log("Initializing permissions...");
  
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
    console.log(`✓ ${key}`);
  }
  
  console.log("\nAll permissions initialized successfully!");
}

initializePermissions()
  .catch((e) => {
    console.error("Error initializing permissions:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


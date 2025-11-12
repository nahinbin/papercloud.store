// Script to ensure all users with username "@admin" or "admin" have isAdmin set to true
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateAdminUsers() {
  try {
    console.log('🔄 Checking for admin users...');
    
    // Find all users with username @admin or admin
    const adminUsers = await prisma.user.findMany({
      where: { 
        OR: [
          { username: "@admin" },
          { username: "admin" }
        ]
      },
      select: { id: true, username: true, isAdmin: true },
    });
    
    if (adminUsers.length === 0) {
      console.log('✅ No @admin users found');
      return;
    }
    
    console.log(`📝 Found ${adminUsers.length} @admin user(s)`);
    
    // Update any @admin users that don't have isAdmin set to true
    for (const user of adminUsers) {
      if (!user.isAdmin) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isAdmin: true },
        });
        console.log(`✅ Updated user ${user.id} (${user.username}) to admin status`);
      } else {
        console.log(`✅ User ${user.id} (${user.username}) already has admin status`);
      }
    }
    
    console.log('✅ Admin user update completed');
  } catch (error) {
    console.error('❌ Update error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run update
updateAdminUsers()
  .then(() => {
    console.log('Admin user update script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Admin user update script failed:', error);
    process.exit(1);
  });


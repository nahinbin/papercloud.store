// Migration script to add username to existing users
// This script populates username for existing users before making it required

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateUsernames() {
  try {
    console.log('🔄 Starting username migration...');
    
    // Find all users without a username
    const usersWithoutUsername = await prisma.user.findMany({
      where: { username: null },
      select: { id: true, name: true },
    });
    
    if (usersWithoutUsername.length === 0) {
      console.log('✅ No users need migration');
      return;
    }
    
    console.log(`📝 Found ${usersWithoutUsername.length} user(s) to migrate`);
    
    // Generate usernames for existing users
    for (const user of usersWithoutUsername) {
      // Generate username from user ID
      let username = `user_${user.id.substring(0, 8)}`;
      
      // Ensure uniqueness by appending number if needed
      let finalUsername = username;
      let counter = 1;
      while (true) {
        const existing = await prisma.user.findUnique({
          where: { username: finalUsername },
        });
        if (!existing) break;
        finalUsername = `${username}_${counter}`;
        counter++;
      }
      
      // Update user with username
      await prisma.user.update({
        where: { id: user.id },
        data: { username: finalUsername },
      });
      
      console.log(`✅ Migrated user ${user.id} to username: ${finalUsername}`);
    }
    
    console.log('✅ Username migration completed');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateUsernames()
  .then(() => {
    console.log('Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });


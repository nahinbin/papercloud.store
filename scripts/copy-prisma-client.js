// Script to copy Prisma client from home directory to project node_modules
// This is mainly needed for local development with non-ASCII paths
// On Vercel, Prisma generates directly to the correct location

const fs = require('fs');
const path = require('path');
const os = require('os');

// Skip on Vercel or CI environments
if (process.env.VERCEL || process.env.CI) {
  console.log('⏭️  Skipping Prisma client copy (Vercel/CI environment)');
  process.exit(0);
}

const homeDir = os.homedir();
const projectDir = process.cwd();

const sourceClient = path.join(homeDir, 'node_modules', '@prisma', 'client');
const sourcePrisma = path.join(homeDir, 'node_modules', '.prisma');
const destClient = path.join(projectDir, 'node_modules', '@prisma', 'client');
const destPrisma = path.join(projectDir, 'node_modules', '.prisma');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    return false;
  }
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  
  return true;
}

// Copy Prisma client
if (copyDir(sourceClient, destClient)) {
  console.log('✅ Copied Prisma client to project node_modules');
} else {
  console.log('⚠️  Prisma client not found in home directory, skipping copy');
}

// Copy .prisma folder
if (copyDir(sourcePrisma, destPrisma)) {
  console.log('✅ Copied .prisma folder to project node_modules');
} else {
  console.log('⚠️  .prisma folder not found in home directory, skipping copy');
}


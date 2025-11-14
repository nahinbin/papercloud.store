const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function createFavicon() {
  const inputPath = path.join(__dirname, '../public/nav.png');
  const outputPath = path.join(__dirname, '../src/app/icon.png');
  
  try {
    // Get image metadata
    const metadata = await sharp(inputPath).metadata();
    
    // Create a square version by cropping the center
    const size = Math.min(metadata.width, metadata.height);
    const left = Math.floor((metadata.width - size) / 2);
    const top = Math.floor((metadata.height - size) / 2);
    
    await sharp(inputPath)
      .extract({ left, top, width: size, height: size })
      .resize(32, 32, { fit: 'cover' })
      .toFile(outputPath);
    
    console.log('✅ Favicon created successfully at src/app/icon.png');
    console.log('   Next.js will automatically use this as your favicon!');
  } catch (error) {
    console.error('❌ Error creating favicon:', error.message);
    process.exit(1);
  }
}

createFavicon();


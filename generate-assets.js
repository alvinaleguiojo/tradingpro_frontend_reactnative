const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');

// Icon SVG content (1024x1024)
const iconSvg = fs.readFileSync(path.join(assetsDir, 'icon.svg'));

// Splash SVG content
const splashSvg = fs.readFileSync(path.join(assetsDir, 'splash.svg'));

async function generateAssets() {
  console.log('Generating PNG assets from SVGs...');

  // Generate icon.png (1024x1024)
  await sharp(iconSvg)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));
  console.log('✓ Created icon.png (1024x1024)');

  // Generate adaptive-icon.png (1024x1024) - same as icon for now
  await sharp(iconSvg)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(assetsDir, 'adaptive-icon.png'));
  console.log('✓ Created adaptive-icon.png (1024x1024)');

  // Generate splash.png (1284x2778 for iPhone 13 Pro Max / modern devices)
  // First, create the splash with proper dimensions
  const splashWidth = 1284;
  const splashHeight = 2778;
  
  await sharp(splashSvg)
    .resize(splashWidth, splashHeight, {
      fit: 'contain',
      background: { r: 13, g: 20, b: 33, alpha: 1 } // #0D1421
    })
    .png()
    .toFile(path.join(assetsDir, 'splash.png'));
  console.log('✓ Created splash.png (1284x2778)');

  // Generate favicon.png for web (48x48)
  await sharp(iconSvg)
    .resize(48, 48)
    .png()
    .toFile(path.join(assetsDir, 'favicon.png'));
  console.log('✓ Created favicon.png (48x48)');

  console.log('\nAll assets generated successfully!');
}

generateAssets().catch(console.error);

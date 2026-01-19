import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const iconsDir = path.join(publicDir, 'assets', 'icons');

const BEIGE_BG = '#feefe1';
const sizes = [192, 512];

async function generateIcons() {
  const logoPath = path.join(publicDir, 'logo-carre.png');

  for (const size of sizes) {
    // Create a beige background with the logo centered
    const logoSize = Math.floor(size * 0.7); // Logo takes 70% of the icon
    const padding = Math.floor((size - logoSize) / 2);

    // Resize logo
    const resizedLogo = await sharp(logoPath)
      .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    // Create icon with beige background
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: BEIGE_BG
      }
    })
      .composite([{
        input: resizedLogo,
        top: padding,
        left: padding
      }])
      .png()
      .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));

    console.log(`Created icon-${size}x${size}.png`);
  }

  // Also create apple-touch-icon (180x180)
  const appleSize = 180;
  const applLogoSize = Math.floor(appleSize * 0.7);
  const applePadding = Math.floor((appleSize - applLogoSize) / 2);

  const appleResizedLogo = await sharp(logoPath)
    .resize(applLogoSize, applLogoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: appleSize,
      height: appleSize,
      channels: 4,
      background: BEIGE_BG
    }
  })
    .composite([{
      input: appleResizedLogo,
      top: applePadding,
      left: applePadding
    }])
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('Created apple-touch-icon.png');
}

generateIcons().catch(console.error);

/**
 * Script pour générer les icônes PWA
 * 
 * Prérequis: npm install sharp
 * Usage: node scripts/generate-pwa-icons.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, "../public/icons");

async function generateIcons() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("❌ Le package 'sharp' n'est pas installé.");
    console.log("   Exécutez: npm install sharp");
    console.log("");
    console.log("   Ou créez manuellement les fichiers suivants:");
    console.log("   - public/icons/icon-192x192.png (192x192 pixels)");
    console.log("   - public/icons/icon-512x512.png (512x512 pixels)");
    process.exit(1);
  }

  const svgPath = path.join(iconsDir, "icon.svg");
  
  if (!fs.existsSync(svgPath)) {
    console.error("❌ Fichier SVG source introuvable:", svgPath);
    process.exit(1);
  }

  const sizes = [192, 512];

  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✅ Généré: ${outputPath}`);
  }

  console.log("");
  console.log("🎉 Icônes PWA générées avec succès!");
}

generateIcons().catch(console.error);

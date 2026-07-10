import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import sharp from "sharp"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")
const LOGO = path.join(ROOT, "public/assets/scraped/branding/setu-logo.png")
const BG = { r: 255, g: 255, b: 255 }

function removeDarkBackground(data) {
  const cleaned = Buffer.alloc(data.length)

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]

    const isDarkBg = r < 50 && g < 50 && b < 50
    const isTransparent = a < 20

    if (isDarkBg || isTransparent) {
      cleaned[i] = 0
      cleaned[i + 1] = 0
      cleaned[i + 2] = 0
      cleaned[i + 3] = 0
    } else {
      cleaned[i] = r
      cleaned[i + 1] = g
      cleaned[i + 2] = b
      cleaned[i + 3] = 255
    }
  }

  return cleaned
}

async function prepareLogoBuffer() {
  const meta = await sharp(LOGO).metadata()
  const cropHeight = Math.round(meta.height * 0.62)

  const cropped = await sharp(LOGO)
    .extract({ left: 0, top: 0, width: meta.width, height: cropHeight })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const cleaned = removeDarkBackground(cropped.data)

  return sharp(cleaned, {
    raw: { width: cropped.info.width, height: cropped.info.height, channels: 4 },
  })
    .trim()
    .png()
    .toBuffer()
}

async function createFavicon(size, logoBuffer, logoScale = 0.78) {
  const logoMax = Math.round(size * logoScale)
  const resizedLogo = await sharp(logoBuffer)
    .resize({ width: logoMax, height: logoMax, fit: "inside" })
    .png()
    .toBuffer()

  const logoMeta = await sharp(resizedLogo).metadata()
  const left = Math.floor((size - logoMeta.width) / 2)
  const top = Math.floor((size - logoMeta.height) / 2)

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: BG,
    },
  })
    .composite([{ input: resizedLogo, left, top }])
    .png()
    .toBuffer()
}

async function main() {
  const logoBuffer = await prepareLogoBuffer()

  const outputs = [
    { size: 16, path: "public/favicon-16.png", scale: 0.82 },
    { size: 32, path: "public/favicon.png", scale: 0.8 },
    { size: 32, path: "public/favicon-32.png", scale: 0.8 },
    { size: 48, path: "public/favicon-48.png", scale: 0.78 },
    { size: 180, path: "public/assets/scraped/branding/apple-touch-icon.png", scale: 0.72 },
    { size: 180, path: "public/assets/scraped/branding/favicon.png", scale: 0.72 },
  ]

  for (const { size, path: outPath, scale } of outputs) {
    const buf = await createFavicon(size, logoBuffer, scale)
    const fullPath = path.join(ROOT, outPath)
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.writeFile(fullPath, buf)
    console.log(`Wrote ${outPath} (${size}x${size})`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

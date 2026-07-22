import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import sharp from "sharp"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")
const LOGO = path.join(ROOT, "public/assets/scraped/branding/setu-logo.png")
/** Light cream — matches site shell; blue SETU mark stays readable */
const BG = { r: 250, g: 249, b: 247 }

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
  const cropHeight = Math.round(meta.height * 0.55)

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
    { size: 16, path: "public/favicon-16.png", scale: 0.86 },
    { size: 32, path: "public/favicon.png", scale: 0.84 },
    { size: 32, path: "public/favicon-32.png", scale: 0.84 },
    { size: 48, path: "public/favicon-48.png", scale: 0.82 },
    { size: 180, path: "public/assets/scraped/branding/apple-touch-icon.png", scale: 0.76 },
    { size: 180, path: "public/assets/scraped/branding/favicon.png", scale: 0.76 },
  ]

  let favicon32 = null

  for (const { size, path: outPath, scale } of outputs) {
    const buf = await createFavicon(size, logoBuffer, scale)
    if (outPath === "public/favicon.png") favicon32 = buf
    const fullPath = path.join(ROOT, outPath)
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.writeFile(fullPath, buf)
    console.log(`Wrote ${outPath} (${size}x${size})`)
  }

  const brandDir = path.join(ROOT, "public/brand")
  await fs.mkdir(brandDir, { recursive: true })

  if (favicon32) {
    const brandOutputs = [
      { name: "setu-favicon.ico", buf: favicon32 },
      { name: "setu-favicon-32.png", buf: favicon32 },
    ]
    for (const { name, buf } of brandOutputs) {
      await fs.writeFile(path.join(brandDir, name), buf)
      console.log(`Wrote public/brand/${name}`)
    }
  }

  const favicon16 = await createFavicon(16, logoBuffer, 0.86)
  const favicon48 = await createFavicon(48, logoBuffer, 0.82)
  await fs.writeFile(path.join(brandDir, "setu-favicon-16.png"), favicon16)
  await fs.writeFile(path.join(brandDir, "setu-favicon-48.png"), favicon48)
  console.log("Wrote public/brand/setu-favicon-16.png")
  console.log("Wrote public/brand/setu-favicon-48.png")

  const apple = await createFavicon(180, logoBuffer, 0.76)
  await fs.writeFile(path.join(brandDir, "setu-apple-touch-icon.png"), apple)
  console.log("Wrote public/brand/setu-apple-touch-icon.png")

  if (favicon32) {
    const icoPath = path.join(ROOT, "public/favicon.ico")
    await fs.writeFile(icoPath, favicon32)
    console.log("Wrote public/favicon.ico (32x32 PNG — stops SPA fallback on /favicon.ico)")
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

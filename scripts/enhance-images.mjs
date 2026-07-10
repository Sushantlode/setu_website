import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import sharp from "sharp"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")
const BASE = "https://www.setuai.com"
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
const OUT = path.join(ROOT, "public/assets/enhanced")

const DOWNLOADS = [
  { url: `${BASE}/assets/img/w1.jpg`, out: "projects/sundargarh-eswasthya.jpg", minWidth: 1920 },
  { url: `${BASE}/assets/img/w2.jpg`, out: "projects/matrujyoti.jpg", minWidth: 1920 },
  { url: `${BASE}/assets/img/w3.jpg`, out: "projects/nalanda-preventive.jpg", minWidth: 1920 },
  { url: `${BASE}/assets/img/o9.jpg`, out: "projects/khatima-checkups.jpg", minWidth: 1920 },
  { url: `${BASE}/assets/img/r3.jpg`, out: "projects/pune-pmc-pilot.jpg", minWidth: 1920 },
  { url: `${BASE}/assets/img/portfolio/portfolio-4.webp`, out: "projects/portfolio-4.webp", minWidth: 1920 },
  { url: `${BASE}/assets/img/fg.jpeg`, out: "general/hero-fg.jpeg", minWidth: 1920 },
  {
    url: `${BASE}/assets/img/WhatsApp%20Image%202025-12-09%20at%202.06.26%20AM.jpeg`,
    out: "general/about-team.jpeg",
    minWidth: 1400,
  },
  { url: `${BASE}/assets/img/oiu.jpg`, out: "general/services-oiu.jpg", minWidth: 1920 },
  { url: `${BASE}/assets/img/Setu%20logo.png`, out: "branding/setu-logo.png", minWidth: 0 },
  { url: `${BASE}/assets/img/telemedicine-1.jpeg`, out: "services/telemedicine-1.jpeg", minWidth: 1600 },
  { url: `${BASE}/assets/img/telemedicine-2.jpeg`, out: "services/telemedicine-2.jpeg", minWidth: 1600 },
  { url: `${BASE}/assets/img/telemedicine-3.jpeg`, out: "services/telemedicine-3.jpeg", minWidth: 1600 },
  { url: `${BASE}/assets/img/matru1.jpeg`, out: "services/mother-child-matru1.jpeg", minWidth: 1600 },
  { url: `${BASE}/assets/img/matru2.jpeg`, out: "services/mother-child-matru2.jpeg", minWidth: 1600 },
  { url: `${BASE}/assets/img/child1.jpeg`, out: "services/mother-child-child1.jpeg", minWidth: 1600 },
  { url: `${BASE}/assets/img/child2.jpeg`, out: "services/mother-child-child2.jpeg", minWidth: 1600 },
  { url: `${BASE}/assets/img/setu-wind.jpeg`, out: "services/setu-wind.jpeg", minWidth: 1600 },
  { url: `${BASE}/assets/img/setu-wind-alt.jpeg`, out: "services/setu-wind-alt.jpeg", minWidth: 1600 },
  { url: `${BASE}/assets/img/setu-air.jpg`, out: "services/setu-air.jpg", minWidth: 1920 },
  { url: `${BASE}/assets/img/setu-air-wall.jpeg`, out: "services/setu-air-wall.jpeg", minWidth: 1600 },
  {
    url: `${BASE}/assets/img/preventive-ehealth-center.png`,
    out: "services/preventive-ehealth-center.png",
    minWidth: 1600,
  },
  {
    url: `${BASE}/assets/img/preventive-health-kit.png`,
    out: "services/preventive-health-kit.png",
    minWidth: 1600,
  },
]

async function download(url, dest) {
  const res = await fetch(url, { headers: { "User-Agent": UA } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await fs.mkdir(path.dirname(dest), { recursive: true })
  await fs.writeFile(dest, buf)
  return buf
}

async function enhanceBuffer(input, { minWidth = 0, format = "webp" }) {
  const meta = await sharp(input).metadata()
  let width = meta.width ?? 0

  let pipeline = sharp(input).rotate()

  if (minWidth && width < minWidth) {
    width = minWidth
    pipeline = pipeline.resize({
      width: minWidth,
      withoutEnlargement: false,
      kernel: sharp.kernel.lanczos3,
    })
  }

  pipeline = pipeline
    .normalize()
    .modulate({ brightness: 1.03, saturation: 1.06 })
    .sharpen({ sigma: 1.1, m1: 1.15, m2: 0.45, x1: 2, y2: 10, y3: 20 })

  if (format === "png") {
    return pipeline.png({ compressionLevel: 6, quality: 95 }).toBuffer()
  }

  if (format === "jpeg") {
    return pipeline.jpeg({ quality: 92, mozjpeg: true }).toBuffer()
  }

  return pipeline.webp({ quality: 90, effort: 6, smartSubsample: true }).toBuffer()
}

function outputFormat(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === ".png") return "png"
  if (ext === ".jpg" || ext === ".jpeg") return "jpeg"
  return "webp"
}

function toWebpPath(filePath) {
  return filePath.replace(/\.(jpe?g|png|webp)$/i, ".webp")
}

async function main() {
  const tmpDir = path.join(ROOT, ".tmp-images")
  await fs.mkdir(tmpDir, { recursive: true })
  await fs.mkdir(OUT, { recursive: true })

  const manifest = []

  for (const item of DOWNLOADS) {
    const tmpPath = path.join(tmpDir, path.basename(item.out))
    const webpOut = toWebpPath(path.join(OUT, item.out))
    const format = outputFormat(item.out)

    try {
      console.log(`Downloading ${item.url}`)
      const buf = await download(item.url, tmpPath)
      const enhanced = await enhanceBuffer(buf, {
        minWidth: item.minWidth,
        format: "webp",
      })

      await fs.mkdir(path.dirname(webpOut), { recursive: true })
      await fs.writeFile(webpOut, enhanced)

      const meta = await sharp(enhanced).metadata()
      manifest.push({
        source: item.url,
        output: webpOut.replace(path.join(ROOT, "public"), ""),
        width: meta.width,
        height: meta.height,
        bytes: enhanced.length,
      })

      if (format === "png") {
        const pngOut = path.join(OUT, item.out)
        const pngBuf = await enhanceBuffer(buf, { minWidth: item.minWidth, format: "png" })
        await fs.writeFile(pngOut, pngBuf)
      }

      console.log(`  -> ${meta.width}x${meta.height} ${(enhanced.length / 1024).toFixed(0)}KB`)
    } catch (err) {
      console.warn(`  SKIP ${item.out}: ${err.message}`)
      const fallback = path.join(ROOT, "public/assets/scraped", item.out)
      try {
        const fallbackBuf = await fs.readFile(fallback)
        const enhanced = await enhanceBuffer(fallbackBuf, {
          minWidth: item.minWidth,
          format: "webp",
        })
        await fs.mkdir(path.dirname(webpOut), { recursive: true })
        await fs.writeFile(webpOut, enhanced)
        const meta = await sharp(enhanced).metadata()
        manifest.push({
          source: "fallback:" + fallback,
          output: webpOut.replace(path.join(ROOT, "public"), ""),
          width: meta.width,
          height: meta.height,
          bytes: enhanced.length,
        })
        console.log(`  fallback -> ${meta.width}x${meta.height}`)
      } catch {
        console.error(`  FAILED ${item.out}`)
      }
    }
  }

  await fs.writeFile(
    path.join(OUT, "manifest.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), images: manifest }, null, 2),
  )

  await fs.rm(tmpDir, { recursive: true, force: true })
  console.log(`\nDone. ${manifest.length} enhanced images in public/assets/enhanced/`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

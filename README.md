# SETU Website

Modern React marketing site for [SETU](https://www.setuai.com) — preventive healthcare platform.

## Stack

- **React 19** + **Vite 8**
- **Tailwind CSS 4**
- **Framer Motion** — scroll animations
- **Lucide React** — icons

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run build:godaddy` | Build + config.php (if SMTP_PASS in env) + deploy checklist |
| `npm run preview` | Preview production build |

## Deploy to GoDaddy (setuai.com)

See **[DEPLOY-GODADDY.md](./DEPLOY-GODADDY.md)** for full cPanel upload steps.

Quick version:

```bash
npm run build:godaddy
# Upload everything inside dist/ to public_html via cPanel File Manager or FTP
# Copy api/config.php.example → api/config.php and add SMTP password on server
```

## Project Structure

```
src/
├── components/     # UI sections (Hero, Navbar, etc.)
├── data/           # Content & copy (content.js)
├── App.jsx         # Page layout
└── main.jsx        # Entry point
```

## Sections

1. **Hero** — Mission-led headline with CTAs
2. **Impact Stats** — Animated counters (30K+ screened, etc.)
3. **Services** — Interactive initiative tabs
4. **Impact Map** — India deployment explorer
5. **About / Mission** — Belief statements + timeline
6. **Projects** — Field stories from Odisha, Bihar, etc.
7. **Devices** — WIND & AIR showcase
8. **Partner** — B2G/B2B partnership CTA
9. **Contact** — Form + contact details
10. **Footer**

## Customization

Edit `src/data/content.js` to update copy, stats, projects, and contact info.

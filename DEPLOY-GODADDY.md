# Deploy SETU Website to GoDaddy (setuai.com)

This guide is for your **GoDaddy cPanel shared hosting** (`setuai.com`).

The site is a **static React build** + **PHP contact API**. GoDaddy shared hosting does **not** run the Node.js dev server — PHP handles the contact form instead.

---

## CI/CD — GitHub Actions (recommended)

Auto-deploy to GoDaddy on every push to `main`.

### 1. Create a GitHub repo

```bash
cd setu_website
git init
git add .
git commit -m "SETU website with GoDaddy deploy"
git branch -M main
git remote add origin https://github.com/YOUR_ORG/setu-website.git
git push -u origin main
```

### 2. Add GitHub Secrets

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret | Value | Required |
|--------|-------|----------|
| `FTP_SERVER` | `184.168.116.6` (GoDaddy hosting IP for nkginternational.com account) | Yes |
| `FTP_USERNAME` | `my14ac4b46r3` (cPanel login from GoDaddy → Hosting → Manage) | Yes |
| `FTP_PASSWORD` | Your cPanel password | Yes |
| `SMTP_PASS` | Password for `no_reply@setuai.com` | Yes |
| `SMTP_USER` | `no_reply@setuai.com` | Optional |
| `SMTP_HOST` | `setuai.com` | Optional |
| `SMTP_PORT` | `465` | Optional |
| `SMTP_FROM` | `Setu <no_reply@setuai.com>` | Optional |
| `CONTACT_TO_EMAIL` | `support@setuai.com` | Optional |
| `STAGING_API_BASE` | `https://staging.setuai.com` (API proxy upstream) | Optional |

**Do NOT set `FTP_SERVER_DIR`.** Deploy always targets `public_html/setuai.com/` only.  
**Never deploy to `public_html/`** — that folder serves **nkginternational.com**.

**Never commit passwords to git.** Use GitHub Secrets only.

### 3. Find FTP credentials in GoDaddy

**Hosting** → **nkginternational.com** → **Manage** → note **cPanel login** and **IP Address**:

- **FTP_SERVER:** `184.168.116.6`
- **FTP_USERNAME:** `my14ac4b46r3` (your cPanel login)
- **FTP_PASSWORD:** cPanel password (change via **Change** next to cPanel password)

setuai.com is an **addon domain**; files deploy to `public_html/setuai.com/`.

### 4. First deploy (replace existing site)

1. **Backup** current `public_html` in cPanel
2. GitHub → **Actions** → **Deploy to GoDaddy** → **Run workflow**
3. Set **clean_slate** = `true` (wipes old site, uploads new one)
4. **Upload story video once** via FTP (not in git — 343 MB):
   - `public_html/videos/setu-story-web.mp4`

### 5. Ongoing deploys

Every push to `main` auto-deploys. Use **clean_slate** = `false` (default) so existing videos on the server are not deleted.

### 6. Manual deploy (without CI)

```bash
# Uses SMTP_PASS from your local .env
npm run build:godaddy
# Upload dist/ to public_html via File Manager or FTP
```

---

## What you need from GoDaddy

| Item | Where to find it |
|------|------------------|
| cPanel login | GoDaddy → My Account → Hosting → setuai.com → **cPanel Admin** |
| File Manager | cPanel → **File Manager** |
| FTP (optional) | cPanel → **FTP Manager** — use for large video files |
| Email SMTP password | Password for `no_reply@setuai.com` (or create this mailbox in GoDaddy Email) |

---

## Step 1 — Build on your computer

```bash
cd setu_website
npm install
npm run build:godaddy
```

This creates a `dist/` folder with everything to upload.

**Large videos** (must exist locally before build — they are copied from `public/`):

| File | Size | Purpose |
|------|------|---------|
| `public/videos/herovideo.mp4` | ~15 MB | Hero background |
| `public/videos/setu-story-web.mp4` | ~343 MB | “Watch Our Story” modal |

If videos are missing, copy them into `public/videos/` and run `npm run build:godaddy` again.

---

## Step 2 — Backup existing site

In cPanel:

1. **Backups** → download a full backup, or
2. **File Manager** → `public_html` → **Compress** → download the zip

Keep the backup until the new site is verified.

---

## Step 3 — Upload files

1. Open **File Manager** → `public_html`
2. Delete or move old site files (keep backup zip elsewhere)
3. Upload **all contents** of your local `dist/` folder into `public_html`

Upload structure should look like:

```
public_html/
├── index.html
├── .htaccess
├── favicon.png
├── assets/
├── videos/
├── api/
│   ├── contact.php
│   ├── health.php
│   ├── config.php.example
│   ├── lib.php
│   └── data/
└── ...
```

**Tip:** For the 343 MB story video, use **FTP** (FileZilla) if cPanel upload times out.

---

## Step 4 — Configure contact form email

1. In File Manager, go to `public_html/api/`
2. Copy `config.php.example` → `config.php`
3. Edit `config.php` and set:

```php
"smtp_pass" => "YOUR_ACTUAL_PASSWORD",
```

Use the password for `no_reply@setuai.com` from GoDaddy Professional Email.

4. Ensure `api/data/` is writable:
   - Right-click `data` → **Change Permissions** → `755` or `775`

---

## Step 5 — Test

| URL | Expected |
|-----|----------|
| https://setuai.com | Homepage loads with hero video |
| https://setuai.com/api/health | `{"ok":true,"service":"setu-contact-api",...}` |
| Contact form on site | Sends email to support@setuai.com |

---

## HTTPS & www

`.htaccess` is included and will:

- Force **HTTPS**
- Redirect **www.setuai.com** → **setuai.com**

To use `www` as primary instead, edit `public/.htaccess` before building.

---

## Troubleshooting

### Contact form returns “Email service is not configured”
- `api/config.php` is missing or `smtp_pass` is empty

### Contact form returns 500
- Wrong SMTP password
- Check cPanel → **Errors** or **Metrics → Errors** for PHP logs
- Confirm `no_reply@setuai.com` exists in GoDaddy Email

### Hero or story video missing
- Upload `videos/herovideo.mp4` and `videos/setu-story-web.mp4` via FTP

### Blank page after upload
- Ensure `index.html` is directly in `public_html` (not inside a `dist` subfolder)
- Check `.htaccess` was uploaded (enable “Show Hidden Files” in File Manager)

### Upload size limit
- Use FTP for files over 100 MB
- Or split uploads: HTML/assets first, videos via FTP

---

## What I need from you

Please confirm or provide:

1. **GitHub repo URL** — to push the code for CI/CD (or create one under your org)
2. **FTP credentials** from cPanel → FTP Manager (server, username, password)
3. **Replace confirmed** — you want to fully replace the existing setuai.com site ✓
4. **Story video** — upload `setu-story-web.mp4` once via FTP after first CI deploy (343 MB, too large for git)

SMTP password: add as GitHub Secret `SMTP_PASS` — do not commit to the repository.

---

## Re-deploy after changes

```bash
npm run build:godaddy
```

Upload changed files from `dist/` to `public_html` (or full replace).

---

## Local vs production

| Environment | Contact API | Auth / app APIs (`/auth`, `/dashboard`, …) |
|-------------|-------------|-----------------------------------------------|
| `npm run dev` | Node on `:3001` (via Vite `/api`) | Vite proxy → `https://api.setuai.com` |
| GoDaddy production | PHP `/api/contact` | PHP `/api/staging-proxy.php` via `.htaccess` → `https://api.setuai.com` |

Keep `VITE_API_URL` empty in production. Relative bases (`/auth`, …) stay same-origin so the browser never hits API CORS/CORP.

Optional GitHub secret `STAGING_API_BASE` (default `https://api.setuai.com`) is written into `api/config.php` for the proxy upstream.

### After deploy — quick checks

- `https://setuai.com/api/health` → PHP health OK
- `POST https://setuai.com/auth/otp/send` with JSON `{"mobile":"…"}` → JSON from api.setuai.com (not `index.html`)
- Login OTP in the browser on `https://setuai.com`

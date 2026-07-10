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
| `FTP_SERVER` | `ftp.setuai.com` (from cPanel → FTP) | Yes |
| `FTP_USERNAME` | Your cPanel FTP username | Yes |
| `FTP_PASSWORD` | Your cPanel FTP password | Yes |
| `FTP_SERVER_DIR` | `/public_html/` (default) | Optional |
| `FTP_PORT` | `21` | Optional |
| `SMTP_PASS` | Password for `no_reply@setuai.com` | Yes |
| `SMTP_USER` | `no_reply@setuai.com` | Optional |
| `SMTP_HOST` | `setuai.com` | Optional |
| `SMTP_PORT` | `465` | Optional |
| `SMTP_FROM` | `Setu <no_reply@setuai.com>` | Optional |
| `CONTACT_TO_EMAIL` | `support@setuai.com` | Optional |

**Never commit passwords to git.** Use GitHub Secrets only.

### 3. Find FTP credentials in GoDaddy

cPanel → **FTP Accounts** or **FTP Manager**:
- **Server:** often `ftp.setuai.com`
- **Username:** your cPanel username (may look like `setuai` or `setuai@setuai.com`)
- **Password:** FTP password (can reset in cPanel)

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

| Environment | Contact API |
|-------------|-------------|
| `npm run dev:all` | Node.js on port 3001 |
| GoDaddy production | PHP at `/api/contact` |

No code changes needed — production uses same-origin `/api/contact` automatically.

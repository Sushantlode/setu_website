---
name: code-review
description: Review React/Vite code for setu_website — scope discipline, RN parity, auth, API clients, VLE flows. Use when reviewing PRs, examining changes, or when the user asks for a code review.
---

# SETU Website Code Review

Label findings:

- 🔴 **Block** — must fix before merge
- 🟡 **Suggest** — should fix
- 🟢 **Polish** — optional

## 1. Scope & parity (🔴 if violated)

- [ ] Change matches what was requested — no drive-by refactors or new modules
- [ ] App features mirror `setuReactNative` behaviour where applicable
- [ ] No marketing stubs (`ModulePage`) for shipped features
- [ ] No new markdown/docs unless requested

## 2. Auth & security (🔴)

- [ ] No secrets in code, commits, or `.env.example` with real values
- [ ] Tokens refreshed via SETU-AUTH `/auth/refreshToken` — no invented refresh URLs
- [ ] VLE routes wrapped in `RoleProtectedRoute allow="vle"`
- [ ] API calls use `authFetch` / `vleAuthFetch`, not raw fetch with hardcoded hosts

## 3. API & proxy (🔴 / 🟡)

- [ ] URLs built via `src/config/api.js` helpers
- [ ] New backend prefix has Vite proxy + `staging-proxy.php` entry
- [ ] Response envelopes normalized once in API client, not in every page

## 4. UI / React (🟡)

- [ ] Loading, empty, and error states on list/data screens
- [ ] Reuses existing layouts (`AppLayout`, `VleLayout`, `*Shell.jsx`)
- [ ] Safe-area classes (`app-safe-x`, `page-safe-bottom`) on mobile views
- [ ] Storage images via `resolveStorageImageUrl` — not direct cross-origin `api.setuai.com/assets`

## 5. Build & lint (🔴)

- [ ] `npm run build` passes
- [ ] `npm run lint` passes on touched files
- [ ] Commit message follows Conventional Commits (see **commit-rabbit** skill)

## 6. VLE / wallet (🟡 when relevant)

- [ ] Deposit flow: create-order → Razorpay → confirm (or webhook)
- [ ] Transaction status not duplicated in page + layout
- [ ] Wallet balance only changes on confirmed deposit / completed payout

## Output format

```
## Summary
<1–2 sentences>

## 🔴 Block
- ...

## 🟡 Suggest
- ...

## 🟢 Polish
- ...
```

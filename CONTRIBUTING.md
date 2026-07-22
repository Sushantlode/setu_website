# Contributing to SETU Website

> React/Vite web app — parity with `setuReactNative`, VLE portal, and proxied SETU microservices.

## Branching

| Branch | Purpose |
|--------|---------|
| `main` | Production |
| `staging` | Staging / pre-production |
| `feat/<description>` | New features |
| `fix/<description>` | Bug fixes |
| `chore/<description>` | Tooling, deps, config |

## Commit Messages (Conventional Commits)

Format: `<type>(<scope>): <description>`

```
feat(vle): add wallet page with Razorpay deposit flow
fix(auth): resolve invalid VLE token on dashboard boot
refactor(layout): extract VleLayout from dashboard pages
chore(deps): upgrade react-router-dom
```

**Types:** `feat` `fix` `chore` `docs` `style` `refactor` `test` `perf` `ci` `build` `revert`

The **commit-msg** Husky hook rejects non-conforming messages. Use the **commit-rabbit** Cursor skill (`.cursor/skills/commit-rabbit/`) to draft messages.

**Common scopes:** `vle`, `auth`, `wallet`, `app`, `login`, `reports`, `vite`, `proxy`, `ui`, `deps`

## Pre-commit Checks

The `pre-commit` hook runs `lint-staged`:

- **oxlint** on staged `.js` / `.jsx` files

Run manually:

```bash
npm run lint
npm run build
```

## Code Review

Follow the **code-review** skill (`.cursor/skills/code-review/`):

- No scope creep beyond the ticket
- Auth and API clients use `src/config/api.js` — no hardcoded hosts
- `npm run build` passes before merge

## Local Development

```bash
cp .env.example .env
npm install
npm run dev          # Vite :5173
npm run dev:all      # Vite + contact API
```

Point auth at local SETU-AUTH when needed:

```env
VITE_PROXY_AUTH_HOST=http://localhost:7005
```

## Do Not Commit

- `.env` with real secrets
- `node_modules/`, `dist/` (unless release process requires it)
- Credentials in Postman environments

## Cursor Rules & Skills

| Path | Purpose |
|------|---------|
| `.cursor/rules/pre-commit-standards.mdc` | Lint + commit format |
| `.cursor/rules/project-context.mdc` | Website architecture |
| `.cursor/rules/setu-website-standards.mdc` | Scope discipline |
| `.cursor/skills/commit-rabbit/` | Draft commit messages |
| `.cursor/skills/code-review/` | PR review checklist |

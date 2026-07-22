---
name: commit-rabbit
description: Draft Conventional Commit messages for setu_website. Use when the user asks to commit, write a commit message, prepare a PR title, or before running git commit. Fast, consistent messages aligned with Husky commit-msg hook.
---

# Commit Rabbit 🐰

Quick, consistent Conventional Commit messages for **setu_website**. The Husky `commit-msg` hook rejects anything that does not match the pattern below.

## Format

```
<type>(<scope>): <description>
```

- **description:** 1–100 chars, imperative mood, no trailing period
- **scope:** lowercase, hyphenated, optional but preferred

## Valid types

| Type | When |
|------|------|
| `feat` | New user-facing feature or route |
| `fix` | Bug fix |
| `refactor` | Code change, no behaviour change |
| `perf` | Performance improvement |
| `style` | Formatting, Tailwind-only tweaks |
| `test` | Tests |
| `docs` | README, CONTRIBUTING, comments in docs |
| `chore` | Tooling, deps, config |
| `ci` | GitHub Actions, deploy scripts |
| `build` | Vite/build config |
| `revert` | Revert a prior commit |

## Website scopes (pick the closest)

`vle`, `auth`, `wallet`, `login`, `app`, `reports`, `sos`, `mental`, `booktest`, `coordinator`, `register`, `vite`, `proxy`, `ui`, `layout`, `deps`, `api`

## Examples

```
feat(vle): add app-style navbar to VLE portal layout
fix(wallet): mark cancelled Razorpay deposits on checkout dismiss
fix(auth): auto-refresh expired VLE token on dashboard load
feat(vle): add leaderboard page with top-3 podium
refactor(api): centralize vleAuthFetch token refresh
chore(deps): add husky and lint-staged for pre-commit
docs(contributing): add Conventional Commits guide
perf(app): lazy-load heavy module routes
```

## Workflow

1. Run `git diff` / `git status` — understand **what** changed and **why**
2. Pick **one primary type** (split into multiple commits if unrelated changes)
3. Draft message; verify against regex:

   `^(feat|fix|chore|docs|style|refactor|test|perf|ci|build|revert)(\([a-z0-9-]+\))?(!)?: .{1,100}`

4. Pass to user or `git commit -m "..."`

## Do not

- Use vague messages: `fix stuff`, `updates`, `WIP`
- Combine unrelated areas: `feat(vle): wallet and login and reports`
- Exceed 100 characters in the description
- Commit secrets (`.env`, keys, Postman env with credentials)

## Multi-file / large change

Prefer one commit per logical unit:

```
feat(vle): add VleLayout with sticky nav and mobile bottom tabs
feat(vle): wire wallet deposit confirm and transaction list
fix(vle): sync pending wallet status from Razorpay on load
```

# SETU Website — agent notes

Persistent Cursor rules live in [`.cursor/rules/`](.cursor/rules/).

## Goals

- Bring **app module parity** (Generic Medicine, Reports, SOS, Mental Health, Book Tests, Telemedicine) without rebuilding marketing stubs.
- Keep diffs small, match React Native flows/APIs, and avoid speculative features.

## Always

1. Check `setuReactNative` for the source screen + API before coding.
2. Follow `.cursor/rules/setu-website-standards.mdc`.
3. Run `npm run build` after module/route/API changes.
4. Ask before committing if the user did not explicitly request a commit.

## Never

- Expand scope into unrelated backend repos unless asked.
- Paste secrets into rules or commits.
- Use broken auth refresh paths (only `/auth/refreshToken`).

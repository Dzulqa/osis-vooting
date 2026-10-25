# fe-suara: Biggest Gaps

Audit of the current state of the project (Next.js 16 frontend, E-Voting OSIS SMK Al-Amanah).

## TL;DR

The project is a **frontend demo**. All data (queue, booths, votes, voted list, accounts, sessions) lives in the browser's `localStorage` (`lib/votingStorage.js`). It cannot run a real election: there is no backend, no real authentication, and no landing/countdown page.

## Biggest gap: no backend and no database

| Problem | Impact |
| --- | --- |
| Data is in `localStorage` | Registration, caller and booth devices cannot see each other. Sync only works between tabs of one browser. |
| Votes stored in the browser | Lost when the cache is cleared, and anyone can edit them in DevTools. |
| Double-vote check is a list in the browser | Can be bypassed or reset. |
| Candidates, DPT and committee are hardcoded or local | `data/candidates.js` and `data/students.js` are in source code. |

**Needed**
- Database (MySQL/Postgres) with tables: academic year, candidates, voters (DPT), committee users, queue, booths, votes, event config. All tied to the academic year.
- API endpoints for all of the above (Next.js route handlers or a separate service).
- Cross-device real-time updates (polling, SSE or WebSocket) replacing the `osis-storage-update` event.
- Vote + "has voted" flag saved in one transaction. Store votes without voter identity to keep the ballot secret.

## Second: no real authentication

- Passwords are plain text in `localStorage`; defaults `admin123` / `ketua123` (`lib/votingStorage.js:18-31`).
- The session is in `localStorage`, so it can be forged from the console.
- Only `superadmin` and `ketua` can log in. Registrator, caller and saksi accounts exist as data but cannot log in.
- `/caller`, `/registration`, `/results` and `/rekap` have no `AuthGuard`. Anyone with the URL can open them.
- Booth pages (`/` and `/booth/[id]`) are open to anyone.

**Needed:** hashed passwords, server-side sessions (httpOnly cookie or JWT), per-role middleware, login rate limiting, booth-to-device binding.

## Third: no landing page, no countdown

- `app/page.js` just renders booth 1.
- The countdown page described in `docs/arsitektur_dan_fitur_evoting.md` (section 2) is not implemented. It must be enforced server-side, not just hidden in the UI.
- Missing: landing page (event info, schedule, candidate profiles, instructions), 404, "event closed", "already voted" pages.
- `app/layout.js` still says "Create Next App" with `lang="en"`. The README is the default Next.js text.

## Security issues (fix first)

1. **Private SSH key committed.** `bamzky707@gmail.com` (private key) and `bamzky707@gmail.com.pub` are tracked in git (history: `c8b0835`). Treat the key as compromised: remove it from the VPS/GitHub, generate a new one, delete the files, purge history if the repo was shared. `gcm-diagnose.log` is also tracked.
2. **Hardcoded API credentials.** `app/api/school/voters/route.js:3-5` has real fallback API key/secret for `sinar.smkalamanah.sch.id`. Rotate them and fail when env vars are missing.

## Missing features (from the project's own doc)

- DPT import from Excel/CSV (only a school-API fetch and hardcoded data exist).
- Candidate photo upload and file storage.
- Academic-year history archive.
- Live count for saksi only, with a UUID vote log.
- Audit log of who did what.

## Production readiness

- No tests and no staging environment.
- `ecosystem.config.js`: PM2 cluster with `instances: 'max'`. The in-memory cache in the voters route is per worker, so workers will disagree.
- `nginx.conf`: HTTPS is commented out, and the commented block points to port 3000 instead of 3008.
- `.github/workflows/deploy.yml`: does not provide `.env` to the server and has no DB migration step.

## Suggested order

1. Rotate SSH key and API secrets; remove them from the repo.
2. Pick the stack (separate backend such as Express + Prisma + MySQL like `be-finance`, or Next.js route handlers + Prisma).
3. Design schema and auth, then migrate `votingStorage.js` to API calls: queue, booths, votes, config.
4. Add landing page and server-enforced countdown.
5. Add DPT import, harden production (HTTPS, env, backups), run a dry-run election.

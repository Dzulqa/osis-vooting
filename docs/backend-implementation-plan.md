# fe-suara Backend Implementation Plan (Next.js + MySQL/Docker)

## 0. Context

`fe-suara` (E-Voting OSIS SMK Al-Amanah) is a Next.js 16 / React 19 frontend demo. Every piece of state (queue, booths, votes, voted list, committee, event config, accounts, sessions) is in `localStorage` through `lib/votingStorage.js` (~50 exported functions, 793 lines). Consequences: devices cannot share state, votes can be edited in DevTools, passwords are plain text (`admin123` / `ketua123`), most pages have no guard, and there is no landing/countdown page.

**Decision (agreed with user):** a separate voting backend, implemented **inside the same Next.js app** (App Router route handlers + a server-side service layer) with **its own MySQL database**. E-raport (`eraport-alamanah`) stays the read-only source of master data (years, students, teachers) through its existing `/api/service/master/*` API. DPT is imported as a **frozen snapshot** per election. No voting logic or tables go into e-raport.

**Outcome:** a secure, multi-device, auditable election system that can run one real OSIS election and be reused each academic year.

Local dev DB: MySQL 8 in Docker. The Next.js app runs on the host with `npm run dev`.

---

## 1. Goals / Non-goals

**Goals**
- Real persistence and multi-device sync (registrator, caller, booths, ketua, saksi).
- Server-enforced rules: one vote per voter, event window, role permissions, results lock.
- Ballot secrecy (votes unlinked from voters) + audit trail.
- Everything scoped to an academic-year Election; history archive.
- Landing page + server-enforced countdown.
- Reproducible local env (Docker), automated tests incl. concurrency, deploy pipeline, runbook.

**Non-goals (v1)**
- No separate microservice, no Redis/queue, no WebSocket server (SSE is enough).
- No voter self-service voting from personal phones (voting happens only on paired booth devices).
- No changes to `eraport-alamanah` except registering an API client with the needed scopes.
- Blank/abstain ballot is NOT in the current UI; out of scope unless requested.

---

## 2. Decisions & assumptions (change before dev starts if wrong)

| # | Decision | Default chosen | Why |
|---|---|---|---|
| D1 | ORM | **Prisma 6** + MySQL 8.4 | Same as `be-finance`; migrations; transactions. |
| D2 | Language | Keep **JavaScript** (jsconfig, JSDoc on service fns), Zod for runtime validation | Avoid rewriting 5.6k lines of UI; TS can come later. |
| D3 | Staff auth | Own `User` table, **argon2id** hashes, opaque session token in httpOnly cookie, hashed in DB | Revocable, no JWT pitfalls, works across PM2 workers. |
| D4 | Booth auth | **Device pairing**: superadmin issues a one-time pairing code per booth; device gets a long-lived httpOnly booth cookie | Prevents a student opening `/booth/1` on their own phone. |
| D5 | Realtime | **SSE** (`/api/events`) driven by an `Election.revision` counter, polling fallback | Simple, DB is source of truth, works with PM2 cluster. |
| D6 | Results visibility | Only after Ketua "reveal"; visible to logged-in Saksi/Ketua/Superadmin; public page behind flag `publicResults` (default off) | Doc says Saksi; current UI text says "Saksi & Publik" -> make explicit flag. |
| D7 | Teachers vote | Yes (existing UI has Guru tab), weight 1 | Keep existing behaviour. |
| D8 | In-flight sessions at close time | Allowed to finish within `graceMinutes` (default 5) | Avoid cutting off a student mid-vote. |
| D9 | Timezone | Store UTC, display/input **Asia/Jakarta (WIB)** explicitly | Existing `new Date(datetime-local)` depends on browser TZ. |
| D10 | Ballot time | Ballot stores only an **hour bucket**, no booth id | Small volumes make exact time/booth correlatable with queue order. |
| D11 | Rehearsal | Election has `kind: REHEARSAL \| REAL`; reset allowed only for REHEARSAL (or REAL with 0 ballots) | Replaces the dangerous client-side "System Override". |
| D12 | Deploy DB | MySQL installed on the VPS (not Docker) unless user prefers Docker there | Open question Q2. |

Open questions (non-blocking, defaults above apply): Q1 public results? Q2 VPS DB: native MySQL or Docker? Q3 purge the leaked SSH key from git history (rewrite) or just rotate + delete? Q4 blank-vote option wanted?

---

## 3. Architecture

```
Browser (booth / registrator / caller / ketua / saksi / public)
   | httpOnly cookie (staff session or booth token) + SSE
   v
Next.js 16  (PM2, behind nginx)
 |- app/**/page.js        UI (server components do auth check, client components render)
 |- app/api/**/route.js   thin handlers: auth -> validate (zod) -> service -> envelope
 |- lib/server/services/* business rules + transactions   <- all logic lives here
 |- lib/server/eraport/*  read-only client for e-raport service API (import only)
 v                         v
MySQL 8.4 (Prisma)        e-raport /api/service/master/* (years, students, teachers)
```

API envelope (workspace convention): `{ status: 'success'|'error', message, data, meta? }`; errors add `code` (e.g. `EVENT_CLOSED`, `ALREADY_VOTED`, `BOOTH_BUSY`, `FORBIDDEN`).

Next 16 note: the old `middleware.js` is now `proxy.js`. Use it only for coarse redirects (cookie present?). **Real authorization is always re-checked in route handlers / server components** (`requireRole()`), never only in proxy.

---

## 4. Local environment (Docker MySQL)

### 4.1 Files to add
- `docker-compose.yml`
- `.env.example` (committed), `.env` (git-ignored, already covered by `.env*`)
- `.dockerignore` (only needed if the app image is added later)
- `scripts/db-reset.sh` (drop + migrate + seed for local)

### 4.2 `docker-compose.yml` (dev DB only)
```yaml
services:
  mysql:
    image: mysql:8.4
    container_name: suara-mysql
    restart: unless-stopped
    command: >
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_unicode_ci
      --default-time-zone=+00:00
      --max_connections=100
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-rootpass}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-suara}
      MYSQL_USER: ${MYSQL_USER:-suara}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:-suara}
    ports:
      - "127.0.0.1:3307:3306"   # 3307 avoids clashing with a local MySQL; bound to localhost only
    volumes:
      - suara_mysql_data:/var/lib/mysql
      - ./docker/mysql-init:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "127.0.0.1", "-uroot", "-p${MYSQL_ROOT_PASSWORD:-rootpass}"]
      interval: 5s
      timeout: 5s
      retries: 20
  adminer:               # optional DB browser, dev only
    image: adminer
    profiles: ["tools"]
    ports: ["127.0.0.1:8081:8080"]
    depends_on: [mysql]
volumes:
  suara_mysql_data:
```
Notes: Prisma `migrate dev` needs a **shadow database** -> the app user needs CREATE/DROP on `suara_shadow`; grant it via an init SQL file (`docker/mysql-init/01-grants.sql`: `CREATE DATABASE IF NOT EXISTS suara_shadow; CREATE DATABASE IF NOT EXISTS suara_test; GRANT ALL ON \`suara%\`.* TO 'suara'@'%';`) or use root in `DATABASE_URL` for local only.

### 4.3 `.env.example`
```
# Database (local docker)
DATABASE_URL="mysql://suara:suara@127.0.0.1:3307/suara?connection_limit=5"
SHADOW_DATABASE_URL="mysql://root:rootpass@127.0.0.1:3307/suara_shadow"
TEST_DATABASE_URL="mysql://root:rootpass@127.0.0.1:3307/suara_test"
# E-raport service API (server-side only, NEVER NEXT_PUBLIC_)
SCHOOL_API_URL="https://sinar.smkalamanah.sch.id/api/service"
SCHOOL_API_KEY=""
SCHOOL_API_SECRET=""
# Auth
SESSION_TTL_HOURS=12
BOOTH_TOKEN_TTL_DAYS=3
AUTH_COOKIE_SECURE=false          # true in production
APP_ORIGIN="http://localhost:3000" # used for Origin/CSRF check
# First superadmin (seed). Seed refuses weak/default values when NODE_ENV=production
SEED_SUPERADMIN_USERNAME="superadmin"
SEED_SUPERADMIN_PASSWORD=""
# Uploads (candidate photos)
UPLOAD_DIR="./.uploads"
```
`lib/server/env.js` parses these with Zod at boot and **throws on missing required vars** (this also removes the hardcoded API-key fallbacks in `app/api/school/voters/route.js`).

### 4.4 npm scripts
`db:up` (docker compose up -d mysql --wait), `db:down`, `db:migrate` (prisma migrate dev), `db:deploy` (prisma migrate deploy), `db:seed`, `db:reset`, `db:studio`, `test`, `test:e2e`, `simulate`.

### 4.5 Dependencies
runtime: `@prisma/client`, `prisma` (**dependencies**, not dev: VPS runs `migrate deploy`), `zod`, `@node-rs/argon2`, `papaparse` (CSV), `sharp` (photo resize/validate). dev: `vitest`, `@playwright/test`, `dotenv-cli`.

---

## 5. Data model (Prisma, MySQL)

All tables are scoped by `electionId` (academic-year isolation). IDs: `BigInt autoincrement` for internal rows; `String @db.Char(36)` UUID for ballots.

### 5.1 Enums
`UserRole { SUPERADMIN KETUA REGISTRATOR CALLER SAKSI }`
`ElectionKind { REHEARSAL REAL }`
`ForceState { NONE OPEN CLOSED }`
`VoterType { STUDENT TEACHER }`
`SessionStatus { REGISTERED ASSIGNED ACTIVE VOTED CANCELLED }`
`ActorType { USER BOOTH SYSTEM }`

### 5.2 Models
- **User**: id, username (unique), passwordHash, name, role (global role for SUPERADMIN only), active, mustChangePassword, failedLoginCount, lockedUntil, lastLoginAt, createdAt, updatedAt.
- **ElectionMember**: electionId, userId, role (KETUA/REGISTRATOR/CALLER/SAKSI), unique(electionId,userId). Implements "committee accounts valid only for that academic year". Superadmin bypasses membership.
- **AuthSession**: id, userId, tokenHash (unique, sha-256), expiresAt, revokedAt, ip, userAgent, createdAt. Index(userId), index(expiresAt).
- **Election**: id, name, academicYearLabel ("2026/2027"), eraportYearId?, kind, scheduledStart?, scheduledEnd?, forceState (NONE/OPEN/CLOSED), graceMinutes (default 5), resultsRevealedAt?, resultsRevealedBy?, publicResults (bool), finalizedAt?, finalizedBy?, isCurrent (bool), ketua snapshot fields (ketuaName, ketuaNis, ketuaClass, ketuaTitle), revision (Int, bumped on every queue/booth/config change; drives SSE), createdBy, timestamps. Rule: at most one `isCurrent=true` (enforced in service in a transaction + unique index on a nullable column `currentFlag` = 1 or NULL).
- **Candidate**: id, electionId, number (int, unique per election), chairName, viceName, chairNis?, viceNis?, slogan, vision (Text), missions (Json string[]), programs (Json string[]), photoPath?, active, timestamps. unique(electionId, number). Edits locked once election has ever been OPEN (ballots exist).
- **Classroom** (snapshot of `GET /master/classrooms`): id, electionId, sourceId (= e-raport classroom id), name, level, yearId, yearName, studyLevel, studyMajor, competency, homeroomTeacher, homeroomTeacherEmail, active, studentCount, syncedAt. unique(electionId, sourceId). Feeds the class dropdown with counts.
- **Voter** (DPT snapshot, **field names mirror the sinar/e-raport API**): id, electionId, type, externalId (nis for students, code for teachers); student fields `nis, nisn, classroom (name), classroomId, level, year, yearId, competencyId, competencyName, graduated, isPondok`; teacher fields `code, lastStudy`; shared `name, gender, email, phone, active` (API value at sync time), `raw` (untouched API item as JSON so undocumented fields are never lost); our own `eligible` (bool), `source` ("ERAPORT" | "CSV" | "MANUAL"), syncedAt, timestamps. unique(electionId, type, externalId). Indexes (electionId, classroomId, name), (electionId, name).
- **VotingSession** (one row per voter per election = the whole queue->booth->voted state machine): id, electionId, voterId, status, queuedAt, queuedBy(userId), boothId?, assignedAt?, assignedBy?, activatedAt?, activatedBy(ActorType+id), votedAt?, cancelledAt?, cancelReason?, castKey (idempotency key for the vote request, unique per session), timestamps. **unique(electionId, voterId)** -> a voter can never have two sessions; re-queue after cancel reuses the row.
- **Booth**: id, electionId, number, label, active, currentSessionId? (**unique**: a session can be in only one booth), pairingCodeHash?, pairingExpiresAt?, deviceTokenHash?, pairedAt?, lastSeenAt?. unique(electionId, number). Booth display status is derived: no session -> WAITING, session ASSIGNED -> ASSIGNED, ACTIVE -> ACTIVE.
- **Ballot** (secret): id (UUID), electionId, candidateId, castHour (DateTime truncated to the hour). **No voterId, no sessionId, no boothId.** Index(electionId, candidateId).
- **AuditLog** (append-only): id, electionId?, actorType, actorId?, actorLabel, action (e.g. `VOTER_QUEUED`, `BOOTH_ASSIGNED`, `VOTE_CAST`, `EVENT_FORCED_CLOSED`, `RESULTS_REVEALED`, `DPT_APPLIED`, `LOGIN_FAILED`), entityType, entityId, metadata Json, ip, createdAt, prevHash?, hash? (hash chain added in phase 8). Never log the candidate chosen together with a voter/session id.

### 5.3 Secrecy design
`VotingSession.status=VOTED` proves *that* a voter voted; `Ballot` proves *what was cast*; nothing links them. Vote transaction writes both but stores no shared key. Audit `VOTE_CAST` records only the booth number and election, not candidate, and the ballot hour bucket blunts timing correlation.

---

## 6. State machines & core transactions (all in `lib/server/services/`)

### 6.1 Effective event state (computed server-side on every request — replaces the Ketua-browser `setInterval`)
```
if forceState == OPEN   -> OPEN
if forceState == CLOSED -> CLOSED
if finalizedAt          -> FINALIZED
if no schedule          -> CLOSED (election not yet opened)    // explicit: DRAFT
now < scheduledStart    -> NOT_STARTED (countdown)
now in [start, end)     -> OPEN
now >= end              -> CLOSED
```
`OPEN` accepts registration/assign/activate/vote. After `end`, ACTIVE sessions may still cast for `graceMinutes`; registration/assign are refused immediately. The existing page text "Event Ditutup" maps to CLOSED; countdown maps to NOT_STARTED.
Pure function `computeEventState(election, now)` — unit-tested exhaustively (boundaries, only start, only end, force flags, grace).

### 6.2 VotingSession transitions
```
(no row) --register--> REGISTERED --assign(booth)--> ASSIGNED --activate--> ACTIVE --vote--> VOTED
REGISTERED --cancel--> CANCELLED --register--> REGISTERED
ASSIGNED/ACTIVE --caller reset booth--> REGISTERED (booth freed, audited)
```
Every transition is a **conditional update** (`updateMany ... where status = <expected>`; require `count === 1`) inside `prisma.$transaction`, so concurrent requests cannot double-apply. `revision` is incremented in the same transaction.

1. **register** `{voterId}`: event OPEN; voter eligible; insert session (catch unique-violation P2002 -> `ALREADY_REGISTERED`/`ALREADY_VOTED`); if row exists in CANCELLED -> update to REGISTERED.
2. **cancel**: only from REGISTERED.
3. **assign** `{sessionId, boothId}`: tx: session REGISTERED->ASSIGNED(boothId); booth `updateMany where id & active & currentSessionId IS NULL` set currentSessionId (count must be 1) else rollback `BOOTH_BUSY`.
4. **activate** (booth device or caller): ASSIGNED->ACTIVE for the booth's current session.
5. **vote** `{candidateId, castKey}` from the paired booth: tx: load booth.currentSessionId; `updateMany session where id & status=ACTIVE -> VOTED, votedAt, castKey` (count 1) — if count 0 and session already VOTED with same `castKey` return the original success (idempotent retry); candidate must be active & in this election; insert Ballot; booth.currentSessionId = NULL; revision++. Event state must be OPEN or within grace.
6. **reset booth** (caller/superadmin): session ->REGISTERED, booth freed, audit with reason.

### 6.3 Results
`computeResults(electionId)`: totals via `groupBy candidateId` on Ballot; participation = count(sessions VOTED) / count(eligible voters). Leader = strict max, else `null` (tie), matching current `getVoteSummary`. Available only when `resultsRevealedAt != null`. Ketua can re-lock (audited). `finalize` (Ketua+Superadmin): requires state CLOSED; sets `finalizedAt`, locks all writes, stores a results snapshot JSON for the archive.

---

## 7. E-raport integration (import only)

`lib/server/eraport/client.js`
- `POST {SCHOOL_API_URL}/auth/token` with headers `X-API-Key` / `X-API-Secret` (credentials in **headers**, per spec). Cache token in memory until `expires_in - 60s`; on 401 re-auth once. Timeouts (10s) + 2 retries with backoff.
- `fetchYears()` -> `/master/years` (scope `master.years`), `fetchStudents({yearId})` -> `/master/students?year_id=&per_page=1000&page=N` looping `meta.last_page` (scope `master.students`), `fetchTeachers()` -> `/master/teachers?active=1` (scope `master.teachers`).
- Mapping is a near copy because our columns use the API's names: students (`active in (1,true,"1") && !graduated`) -> `{type:STUDENT, externalId:nis, nis, nisn, name, gender, classroom, classroomId, level, year, yearId, competencyId, competencyName, graduated, isPondok, active, raw}`; teachers (`active`) -> `{type:TEACHER, externalId:code, code, name, lastStudy, email, phone, gender, active, raw}`; the "Guru" label and "name, last_study" display string are produced at read time, not stored. Classrooms from `/master/classrooms?year_id=` -> `Classroom` rows. Add scope `master.classrooms` to the e-raport API client.
- Endpoints without documented fields (`/master/years`, `/master/competencies`, `/master/teachers` beyond the spec) are consumed defensively: store the whole item in `raw` and only read the fields listed in `eraport-alamanah/docs/external_api_spec.md`.
- **Required e-raport action (admin UI, no code):** register/confirm an API client for fe-suara with scopes `master.years`, `master.students`, `master.teachers` (and `master.classrooms` if a class list is needed), optionally an **Allowed IPs** entry for the VPS. **Rotate the currently leaked key/secret** and put new ones only in server env.

`DPT sync flow` (Superadmin, election must be DRAFT/SCHEDULED, not yet OPEN):
1. `POST /api/admin/voters/sync/preview` -> fetches, diffs against current snapshot, returns counts: added / removed / changed / unchanged + samples. **Nothing written.**
2. `POST /api/admin/voters/sync/apply` -> upsert in a transaction; voters removed upstream become `eligible=false` (never hard-delete if they have a session). Audit `DPT_APPLIED` with counts.
3. After OPEN the snapshot is frozen; only `POST /api/admin/voters` (manual add) / `PATCH .../eligible` are allowed, each requires a reason and is audited.
4. CSV/Excel fallback: `POST /api/admin/voters/import-csv` (multipart, papaparse, header validation, per-row error report, max 5k rows). Excel (.xlsx) optional later.
- If e-raport is down the election continues unaffected (snapshot is local). Sync errors are shown to the admin, never block voting.

---

## 8. Authentication & authorization

- **Login** `POST /api/auth/login {username,password}`: argon2id verify; constant-time-ish responses; on failure increment `failedLoginCount`, lock 15 min after 5 failures; audit `LOGIN_FAILED`/`LOGIN_OK`. On success create `AuthSession` with random 32-byte token; cookie `suara_session` (httpOnly, SameSite=Lax, Secure in prod, path `/`, Max-Age = TTL); DB stores sha-256 of token. `mustChangePassword` forces `/account/password` before anything else.
- **Guards** (`lib/server/auth/guard.js`): `requireSession()`, `requireRole(roles, {electionId})` (Superadmin always passes; others need `ElectionMember`), `requireBooth()` (booth cookie). Used in every route handler and server page; the client `AuthGuard` component becomes display-only.
- **Role matrix**

| Area | Public | Booth device | Registrator | Caller | Saksi | Ketua | Superadmin |
|---|---|---|---|---|---|---|---|
| Landing/countdown/candidate profiles | R | | | | | | |
| Booth state/activate/vote | | X | | | | | |
| Voter list + queue register/cancel | | | X | R | | R | X |
| Caller board, assign, activate, reset booth | | | | X | | R | X |
| Live count / results (after reveal) | flag | | | | R | R | R |
| Event schedule, force open/close, reveal, finalize | | | | | | X | X |
| Election, committee, booths, candidates, DPT, history, audit | | | | | | R(audit) | X |

- **CSRF**: cookie is SameSite=Lax + all mutating routes require `Origin` equal to `APP_ORIGIN` (or same-host) and `Content-Type: application/json`.
- **Booth pairing**: Superadmin clicks "Generate pairing code" on a booth (6-8 chars, 10 min expiry, stored hashed). Device opens `/booth` -> enters code -> `POST /api/booth/pair` -> sets `suara_booth` cookie (random token, hash stored on Booth). Superadmin can revoke (clears hash). Booth routes use this cookie, not the URL id.
- **Passwords**: min 10 chars for staff; superadmin can reset (generates temp password, `mustChangePassword`). No plaintext anywhere; delete `getAuthCreds/saveAuthCreds` and the credentials forms in `app/superadmin/page.js`.

---

## 9. API surface (all under `app/api/`, envelope response, Zod-validated)

**Public**: `GET /api/public/election` (name, year, effective state, schedule, `serverTime`, results-published flag), `GET /api/public/candidates`, `GET /api/health` (DB ping).
**Auth**: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/change-password`.
**Booth**: `POST /api/booth/pair`, `GET /api/booth/state`, `POST /api/booth/activate`, `POST /api/booth/vote`.
**Registration**: `GET /api/voters?type=&class=&q=&page=&perPage=` (server-side search, paginated, includes per-voter status), `GET /api/registration/queue`, `POST /api/registration/queue`, `DELETE /api/registration/queue/[sessionId]`.
**Caller**: `GET /api/caller/board`, `POST /api/caller/assign`, `POST /api/caller/activate`, `POST /api/caller/booths/[id]/reset`.
**Ketua**: `GET /api/ketua/overview`, `PUT /api/ketua/schedule`, `POST /api/ketua/state` ({force: OPEN|CLOSED|NONE}), `POST /api/ketua/results/reveal`, `POST /api/ketua/results/lock`, `POST /api/ketua/finalize`.
**Results**: `GET /api/results` (per candidate, participation, optional `?candidateId=` ballot-id log, hour-bucketed), `GET /api/results/export.csv`.
**Admin (Superadmin)**: elections (`GET/POST /api/admin/elections`, `PATCH /api/admin/elections/[id]`, `POST .../clone-from/[prevId]`, `POST .../set-current`), committee (`/api/admin/users` CRUD, `POST .../[id]/reset-password`, member assignment), booths (`/api/admin/booths` CRUD, `POST .../[id]/pairing-code`, `DELETE .../[id]/pairing`), candidates (`/api/admin/candidates` CRUD, `POST .../[id]/photo`), DPT (`/api/admin/voters/sync/{preview,apply}`, `/import-csv`, manual add/eligibility), rehearsal reset (`POST /api/admin/elections/[id]/reset` rehearsal-only), history (`GET /api/admin/history`), audit (`GET /api/admin/audit?...`).
**Realtime**: `GET /api/events` (SSE; emits `{revision, state}` when `Election.revision` changes; heartbeat every 15s; closes after 10 min and client reconnects).
**Media**: `GET /api/media/candidates/[file]` serves uploads from `UPLOAD_DIR` (outside the deployed folder so deploys don't wipe photos; validated filename, cache headers).

Handler wrapper `lib/server/http.js`: `handler({auth, schema, run})` -> parses JSON, validates, checks Origin, maps `AppError(code,status)` and unexpected errors to the envelope, never leaks stack traces or SQL.

---

## 10. Code structure

```
prisma/schema.prisma  prisma/migrations/  prisma/seed.js
lib/server/db.js              prisma singleton (globalThis in dev)
lib/server/env.js             zod env, fail-fast
lib/server/http.js            handler wrapper, envelope, AppError
lib/server/auth/{password,session,guard,booth}.js
lib/server/eraport/{client,mapper}.js
lib/server/services/{election,eventState,voters,dpt,votingSession,vote,results,candidates,booths,users,audit,uploads}.js
lib/server/validation/*.js    zod schemas per route
lib/client/api.js             fetch wrapper (envelope-aware, 401 -> /login)
lib/client/useLive.js         SSE hook + polling fallback + serverTime offset
lib/client/format.js          WIB date helpers
app/(public)/page.js          landing / countdown / closed (state driven)
app/(public)/candidates/...   profile pages
app/login, app/account/password
app/booth (pair), app/booth/run
app/registration, app/caller, app/ketua, app/results (+/rekap alias), app/superadmin (+/history, /audit)
tests/{unit,integration,e2e}
scripts/{db-reset.sh,simulate-election.mjs,backup.sh}
docker-compose.yml  docker/mysql-init/
```
Server-only modules import `server-only` to prevent bundling into client code.

### 10.1 Migration map: `lib/votingStorage.js` -> backend
| Old function(s) | New |
|---|---|
| `getQueue/addToQueue/removeFromQueue/saveQueue` | `GET/POST/DELETE /api/registration/queue` (+ `votingSession.register/cancel`) |
| `getBooths/saveBooths/addBooth/removeBooth` | `GET /api/caller/board`, `/api/admin/booths` |
| `assignStudentToBooth/activateBooth/resetBooth` | `/api/caller/assign`, `/activate`, `/booths/[id]/reset`, `/api/booth/activate` |
| `getVotedStudents/hasStudentVoted/markStudentAsVoted/saveVote` | session status VOTED + `POST /api/booth/vote` (one transaction) |
| `getVotes/getVotesByCandidate/getVoteSummary` | `GET /api/results` |
| `getEventConfig/saveEventConfig/setEventStatus/setEventSchedule/checkAndApplySchedule/toggleResultRevealed` | `computeEventState` + `/api/ketua/*`, `/api/public/election` |
| `resetVotingSimulation` | rehearsal-only `POST /api/admin/elections/[id]/reset` |
| `getAcademicYear/saveAcademicYear`, `getKetuaOsisIdentity/save…` | Election fields via `/api/admin/elections` |
| `getCommitteeList/add/remove` | `/api/admin/users` + ElectionMember |
| `getCandidatesList/add/remove/save` | `/api/admin/candidates`, `/api/public/candidates` |
| `getStudentsList/getTeachersList/save…/importDptFromData` | Voter table, DPT sync/import endpoints |
| `getAuthCreds/saveAuthCreds/getAuthSession/loginUser/logoutUser` | `/api/auth/*` + server sessions |
| `subscribeVotingStorage`, `notifyUpdate` | `useLive()` over SSE |
| `data/candidates.js`, `data/students.js` | moved into `prisma/seed.js` (dev only), then deleted |

Remove: `app/api/school/voters/route.js` (replaced by admin DPT sync), `components/AuthGuard.jsx` logic (becomes display only), hardcoded default creds.

---

## 11. Frontend work (per page)

- **Landing `/`**: server component reads effective state. NOT_STARTED -> countdown (uses `serverTime` offset, WIB label, auto-refresh at 0); OPEN -> info + instructions (no booth link for public); CLOSED -> "pemilihan ditutup"; results published (flag) -> link. Candidate profiles section (photo, vision, mission, programs). Staff (logged in) see role shortcuts. Fix metadata (`title`, `lang="id"`), favicon, OG tags. Footer kept.
- **`/booth`** pair screen, **`/booth/run`**: states WAITING / ASSIGNED / ACTIVE / SUCCESS / CLOSED / OFFLINE from `GET /api/booth/state` + SSE. Vote button disabled while submitting; `castKey` generated once per attempt; on network failure retry with same key; success screen 3s then back to waiting. Kiosk touches: request fullscreen, block back navigation/context menu, wake-lock to prevent tablet sleep, clear voter name from DOM after vote, "connection lost" banner.
- **`/registration`**: server-side search & class filter (replace in-browser 1000-row filtering), student/guru tabs, disabled buttons with reason (already queued / in booth / voted / event closed), undo from queue, count badges, sync button removed (DPT is frozen; Superadmin-only).
- **`/caller`**: queue ordered by `queuedAt`, booth cards with elapsed time per session (highlight > N min), assign, activate, reset-stuck-booth with reason modal.
- **`/ketua`**: schedule in WIB, force open/close/clear, reveal/lock results, live turnout (voted/eligible, queue length, booths), finalize with typed confirmation.
- **`/results`**: locked screen until reveal; per-candidate bars, participation, hour-bucket ballot log (UUID), export CSV, print-friendly "Berita Acara" view.
- **`/superadmin`**: tabs Overview, Election/Year (+clone previous), Ketua identity, Committee (accounts, roles, reset password), Booths (add/remove, pairing code, revoke), Candidates (CRUD + photo upload with preview), DPT (sync preview/apply, CSV import, manual add, counts), Rehearsal reset, History, Audit log. Remove credentials-in-localStorage forms.
- **`/login`**: server-validated, redirect param whitelist (relative paths only), lockout message, forced password change.
- Shared: `Navbar` shows role-aware links from `/api/auth/me`; loading/error/empty states everywhere; WIB date formatting helper; Indonesian copy kept.

---

## 12. Security & hardening checklist

- [ ] **Rotate and remove the committed SSH private key** (`bamzky707@gmail.com`, `.pub` in repo root, commit `c8b0835`): delete from VPS `authorized_keys` and GitHub, generate a new deploy key, `git rm`, add to `.gitignore`; decide history rewrite (Q3). Also `git rm gcm-diagnose.log`.
- [ ] **Rotate e-raport API key/secret** (hardcoded in `app/api/school/voters/route.js:3-5`), set only in server env.
- [ ] No `NEXT_PUBLIC_` secrets; `server-only` imports; zod env validation.
- [ ] Security headers in `next.config.mjs`: CSP (self + fonts used), `X-Frame-Options: DENY`, `Referrer-Policy`, `X-Content-Type-Options`, `Permissions-Policy`; HSTS via nginx.
- [ ] Origin check on mutations; cookies httpOnly/Secure/SameSite; session rotation on login; logout revokes DB row.
- [ ] Login lockout + nginx `limit_req` on `/api/auth/login` and `/api/booth/pair`.
- [ ] Upload hardening: magic-byte check (png/jpg/webp), 2 MB cap, re-encode via `sharp`, random filenames, never trust client name.
- [ ] Prisma only (no raw SQL with interpolation); pagination caps; error messages generic.
- [ ] Audit log append-only (no update/delete in code; DB user for app has no DELETE on `AuditLog` if feasible), hash chain `hash = sha256(prevHash + row)` + verify script.
- [ ] Ballot secrecy review: grep to prove no code path writes voter/session/booth ids together with a candidate.
- [ ] Backups + restore test; secrets not logged; `console.error` never prints request bodies/passwords.

---

## 13. Edge cases to handle explicitly

Double-click / retried vote (idempotent `castKey`); two registrators queue the same voter at once (unique constraint); two callers assign to the same booth (conditional update); booth device refresh mid-session (state is server-side); tablet loses network at submit (retry, show pending, never double count); event closes while a session is ACTIVE (grace window); schedule edited while OPEN; Ketua force-closes then clears override; voter is both in queue and removed upstream (eligible=false blocks assign); NIS collision between student and teacher (scoped by `type`); booth removed while occupied (blocked); candidate edited after first ballot (blocked); single candidate / zero votes / tie (leader null); server restart or PM2 reload mid-request (transactions atomic); DB unavailable (friendly 503 + `/api/health`); e-raport unavailable (sync error only); clock skew between devices (use `serverTime` offset); large DPT (pagination + indexes); photo path missing (placeholder); duplicate usernames; deleting a user who has audit rows (soft-deactivate only).

---

## 14. Testing strategy

- **Unit (Vitest)**: `computeEventState` (all boundaries/force/grace), result tally + tie, CSV parser, eraport mapper, password/session helpers, role matrix.
- **Integration (Vitest + real MySQL `suara_test`)**: each service against the DB with `prisma migrate reset` per suite. Critical **concurrency tests** with `Promise.all`: N parallel `register` same voter -> 1 success; parallel `assign` to one booth -> 1 success; parallel `vote` same session -> exactly 1 ballot; idempotent retry returns same result; vote refused when CLOSED / outside grace; voter cannot be queued after VOTED; ballot rows contain no linkable ids (schema assertion).
- **API tests**: route handlers with fake session/booth cookies; role matrix 403s; envelope shape; Origin check.
- **E2E (Playwright)**: multi-context scenario — superadmin sets up rehearsal election (seeded), registrator queues, caller assigns, booth votes, ketua closes & reveals, saksi sees tally; plus landing countdown and locked results.
- **Rehearsal simulator** `scripts/simulate-election.mjs`: seeds ~300 voters, runs 5 virtual booths concurrently over HTTP, asserts totals equal votes cast and no duplicate votes; reports p95 latency.
- CI: lint + unit + integration (MySQL service container in GitHub Actions) before build/deploy.

---

## 15. Deployment changes (VPS)

- `.github/workflows/deploy.yml`: add MySQL service for tests; run `npm run lint && npm test`; tarball must now include `prisma/` and `package.json`; on VPS run `npm ci --omit=dev`, `npx prisma generate`, `npx prisma migrate deploy` **before** `pm2 reload`; add smoke test `curl -f http://127.0.0.1:3008/api/health`.
- `.env` lives on the VPS only (`/home/deploy/apps/fe-suara/.env` or shared dir); never in the tarball.
- `ecosystem.config.js`: `instances: 2` (not `'max'`) and Prisma `connection_limit=5` so total connections stay well under MySQL's limit; `kill_timeout`/`wait_ready` for graceful reload; uploads dir outside the release dir (`/home/deploy/data/suara/uploads`).
- `nginx.conf`: enable HTTPS (certbot), redirect 80->443, HSTS, `limit_req_zone` for login/pair, `/api/events` location with `proxy_buffering off; proxy_read_timeout 1h;`, `client_max_body_size 5m`, fix the commented block's port (3008).
- DB on VPS: dedicated MySQL user with least privilege, utf8mb4, `bind-address=127.0.0.1`, nightly `mysqldump` (cron) + manual dump immediately before opening and after closing; keep 14 days; restore rehearsal documented in the runbook.
- Rollback: keep previous release tarball; migrations are forward-only so every migration must be backward-compatible with the previous app version during the election week (no destructive migrations after DPT freeze). **Change freeze** 24h before the event.

---

## 16. Implementation phases & acceptance criteria

| Phase | Work | Done when |
|---|---|---|
| **0 Hygiene & security** | Rotate SSH key + e-raport secrets; `git rm` key files and `gcm-diagnose.log`; remove hardcoded creds; `.env.example`; rewrite README; fix layout metadata | Repo has no secrets; app still builds |
| **1 Local infra** | `docker-compose.yml`, init SQL, `.env.example`, Prisma init, full schema + first migration, seed script, `/api/health`, npm scripts | `npm run db:up && npm run db:migrate && npm run db:seed` works from a clean clone; `/api/health` OK |
| **2 Server foundations** | `env.js`, `db.js`, `http.js`, `audit`, password/session/guard, login/logout/me/change-password, `proxy.js` redirects | Login works; wrong role gets 403; lockout works; sessions revocable |
| **3 Election & public** | election service, `computeEventState`, public endpoints, landing/countdown/closed pages, SSE endpoint + `useLive` | Countdown driven by server time; state flips without Ketua browser open |
| **4 DPT** | e-raport client, sync preview/apply, CSV import, manual add, voters list API | Snapshot imported with correct counts; frozen after OPEN |
| **5 Admin master data** | Superadmin UI on API: election/year, ketua identity, committee, booths + pairing, candidates + photo upload, history | No `votingStorage` use left in superadmin page |
| **6 Voting flow** | registration, caller, booth pairing/run, vote tx, reset booth, live updates | Full flow works across 3 devices/browsers; concurrency tests green |
| **7 Ketua & results** | schedule/force/reveal/lock/finalize, results page, CSV export, print view | Results hidden until reveal; finalize locks writes |
| **8 Hardening** | CSRF/Origin, rate limits, headers, upload checks, audit hash chain + verify script, secrecy review | Checklist in section 12 all ticked |
| **9 Testing** | unit + integration + e2e + simulator, CI wired | CI green; simulator shows 0 discrepancies |
| **10 Deploy** | workflow, PM2, nginx HTTPS/SSE, VPS MySQL, backups, runbook | Staging deploy passes smoke test; restore tested |
| **11 Rehearsal & go-live** | rehearsal election with committee; fix findings; real election checklist (D-7, D-1, D-day, after) | Sign-off from Pembina OSIS |
| **12 Cleanup** | delete `lib/votingStorage.js`, `data/*.js`, old API route, dead code; update docs (`docs/arsitektur_dan_fitur_evoting.md`, README, CLAUDE.md) | No `localStorage` data paths remain (only UI preferences) |

Phases 0-2 are prerequisites; 3-5 can overlap; 6 depends on 4-5; 7 depends on 6.

---

## 17. Runbook outline (to write in `docs/runbook.md`)

Setup new academic year (clone election, import DPT, add candidates/booths/committee, pair booths); D-1 checklist (backup, smoke test, devices paired, fullscreen, charger/wifi, printed fallback list); D-day (open, monitor turnout, handle stuck booth, close, reveal, finalize, print berita acara); incident playbooks (network down at a booth, DB down, wrong candidate data, voter claims already voted, forgot password); after (backup, archive, rotate passwords, remove pairing).

---

## 18. Critical files (existing) touched

- `lib/votingStorage.js` (replace & delete), `data/candidates.js`, `data/students.js` (-> seed, delete)
- `app/api/school/voters/route.js` (replace; contains leaked creds at lines 3-5)
- `app/{page,layout,login,registration,caller,ketua,results,rekap,superadmin}/*`, `app/booth/[id]/page.js`
- `components/{AuthGuard,Navbar,VotingBooth,CandidateCard,CandidateDetail,VoteModal,VoteSuccess,BoothWaiting,Footer}.jsx`
- `next.config.mjs` (headers), `package.json` (deps/scripts), `ecosystem.config.js`, `nginx.conf`, `.github/workflows/deploy.yml`, `.gitignore`, `README.md`, `docs/arsitektur_dan_fitur_evoting.md`
- Reuse: mapping/filter logic in `app/api/school/voters/route.js` (student/teacher mapping, class sort with `localeCompare numeric`), UI components and Tailwind styling as-is, e-raport API contract in `eraport-alamanah/docs/external_api_spec.md`.

---

## 19. Verification (end-to-end)

1. `npm run db:up` -> MySQL healthy; `npm run db:reset` -> schema + seed OK; `curl localhost:3000/api/health` -> `{status:'success'}`.
2. `npm test` -> unit + integration (incl. concurrency) green against `suara_test`.
3. Manual local flow with 4 browser profiles: superadmin (setup + pair booth), registrator, caller, booth, ketua, saksi: queue -> assign -> activate -> vote; verify DB: one `VotingSession.VOTED`, one `Ballot` with no voter link, audit rows present, queue/booth screens update live without refresh.
4. Negative checks: vote while CLOSED -> `EVENT_CLOSED`; second vote same voter -> `ALREADY_VOTED`; direct `/caller` without login -> redirect; wrong role -> 403; open `/booth/run` without pairing -> pair screen; results before reveal -> 403/locked.
5. `npm run simulate` -> totals match, 0 duplicates.
6. Playwright e2e passes in CI.
7. Staging deploy: migrate deploy runs, `/api/health` smoke test passes, SSE works through nginx, HTTPS only, backup + restore verified.

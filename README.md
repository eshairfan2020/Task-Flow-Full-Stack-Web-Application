# TaskFlow

A full-stack task/team management app built to demonstrate every topic on your roadmap in real, working code not just isolated snippets. React + Node/Express + MySQL + Redis + JWT auth.

Two things to read together:
1. **This README** — the topic-by-topic map below tells you exactly which file to open for each concept.

---

## Quick start

### 1. Backend
```bash
cd backend
cp .env.example .env        # then edit DB/Redis credentials
npm install
mysql -u root -p < src/db/schema.sql   # creates the `taskflow` database + tables
npm run dev                 # http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

### 3. Optional: standalone concept demos (no DB/Redis needed)
```bash
cd backend
node src/utils/asyncPatternsDemo.js   # promises, async/await, event loop, etc.
node src/workers/reportWorker.js      # Worker Threads
node src/workers/forkSpawnDemo.js     # child_process fork() vs spawn()
```
I ran all three of these myself while building this and pasted real output into the comments — they're not hypothetical.

---

## Topic map

### JavaScript
| Topic | Where |
|---|---|
| var / let / const | `backend/src/utils/asyncPatternsDemo.js` → `scopingDemo()` |
| Data Types | same file → `dataTypesDemo()` |
| Functions / Callbacks | same file → `callbackDemo()` |
| Promises | same file → `fakeApiCall()`, `promiseChainDemo()` |
| then / catch / finally | `promiseChainDemo()` |
| Async / Await | `asyncAwaitDemo()`, and everywhere in the backend controllers |
| Promise.all | `promiseCombinatorsDemo()` |
| Promise.allSettled | `promiseCombinatorsDemo()` |
| Promise.race | `promiseCombinatorsDemo()` |
| Sequential vs Concurrent | `sequentialDemo()` vs `concurrentDemo()` (timed, ~200ms vs ~100ms) |
| Event Loop | `eventLoopDemo()` |
| Microtasks / Macrotasks | `eventLoopDemo()` — logs the actual execution order |
| API Calls | `frontend/src/api/client.js` (`apiFetch`) |

### React
| Topic | Where |
|---|---|
| Components | every file in `frontend/src/components/` and `pages/` |
| JSX | all `.jsx` files |
| Props | `TaskCard.jsx`, `TaskForm.jsx`, `ProtectedRoute.jsx` |
| State | `useState` calls in `Login.jsx`, `Dashboard.jsx`, `TaskForm.jsx` |
| Hooks | see below |
| useState | `Dashboard.jsx`, `TaskForm.jsx` |
| useEffect | `Dashboard.jsx` (load teams/tasks), `AuthContext.jsx` (restore session), `useFetch.js` |
| useMemo | `Dashboard.jsx` → `columns` (grouping tasks by status) |
| useCallback | `Dashboard.jsx` → `loadTasks`, `handleCardClick`; `AuthContext.jsx` → `login`/`register`/`logout` |
| Context API | `context/AuthContext.jsx` |
| Prop Drilling | explained in a comment at the top of `AuthContext.jsx` — Context is the fix |
| Virtual DOM | `main.jsx` comment on `createRoot`; `TaskCard.jsx` uses `React.memo` to reduce re-diffing |

### Node.js
| Topic | Where |
|---|---|
| Node.js / V8 / Event Loop | `backend/src/utils/asyncPatternsDemo.js` |
| EventEmitter | `backend/src/utils/eventEmitter.js` (task/user lifecycle events) |
| Process / Thread | comments in `reportWorker.js` |
| Worker Threads | `backend/src/workers/reportWorker.js` — real, runnable, timed |
| Fork / Spawn | `backend/src/workers/forkSpawnDemo.js` + `forkChild.js` |
| PM2 | `backend/ecosystem.config.js` |
| Streams | `backend/src/controllers/fileController.js` → `exportTasksCsv` (writes CSV row-by-row) and `downloadAttachment` (`fs.createReadStream` + `.pipe`) |
| fs | `fileController.js`, `config/multer.js` |
| Environment Variables | `backend/.env.example`, loaded via `dotenv` in `server.js` |

### Express
| Topic | Where |
|---|---|
| Express.js | `backend/server.js` |
| Routes | `backend/src/routes/*.js` |
| req / res | every controller in `backend/src/controllers/` |
| next() | every controller (`next(err)`), `middleware/errorHandler.js` |
| Middleware | `helmet`, `cors`, `express.json`, `apiLimiter` — all wired in `server.js` |
| Error Middleware | `middleware/errorHandler.js` (4-arg signature) |
| Controllers | `backend/src/controllers/` |
| Business Logic | inside controllers, backed by `models/` |
| MVC | Models = `models/`, Views = the React frontend, Controllers = `controllers/` |
| REST API | `routes/taskRoutes.js` — `/teams/:teamId/tasks`, `/tasks/:taskId` |
| CRUD | `models/taskModel.js` (create/get/update/delete) |
| HTTP Methods | GET/POST/PATCH/DELETE used consistently by resource in `taskRoutes.js` |
| Status Codes | 200/201/204/400/401/403/404/409/500 — see `errorHandler.js` and each controller |

### Authentication
| Topic | Where |
|---|---|
| Authentication | `middleware/auth.js` → `authenticate()` |
| Authorization | `middleware/auth.js` → `authorize(...roles)` |
| JWT | `utils/jwt.js` |
| JWT Decode / Verify | `jwt.js` — `verifyAccessToken` vs `decodeToken`, with a comment on why decode-only is unsafe for auth |
| Bearer Token | `middleware/auth.js` reads `Authorization: Bearer <token>` |
| Access Token | short-lived, `JWT_ACCESS_EXPIRES` |
| Refresh Token | long-lived, hashed + stored in `refresh_tokens` table, rotated in `authController.refresh` |
| RBAC | `role` column on `users`, enforced via `authorize('admin')` on the delete-task route |
| Sessions | noted in code comments as the stateful alternative to JWTs; this app uses stateless JWTs + a DB-backed refresh token instead |

### Security
| Topic | Where |
|---|---|
| Hashing | `utils/hash.js` (bcrypt, one-way) |
| Encryption | explained vs hashing in a comment in `hash.js` (not used for passwords — two-way, needs a key) |
| bcrypt | `utils/hash.js` |
| CORS | `server.js` (`cors({ origin: CLIENT_ORIGIN })`) |
| CSRF | see "Next steps" below — this app uses Bearer tokens in a header (not cookies), which sidesteps classic CSRF; noted where relevant |
| XSS | `middleware/validate.js` → `sanitizeBody` (the `xss` package) |
| SQL Injection | every query in `models/` uses `?` parameterized placeholders — see the comment at the top of `userModel.js` |
| Helmet | `server.js` |
| Rate Limiting | `middleware/rateLimiter.js` — general + a strict login limiter |
| Brute Force | the strict `loginLimiter` (5 attempts / 10 min) exists specifically for this |
| OWASP Top 10 | see "Next steps" — most items are addressed piecemeal above; full checklist linked below |

### MySQL
| Topic | Where |
|---|---|
| Tables / Primary Key / Foreign Key / Candidate Key / Composite Key | `backend/src/db/schema.sql` — every constraint is commented |
| Normalization / 1NF / 2NF / 3NF / Partial & Transitive Dependency | comments directly above each table in `schema.sql` |
| Indexes | `idx_tasks_team_status`, `idx_tasks_assignee`, `idx_comments_task` in `schema.sql` |
| ERD | see `docs/erd.md` (text description) — draw it in your tool of choice from the FK relationships in `schema.sql` |
| Relationships | 1-to-many (users→tasks), many-to-many (users↔teams via `team_members`) |
| JOINs | `models/taskModel.js`, `models/teamModel.js` |
| WHERE / GROUP BY / HAVING / ORDER BY | `models/taskModel.js` → `listTasksForTeam`, `overloadedMembers` |
| CAP Theorem | see "Next steps" — conceptual, doesn't map to a single file in a single-node MySQL setup |

### Advanced Backend
| Topic | Where |
|---|---|
| Redis / Caching | `config/redis.js`, `utils/cache.js` (cache-aside pattern), used in `taskController.listTasks` |
| RabbitMQ / Kafka / Message Queue / Event Streaming | see "Next steps" below |
| Webhooks | see "Next steps" below |
| Storage Buckets | `server.js` comment on `/uploads` — noted where you'd swap to S3/GCS |
| Multer | `config/multer.js`, `controllers/fileController.js` |
| ORM / ODM | this project deliberately uses raw SQL (`mysql2`) so the JOIN/GROUP BY/normalization topics stay visible — see "Next steps" for the ORM equivalent |
| Microservices / Monolith / Tight vs Loose Coupling / Decoupling | see "Next steps" below — this app is intentionally a monolith; `eventEmitter.js` shows the in-process seam where you'd cut it into services |

---

## Next steps (topics that need infrastructure this environment can't run)

These need a real server/cluster to actually exercise, so rather than fake them, here's what each one is and where you'd plug it in:

- **RabbitMQ / Kafka / Message Queues / Event Streaming** — `utils/eventEmitter.js` already isolates "something happened" (`task:created`) from "what happens next." In a real deployment you'd replace the in-process `.emit()` with `channel.publish()` (RabbitMQ) or `producer.send()` (Kafka) so other *services* — not just other code in the same process — can react. Start here: [RabbitMQ tutorials](https://www.rabbitmq.com/tutorials), [Kafka introduction](https://kafka.apache.org/intro).
- **Webhooks** — same seam as above, but the "other side" is an external URL you `POST` to (e.g. notify a Slack channel when a task is marked done). Start here: [webhooks.fyi](https://webhooks.fyi/).
- **Microservices vs Monolith / Tight vs Loose Coupling / Decoupling** — this app is one monolith on purpose (simpler to run and study). Splitting `auth`, `tasks`, and `teams` into separately deployable services — each with its own DB — is the natural next exercise once you're comfortable with this codebase. Start here: [microservices.io](https://microservices.io/).
- **CAP Theorem** — a distributed-systems tradeoff (Consistency vs Availability under a network Partition) that only becomes concrete once you have multiple database nodes; a single local MySQL instance can't demonstrate it. Start here: [Julia Evans' CAP theorem explainer](https://jvns.ca/) or the original Brewer's conjecture writeups.
- **ORM/ODM (e.g. Prisma, Sequelize, Mongoose)** — this project uses raw SQL intentionally so you keep seeing the JOIN/GROUP BY/normalization concepts directly. Once those are solid, try re-implementing `models/taskModel.js` with [Prisma](https://www.prisma.io/docs) to see what an ORM abstracts away.
- **OWASP Top 10 (full list)** — this app covers several items directly (injection, auth, XSS) but not all ten. Full reference: [owasp.org/Top10](https://owasp.org/www-project-top-ten/).
- **CSRF** — this app avoids the classic cookie-based CSRF vector by sending the JWT in an `Authorization` header instead of a cookie. If you switch to cookie-based sessions, you'll need CSRF tokens — see [OWASP's CSRF prevention cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
- **Storage Buckets (S3/GCS)** — `/uploads` currently writes to local disk via Multer. Swapping `multer.diskStorage` for `multer-s3` (or a GCS equivalent) is a small, well-documented change once you have a cloud account to test against.

---

## Project structure

```
taskflow/
├── backend/
│   ├── server.js                  # Express app entry point
│   ├── ecosystem.config.js        # PM2 cluster config
│   ├── .env.example
│   └── src/
│       ├── config/                # db.js, redis.js, multer.js
│       ├── db/schema.sql          # MySQL schema + normalization notes
│       ├── middleware/            # auth, error handling, rate limiting, validation
│       ├── models/                # raw SQL, parameterized queries
│       ├── controllers/           # business logic (MVC "C")
│       ├── routes/                # REST endpoints
│       ├── utils/                 # jwt, hash, eventEmitter, cache, async demo
│       └── workers/               # worker_threads + fork/spawn demos
└── frontend/
    └── src/
        ├── api/client.js          # fetch wrapper + token refresh
        ├── context/AuthContext.jsx
        ├── hooks/useFetch.js
        ├── components/            # Navbar, TaskCard, TaskForm, ProtectedRoute
        └── pages/                 # Login, Register, Dashboard
```

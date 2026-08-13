## Topics Covered

**JavaScript**
var / let / const · Data Types · Functions · Callbacks · Promises · then / catch / finally · Async / Await · Promise.all · Promise.allSettled · Promise.race · Sequential · Concurrent / Parallel · Event Loop · Microtasks / Macrotasks · API Calls

**React**
Components · JSX · Props · State · Hooks · useState · useEffect · useMemo · useCallback · Context API · Prop Drilling · Virtual DOM

**Node.js**
Node.js · V8 · Event Loop · EventEmitter · Process / Thread · Worker Threads · Fork / Spawn · PM2 · Streams · fs · Environment Variables

**Express**
Express.js · Routes · req / res · next() · Middleware · Error Middleware · Controllers · Business Logic · MVC · REST API · CRUD · HTTP Methods · Status Codes

**Authentication**
Authentication · Authorization · JWT · JWT Decode / Verify · Bearer Token · Access Token · Refresh Token · RBAC · Sessions

**Security**
Hashing · Encryption · bcrypt · CORS · XSS · SQL Injection · Helmet · Rate Limiting · Brute Force

**MySQL**
Tables · Primary Key · Foreign Key · Composite Key · Normalization (1NF / 2NF / 3NF) · Indexes · ERD · Relationships · JOINs · WHERE · GROUP BY · HAVING · ORDER BY

**Advanced Backend**
Redis · Caching · Webhooks · Storage Buckets · Multer · ORM / ODM · Microservices · Monolith · Tight / Loose Coupling · Decoupling

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

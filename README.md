# SQL Detective Game

A detective-style SQL puzzle. Players read a case, inspect a small SQLite database
schema, write queries, and submit the answer. The PHP API owns identity, sessions,
time, hints, answers and scoring.

The project is split into two independent folders:

- `frontend/` — a multi-page static site: one HTML, one CSS and one JS file per page.
- `backend/` — a PHP 8 front controller plus MySQL, served by XAMPP/Apache.

There is no React, no Vite, and no npm build step. Open the HTML pages directly through
Apache; each page imports only its own CSS/JS and the shared API client.

## Stack

| Layer      | Choice                                                              |
| ---------- | ------------------------------------------------------------------- |
| Web server | Apache 2.4 (XAMPP) with `mod_rewrite`                               |
| Frontend   | HTML, CSS, JavaScript (ES modules), one folder per page             |
| Backend    | PHP 8.2, no framework, front controller (`backend/index.php`)        |
| Database   | MariaDB / MySQL (`sql_detective`), accessed with PDO                 |
| Case files | SQLite databases kept in `backend/storage/case-files/`               |
| Browser DB | sql.js in a Web Worker, 3 s query budget, 500-row cap                |

## Folder layout

```text
SQL-Detective-Game2/
├── frontend/
│   ├── index.html                 redirects to pages/home/home.html
│   ├── pages/
│   │   ├── home/                  home.html, home.css, home.js
│   │   ├── login/                 login.html, login.css, login.js
│   │   ├── register/              register.html, register.css, register.js
│   │   ├── cases/                 cases.html, cases.css, cases.js
│   │   ├── case-detail/           case-detail.html, case-detail.css, case-detail.js
│   │   ├── leaderboard/           leaderboard.html, leaderboard.css, leaderboard.js
│   │   ├── me/                    me.html, me.css, me.js
│   │   └── admin/                 admin.html, admin.css, admin.js
│   ├── shared/
│   │   ├── api.js                 backend probe and fetch wrapper
│   │   └── demo-data.js           sample cases, leaderboard, profile, admin stats
│   ├── vendor/                    sql-wasm.js, sql-wasm.wasm
│   └── workers/                   sql.worker.js
├── backend/
│   ├── index.php                  headers, CORS, session, routing
│   ├── .htaccess                  routes /api requests to index.php
│   ├── .env                       local configuration and secrets
│   ├── src/                       helpers, domain, routes, router
│   ├── scripts/                   migrate.php, import.php
│   ├── database/                  schema.sql, site-data.json
│   └── storage/                   case-files/, ratelimit/, tmp/
├── IDEA.md
├── README.md
└── TASK.md
```

## Requirements

- XAMPP at `/opt/lampp` (Apache, PHP 8.2+, MariaDB/MySQL)
- PHP extensions: `pdo_mysql`, `sqlite3`, `mbstring`, `intl`, `json`, `openssl`
- `sqlite3` CLI for the admin sandbox (`/usr/bin/sqlite3`)

## Quick start

1. Start XAMPP:

   ```bash
   sudo /opt/lampp/lampp start
   ```

2. Create the database and tables:

   ```bash
   /opt/lampp/bin/php backend/scripts/migrate.php
   ```

3. Import the starter data:

   ```bash
   /opt/lampp/bin/php backend/scripts/import.php
   ```

4. Open the game:

   - Entry: `http://localhost/SQL-Detective-Game2/frontend/index.html`
   - Home: `http://localhost/SQL-Detective-Game2/frontend/pages/home/home.html`
   - API health: `http://localhost/SQL-Detective-Game2/backend/api/health`

The admin email and password are read from `backend/.env` (`ADMIN_EMAIL`,
`ADMIN_PASSWORD`) by the import script. To create a player account, use the register
page.

## Figure mode (frontend without the backend)

The frontend is designed to be reviewable before the backend is running. On load, each
page asks the shared API client to probe `/api/health` once:

- If the backend answers, the page calls the real API.
- If it does not answer, the page renders the sample data from `frontend/shared/demo-data.js`.

This means every page can be opened as a working figure without PHP or MySQL. The
sample data is presentation-only: **case files are never copied into the frontend**.
The SQLite files stay in `backend/storage/case-files/`.

In figure mode the SQL console shows the sample query result. Live query execution and
answer validation start working when the backend is connected.

## Live mode (frontend + backend)

- Login and register use the PHP session cookie.
- The case list loads `GET /api/cases`.
- The case workspace loads `GET /api/cases/:id`, then downloads the SQLite bytes from
  `GET /api/cases/:id/file` and runs queries in `frontend/workers/sql.worker.js`.
- Hints use `POST /api/cases/:id/hint`.
- Answers use `POST /api/cases/:id/answer`.
- The profile uses `GET /api/me`.
- The leaderboard uses `GET /api/leaderboard`.
- The admin sandbox uses `GET /api/admin/stats` and `POST /api/admin/cases`.

## Configuration

`frontend/shared/api.js` derives the backend URL relative to itself:

```js
const API_BASE = new URL("../../backend/", import.meta.url);
```

That keeps the default XAMPP path working without configuration. If the frontend and
backend are deployed to unrelated hosts, change `API_BASE` in that one file.

## Notes

- No `.ts` or `.tsx` files: all frontend source is JavaScript (`.js`).
- No page imports another page's CSS or JS.
- `backend/.env` is gitignored. Never commit secrets.
- The admin sandbox uploads `.sqlite` or `.csv` case files; the backend validates them
  before storing them in `backend/storage/case-files/`.

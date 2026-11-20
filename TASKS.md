# TASK.md — SQL Detective Game delivery plan

## Project window

The project is built and pushed over one month.

| Phase             | Dates                    | Duration |
| ----------------- | ------------------------ | -------- |
| Frontend delivery | 2026-11-02 → 2026-11-15 | 2 weeks  |
| Backend delivery  | 2026-11-16 → 2026-11-29 | 2 weeks  |
| Final push        | 2026-11-30              | 1 day    |

## Team

| Member                | GitHub username              |
| --------------------- | ---------------------------- |
| Achraf Ounis          | @achraf-ounis                |
| Mohamed Redha Cherifi | @cherifi-Mohamed8            |
| Abdelkhalek Chetouane | @chetouaneabdelkhalek-source |
| Zakaria Mazouzi       | @zakaria-mazouzi0            |

## Rules

- One collaborator owns a page, one different collaborator reviews it.
- Every page has its own HTML, CSS and JS file in its own folder. No shared CSS between pages.
- Shared JavaScript is limited to the API client and the sample data used by the figure.
- The owner builds the frontend in the first two weeks and the backend in the last two weeks.
- The reviewer reviews each delivery and records the review date.
- Every operation (frontend push, backend push, review) has a due date.
- A page is done only when the frontend, backend, and review dates are all present.
- Stack: HTML, CSS, JavaScript for the frontend; PHP (XAMPP/Apache) for the backend; MySQL for the database.
- The frontend and backend stay in separate folders.
- The frontend figure must render with sample data when the backend is absent.
- Case files stay in `backend/storage/case-files/` and are never copied into `frontend/`.
- No React, no Vite build step, and no `.ts`/`.tsx` files.

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
│   ├── index.php                  API front controller
│   ├── src/                       routes and domain logic
│   ├── scripts/                   migrate.php, import.php
│   ├── database/                  schema.sql, site-data.json
│   └── storage/                   case files and runtime storage
├── IDEA.md
├── README.md
└── TASK.md
```

## Pages

Each row is one page with its own HTML, CSS and JS. The owner is the only person who edits that folder.

| Page           | Files                              | Collaborator                   | Reviewer                      | Frontend due | Backend due | Review due | Status      |
| -------------- | ---------------------------------- | ------------------------------ | ----------------------------- | ------------ | ----------- | ---------- | ----------- |
| Home           | `pages/home/`                      | @achraf-ounis                  | @cherifi-Mohamed8             | 2026-11-06   | 2026-11-20  | 2026-11-22 | Not started |
| Login          | `pages/login/`                     | @achraf-ounis                  | @cherifi-Mohamed8             | 2026-11-07   | 2026-11-21  | 2026-11-23 | Not started |
| Register       | `pages/register/`                  | @achraf-ounis                  | @cherifi-Mohamed8             | 2026-11-08   | 2026-11-22  | 2026-11-24 | Not started |
| Case list      | `pages/cases/`                     | @cherifi-Mohamed8              | @zakaria-mazouzi0             | 2026-11-09   | 2026-11-23  | 2026-11-25 | Not started |
| Case workspace | `pages/case-detail/`               | @cherifi-Mohamed8              | @zakaria-mazouzi0             | 2026-11-12   | 2026-11-26  | 2026-11-28 | Not started |
| Leaderboard    | `pages/leaderboard/`               | @zakaria-mazouzi0              | @chetouaneabdelkhalek-source  | 2026-11-10   | 2026-11-24  | 2026-11-26 | Not started |
| Profile        | `pages/me/`                        | @zakaria-mazouzi0              | @chetouaneabdelkhalek-source  | 2026-11-11   | 2026-11-25  | 2026-11-27 | Not started |
| Admin sandbox  | `pages/admin/`                     | @chetouaneabdelkhalek-source   | @achraf-ounis                 | 2026-11-14   | 2026-11-28  | 2026-11-29 | Not started |

## Shared files

| File                                | Collaborator                 | Reviewer                      |
| ----------------------------------- | ---------------------------- | ----------------------------- |
| `frontend/index.html`               | @achraf-ounis                | @cherifi-Mohamed8             |
| `frontend/shared/api.js`            | @zakaria-mazouzi0            | @chetouaneabdelkhalek-source  |
| `frontend/shared/demo-data.js`      | @zakaria-mazouzi0            | @chetouaneabdelkhalek-source  |
| `frontend/workers/sql.worker.js`    | @cherifi-Mohamed8            | @zakaria-mazouzi0             |
| `frontend/vendor/`                  | @cherifi-Mohamed8            | @zakaria-mazouzi0             |

## Completion contract

1. Owner pushes the page frontend and writes **frontend pushed <date>**.
2. Owner pushes the page backend and writes **backend pushed <date>**.
3. Reviewer checks both deliveries and writes **reviewed <date>**.
4. Only then the status becomes **Done**.

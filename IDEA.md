# Idea — SQL Detective Game

SQL Detective Game is a browser-based detective training ground where players investigate
crime scenarios by writing SQL queries against small, self-contained SQLite case files.
The PHP API handles identity, time, hints, scoring and access control, while the browser
runs the query engine in a web worker, so every player solves the same case with their own
engine and their own mistakes.

## Problem statement

Legal, financial and security investigations are becoming harder to practice in
traditional classrooms, where each student waits for the same fixed result and cannot
iterate on a query until the instructor approves it. Players need a setup where they can
type arbitrary SQL, receive fast feedback, and see exactly which fact their query missed —
without exposing the backend database directly. At the same time, the supporting service
mesh (identity, sessions, hints, scoring, admin sandbox) must run on a single, cheap,
self-contained host so that a student team can deploy it in one afternoon.

## Target users

1. Detective training students and instructors. They need repeatable, solvable SQL cases,
   instant feedback on their queries, and a clear map from a query to the fact it should
   return.
2. Solo developers and small teams who want a working, deployable web app with a clean
   separation between a static frontend and a stateful backend, and who need an admin
   workflow to add and test new cases without touching the database by hand.

## Services

- Apache 2.4 (XAMPP): the web server and static file host for the multi-page frontend.
- PHP 8.x (no framework): the backend front controller that dispatches `/api/...`
  endpoints, owns sessions, and enforces auth, CSRF and CORS.
- MariaDB / MySQL: the persistence layer for users, sessions, cases, attempts, hints,
  ratings and audits.
- sql.js (Web Worker): the in-browser SQLite engine that loads the case database and
  enforces a query-timeout and a row-count cap.
- Per-page CSS: each page ships its own stylesheet, so page owners can work independently.

## Profiles and privileges

- Guest: can register and sign in; can browse published cases and read the leaderboard;
  cannot submit answers, use hints or see personal progress.
- Player: can solve published cases, submit answers, request hints, view solved and
  in-progress cases, rate solved cases, and see their own profile and score.
- Admin: can create, test and publish new cases, edit or unpublish drafts, delete cases,
  test a solution query against the case file, and view the admin statistics and activity
  log.

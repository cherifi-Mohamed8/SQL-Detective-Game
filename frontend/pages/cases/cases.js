// Cases page: bureau mission board.
// Only admin sessions can see the Admin Sandbox nav link.
import { isAdmin } from "../../shared/auth.js";
import { isBackendOnline, API_BASE } from "../../shared/api.js";
import { demoCases } from "../../shared/demo-data.js";

const casesList = document.getElementById("cases-list");
const statusPill = document.getElementById("status-pill");
const errorEl = document.getElementById("error");
const modeNote = document.getElementById("mode-note");
const heroTotal = document.getElementById("hero-total");
const heroSolved = document.getElementById("hero-solved");
const heroProgress = document.getElementById("hero-progress");
const heroClearance = document.getElementById("hero-clearance");

const pills = new Set();
let activeDifficulty = "all";
let activeStatus = "all";

function setError(message) {
  errorEl.textContent = message;
}

function setStatusPill(text) {
  statusPill.textContent = text;
}

async function initConnection() {
  try {
    const online = await isBackendOnline();
    modeNote.dataset.mode = online ? "online" : "demo";
    if (online) {
      modeNote.textContent = "Live backend data · mission board";
      return true;
    } else {
      modeNote.textContent = "Demo data · mission board";
      return false;
    }
  } catch (error) {
    modeNote.dataset.mode = "demo";
    modeNote.textContent = "Demo data · mission board";
    return false;
  }
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}

function formatCaseRow(row, idx) {
  const title = escapeHtml(row.title);
  const difficulty = escapeHtml(row.difficulty || "unknown");
  const difficultyLabel = difficulty.toUpperCase();
  const statusText = row.solved ? "Solved & Verified" : "Under Investigation";
  const statusClass = row.solved ? "solved" : "active";

  return `
    <article class="case-file" data-id="${escapeHtml(row.id)}" data-difficulty="${escapeHtml(difficulty)}" data-status="${escapeHtml(row.solved ? "solved" : "in_progress")}">
      <header class="case-file-header">
        <span class="case-file-id">CASE #${escapeHtml(String(row.id).slice(0, 12))}</span>
        <span class="case-file-badge" data-difficulty="${escapeHtml(difficulty)}">
          <span class="material-symbols-outlined icon-14">${difficulty === "easy" ? "arrow_downward" : difficulty === "medium" ? "remove" : difficulty === "hard" ? "arrow_upward" : "help"}</span>
          ${difficultyLabel}
        </span>
        <span class="status-pill status-pill--${statusClass}">${statusText}</span>
      </header>
      <div class="case-file-meta">
        <span class="meta-label">Posted by</span>
        <span class="meta-value">${escapeHtml(row.author || "Bureau Admin")}</span>
      </div>
      <h3 class="case-file-title">${title}</h3>
      <div class="case-file-stats">
        <span class="case-stat">
          <span class="material-symbols-outlined icon-14">score</span>
          <span class="stat-value">${row.points ?? "—"} pts</span>
        </span>
        <span class="case-stat">
          <span class="material-symbols-outlined icon-14">query_builder</span>
          <span class="stat-value">${row.tables ?? "—"} tables</span>
        </span>
        <span class="case-stat">
          <span class="material-symbols-outlined icon-14">lightbulb_outline</span>
          <span class="stat-value">${row.hints ?? "—"} hints</span>
        </span>
      </div>
      <a class="btn btn-primary btn-small" href="../case-detail/case-detail.html?id=${encodeURIComponent(row.id)}">
        <span class="material-symbols-outlined icon-14">open_in_new</span>
        Open
      </a>
    </article>
  `;
}

function renderCases(rows) {
  if (!rows.length) {
    casesList.innerHTML = `<p class="empty">No dossiers in the repository yet.</p>`;
    setStatusPill("No cases in the bureau repository.");
    return;
  }

  const html = rows.map((row, idx) => formatCaseRow(row, idx)).join("");
  casesList.innerHTML = html;
  setStatusPill(`Showing ${rows.length} of ${rows.length} dossiers.`);
}

function getFilteredCases() {
  return demoCases.filter((row) => {
    if (activeDifficulty !== "all" && (row.difficulty || "").toLowerCase() !== activeDifficulty) {
      return false;
    }
    if (activeStatus === "solved" && !row.solved) {
      return false;
    }
    if (activeStatus === "in_progress" && row.solved) {
      return false;
    }
    if (activeStatus === "unopened" && row.solved) {
      return false;
    }
    return true;
  });
}

function updateHero() {
  const online = modeNote.dataset.mode === "online";
  const rows = online ? demoCases : demoCases;

  const total = rows.length;
  const solved = rows.filter((row) => row.solved).length;
  const progress = rows.filter((row) => !row.solved).length;

  heroTotal.textContent = String(total);
  heroSolved.textContent = String(solved);
  heroProgress.textContent = String(progress);
  heroClearance.textContent = online ? "Field Inspector" : "Field Inspector (demo)";
}

pills.add("all");
pills.add("easy");
pills.add("medium");
pills.add("hard");

document.querySelectorAll(".pill-btn[data-difficulty]").forEach((button) => {
  button.addEventListener("click", () => {
    activeDifficulty = button.dataset.difficulty;
    document.querySelectorAll(".pill-btn[data-difficulty]").forEach((b) =>
      b.classList.toggle("active", b.dataset.difficulty === activeDifficulty)
    );
    renderCases(getFilteredCases());
    updateHero();
  });
});

document.querySelectorAll(".pill-btn[data-status]").forEach((button) => {
  button.addEventListener("click", () => {
    activeStatus = button.dataset.status;
    document.querySelectorAll(".pill-btn[data-status]").forEach((b) =>
      b.classList.toggle("active", b.dataset.status === activeStatus)
    );
    renderCases(getFilteredCases());
    updateHero();
  });
});

async function init() {
  const online = await initConnection();

  if (online) {
    try {
      const response = await fetch(new URL("api/cases", API_BASE));
      if (response.ok) {
        const data = await response.json();
        demoCases = data.cases ?? demoCases;
        renderCases(getFilteredCases());
        updateHero();
        setStatusPill("Bureau record repository synced.");
        return;
      }
    } catch (error) {
      // Fall through to demo data.
    }
  }

  renderCases(getFilteredCases());
  updateHero();

  // Gate the Admin Sandbox nav link.
  const adminLink = document.querySelector('nav a[href="../admin/admin.html"][data-admin-only]');
  if (adminLink) {
    const admin = await isAdmin();
    adminLink.hidden = !admin;
  }
}

init();
setStatusPill("Accessing Bureau record repository…");

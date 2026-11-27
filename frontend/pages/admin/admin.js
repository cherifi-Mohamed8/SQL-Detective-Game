// Admin sandbox: bureau-only page.
// Behavior matches SQL-Detective-Game: admin routes are behind RequireLogin and
// only admin sessions see the forge / management / telemetry panels.
import { api, API_BASE, DemoModeError } from "../../shared/api.js";
import { demoAdminStats } from "../../shared/demo-data.js";
import { guardAdmin, AuthStateError } from "../../shared/auth.js";

const modeNote = document.getElementById("mode-note");
const adminError = document.getElementById("admin-error");
const adminMessage = document.getElementById("admin-message");

const managementList = document.getElementById("management-list");
const telemetryBody = document.getElementById("telemetry-body");

const managementFallback = document.getElementById("management-fallback");
const telemetryFallback = document.getElementById("telemetry-fallback");

const form = document.getElementById("create-case-form");
const submitLabel = document.getElementById("create-submit-label");

let live = false;
let stats = normalizeStats(demoAdminStats);

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}

function normalizeStats(data) {
  const cases = (data.cases || []).map((item) => ({
    id: item.id,
    title: item.title,
    difficulty: item.difficulty,
    status: item.status,
    playersCount: Number(item.playersCount ?? 0),
    solvedCount: Number(item.solvedCount ?? 0),
    completionRatePercent: Number(item.completionRatePercent ?? 0),
    avgSolveTimeMinutes: item.avgSolveTimeMinutes ?? null,
    avgHintsUsed: item.avgHintsUsed ?? null,
  }));

  const totals = data.totals
    ? {
        users: Number(data.totals.users ?? 0),
        cases: Number(data.totals.cases ?? cases.length),
      }
    : {
        users: Number(data.userCount ?? 0),
        cases: cases.length,
      };

  return { totals, cases };
}

function statusStamp(status) {
  const published = status === "published";
  return `<span class="dossier-stamp ${published ? "solved" : "in-progress"}">${escapeHtml(String(status || "draft").toUpperCase())}</span>`;
}

function formatMinutes(value) {
  return value === null || value === undefined ? "—" : `${Number(value).toFixed(1)}m`;
}

function formatHints(value) {
  return value === null || value === undefined ? "—" : Number(value).toFixed(1);
}

function actionButtons(rowId, rowTitle, extraClass) {
  const escapedId = escapeHtml(rowId);
  const escapedTitle = escapeHtml(rowTitle);

  const publishButton =
    rowId === "draft"
      ? `<button type="button" class="btn btn-primary ${extraClass}" data-action="publish" data-id="${escapedId}" title="Publish case to players">Publish</button>`
      : `<button type="button" class="btn btn-outline ${extraClass}" data-action="unpublish" data-id="${escapedId}" title="Return case to draft">Unpublish</button>`;

  return `<div class="table-actions">
      ${publishButton}
      <button type="button" class="btn btn-danger ${extraClass}" data-action="delete" data-id="${escapedId}" data-title="${escapedTitle}" title="Delete case permanently">Delete</button>
    </div>`;
}

function renderManagement() {
  if (stats.cases.length === 0) {
    managementList.innerHTML =
      '<p class="empty-note">No cases drafted yet. Author a case using the forge on the left.</p>';
    return;
  }

  managementList.innerHTML = stats.cases
    .map((row) => {
      const rowId = escapeHtml(row.id);
      const rowTitle = escapeHtml(row.title);
      const shortId = escapeHtml(String(row.id).slice(0, 12));
      const tierClass = escapeHtml(row.status === "published" ? "solved" : "in-progress");

      const publishBtn = row.status === "draft"
        ? `<button type="button" class="btn btn-primary btn-small" data-action="publish" data-id="${rowId}" title="Publish case to players">
              <span class="material-symbols-outlined icon-14">publish</span>
              Publish Case
            </button>`
        : `<button type="button" class="btn btn-outline btn-small" data-action="unpublish" data-id="${rowId}">Unpublish (Lock Edits)</button>`;

      const deleteBtn = `<button type="button" class="btn btn-danger btn-small" data-action="delete" data-id="${rowId}" data-title="${rowTitle}" title="Delete case permanently">
              <span class="material-symbols-outlined icon-14">delete</span>
              Delete
            </button>`;

      return `<div class="management-row">
        <div class="management-head">
          <div>
            <strong class="management-title">${rowTitle}</strong>
            <span class="management-meta">
              Tier: ${escapeHtml(String(row.difficulty || "—").toUpperCase())} • ID: ${shortId}…
            </span>
          </div>
          <span class="dossier-stamp ${tierClass}">${escapeHtml(String(row.status || "draft").toUpperCase())}</span>
        </div>
        <div class="management-actions">${publishBtn}${deleteBtn}</div>
      </div>`;
    })
    .join("");
}

function renderTelemetry() {
  if (stats.cases.length === 0) {
    telemetryBody.innerHTML =
      '<tr><td colspan="8" class="table-empty">No cases recorded yet.</td></tr>';
    return;
  }

  telemetryBody.innerHTML = stats.cases
    .map((row) => {
      const rowId = escapeHtml(row.id);
      const rowTitle = escapeHtml(row.title);
      const tierClass = escapeHtml(row.status === "published" ? "solved" : "in-progress");

      return `<tr>
        <td><strong>${rowTitle}</strong></td>
        <td><span class="dossier-stamp ${tierClass}">${escapeHtml(String(row.status || "draft").toUpperCase())}</span></td>
        <td class="cell-number">${row.playersCount}</td>
        <td class="cell-number cell-solved">${row.solvedCount}</td>
        <td class="cell-number cell-rate">${row.completionRatePercent.toFixed(0)}%</td>
        <td class="cell-number">${formatMinutes(row.avgSolveTimeMinutes)}</td>
        <td class="cell-number">${formatHints(row.avgHintsUsed)}</td>
        <td>${actionButtons(rowId, rowTitle, "btn-xs")}</td>
      </tr>`;
    })
    .join("");
}

function render() {
  document.getElementById("stat-agents").textContent = String(stats.totals.users);
  document.getElementById("stat-cases").textContent = String(stats.totals.cases);
  renderManagement();
  renderTelemetry();
}

function clearBanners() {
  adminError.textContent = "";
  adminMessage.textContent = "";
}

function showMessage(text) {
  adminMessage.textContent = text;
}

function showError(text) {
  adminError.textContent = text;
  adminError.hidden = false;
}

async function refreshStats() {
  const data = await api.get("/admin/stats").catch(() => null);
  if (data) stats = normalizeStats(data);
  render();
}

/* ==========================================================================
   ACTIONS
   ========================================================================== */

async function publishCase(caseId, nextStatus) {
  clearBanners();

  try {
    await api.patch(`/admin/cases/${encodeURIComponent(caseId)}`, { status: nextStatus });
    showMessage(`Case status updated to: ${nextStatus.toUpperCase()}`);
    await refreshStats();
  } catch (error) {
    showError(error.message || "Status update failed.");
  }
}

async function deleteCase(caseId, caseTitle) {
  clearBanners();

  if (
    !window.confirm(
      `Are you sure you want to delete case "${caseTitle}"? This cannot be undone.`,
    )
  ) {
    return;
  }

  try {
    await api.delete(`/admin/cases/${encodeURIComponent(caseId)}`);
    showMessage(`Case "${caseTitle}" deleted successfully.`);
    await refreshStats();
  } catch (error) {
    showError(error.message || "Failed to delete case.");
  }
}

function handleActionClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id, title } = button.dataset;

  if (action === "delete") {
    void deleteCase(id, title || "this case");
  } else {
    void publishCase(id, action === "publish" ? "published" : "draft");
  }
}

managementList.addEventListener("click", handleActionClick);
telemetryBody.addEventListener("click", handleActionClick);

/* ==========================================================================
   CASE FORGE
   ========================================================================== */

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearBanners();

  const formData = new FormData(form);
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    showError("Choose a .sqlite or .csv case file.");
    return;
  }

  const definition = {
    title: String(formData.get("title") || "").trim(),
    story: String(formData.get("story") || "").trim(),
    question: String(formData.get("question") || "").trim(),
    difficulty: String(formData.get("difficulty") || "easy"),
    answerType: String(formData.get("answerType") || "text"),
    acceptedAnswers: String(formData.get("acceptedAnswers") || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    hints: String(formData.get("hints") || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 3),
  };

  const payload = new FormData();
  payload.append("definition", JSON.stringify(definition));
  payload.append("file", file);

  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  submitLabel.textContent = "Uploading Evidence…";

  try {
    const response = await fetch(new URL("api/admin/cases", API_BASE), {
      method: "POST",
      credentials: "include",
      body: payload,
    });
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(body.error || `Upload failed (${response.status}).`);
    }

    showMessage(
      `Case created successfully: "${body.case?.title || definition.title}" (Status: Draft). You can now publish it to field investigators.`,
    );
    form.reset();
    await refreshStats();
  } catch (error) {
    showError(error.message || "Upload failed.");
  } finally {
    submitLabel.textContent = "Upload & Create Draft Dossier";
    button.disabled = false;
  }
});

/* ==========================================================================
   AUTH GATE
   ========================================================================== */

async function init() {
  adminError.textContent = "";
  adminMessage.textContent = "";
  modeNote.textContent = "Loading authorization…";
  modeNote.dataset.mode = "checking";

  try {
    await guardAdmin();
    live = true;
    stats = normalizeStats(demoAdminStats);
    modeNote.textContent = "Live backend data · admin session required";
    modeNote.dataset.mode = "online";
    adminError.hidden = true;
    render();
  } catch (error) {
    live = false;
    stats = normalizeStats(demoAdminStats);
    modeNote.textContent = error instanceof AuthStateError
      ? "Bureau classification: admin clearance required."
      : "Admin session required · sample data";
    modeNote.dataset.mode = "demo";

    if (error instanceof AuthStateError) {
      adminError.textContent =
        "Bureau classification: this workspace is restricted to bureau admins. " +
        "Sign in as an admin to continue.";
    } else {
      adminError.textContent = error.message || "Authorization failed.";
    }

    document.querySelectorAll(".dossier-panel, .admin-grid, .results-card").forEach((el) => el.remove());

    if (managementFallback) managementFallback.hidden = false;
    if (telemetryFallback) telemetryFallback.hidden = false;
  }
}

init();

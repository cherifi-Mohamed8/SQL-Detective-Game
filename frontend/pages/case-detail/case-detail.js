// Case workspace: single case dossier with in-browser SQL sandbox.
import { api, API_BASE, DemoModeError, isBackendOnline } from "../../shared/api.js";
import { demoCases } from "../../shared/demo-data.js";
import { isAdmin } from "../../shared/auth.js";

const caseFileId = document.getElementById("case-file-id");
const caseTitle = document.getElementById("case-title");
const difficultyStamp = document.getElementById("difficulty-stamp");
const statusBadge = document.getElementById("status-badge");
const modeBadge = document.getElementById("mode-badge");
const hintCount = document.getElementById("hint-count");
const caseStory = document.getElementById("case-story");
const caseQuestion = document.getElementById("case-question");
const answerFormat = document.getElementById("answer-format");
const answerInput = document.getElementById("answer-input");
const answerFeedback = document.getElementById("answer-feedback");
const answerErrors = document.getElementById("answer-errors");
const hintButton = document.getElementById("hint-button");
const hintButtonLabel = document.getElementById("hint-button-label");
const hintsPanel = document.getElementById("hints-panel");
const historyEl = document.getElementById("history");
const timerEl = document.getElementById("timer");
const bonusEl = document.getElementById("bonus");
const runLabel = document.getElementById("run-label");
const queryInput = document.getElementById("query-input");
const runButton = document.getElementById("run-query");
const clearButton = document.getElementById("clear-query");
const resultsEl = document.getElementById("results");
const engineStatus = document.getElementById("engine-status");
const schemaViewer = document.getElementById("schema-viewer");
const schemaCount = document.getElementById("schema-count");
const queryMeta = document.getElementById("query-meta");

let currentCaseId = null;
let answersSubmitted = 0;
let hintsRevealed = 0;
const MAX_HINTS = 3;

function setModeText(mode) {
  modeBadge.textContent = `Figure mode (${mode})`;
  modeBadge.dataset.mode = mode;
}

function resetTelemetry(headline) {
  engineStatus.textContent = headline;
  resultsEl.innerHTML = "";
  schemaViewer.innerHTML = "";
  schemaCount.textContent = "0";
  queryMeta.textContent = "";
}

async function initConnection() {
  try {
    const online = await isBackendOnline();
    setModeText(online ? "online" : "offline");
    return online;
  } catch (error) {
    setModeText("offline");
    return false;
  }
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}

function formatDifficulty(difficulty) {
  return (difficulty || "unknown").toUpperCase();
}

function renderHint(index, text) {
  const wrapper = document.createElement("div");
  wrapper.className = "hint-row";
  wrapper.innerHTML = `
    <span class="hint-index">${index + 1}</span>
    <span class="hint-text">${escapeHtml(text)}</span>
  `;
  hintsPanel.appendChild(wrapper);
}

function renderHistory(entries) {
  if (!entries.length) {
    historyEl.innerHTML = `<p class="history-empty">No query history yet.</p>`;
    return;
  }

  historyEl.innerHTML = entries
    .map(
      (entry) => `
      <div class="history-row">
        <span class="history-time">${escapeHtml(entry.time)}</span>
        <span class="history-label">${escapeHtml(entry.label)}</span>
        <pre class="history-pre">${escapeHtml(entry.sql)}</pre>
        <pre class="history-pre">${escapeHtml(entry.result ?? "")}</pre>
      </div>
    `
    )
    .join("");
}

function updateHintButton() {
  const remaining = MAX_HINTS - hintsRevealed;
  hintButton.disabled = remaining === 0 || answersSubmitted > 0;
  hintButtonLabel.textContent = `Request Next Hint (${remaining} Available)`;
  hintCount.textContent = `${hintsRevealed}/${MAX_HINTS}`;
}

function applyCaseData(row) {
  caseFileId.textContent = `CASE #${escapeHtml(String(row.id).slice(0, 12))} // RESTRICTED CLASSIFICATION`;
  caseTitle.textContent = row.title;
  difficultyStamp.textContent = formatDifficulty(row.difficulty);
  difficultyStamp.className = `dossier-stamp ${row.difficulty || "not-started"}`;
  statusBadge.textContent = row.solved ? "Solved & Verified" : "Not started";
  statusBadge.className = `dossier-stamp ${row.solved ? "solved" : "in-progress"}`;
  caseStory.textContent = row.story;
  caseQuestion.textContent = row.question;
  answerFormat.textContent = (row.answerType || "text").toUpperCase();
  answerInput.setAttribute("type", row.answerType === "integer" || row.answerType === "decimal" ? "number" : "text");
  answerInput.value = "";
  answerFeedback.textContent = "";
  answerErrors.textContent = "";
  hintsRevealed = 0;
  hintsPanel.innerHTML = "";
  historyEl.innerHTML = "";
  updateHintButton();
}

function startTimer() {
  let seconds = 0;
  const bonusMinutes = 30;
  let bonusSeconds = bonusMinutes * 60;
  const tick = () => {
    seconds += 1;
    const elapsed = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    timerEl.textContent = elapsed;
    if (bonusSeconds > 0) {
      bonusSeconds -= 1;
      bonusEl.textContent = `${String(Math.floor(bonusSeconds / 60)).padStart(2, "0")}:${String(bonusSeconds % 60).padStart(2, "0")}`;
    }
    timerEl.setAttribute("aria-label", `Investigation time: ${elapsed}`);
    bonusEl.setAttribute("aria-label", `Bonus window remaining: ${bonusEl.textContent}`);
  };
  tick();
  return setInterval(tick, 1000);
}

async function gotoCaseDetail(id) {
  const row = demoCases.find((c) => c.id === id);
  if (!row) {
    resetTelemetry("Case not found in sample data.");
    caseFileId.textContent = `CASE #— // RESTRICTED CLASSIFICATION`;
    caseTitle.textContent = "Case not found";
    difficultyStamp.textContent = "—";
    statusBadge.textContent = "Unknown";
    statusBadge.className = "dossier-stamp not-started";
    caseStory.textContent = "The bureau could not locate this case in the sample data.";
    caseQuestion.textContent = "No question available.";
    answerFormat.textContent = "TEXT";
    return false;
  }

  currentCaseId = row.id;
  applyCaseData(row);
  return true;
}

async function loadCaseFromServer(id) {
  resetTelemetry("Preparing the case database…");
  try {
    const response = await fetch(new URL(`api/cases/${encodeURIComponent(id)}`, API_BASE));
    if (!response.ok) {
      resetTelemetry("Case not found.");
      return false;
    }

    const data = await response.json();
    const row = data.case ?? data;

    currentCaseId = row.id;
    applyCaseData(row);
    await renderCaseDatabase(row);
    return true;
  } catch (error) {
    resetTelemetry("Case database unavailable.");
    return false;
  }
}

async function renderCaseDatabase(row) {
  resetTelemetry("Preparing the case database…");

  try {
    const definition = buildCaseDefinition(row);
    const db = await loadDatabase(definition);

    schemaViewer.innerHTML = "";
    schemaCount.textContent = "0";

    const tables = db ? Object.keys(db) : [];
    schemaCount.textContent = String(tables.length);

    tables.forEach((table) => {
      const card = document.createElement("div");
      card.className = "schema-table";
      const columns = db[table] ? Object.keys(db[table][0] || {}).join(", ") : "";
      card.innerHTML = `
        <div class="schema-table-header">
          <span class="material-symbols-outlined icon-14">table</span>
          <code>${escapeHtml(table)}</code>
        </div>
        <div class="schema-columns">${escapeHtml(columns)}</div>
      `;
      schemaViewer.appendChild(card);
    });

    resetTelemetry("Database ready · 1 schema table loaded");
  } catch (error) {
    resetTelemetry("Case database unavailable.");
  }
}

function buildCaseDefinition(row) {
  const tables = (row.tables || []).map((t) => t.toLowerCase()).join(", ");
  return {
    title: row.title,
    story: row.story,
    question: row.question,
    difficulty: row.difficulty,
    tables: tables,
    hints: row.hints ?? [],
    answerType: row.answerType ?? "text",
    acceptedAnswers: row.acceptedAnswers ?? [row.answer],
  };
}

async function loadDatabase(definition) {
  try {
    const response = await fetch(
      new URL(`api/case-database?case=${encodeURIComponent(definition.title)}`, API_BASE),
    );
    if (response.ok) {
      const payload = await response.json();
      return payload.database ?? null;
    }
  } catch (error) {
    // fall back to in-browser.
  }

  try {
    const worker = await loadWorker();
    const db = await worker.run(definition);
    return db;
  } catch (error) {
    return null;
  }
}

async function loadWorker() {
  const url = new URL("../../workers/sql.worker.js", import.meta.url);
  const blob = await new Promise((resolve, reject) => {
    fetch(url.toString())
      .then((response) => response.blob())
      .then((blob) => resolve(blob))
      .catch(reject);
  });
  const blobUrl = URL.createObjectURL(blob);
  const worker = await new Promise((resolve, reject) => {
    const w = new Worker(blobUrl, { type: "blob" });
    w.onmessage = (event) => resolve(w);
    w.onerror = (error) => reject(error);
    w.postMessage({ type: "init" });
  });
  URL.revokeObjectURL(blobUrl);
  return worker;
}

async function executeQuery(sql) {
  resetTelemetry("Preparing the case database…");
  const startTime = performance.now();
  try {
    const worker = await loadWorker();
    const result = await worker.runQuery({ sql, caseTitle: currentCaseId });
    const elapsed = Math.round(performance.now() - startTime);

    if (!result.ok) {
      resultsEl.innerHTML = `
        <div class="results-error">
          <span class="material-symbols-outlined icon-16">error</span>
          <div>
            <strong>Query error</strong>
            <pre>${escapeHtml(result.error || "Unknown SQL error")}</pre>
          </div>
        </div>
      `;
      resetTelemetry("Query failed.");
      return;
    }

    const rows = result.rows ?? [];
    const columns = result.columns ?? [];
    const rowCount = rows.length;

    if (!rowCount) {
      resultsEl.innerHTML = `
        <div class="results-empty">
          <span class="material-symbols-outlined icon-16">filter_list_off</span>
          <div>No rows returned.</div>
        </div>
      `;
      resetTelemetry("Query returned no rows.");
      return;
    }

    const table = document.createElement("table");
    table.className = "results-table";
    const header = document.createElement("thead");
    const headRow = document.createElement("tr");
    columns.forEach((column) => {
      const th = document.createElement("th");
      th.textContent = column;
      headRow.appendChild(th);
    });
    header.appendChild(headRow);
    table.appendChild(header);

    const body = document.createElement("tbody");
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      columns.forEach((column) => {
        const cell = document.createElement("td");
        cell.textContent = row[column] != null ? row[column] : "";
        tr.appendChild(cell);
      });
      body.appendChild(tr);
    });
    table.appendChild(body);
    resultsEl.appendChild(table);

    resetTelemetry(`Query returned ${rowCount} row${rowCount === 1 ? "" : "s"} in ${elapsed}ms.`);

    const entry = {
      time: new Date().toLocaleTimeString(),
      label: "Executed query",
      sql,
      result: `${rowCount} row${rowCount === 1 ? "" : "s"} returned`,
    };
    renderHistory([entry, ...historyEl.querySelectorAll(".history-row")].slice(0, 50));
  } catch (error) {
    resetTelemetry("Query engine unavailable.");
  }
}

queryInput.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    runQuery();
  }
});

runButton.addEventListener("click", runQuery);
clearButton.addEventListener("click", () => {
  queryInput.value = "";
  queryInput.focus();
  resultsEl.innerHTML = "";
  resetTelemetry("Query cleared.");
});

function runQuery() {
  const sql = queryInput.value.trim();
  if (!sql) {
    resetTelemetry("Enter a query to run.");
    return;
  }

  queryMeta.textContent = `Running: ${escapeHtml(sql)}`;
  runLabel.textContent = "Running…";
  runButton.disabled = true;

  executeQuery(sql).finally(() => {
    runLabel.textContent = "Run Query";
    runButton.disabled = false;
  });
}

async function init() {
  await initConnection();

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  currentCaseId = id ?? null;

  if (id) {
    const online = modeBadge.dataset.mode === "online";
    if (online) {
      await loadCaseFromServer(id);
    } else {
      await gotoCaseDetail(id);
    }
  } else {
    resetTelemetry("No case id provided.");
    caseFileId.textContent = `CASE #— // RESTRICTED CLASSIFICATION`;
    caseTitle.textContent = "Select a case";
    difficultyStamp.textContent = "—";
    statusBadge.textContent = "Not started";
    statusBadge.className = "dossier-stamp in-progress";
    caseStory.textContent = "Pick a case from the mission board to start investigating.";
    caseQuestion.textContent = "No question selected.";
    answerFormat.textContent = "TEXT";
  }

  // Gate the Admin Sandbox nav link.
  const adminLink = document.querySelector('nav a[href="../admin/admin.html"][data-admin-only]');
  if (adminLink) {
    const admin = await isAdmin();
    adminLink.hidden = !admin;
  }
}

init();

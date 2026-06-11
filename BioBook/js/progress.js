/**
 * progress.js — BioBook progress tracker
 * ========================================
 * Stores studied topics in localStorage under the key "biobook_progress".
 * Works on both the home page (renders the progress bar + card ticks)
 * and on individual topic pages (drives the "Mark as studied" button).
 */

const PROGRESS_KEY = "biobook_progress";

// ── Core helpers ─────────────────────────────────────────────────────────────

function getStudiedSet() {
    try {
        const raw = localStorage.getItem(PROGRESS_KEY);
        return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
        return new Set();
    }
}

function saveStudiedSet(set) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify([...set]));
}

function isStudied(topicId) {
    return getStudiedSet().has(topicId);
}

function markStudied(topicId) {
    const set = getStudiedSet();
    set.add(topicId);
    saveStudiedSet(set);
}

function unmarkStudied(topicId) {
    const set = getStudiedSet();
    set.delete(topicId);
    saveStudiedSet(set);
}

function toggleStudied(topicId) {
    isStudied(topicId) ? unmarkStudied(topicId) : markStudied(topicId);
}

function resetAllProgress() {
    localStorage.removeItem(PROGRESS_KEY);
}

// ── Home page: progress bar ───────────────────────────────────────────────────

function renderProgressBar() {
    const fill = document.getElementById("progress-bar-fill");
    const label = document.getElementById("progress-label");
    if (!fill || !label) return;

    const total = BIOBOOK_TOPICS.length;
    const studied = getStudiedSet();
    const done = BIOBOOK_TOPICS.filter((t) => studied.has(t.id)).length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);

    fill.style.width = pct + "%";
    fill.setAttribute("aria-valuenow", pct);
    label.textContent = `${done} of ${total} topic${total !== 1 ? "s" : ""} studied`;
}

// ── Home page: card studied badges ───────────────────────────────────────────

function applyStudiedBadgesToCards() {
    const studied = getStudiedSet();
    document.querySelectorAll(".topic-card").forEach((card) => {
        const id = card.dataset.topicId;
        card.classList.toggle("is-studied", studied.has(id));
    });
}

// ── Home page: build topic grid ───────────────────────────────────────────────

function buildTopicGrid() {
    const grid = document.getElementById("topic-grid");
    if (!grid) return;

    if (BIOBOOK_TOPICS.length === 0) {
        grid.innerHTML = `<p class="empty-state">No topics yet — add some in js/topics.js!</p>`;
        return;
    }

    grid.innerHTML = BIOBOOK_TOPICS.map((t) => `
    <article class="topic-card" data-topic-id="${t.id}" data-searchable="${t.title.toLowerCase()} ${t.tag.toLowerCase()} ${t.summary.toLowerCase()}">
      <a href="${t.file}" class="card-link">
        <div class="card-inner">
          <div class="card-top">
            <span class="card-tag">${t.tag}</span>
            <span class="card-difficulty difficulty-${t.difficulty.toLowerCase()}">${t.difficulty}</span>
          </div>
          <h2 class="card-title">${t.title}</h2>
          <p class="card-summary">${t.summary}</p>
        </div>
        <div class="card-footer">
          <span class="studied-badge">✓ Studied</span>
          <span class="card-cta">Read →</span>
        </div>
      </a>
    </article>
  `).join("");

    applyStudiedBadgesToCards();
}

// ── Topic page: "Mark as studied" button ─────────────────────────────────────

function initStudiedButton() {
    const btn = document.getElementById("studied-btn");
    if (!btn) return;

    const topicId = btn.dataset.topicId;
    if (!topicId) {
        console.warn("BioBook: #studied-btn has no data-topic-id set.");
        return;
    }

    function updateButton() {
        const done = isStudied(topicId);
        btn.textContent = done ? "✓ Studied" : "Mark as studied";
        btn.classList.toggle("is-studied", done);
    }

    updateButton();

    btn.addEventListener("click", () => {
        toggleStudied(topicId);
        updateButton();
    });
}

// ── Reset button (home page) ──────────────────────────────────────────────────

function initResetButton() {
    const btn = document.getElementById("reset-progress-btn");
    if (!btn) return;

    btn.addEventListener("click", () => {
        if (!confirm("Reset all progress? This can't be undone.")) return;
        resetAllProgress();
        renderProgressBar();
        applyStudiedBadgesToCards();
    });
}

// ── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
    buildTopicGrid();
    renderProgressBar();
    initResetButton();
    initStudiedButton(); // no-op on home page (element won't exist)
});

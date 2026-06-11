/**
 * topic-page.js — BioBook individual topic page logic
 * =====================================================
 * - Sets the page <title> from topics.js data
 * - Wires up Prev / Next navigation links
 *
 * Depends on: topics.js, progress.js
 *
 * HOW TO LINK THIS TO YOUR TOPIC PAGE:
 *   In your topic HTML file, set data-topic-id on the #studied-btn:
 *     <button class="btn-studied" id="studied-btn" data-topic-id="cell-division">
 *   Make sure that id matches the entry in BIOBOOK_TOPICS in topics.js.
 */

document.addEventListener("DOMContentLoaded", () => {
    const studiedBtn = document.getElementById("studied-btn");
    if (!studiedBtn) return;

    const topicId = studiedBtn.dataset.topicId;
    const idx = getTopicIndex(topicId);

    if (idx === -1) {
        console.warn(`BioBook: topic id "${topicId}" not found in topics.js`);
        return;
    }

    const topic = BIOBOOK_TOPICS[idx];

    // ── Update page title ─────────────────────────────────────────────────────
    document.title = `${topic.title} | BioBook`;

    // ── Prev / Next navigation ────────────────────────────────────────────────
    const prevLink = document.getElementById("prev-topic");
    const nextLink = document.getElementById("next-topic");

    if (prevLink && idx > 0) {
        const prev = BIOBOOK_TOPICS[idx - 1];
        prevLink.href = `../${prev.file}`;
        prevLink.textContent = `← ${prev.title}`;
        prevLink.hidden = false;
    }

    if (nextLink && idx < BIOBOOK_TOPICS.length - 1) {
        const next = BIOBOOK_TOPICS[idx + 1];
        nextLink.href = `../${next.file}`;
        nextLink.textContent = `${next.title} →`;
        nextLink.hidden = false;
    }
});
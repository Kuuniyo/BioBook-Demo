/**
 * topics.js — BioBook topic registry
 * ===================================
 * This is the ONLY file you need to edit to add or change topics.
 *
 * Each topic object has:
 *   id         (string)  — unique slug, used in URLs and localStorage keys
 *   title      (string)  — display name shown on cards and topic pages
 *   tag        (string)  — category label (e.g. "Cell Biology")
 *   difficulty (string)  — "Easy" | "Medium" | "Hard"  (shown as a badge)
 *   file       (string)  — path to the topic's HTML page (relative to index.html)
 *   summary    (string)  — one-sentence blurb shown on the home-page card
 *
 * HOW TO ADD A TOPIC:
 *   1. Duplicate pages/topic-template.html and name it pages/your-topic-id.html
 *   2. Fill in the template content
 *   3. Add an entry to BIOBOOK_TOPICS below
 *   4. That's it — the card appears on the home page automatically.
 */

const BIOBOOK_TOPICS = [
    // ── EXAMPLE ENTRIES — replace or delete these ──────────────────────────────
    {
        id: "topic-1",
        title: "BioBook",
        tag: "Category",
        difficulty: "Medium",
        file: "BioBook/Index.html",
        summary: "The Biology section of Library",
    },
    {
        id: "topic-2",
        title: "HumanBook",
        tag: "Category",
        difficulty: "Hard",
        file: "HumanBook/Index.html",
        summary: "The Humanities section of Library",
    },
    {
        id: "topic-3",
        title: "EnglishBook",
        tag: "Category",
        difficulty: "Easy",
        file: "EnglishBook/Index.html",
        summary: "The English section of Library.",
    },
    // ── ADD MORE TOPICS BELOW ──────────────────────────────────────────────────
];

/**
 * Returns the full topic object for a given id, or undefined if not found.
 */
function getTopicById(id) {
    return BIOBOOK_TOPICS.find((t) => t.id === id);
}

/**
 * Returns the index of a topic in BIOBOOK_TOPICS by id.
 */
function getTopicIndex(id) {
    return BIOBOOK_TOPICS.findIndex((t) => t.id === id);
}

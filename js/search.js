/**
 * search.js — BioBook topic search
 * ==================================
 * Filters the topic grid in real-time as the user types.
 * Also shows a quick-access dropdown with matching topic links.
 *
 * Depends on: topics.js (for BIOBOOK_TOPICS), progress.js (for buildTopicGrid)
 */

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("topic-search");
    const dropdown = document.getElementById("search-results");
    const grid = document.getElementById("topic-grid");

    if (!input) return; // not on the home page

    // ── Dropdown (quick links) ────────────────────────────────────────────────

    function showDropdown(query) {
        if (!query) {
            dropdown.hidden = true;
            dropdown.innerHTML = "";
            return;
        }

        const matches = BIOBOOK_TOPICS.filter((t) =>
            (t.title + " " + t.tag + " " + t.summary)
                .toLowerCase()
                .includes(query)
        ).slice(0, 6); // cap at 6 dropdown results

        if (matches.length === 0) {
            dropdown.innerHTML = `<div class="search-no-results">No books match "${query}"</div>`;
        } else {
            dropdown.innerHTML = matches
                .map(
                    (t) => `
          <a href="${t.file}" class="search-result-item">
            <span class="result-title">${highlight(t.title, query)}</span>
            <span class="result-tag">${t.tag}</span>
          </a>`
                )
                .join("");
        }

        dropdown.hidden = false;
    }

    // Wraps the matched part of a string in a <mark> tag.
    function highlight(text, query) {
        const idx = text.toLowerCase().indexOf(query);
        if (idx === -1) return text;
        return (
            text.slice(0, idx) +
            `<mark>${text.slice(idx, idx + query.length)}</mark>` +
            text.slice(idx + query.length)
        );
    }

    // ── Grid filter ───────────────────────────────────────────────────────────

    function filterGrid(query) {
        if (!grid) return;
        const cards = grid.querySelectorAll(".topic-card");
        let visibleCount = 0;

        cards.forEach((card) => {
            const searchable = card.dataset.searchable || "";
            const matches = !query || searchable.includes(query);
            card.hidden = !matches;
            if (matches) visibleCount++;
        });

        // Show "no results" state inside the grid
        let noResultsEl = grid.querySelector(".search-empty-state");
        if (visibleCount === 0 && query) {
            if (!noResultsEl) {
                noResultsEl = document.createElement("p");
                noResultsEl.className = "search-empty-state empty-state";
                grid.appendChild(noResultsEl);
            }
            noResultsEl.textContent = `No topics match "${query}".`;
            noResultsEl.hidden = false;
        } else if (noResultsEl) {
            noResultsEl.hidden = true;
        }
    }

    // ── Event listeners ───────────────────────────────────────────────────────

    input.addEventListener("input", () => {
        const query = input.value.trim().toLowerCase();
        showDropdown(query);
        filterGrid(query);
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.hidden = true;
        }
    });

    // Reopen dropdown when focusing back on the input
    input.addEventListener("focus", () => {
        const query = input.value.trim().toLowerCase();
        if (query) showDropdown(query);
    });

    // Keyboard: Escape closes dropdown
    input.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            dropdown.hidden = true;
            input.blur();
        }
    });
});

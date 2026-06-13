/**
 * chat.js — BioBook class chat (Supabase Realtime)
 * ==================================================
 * SETUP — do this once:
 *   1. Go to supabase.com → New Project
 *   2. Go to Project Settings → API
 *   3. Copy your Project URL and the anon public key (Legacy tab is fine)
 *   4. Paste them into the CONFIG section below
 *   5. Run the SQL from chat.html's comments in the Supabase SQL Editor
 */

// ── CONFIG — paste your values here ──────────────────────────────────────────
const SUPABASE_URL  = "https://swblfllfnyavpopacvys.supabase.co";  // e.g. https://xyzxyz.supabase.co
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3YmxmbGxmbnlhdnBvcGFjdnlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNjg2MzIsImV4cCI6MjA5Njk0NDYzMn0.MMI0GwQ1xLTAHY5Xy7bwLBFWWQQEu3WGI20mUyxwR7k";     // the long eyJhbG... string
// ─────────────────────────────────────────────────────────────────────────────

const MAX_MESSAGES      = 100;
const CHAT_USERNAME_KEY = "biobook_chat_username";

// ── State ─────────────────────────────────────────────────────────────────────
// NOTE: variable is named "sbClient" (not "supabase") to avoid clashing
//       with the global "supabase" object injected by the CDN script.
let sbClient       = null;
let currentChannel = "general";
let username       = "";
let realtimeSub    = null;

// ── Init ──────────────────────────────────────────────────────────────────────
function initSupabase() {
    sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
}

// ── Username (localStorage) ───────────────────────────────────────────────────
function getUsername()      { return localStorage.getItem(CHAT_USERNAME_KEY) || ""; }
function saveUsername(name) { localStorage.setItem(CHAT_USERNAME_KEY, name.trim()); }

// ── HTML helpers ──────────────────────────────────────────────────────────────
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function formatTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatDate(ts) {
    return new Date(ts).toLocaleDateString([], { day: "numeric", month: "short" });
}

// ── Render full message list ──────────────────────────────────────────────────
function renderMessages(messages) {
    const list = document.getElementById("message-list");
    if (!list) return;

    const countEl = document.getElementById("chat-message-count");
    if (countEl) countEl.textContent = `${messages.length} message${messages.length !== 1 ? "s" : ""}`;

    if (messages.length === 0) {
        list.innerHTML = `<div class="chat-empty">No messages yet — be the first to ask something!</div>`;
        return;
    }

    let lastDate = null;
    list.innerHTML = messages.map((msg) => {
        const msgDate = formatDate(msg.created_at);
        let divider = "";
        if (msgDate !== lastDate) {
            lastDate = msgDate;
            divider = `<div class="chat-date-divider"><span>${escapeHtml(msgDate)}</span></div>`;
        }
        const isOwn = msg.author === username;
        return `${divider}
      <div class="chat-message ${isOwn ? "is-own" : ""}" data-id="${msg.id}">
        <span class="msg-author">${escapeHtml(msg.author)}</span>
        <span class="msg-text">${escapeHtml(msg.text)}</span>
        <span class="msg-time">${formatTime(msg.created_at)}</span>
      </div>`;
    }).join("");

    list.scrollTop = list.scrollHeight;
}

// ── Append a single new incoming message ─────────────────────────────────────
function appendMessage(msg) {
    const list = document.getElementById("message-list");
    if (!list) return;

    const empty = list.querySelector(".chat-empty");
    if (empty) empty.remove();

    const isOwn = msg.author === username;
    const div = document.createElement("div");
    div.className = `chat-message ${isOwn ? "is-own" : ""}`;
    div.dataset.id = msg.id;
    div.innerHTML = `
    <span class="msg-author">${escapeHtml(msg.author)}</span>
    <span class="msg-text">${escapeHtml(msg.text)}</span>
    <span class="msg-time">${formatTime(msg.created_at)}</span>`;
    list.appendChild(div);
    list.scrollTop = list.scrollHeight;

    const countEl = document.getElementById("chat-message-count");
    if (countEl) {
        const n = (parseInt(countEl.textContent) || 0) + 1;
        countEl.textContent = `${n} message${n !== 1 ? "s" : ""}`;
    }
}

// ── Load past messages from DB ────────────────────────────────────────────────
async function loadMessages(channel) {
    const list = document.getElementById("message-list");
    if (list) list.innerHTML = `<div class="chat-empty">Loading…</div>`;

    const { data, error } = await sbClient
        .from("chat_messages")
        .select("*")
        .eq("channel", channel)
        .order("created_at", { ascending: true })
        .limit(MAX_MESSAGES);

    if (error) {
        console.error("BioBook chat load error:", error);
        if (list) list.innerHTML = `<div class="chat-empty" style="color:var(--color-danger)">
      ⚠️ Could not load messages: ${escapeHtml(error.message)}</div>`;
        return;
    }

    renderMessages(data || []);
}

// ── Real-time listener ────────────────────────────────────────────────────────
function subscribeToChannel(channel) {
    if (realtimeSub) {
        sbClient.removeChannel(realtimeSub);
        realtimeSub = null;
    }

    realtimeSub = sbClient
        .channel(`chat:${channel}`)
        .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "chat_messages", filter: `channel=eq.${channel}` },
            (payload) => appendMessage(payload.new)
        )
        .subscribe();
}

// ── Switch channel ────────────────────────────────────────────────────────────
async function switchChannel(channel) {
    currentChannel = channel;
    await loadMessages(channel);
    subscribeToChannel(channel);
}

// ── Send a message ────────────────────────────────────────────────────────────
async function sendMessage(channel, author, text) {
    const { error } = await sbClient
        .from("chat_messages")
        .insert({ channel, author, text: text.trim() });
    if (error) console.error("BioBook send error:", error);
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function buildSidebar() {
    const ul = document.getElementById("chat-topic-list");
    if (!ul) return;

    const channels = [
        { id: "general", label: "General" },
        ...BIOBOOK_TOPICS.map((t) => ({ id: t.id, label: t.title })),
    ];

    ul.innerHTML = channels.map((ch) => `
    <li>
      <button class="channel-btn ${ch.id === currentChannel ? "is-active" : ""}"
              data-channel="${ch.id}">${escapeHtml(ch.label)}</button>
    </li>`
    ).join("");

    ul.querySelectorAll(".channel-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
            currentChannel = btn.dataset.channel;
            document.getElementById("chat-channel-title").textContent = btn.textContent;
            ul.querySelectorAll(".channel-btn").forEach((b) => b.classList.remove("is-active"));
            btn.classList.add("is-active");
            await switchChannel(currentChannel);
        });
    });
}

// ── Name UI ───────────────────────────────────────────────────────────────────
function updateNameUI() {
    const banner    = document.getElementById("name-setup-banner");
    const composing = document.getElementById("composing-as");
    const form      = document.getElementById("chat-form");

    if (username) {
        if (banner)   banner.hidden = true;
        if (composing) composing.textContent = `Chatting as ${username}`;
        if (form)     form.hidden = false;
    } else {
        if (banner)   banner.hidden = false;
        if (composing) composing.textContent = "";
        if (form)     form.hidden = true;
    }
}

// ── Compose form ──────────────────────────────────────────────────────────────
function initComposeForm() {
    const form      = document.getElementById("chat-form");
    const input     = document.getElementById("message-input");
    const charCount = document.getElementById("char-count");
    if (!form || !input) return;

    input.addEventListener("input", () => {
        if (charCount) charCount.textContent = `${input.value.length} / 1000`;
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text || !username) return;
        input.value = "";
        if (charCount) charCount.textContent = "0 / 1000";
        await sendMessage(currentChannel, username, text);
    });

    input.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") form.dispatchEvent(new Event("submit"));
    });
}

// ── Page init ─────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
    if (SUPABASE_URL.startsWith("PASTE_YOUR")) {
        document.getElementById("message-list").innerHTML = `
      <div class="chat-empty" style="color:var(--color-danger)">
        ⚠️ Supabase not configured yet — open js/chat.js and paste your URL and anon key.
      </div>`;
        return;
    }

    initSupabase();
    username = getUsername();

    buildSidebar();
    updateNameUI();
    initComposeForm();
    await switchChannel(currentChannel);

    // Set username
    const setBtn        = document.getElementById("set-username-btn");
    const usernameInput = document.getElementById("username-input");
    if (setBtn && usernameInput) {
        setBtn.addEventListener("click", () => {
            const name = usernameInput.value.trim();
            if (!name) return;
            username = name;
            saveUsername(name);
            updateNameUI();
        });
        usernameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") setBtn.click(); });
    }

    // Change name
    const changeBtn = document.getElementById("change-name-btn");
    if (changeBtn) {
        changeBtn.addEventListener("click", () => {
            const n = prompt("Enter a new display name:");
            if (!n?.trim()) return;
            username = n.trim();
            saveUsername(username);
            updateNameUI();
        });
    }
});

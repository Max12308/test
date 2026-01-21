// =======================
// FIREBASE SETUP
// =======================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  runTransaction,
  set
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  databaseURL: "https://test-688e4-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// =======================
// FIREBASE PFADE
// =======================

const basePath = "clipVoting/versprecher";
const votesRef  = ref(db, `${basePath}/votes`);
const roundRef  = ref(db, `${basePath}/round`);
const revealRef = ref(db, `${basePath}/revealAt`);

// =======================
// STATE
// =======================

// globale Daten
let votes = { 1: 0, 2: 0, 3: 0 };
let currentRound = 0;
let currentWinner = null;
let serverOffset = 0;
const MIN_VOTES_REQUIRED = 2;

// lokaler Zustand (pro Gerät)
let lastVotedRound = Number(localStorage.getItem("lastVotedRound"));
if (Number.isNaN(lastVotedRound)) lastVotedRound = -1;

// sicherer Default: gesperrt, wird durch Firebase gesetzt
let hasVoted = true;

// =======================
// LIVE UPDATES
// =======================

// Stimmen (live)
onValue(votesRef, snapshot => {
  votes = snapshot.val() || { 1: 0, 2: 0, 3: 0 };
  updateUI();
});

// Runde (entscheidend für Sperre)
onValue(roundRef, snapshot => {
  currentRound = snapshot.val() ?? 0;
  hasVoted = (lastVotedRound === currentRound);
  updateUI();
});

// GLOBALER COUNTDOWN (für alle)
onValue(revealRef, snapshot => {
  const revealAt = snapshot.val();
  if (!revealAt) return;
  startGlobalCountdown(revealAt);
});
onValue(ref(db, ".info/serverTimeOffset"), snapshot => {
  serverOffset = snapshot.val() || 0;
});

// =======================
// VOTING
// =======================

function vote(video) {
  if (hasVoted) return;

  runTransaction(votesRef, current => {
    if (!current) current = { 1: 0, 2: 0, 3: 0 };
    current[video] = (current[video] || 0) + 1;
    return current;
  });

  hasVoted = true;
  lastVotedRound = currentRound;
  localStorage.setItem("lastVotedRound", String(currentRound));

  updateUI(); // sofort sperren
}

// =======================
// UI
// =======================

function updateUI() {
  document.getElementById("votes1").textContent = votes[1];
  document.getElementById("votes2").textContent = votes[2];
  document.getElementById("votes3").textContent = votes[3];

  document.querySelectorAll("button[data-vote]").forEach(btn => {
    btn.disabled = hasVoted;
  });

  calculateWinner();
}

// =======================
// WINNER LOGIK
// =======================

function calculateWinner() {
  const max = Math.max(votes[1], votes[2], votes[3]);

  if (max === 0) {
    currentWinner = null;
    return;
  }

  const winners = [];
  if (votes[1] === max) winners.push(1);
  if (votes[2] === max) winners.push(2);
  if (votes[3] === max) winners.push(3);

if (winners.length === 1) {
  currentWinner = winners[0];
  showStatus(`🏆 Führend: Video ${currentWinner}`);
} else {
  currentWinner = null;
  showStatus("🤝 Gleichstand – kein eindeutiger Gewinner");
}
function showStatus(text) {
  const el = document.getElementById("status-text");
  if (el) el.textContent = text;
}


// =======================
// REVEAL: G G G → GLOBAL
// =======================

let gCount = 0;
let gTimer = null;

document.addEventListener("keydown", e => {
  if (e.key.toLowerCase() !== "g") return;

  gCount++;
  clearTimeout(gTimer);
  gTimer = setTimeout(() => gCount = 0, 600);

  if (gCount === 3) {
    gCount = 0;
    reveal();
  }
});
function reveal() {
  const totalVotes = votes[1] + votes[2] + votes[3];

  if (totalVotes < MIN_VOTES_REQUIRED) {
    alert(`Mindestens ${MIN_VOTES_REQUIRED} Stimmen erforderlich.`);
    return;
  }

  if (!currentWinner) {
    alert("Kein eindeutiger Gewinner (Gleichstand).");
    return;
  }

  set(revealRef, Date.now() + 3000);
}


// =======================
// GLOBALER COUNTDOWN
// =======================

function startGlobalCountdown(revealAt) {
  const screen = document.getElementById("countdown-screen");
  const num = document.getElementById("countdown-number");

  function tick() {
    const serverNow = Date.now() + serverOffset;
    const diff = Math.ceil((revealAt - serverNow) / 1000);

    if (diff > 0) {
      screen.style.display = "flex";
      num.textContent = diff;
      requestAnimationFrame(tick);
    } else {
      screen.style.display = "none";
      showWinner();

      // Countdown nur einmal auslösen
      set(revealRef, null);
    }
  }

  tick();
}

// =======================
// WINNER SCREEN
// =======================

function showWinner() {
  document.querySelectorAll(".video-box").forEach(v =>
    v.classList.remove("winner")
  );

  if (!currentWinner) return;

  const box = document.getElementById("video-" + currentWinner);
  box.classList.add("winner");

  const src = box.querySelector("video source")?.src;
  const wv = document.getElementById("winner-video");

  if (src) {
    wv.src = src;
    wv.load();
  }

  document.getElementById("winner-screen").style.display = "flex";
}

window.closeWinner = () => {
  document.getElementById("winner-screen").style.display = "none";
};

// =======================
// ADMIN RESET (R R) → NEUE RUNDE
// =======================

let lastR = 0;

document.addEventListener("keydown", e => {
  if (e.key.toLowerCase() === "r") {
    const now = Date.now();

    if (now - lastR < 400) {
      // neue Runde starten
      set(roundRef, currentRound + 1);

      // Stimmen zurücksetzen
      set(votesRef, { 1: 0, 2: 0, 3: 0 });

      alert("Neue Voting-Runde gestartet.");
    }

    lastR = now;
  }
});

// =======================
// BUTTONS
// =======================

document.querySelectorAll("[data-vote]").forEach(btn => {
  btn.addEventListener("click", () => {
    vote(parseInt(btn.dataset.vote));
  });
});






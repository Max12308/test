// =======================
// FIREBASE SETUP
// =======================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  databaseURL: "https://test-688e4-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 🔒 Eigener Pfad für DEIN Projekt (nicht die Demo!)
const votesRef = ref(db, "clipVoting/versprecher/votes");

// =======================
// STATE
// =======================

// Stimmen kommen aus Firebase
let votes = { 1: 0, 2: 0, 3: 0 };

// 1 Vote pro Browser
let hasVoted = localStorage.getItem("hasVoted") === "true";

let currentWinner = null;

// =======================
// LIVE UPDATES (🔥 DAS IST DER KERN)
// =======================

onValue(votesRef, snapshot => {
  votes = snapshot.val() || { 1: 0, 2: 0, 3: 0 };
  updateUI();
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
  localStorage.setItem("hasVoted", "true");
}

window.vote = vote; // wichtig für onclick im HTML

// =======================
// UI
// =======================

function updateUI() {
  document.getElementById("votes1").textContent = votes[1];
  document.getElementById("votes2").textContent = votes[2];
  document.getElementById("votes3").textContent = votes[3];

  if (hasVoted) {
    document.querySelectorAll("button").forEach(b => b.disabled = true);
  }

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

  currentWinner = winners.length === 1 ? winners[0] : null;
}

// =======================
// REVEAL: G G G
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
  if (!currentWinner) {
    alert("Kein eindeutiger Gewinner (Gleichstand oder keine Stimmen).");
    return;
  }
  startCountdown();
}

// =======================
// COUNTDOWN
// =======================

function startCountdown() {
  const screen = document.getElementById("countdown-screen");
  const num = document.getElementById("countdown-number");

  screen.style.display = "flex";
  let c = 3;
  num.textContent = c;

  const i = setInterval(() => {
    c--;
    if (c > 0) {
      num.textContent = c;
    } else {
      clearInterval(i);
      screen.style.display = "none";
      showWinner();
    }
  }, 1000);
}

// =======================
// WINNER SCREEN
// =======================

function showWinner() {
  document.querySelectorAll(".video-box").forEach(v =>
    v.classList.remove("winner")
  );

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

window.closeWinner = function () {
  document.getElementById("winner-screen").style.display = "none";
};

// =======================
// ADMIN RESET (GLOBAL): R R
// =======================

let lastR = 0;

document.addEventListener("keydown", e => {
  if (e.key.toLowerCase() === "r") {
    const now = Date.now();

    if (now - lastR < 400) {

      // 🔥 GLOBALER RESET IN FIREBASE
     import { set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";


      // 🔓 lokale Sperre auf DIESEM Gerät aufheben
      localStorage.removeItem("hasVoted");
      hasVoted = false;

      alert("Voting wurde global zurückgesetzt.");
    }

    lastR = now;
  }
});

// =======================
// BUTTONS VERKABELN (statt onclick)
// =======================

document.querySelectorAll("[data-vote]").forEach(btn => {
  btn.addEventListener("click", () => {
    const video = parseInt(btn.dataset.vote);
    vote(video);
  });
});




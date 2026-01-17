let votes = JSON.parse(localStorage.getItem("votes")) || {1:0,2:0,3:0};
let hasVoted = localStorage.getItem("hasVoted") === "true";
let currentWinner = null;

updateUI();

function vote(video) {
  if (hasVoted) return;

  votes[video]++;
  hasVoted = true;

  localStorage.setItem("votes", JSON.stringify(votes));
  localStorage.setItem("hasVoted", "true");

  updateUI();
}

function updateUI() {
  document.getElementById("votes1").textContent = votes[1];
  document.getElementById("votes2").textContent = votes[2];
  document.getElementById("votes3").textContent = votes[3];

  if (hasVoted) {
    document.querySelectorAll("button").forEach(b => b.disabled = true);
  }

  calculateWinner();
}

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

// Reveal mit G G G
let gCount = 0;
let gTimer;

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
    alert("Kein eindeutiger Gewinner.");
    return;
  }

  startCountdown();
}

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

function showWinner() {
  document.querySelectorAll(".video-box").forEach(v => v.classList.remove("winner"));

  const box = document.getElementById("video-" + currentWinner);
  box.classList.add("winner");

  const src = box.querySelector("video source").src;
  const wv = document.getElementById("winner-video");
  wv.src = src;
  wv.load();

  document.getElementById("winner-screen").style.display = "flex";
}

function closeWinner() {
  document.getElementById("winner-screen").style.display = "none";
}

// Reset: R R
let lastR = 0;
document.addEventListener("keydown", e => {
  if (e.key.toLowerCase() === "r") {
    const now = Date.now();
    if (now - lastR < 400) {
      localStorage.clear();
      location.reload();
    }
    lastR = now;
  }
});

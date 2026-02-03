const modeCards = document.querySelectorAll(".card");
const modeLabel = document.getElementById("mode-label");
const questionEl = document.getElementById("question");
const scoreEl = document.getElementById("score");
const streakEl = document.getElementById("streak");
const livesEl = document.getElementById("lives");
const feedbackEl = document.getElementById("feedback");
const progressBar = document.getElementById("progress-bar");
const answerForm = document.getElementById("answer-form");
const answerInput = document.getElementById("answer");
const startButton = document.getElementById("start-game");
const tableSelect = document.getElementById("table-select");
const levelSelect = document.getElementById("level-select");
const choicesEl = document.getElementById("choices");
const choiceButtons = document.querySelectorAll(".choice-btn");
const tetrisArea = document.getElementById("tetris-area");
const tetrisStack = document.getElementById("tetris-stack");
const dropBlockBtn = document.getElementById("drop-block");
const tetrisCount = document.getElementById("tetris-count");

const bodyEl = document.body;

const modes = {
  bouw: {
    label: "Bouw & Blok · Minecraft vibe",
    success: "Nice! Je krijgt een nieuw blok voor je fort 🧱",
    fail: "Oeps! Een blok brokkelde af. Probeer opnieuw!",
  },
  obby: {
    label: "Obby Runner · Roblox vibe",
    success: "Top! Je springt perfect naar het volgende platform 🤸",
    fail: "Ai! Je mist de sprong. Focus op je volgende som!",
  },
  power: {
    label: "Power-Up Parade · Super Mario vibe",
    success: "Yes! Je pakt een ster en scoort extra punten ⭐",
    fail: "Boe! De Goomba lacht. Pak snel je volgende power-up!",
  },
};

let activeMode = null;
let currentQuestion = null;
let score = 0;
let streak = 0;
let lives = 3;
let progress = 0;
let gameState = {
  // For obby (chase)
  chaseInterval: null,
  chaseRemaining: 0,
  chaseDuration: 0,
  // For tetris
  tetrisTotal: 20,
  tetrisCollected: 0,
  tetrisPreview: null,
};

const levelSettings = {
  easy: { multiplier: 1, max: 5 },
  normal: { multiplier: 2, max: 8 },
  hard: { multiplier: 3, max: 12 },
};

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const pickQuestion = () => {
  const tableValue = tableSelect.value;
  const maxValue = levelSettings[levelSelect.value].max;

  if (tableValue === "mixed") {
    const left = randomInt(1, 12);
    const right = randomInt(1, maxValue);
    return { left, right };
  }

  const left = Number(tableValue);
  const right = randomInt(1, maxValue);
  return { left, right };
};

const updateQuestionUI = () => {
  if (!currentQuestion) {
    questionEl.textContent = "Je som verschijnt hier ✨";
    return;
  }
  questionEl.textContent = `${currentQuestion.left} × ${currentQuestion.right} = ?`;
};

const updateStats = () => {
  scoreEl.textContent = score;
  streakEl.textContent = streak;
  livesEl.textContent = lives;
  progressBar.style.width = `${Math.min(progress, 100)}%`;
};

const setFeedback = (message, type) => {
  feedbackEl.textContent = message;
  feedbackEl.classList.remove("good", "bad");
  if (type) {
    feedbackEl.classList.add(type);
  }
};

const startGame = () => {
  if (!activeMode) {
    setFeedback("Kies eerst een spelwereld om te starten.", "bad");
    return;
  }
  score = 0;
  streak = 0;
  lives = 3;
  progress = 0;
  currentQuestion = pickQuestion();
  updateQuestionUI();
  updateStats();
  setFeedback("Game on! Beantwoord de som om te beginnen.", "good");
  answerInput.focus();

  // Mode specific initialisation
  if (activeMode === "obby") {
    // chase timer based on level
    const base = { easy: 10, normal: 7, hard: 5 }[levelSelect.value] || 7;
    gameState.chaseDuration = base * 1000;
    startChaseTimer();
  } else {
    stopChaseTimer();
  }

  if (activeMode === "bouw") {
    gameState.tetrisCollected = 0;
    tetrisStack.innerHTML = "";
    tetrisCount.textContent = `${gameState.tetrisCollected} / ${gameState.tetrisTotal}`;
    tetrisArea.hidden = false;
    choicesEl.hidden = true;
  }

  if (activeMode === "power") {
    // show multiple choice
    choicesEl.hidden = false;
    tetrisArea.hidden = true;
    generateChoicesForCurrentQuestion();
  }
};

const handleAnswer = (event) => {
  event.preventDefault();
  if (!currentQuestion) {
    setFeedback("Klik op start om een som te krijgen.", "bad");
    return;
  }

  const userAnswer = Number(answerInput.value);
  const correctAnswer = currentQuestion.left * currentQuestion.right;
  const { multiplier } = levelSettings[levelSelect.value];

  if (userAnswer === correctAnswer) {
    score += 10 * multiplier + streak;
    streak += 1;
    progress += 12;
    setFeedback(modes[activeMode].success, "good");
    // mode-specific success
    if (activeMode === "obby") {
      // reset chase
      resetChaseTimer();
    }
    if (activeMode === "bouw") {
      grantTetrisPreview();
    }
  } else {
    lives -= 1;
    streak = 0;
    progress = Math.max(progress - 8, 0);
    setFeedback(`${modes[activeMode].fail} Het juiste antwoord is ${correctAnswer}.`, "bad");
  }

  if (lives <= 0) {
    setFeedback("Game over! Klik op start om opnieuw te spelen.", "bad");
    currentQuestion = null;
    stopChaseTimer();
  } else {
    currentQuestion = pickQuestion();
    if (activeMode === "power") generateChoicesForCurrentQuestion();
  }

  updateQuestionUI();
  updateStats();
  answerForm.reset();
};

/* Theme helper */
const applyThemeForMode = (mode) => {
  bodyEl.classList.remove("theme-blue", "theme-green", "theme-red");
  if (mode === "obby") bodyEl.classList.add("theme-blue");
  if (mode === "bouw") bodyEl.classList.add("theme-green");
  if (mode === "power") bodyEl.classList.add("theme-red");
};

/* Chase timer (obby) */
const startChaseTimer = () => {
  stopChaseTimer();
  gameState.chaseRemaining = gameState.chaseDuration;
  const start = Date.now();
  gameState.chaseInterval = setInterval(() => {
    const elapsed = Date.now() - start;
    gameState.chaseRemaining = Math.max(gameState.chaseDuration - elapsed, 0);
    const pct = 100 - Math.round((gameState.chaseRemaining / gameState.chaseDuration) * 100);
    progressBar.style.width = `${pct}%`;
    if (gameState.chaseRemaining <= 0) {
      // chased down
      lives -= 1;
      streak = 0;
      setFeedback('Je bent ingehaald! Los de volgende som snel op.', 'bad');
      updateStats();
      currentQuestion = pickQuestion();
      updateQuestionUI();
      // restart timer if still alive
      if (lives > 0) startChaseTimer(); else stopChaseTimer();
    }
  }, 150);
};

const resetChaseTimer = () => {
  startChaseTimer();
};

const stopChaseTimer = () => {
  if (gameState.chaseInterval) {
    clearInterval(gameState.chaseInterval);
    gameState.chaseInterval = null;
  }
  progressBar.style.width = `${Math.min(progress, 100)}%`;
};

/* Tetris helpers */
const grantTetrisPreview = () => {
  // create a preview block the player can drop
  if (gameState.tetrisPreview) return; // already have preview
  const div = document.createElement('div');
  div.className = 'block';
  div.style.width = '100%';
  div.style.background = `linear-gradient(90deg, var(--accent), var(--accent-dark))`;
  div.style.opacity = '0.95';
  div.style.border = '1px solid rgba(0,0,0,0.15)';
  div.id = 'preview-block';
  tetrisArea.insertBefore(div, tetrisStack);
  gameState.tetrisPreview = div;
};

dropBlockBtn.addEventListener('click', () => {
  if (!gameState.tetrisPreview) return;
  // move preview into stack
  const preview = gameState.tetrisPreview;
  preview.removeAttribute('id');
  tetrisStack.appendChild(preview);
  gameState.tetrisPreview = null;
  gameState.tetrisCollected += 1;
  tetrisCount.textContent = `${gameState.tetrisCollected} / ${gameState.tetrisTotal}`;
  // award score
  score += 15;
  updateStats();
});

/* Multiple choice (power) */
const generateChoicesForCurrentQuestion = () => {
  if (!currentQuestion) return;
  const correct = currentQuestion.left * currentQuestion.right;
  const choices = new Set([correct]);
  while (choices.size < 3) {
    let delta = Math.floor((Math.random() * 5) + 1);
    if (Math.random() < 0.5) delta *= -1;
    choices.add(Math.max(1, correct + delta));
  }
  const arr = Array.from(choices).sort(() => Math.random() - 0.5);
  choiceButtons.forEach((btn, i) => {
    btn.textContent = arr[i];
    btn.dataset.value = arr[i];
  });
};

choiceButtons.forEach((btn) => {
  btn.addEventListener('click', (e) => {
    if (!currentQuestion) return;
    const picked = Number(btn.dataset.value);
    const correct = currentQuestion.left * currentQuestion.right;
    if (picked === correct) {
      score += 12;
      streak += 1;
      setFeedback(modes[activeMode].success, 'good');
    } else {
      lives -= 1;
      streak = 0;
      setFeedback(modes[activeMode].fail + ' Probeer het volgende antwoord.', 'bad');
    }
    if (lives <= 0) {
      setFeedback('Game over! Klik op start om opnieuw te spelen.', 'bad');
      currentQuestion = null;
    } else {
      currentQuestion = pickQuestion();
      generateChoicesForCurrentQuestion();
    }
    updateQuestionUI();
    updateStats();
  });
});

modeCards.forEach((card) => {
  card.addEventListener("click", () => {
    modeCards.forEach((button) => button.classList.remove("active"));
    card.classList.add("active");
    activeMode = card.dataset.mode;
    modeLabel.textContent = modes[activeMode].label;
    setFeedback("Klaar! Kies je tafel en druk op start.", "good");
    applyThemeForMode(activeMode);

    // UI: show/hide input vs choices vs tetris
    if (activeMode === 'power') {
      choicesEl.hidden = false;
      answerForm.hidden = true;
      tetrisArea.hidden = true;
    } else if (activeMode === 'bouw') {
      choicesEl.hidden = true;
      answerForm.hidden = false;
      tetrisArea.hidden = false;
    } else {
      // obby or others
      choicesEl.hidden = true;
      answerForm.hidden = false;
      tetrisArea.hidden = true;
    }
  });
});

startButton.addEventListener("click", startGame);
answerForm.addEventListener("submit", handleAnswer);

updateStats();

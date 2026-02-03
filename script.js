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
  } else {
    lives -= 1;
    streak = 0;
    progress = Math.max(progress - 8, 0);
    setFeedback(`${modes[activeMode].fail} Het juiste antwoord is ${correctAnswer}.`, "bad");
  }

  if (lives <= 0) {
    setFeedback("Game over! Klik op start om opnieuw te spelen.", "bad");
    currentQuestion = null;
  } else {
    currentQuestion = pickQuestion();
  }

  updateQuestionUI();
  updateStats();
  answerForm.reset();
};

modeCards.forEach((card) => {
  card.addEventListener("click", () => {
    modeCards.forEach((button) => button.classList.remove("active"));
    card.classList.add("active");
    activeMode = card.dataset.mode;
    modeLabel.textContent = modes[activeMode].label;
    setFeedback("Klaar! Kies je tafel en druk op start.", "good");
  });
});

startButton.addEventListener("click", startGame);
answerForm.addEventListener("submit", handleAnswer);

updateStats();

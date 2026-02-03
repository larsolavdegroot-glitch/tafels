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
const bouwPanel = document.getElementById("bouw-panel");
const obbyPanel = document.getElementById("obby-panel");
const powerPanel = document.getElementById("power-panel");
const blocksCount = document.getElementById("blocks-count");
const blockGrid = document.getElementById("block-grid");
const distanceCount = document.getElementById("distance-count");
const runner = document.getElementById("runner");
const powerupsCount = document.getElementById("powerups-count");
const powerRow = document.getElementById("power-row");
const platformCount = document.getElementById("platform-count");

const modes = {
  bouw: {
    label: "Minecraft Race · bouw je track",
    success: "Yes! Je track groeit en je race gaat sneller 🏁",
    fail: "Oeps! Je verliest een stukje van je track. Doorzetten!",
  },
  obby: {
    label: "Obby Runner · Roblox vibe",
    success: "Top! Je springt perfect naar het volgende platform 🤸",
    fail: "Ai! Je mist de sprong. Focus op je volgende som!",
  },
  power: {
    label: "Mario Platform Run · spring & verzamel",
    success: "Hop! Je landt op een nieuw platform en pakt munten 🍄",
    fail: "Ai! Je valt naar beneden. Probeer het volgende platform!",
  },
};

let activeMode = null;
let currentQuestion = null;
let score = 0;
let streak = 0;
let lives = 3;
let progress = 0;
let blocks = 0;
let distance = 0;
let platforms = 0;
let coins = 0;

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

const updateModePanels = () => {
  bouwPanel.hidden = activeMode !== "bouw";
  obbyPanel.hidden = activeMode !== "obby";
  powerPanel.hidden = activeMode !== "power";
  blocksCount.textContent = blocks;
  distanceCount.textContent = `${distance}m`;
  powerupsCount.textContent = coins;
  platformCount.textContent = platforms;
  runner.style.transform = `translateX(${Math.min(distance, 100)}%)`;
  blockGrid.innerHTML = "";
  for (let i = 0; i < Math.min(blocks, 24); i += 1) {
    const block = document.createElement("span");
    block.className = "block";
    blockGrid.append(block);
  }
  powerRow.innerHTML = "";
  for (let i = 0; i < Math.min(platforms, 8); i += 1) {
    const platform = document.createElement("span");
    platform.className = "platform";
    powerRow.append(platform);
  }
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
  blocks = 0;
  distance = 0;
  platforms = 0;
  coins = 0;
  currentQuestion = pickQuestion();
  updateQuestionUI();
  updateStats();
  updateModePanels();
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
    if (activeMode === "bouw") {
      blocks += 2;
    }
    if (activeMode === "obby") {
      distance = Math.min(distance + 12 + streak, 100);
    }
    if (activeMode === "power") {
      platforms += 1;
      coins += 2 + Math.min(streak, 3);
    }
    setFeedback(modes[activeMode].success, "good");
  } else {
    lives -= 1;
    streak = 0;
    progress = Math.max(progress - 8, 0);
    if (activeMode === "bouw") {
      blocks = Math.max(blocks - 1, 0);
    }
    if (activeMode === "obby") {
      distance = Math.max(distance - 8, 0);
    }
    if (activeMode === "power") {
      platforms = Math.max(platforms - 1, 0);
      coins = Math.max(coins - 1, 0);
    }
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
  updateModePanels();
  answerForm.reset();
};

modeCards.forEach((card) => {
  card.addEventListener("click", () => {
    modeCards.forEach((button) => button.classList.remove("active"));
    card.classList.add("active");
    activeMode = card.dataset.mode;
    modeLabel.textContent = modes[activeMode].label;
    setFeedback("Klaar! Kies je tafel en druk op start.", "good");
    updateModePanels();
  });
});

startButton.addEventListener("click", startGame);
answerForm.addEventListener("submit", handleAnswer);

updateStats();
updateModePanels();

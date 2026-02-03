/* RUNNER GAME - Standalone */
const runnerCanvas = document.getElementById('runner');
const rctx = runnerCanvas.getContext('2d');
runnerCanvas.width = 400;
runnerCanvas.height = 400;

let runnerPlayer = {x: 150, y: 300, w: 30, h: 40};
let runnerObstacles = [];
let runnerScore = 0, runnerDistance = 0, runnerSpeed = 2, runnerGameRunning = false, runnerGameId = null;
let runnerQuestionActive = false, runnerCurrentAnswer = 0, runnerChoices = [];

function runnerUpdate() {
  if(!runnerGameRunning) return;
  rctx.fillStyle = '#1a1a2e'; rctx.fillRect(0,0,runnerCanvas.width,runnerCanvas.height);
  
  // Draw road
  rctx.fillStyle = '#2d4059'; rctx.fillRect(0, 200, runnerCanvas.width, 200);
  rctx.fillStyle = '#444'; rctx.strokeStyle = '#fff'; rctx.lineWidth = 2;
  for(let i=0;i<5;i++) rctx.strokeRect(80 + i*80, runnerDistance%50, 60, 30);
  
  // Player
  rctx.fillStyle = '#ff6b6b'; rctx.fillRect(runnerPlayer.x, runnerPlayer.y, runnerPlayer.w, runnerPlayer.h);
  
  // Obstacles
  runnerObstacles.forEach(obs => {
    obs.y += runnerSpeed;
    rctx.fillStyle = obs.type==='tree' ? '#27ae60' : '#8b4513';
    rctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    if(obs.y > runnerCanvas.height) runnerObstacles.shift();
  });
  
  // Spawn obstacles
  if(rand(0,100) < 3) runnerObstacles.push({x: rand(80, 320), y: -40, w: 30, h: 40, type: rand(0,2)?'tree':'rock'});
  
  // Collision
  runnerObstacles.forEach(obs => {
    if(runnerPlayer.x < obs.x + obs.w && runnerPlayer.x + runnerPlayer.w > obs.x && runnerPlayer.y < obs.y + obs.h && runnerPlayer.y + runnerPlayer.h > obs.y) {
      runnerQuestionActive = true; runnerGameRunning = false;
      runnerShowQuestion();
    }
  });
  
  runnerDistance += 1;
  document.getElementById('r-score').textContent = runnerScore;
  document.getElementById('r-dist').textContent = Math.floor(runnerDistance/10);
  
  runnerGameId = requestAnimationFrame(runnerUpdate);
}

function runnerShowQuestion() {
  const a = rand(2,9), b = rand(2,9), correct = a*b;
  runnerCurrentAnswer = correct;
  document.getElementById('r-q-text').textContent = `${a} × ${b} = ?`;
  
  runnerChoices = [correct, rand(1,144), rand(1,144)].sort(() => Math.random()-0.5);
  const choicesDiv = document.querySelector('.r-choices');
  choicesDiv.innerHTML = '';
  runnerChoices.forEach(c => {
    const btn = document.createElement('button');
    btn.textContent = c;
    btn.addEventListener('click', () => {
      if(c === correct) {
        runnerScore += 50;
        document.getElementById('r-score').textContent = runnerScore;
      }
      document.getElementById('r-question-modal').hidden = true;
      runnerGameRunning = true;
      runnerUpdate();
    });
    choicesDiv.appendChild(btn);
  });
  document.getElementById('r-question-modal').hidden = false;
}

document.addEventListener('keydown', (e) => {
  if(!runnerGameRunning) return;
  if(e.key === 'ArrowLeft') runnerPlayer.x = Math.max(80, runnerPlayer.x - 20);
  if(e.key === 'ArrowRight') runnerPlayer.x = Math.min(runnerCanvas.width - 110, runnerPlayer.x + 20);
});

document.getElementById('r-start').addEventListener('click', () => {
  runnerPlayer = {x: 150, y: 300, w: 30, h: 40};
  runnerObstacles = [];
  runnerScore = 0; runnerDistance = 0; runnerSpeed = 2;
  runnerGameRunning = true;
  runnerUpdate();
});

document.getElementById('r-q-skip').addEventListener('click', () => {
  document.getElementById('r-question-modal').hidden = true;
  runnerGameRunning = true;
  runnerUpdate();
});

function rand(min,max){ return Math.floor(Math.random()*(max-min))+min; }

/* === GAME MANAGER & SHARED LOGIC === */
let currentGame = 'game1';
document.querySelectorAll('.game-card').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.game-card').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentGame = btn.dataset.game;
    document.querySelectorAll('.game-pane').forEach(pane => pane.hidden = true);
    document.getElementById(currentGame).hidden = false;
  });
});

function rand(min, max) { return Math.floor(Math.random() * (max - min)) + min; }

/* === GAME 1: TETRIS WITH MATH QUESTIONS === */
const tetrisCanvas = document.getElementById('tetris');
const nextCanvas = document.getElementById('next');
const ctx = tetrisCanvas.getContext('2d');
const nctx = nextCanvas.getContext('2d');

const COLS = 10, ROWS = 20, BLOCK = 22;
tetrisCanvas.width = COLS * BLOCK;
tetrisCanvas.height = ROWS * BLOCK;

let tetrisArena = createMatrix(COLS, ROWS);
let tetrisPlayer = { pos: {x:0,y:0}, matrix: null };
let tetrisNext = null;
let tetrisScore = 0, tetrisLevel = 1, tetrisDropInterval = 800, tetrisDropCounter = 0;
let tetrisLastTime = 0, tetrisRunning = false, tetrisGameId = null;

const pieces = 'TJLOSZI';
const colors = ['#a78bfa','#60a5fa','#fb7185','#fbbf24','#34d399','#f97316','#06b6d4'];

function createMatrix(w,h) {
  const m = []; while(h--) m.push(new Array(w).fill(0)); return m;
}

function createPiece(t) {
  const map = {T:[[0,1,0],[1,1,1],[0,0,0]],O:[[2,2],[2,2]],L:[[0,0,3],[3,3,3],[0,0,0]],J:[[4,0,0],[4,4,4],[0,0,0]],I:[[0,5,0,0],[0,5,0,0],[0,5,0,0],[0,5,0,0]],S:[[0,6,6],[6,6,0],[0,0,0]],Z:[[7,7,0],[0,7,7],[0,0,0]]};
  return map[t];
}

function drawMatrix(matrix, offset, canvas, ctxDraw) {
  matrix.forEach((row,y) => row.forEach((v,x) => {
    if(v) {
      ctxDraw.fillStyle = colors[v-1] || '#999';
      ctxDraw.fillRect((x+offset.x)*BLOCK, (y+offset.y)*BLOCK, BLOCK-1, BLOCK-1);
    }
  }));
}

function tetrisDraw() {
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0,0,tetrisCanvas.width,tetrisCanvas.height);
  drawMatrix(tetrisArena, {x:0,y:0}, tetrisCanvas, ctx);
  if(tetrisPlayer.matrix) drawMatrix(tetrisPlayer.matrix, tetrisPlayer.pos, tetrisCanvas, ctx);
}

function merge(a, p) { 
  p.matrix.forEach((row,y) => {
    row.forEach((v,x) => { 
      if(v && a[y+p.pos.y] && a[y+p.pos.y][x+p.pos.x] !== undefined) {
        a[y+p.pos.y][x+p.pos.x] = v;
      }
    });
  });
}
function collide(a, p) {
  const m = p.matrix;
  for(let y=0;y<m.length;y++) {
    for(let x=0;x<m[y].length;x++) {
      if(m[y][x]) {
        const newY = y + p.pos.y;
        const newX = x + p.pos.x;
        if(newY >= a.length || newX < 0 || newX >= a[0].length || (a[newY] && a[newY][newX] !== 0)) {
          return true;
        }
      }
    }
  }
  return false;
}

function tetrisPlayerDrop() {
  tetrisPlayer.pos.y++;
  if(collide(tetrisArena, tetrisPlayer)) {
    tetrisPlayer.pos.y--;
    merge(tetrisArena, tetrisPlayer);
    tetrisPlayerReset();
    const cleared = tetrisArenaSweep();
    if(cleared > 0) tetrisOnLineClear(cleared);
    tetrisUpdateHUD();
  }
  tetrisDropCounter = 0;
}

function tetrisPlayerMove(dir) {
  tetrisPlayer.pos.x += dir;
  if(collide(tetrisArena, tetrisPlayer)) tetrisPlayer.pos.x -= dir;
}

function tetrisRotate(m, d) {
  for(let y=0;y<m.length;y++) for(let x=0;x<y;x++) [m[x][y], m[y][x]] = [m[y][x], m[x][y]];
  if(d>0) m.forEach(row => row.reverse()); else m.reverse();
}

function tetrisPlayerRotate(d) {
  tetrisRotate(tetrisPlayer.matrix, d);
  let o = 1;
  while(collide(tetrisArena, tetrisPlayer)) {
    tetrisPlayer.pos.x += o;
    o = -(o + (o>0?1:-1));
    if(o > tetrisPlayer.matrix[0].length) { tetrisRotate(tetrisPlayer.matrix, -d); return; }
  }
}

function tetrisPlayerReset() {
  if(!tetrisNext) tetrisNext = createPiece(pieces[rand(0,pieces.length-1)]);
  tetrisPlayer.matrix = tetrisNext;
  tetrisNext = createPiece(pieces[rand(0,pieces.length-1)]);
  tetrisPlayer.pos.y = 0; tetrisPlayer.pos.x = Math.floor((COLS - tetrisPlayer.matrix[0].length)/2);
  if(collide(tetrisArena, tetrisPlayer)) {
    tetrisArena = createMatrix(COLS, ROWS);
    tetrisScore = 0; tetrisLevel = 1; tetrisRunning = false;
    alert('Game Over — nieuw spel');
  }
  tetrisDrawNext();
}

function tetrisDrawNext() {
  nctx.fillStyle = '#111'; nctx.fillRect(0,0,nextCanvas.width,nextCanvas.height);
  if(tetrisNext) drawMatrix(tetrisNext, {x:0,y:0}, nextCanvas, nctx);
}

function tetrisArenaSweep() {
  let cnt = 0;
  outer: for(let y=ROWS-1;y>=0;y--) {
    for(let x=0;x<COLS;x++) if(tetrisArena[y][x]===0) continue outer;
    const row = tetrisArena.splice(y,1)[0].fill(0);
    tetrisArena.unshift(row);
    y++; cnt++;
  }
  if(cnt>0) tetrisScore += cnt * 100;
  return cnt;
}

function tetrisUpdateHUD() {
  document.getElementById('t-score').textContent = tetrisScore;
  document.getElementById('t-level').textContent = tetrisLevel;
}

function tetrisOnLineClear(cnt) {
  tetrisPauseLoop();
  const a = rand(2,9), b = rand(2,9);
  document.getElementById('q-text').textContent = `${a} × ${b} = ?`;
  document.getElementById('q-answer').value = '';
  document.getElementById('question-modal').hidden = false;
  document.getElementById('q-submit').dataset.correct = a*b;
  document.getElementById('q-submit').dataset.lines = cnt;
}

document.getElementById('q-submit').addEventListener('click', () => {
  const correct = Number(document.getElementById('q-submit').dataset.correct);
  const answer = Number(document.getElementById('q-answer').value);
  const lines = Number(document.getElementById('q-submit').dataset.lines) || 1;
  document.getElementById('question-modal').hidden = true;
  if(answer === correct) {
    tetrisScore += lines * 200;
    tetrisLevel = Math.min(10, tetrisLevel + Math.floor(lines/1));
    tetrisDropInterval = Math.max(100, tetrisDropInterval - (tetrisLevel*20));
  } else {
    tetrisDropInterval = Math.max(80, Math.floor(tetrisDropInterval * 0.7));
  }
  tetrisUpdateHUD();
  tetrisResumeLoop();
});

document.getElementById('q-skip').addEventListener('click', () => {
  document.getElementById('question-modal').hidden = true;
  tetrisDropInterval = Math.max(80, Math.floor(tetrisDropInterval * 0.8));
  tetrisResumeLoop();
});

function tetrisUpdate(t=0) {
  if(!tetrisRunning) return;
  const delta = t - tetrisLastTime; tetrisLastTime = t;
  tetrisDropCounter += delta;
  if(tetrisDropCounter > tetrisDropInterval) {
    tetrisPlayerDrop();
  }
  tetrisDraw();
  tetrisGameId = requestAnimationFrame(tetrisUpdate);
}

function tetrisStartLoop() { if(!tetrisRunning) { tetrisRunning=true; tetrisLastTime=0; tetrisDropCounter=0; tetrisGameId = requestAnimationFrame(tetrisUpdate); } }
function tetrisPauseLoop() { tetrisRunning=false; if(tetrisGameId) cancelAnimationFrame(tetrisGameId); }
function tetrisResumeLoop() { if(!tetrisRunning) { tetrisRunning=true; tetrisLastTime=0; tetrisGameId=requestAnimationFrame(tetrisUpdate); } }

document.addEventListener('keydown',(e) => {
  if(currentGame !== 'game1' || !tetrisRunning) return;
  if(e.key === 'ArrowLeft') tetrisPlayerMove(-1);
  if(e.key === 'ArrowRight') tetrisPlayerMove(1);
  if(e.key === 'ArrowDown') tetrisPlayerDrop();
  if(e.key === 'ArrowUp') tetrisPlayerRotate(1);
  if(e.key === ' ') { while(!collide(tetrisArena, tetrisPlayer)) tetrisPlayer.pos.y++; tetrisPlayer.pos.y--; merge(tetrisArena, tetrisPlayer); tetrisPlayerReset(); tetrisArenaSweep(); tetrisUpdateHUD(); }
  tetrisDraw();
});

document.getElementById('t-start').addEventListener('click', () => {
  tetrisArena = createMatrix(COLS, ROWS); tetrisScore=0; tetrisLevel=1; tetrisDropInterval=800; tetrisNext=null; tetrisPlayerReset(); tetrisStartLoop(); tetrisUpdateHUD();
});
document.getElementById('t-pause').addEventListener('click', () => { if(tetrisRunning) tetrisPauseLoop(); else tetrisResumeLoop(); });

tetrisPlayerReset(); tetrisDraw(); tetrisDrawNext(); tetrisUpdateHUD();

/* === GAME 2: RUNNER (SUBWAY SURFER STYLE) === */
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
  if(currentGame !== 'game2' || !runnerGameRunning) return;
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

/* === GAME 3: RASTER (MULTIPLICATION TABLE GRID) === */
let rasterScore = 0, rasterCorrect = 0, rasterTotal = 10, rasterCurrent = 0;
let rasterQuestions = [];

function generateRasterQuestions() {
  rasterQuestions = [];
  for(let i=0;i<rasterTotal;i++) {
    const a = rand(2,12), b = rand(2,12);
    rasterQuestions.push({a,b,answer: a*b});
  }
}

function displayRasterQuestion() {
  if(rasterCurrent >= rasterTotal) {
    alert(`Klaar! Score: ${rasterScore}`);
    rasterScore = 0; rasterCorrect = 0; rasterCurrent = 0;
    return;
  }
  const q = rasterQuestions[rasterCurrent];
  document.getElementById('ra-answer-text').textContent = q.answer;
  
  // Create grid with random table values
  const gridDiv = document.getElementById('raster-grid');
  gridDiv.innerHTML = '';
  const grid = [];
  for(let i=0;i<25;i++) {
    if(i === rand(0,24)) {
      grid.push(q.answer);
    } else {
      grid.push(rand(2,12) * rand(2,12));
    }
  }
  grid.sort(() => Math.random()-0.5);
  
  grid.forEach((val, idx) => {
    const cell = document.createElement('div');
    cell.className = 'raster-cell';
    cell.textContent = val;
    cell.addEventListener('click', () => {
      if(val === q.answer) {
        cell.classList.add('correct');
        rasterScore += 10;
        rasterCorrect += 1;
        setTimeout(() => { rasterCurrent++; displayRasterQuestion(); }, 500);
      } else {
        cell.classList.add('wrong');
      }
    });
    gridDiv.appendChild(cell);
  });
}

document.getElementById('ra-start').addEventListener('click', () => {
  rasterScore = 0; rasterCorrect = 0; rasterCurrent = 0;
  generateRasterQuestions();
  document.getElementById('ra-score').textContent = rasterScore;
  document.getElementById('ra-correct').textContent = `${rasterCorrect}/${rasterTotal}`;
  displayRasterQuestion();
});

/* TETRIS GAME - Standalone */
const tetrisCanvas = document.getElementById('tetris');
const nextCanvas = document.getElementById('next');
const ctx = tetrisCanvas.getContext('2d');
const nctx = nextCanvas.getContext('2d');

const COLS = 10, ROWS = 20;
let BLOCK = 22;

// initial canvas size will be set by resizeTetris()
function resizeTetris() {
  const container = document.querySelector('.tetris-wrap') || tetrisCanvas.parentElement;
  const nextWrap = document.querySelector('.next-wrap');
  const gap = 12;
  const containerStyle = container ? window.getComputedStyle(container) : { flexDirection: 'row' };
  const isColumn = containerStyle.flexDirection === 'column';
  let availableWidth = container ? container.clientWidth : Math.min(window.innerWidth * 0.9, 520);
  if (!isColumn && nextWrap) {
    // subtract next area if side-by-side
    availableWidth = Math.max(160, availableWidth - (nextWrap.offsetWidth + gap));
  }
  const availableHeight = Math.min(550, Math.floor(window.innerHeight * 0.72));
  BLOCK = Math.max(12, Math.floor(Math.min(availableWidth / COLS, availableHeight / ROWS)));
  tetrisCanvas.width = COLS * BLOCK;
  tetrisCanvas.height = ROWS * BLOCK;
  // make next preview sized relative to BLOCK
  nextCanvas.width = Math.max(4, (tetrisNext && tetrisNext[0] ? tetrisNext[0].length : 4)) * BLOCK;
  nextCanvas.height = 4 * BLOCK;
  // set style width so CSS scaling stays consistent
  tetrisCanvas.style.width = tetrisCanvas.width + 'px';
  nextCanvas.style.width = nextCanvas.width + 'px';
  // redraw to apply new sizing
  tetrisDraw();
  tetrisDrawNext();
}

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

// small DOM confetti helper
function spawnConfetti(count = 28) {
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti';
    el.style.left = (50 + (Math.random() - 0.5) * 30) + 'vw';
    el.style.background = ['#ff4757','#ff6b81','#1e90ff','#2ed573','#ffa502'][Math.floor(Math.random()*5)];
    el.style.transform = `rotate(${Math.random()*360}deg)`;
    el.style.top = (Math.random()*10) + 'vh';
    el.style.width = (6 + Math.random()*10) + 'px';
    el.style.height = (8 + Math.random()*12) + 'px';
    document.body.appendChild(el);
    setTimeout(()=> el.remove(), 1600 + Math.random()*600);
  }
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
    // celebratory confetti
    spawnConfetti();
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
  if(!tetrisRunning) return;
  if(e.key === 'ArrowLeft') tetrisPlayerMove(-1);
  if(e.key === 'ArrowRight') tetrisPlayerMove(1);
  if(e.key === 'ArrowDown') tetrisPlayerDrop();
  if(e.key === 'ArrowUp') tetrisPlayerRotate(1);
  if(e.key === ' ') { while(!collide(tetrisArena, tetrisPlayer)) tetrisPlayer.pos.y++; tetrisPlayer.pos.y--; merge(tetrisArena, tetrisPlayer); tetrisPlayerReset(); tetrisArenaSweep(); tetrisUpdateHUD(); }
  tetrisDraw();
});

document.getElementById('t-start').addEventListener('click', () => {
  // ensure question modal is hidden when starting
  tetrisArena = createMatrix(COLS, ROWS); tetrisScore=0; tetrisLevel=1; tetrisDropInterval=800; tetrisNext=null; document.getElementById('question-modal').hidden = true; tetrisPlayerReset(); tetrisStartLoop(); tetrisUpdateHUD();
});
document.getElementById('t-pause').addEventListener('click', () => { if(tetrisRunning) tetrisPauseLoop(); else tetrisResumeLoop(); });

function rand(min, max) { return Math.floor(Math.random() * (max - min)) + min; }

tetrisPlayerReset(); tetrisDraw(); tetrisDrawNext(); tetrisUpdateHUD();

// ensure modals are hidden on initial load
if(document.getElementById('question-modal')) document.getElementById('question-modal').hidden = true;

// set responsive sizing and attach resize handler
resizeTetris();
window.addEventListener('resize', () => {
  resizeTetris();
});

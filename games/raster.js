/* RASTER GAME - Standalone */
let rasterScore = 0, rasterCorrect = 0, rasterTotal = 10, rasterCurrent = 0;
let rasterQuestions = [];

function rand(min, max) { return Math.floor(Math.random() * (max - min)) + min; }

// simple confetti helper
function spawnConfetti(count = 20) {
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti';
    el.style.left = (30 + Math.random()*40) + 'vw';
    el.style.background = ['#ff4757','#ff6b81','#1e90ff','#2ed573','#ffa502'][Math.floor(Math.random()*5)];
    el.style.top = (Math.random()*20) + 'vh';
    el.style.width = (6 + Math.random()*8) + 'px';
    el.style.height = (8 + Math.random()*10) + 'px';
    document.body.appendChild(el);
    setTimeout(()=> el.remove(), 1400 + Math.random()*600);
  }
}

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
  // show the multiplication question, not the raw answer
  document.getElementById('ra-answer-text').textContent = `${q.a} × ${q.b}`;
  
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
        document.getElementById('ra-score').textContent = rasterScore;
        document.getElementById('ra-correct').textContent = `${rasterCorrect}/${rasterTotal}`;
        spawnConfetti();
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

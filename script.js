/* Data model */
const recordAssists = 1076; // Bobby Hurley (Duke)

const allLeaders = [
  { rank: 1, name: "Bobby Hurley", school: "Duke", assists: 1076 },
  { rank: 2, name: "Chris Corchiani", school: "NC State", assists: 1038 },
  { rank: 3, name: "Ed Cota", school: "North Carolina", assists: 1030 },
  { rank: 4, name: "Jason Brickman", school: "LIU Brooklyn", assists: 1009 },
  { rank: 5, name: "Keith Gatlin", school: "Maryland", assists: 972 },
  { rank: 6, name: "Sherman Douglas", school: "Syracuse", assists: 960 },
  { rank: 7, name: "T.J. Ford", school: "Texas", assists: 953 },
  { rank: 8, name: "Aaron Miles", school: "Kansas", assists: 954 },
  { rank: 9, name: "Greg Anthony", school: "UNLV", assists: 950 },
];

const activePlayers = [
  { id: "smith", name: "Braden Smith", school: "Purdue", assists: 838, rank: 11 },
];

/* Elements */
const $assists = (id) => document.getElementById(id);
const els = {
  playerName: $assists("player-name"),
  playerSchool: $assists("player-school"),
  playerRank: $assists("player-rank"),
  playerRankingText: $assists("player-ranking-text"),
  playerAssists: $assists("player-assists"),
  progressPercent: $assists("progress-percent"),
  progressFill: $assists("progress-fill"),
  assistsToRecord: $assists("assists-to-record"),
  assistsToNext: $assists("assists-to-next"),
  gamesAt5: $assists("games-at-5"),
  tickStart: $assists("tick-start-label"),
  tickEnd: $assists("tick-end-label"),
  layer: $assists("timeline-layer"),
  track: $assists("timeline-track"),
  progressTrack: $assists("timeline-progress"),
  playerSelect: $assists("player-select"),
  assistsInput: $assists("assists-input"),
  btnAdd: $assists("btn-add"),
  btnSubtract: $assists("btn-subtract"),
  playerCurrentLine: $assists("player-current-line"),
  toggleAdmin: $assists("toggle-admin"),
  adminPanel: $assists("admin-panel"),
};

/* Utilities */
function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }
function fmt(n){ return n.toLocaleString(); }
function percent(n){ return `${n.toFixed(1)}%`; }
function easeNumber(el, target, {duration=600}={}){
  const start = Number(el.dataset.value || 0);
  const diff = target - start;
  const t0 = performance.now();
  function tick(t){
    const p = clamp((t - t0)/duration, 0, 1);
    const eased = (1 - Math.pow(1 - p, 3));
    const value = Math.round(start + diff * eased);
    el.textContent = fmt(value);
    el.dataset.value = String(value);
    if(p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* State */
let currentPlayer = {...activePlayers[0]};

function recompute(){
  // Header
  els.playerName.textContent = currentPlayer.name;
  els.playerSchool.textContent = currentPlayer.school;
  els.playerRank.textContent = `#${currentPlayer.rank}`;
  els.playerRankingText.textContent = `Current Ranking: #${currentPlayer.rank} All‑Time`;
  easeNumber(els.playerAssists, currentPlayer.assists);

  // Stats
  const toRecord = Math.max(0, recordAssists - currentPlayer.assists);
  easeNumber(els.assistsToRecord, toRecord);

  // Find the next milestone (Greg Anthony by default)
  const sorted = [...allLeaders].sort((a,b)=>a.assists-b.assists);
  const next = sorted.find(p => p.assists > currentPlayer.assists);
  const nextThreshold = next ? next.assists : recordAssists;
  const toNext = Math.max(0, nextThreshold - currentPlayer.assists);
  easeNumber(els.assistsToNext, toNext);
  els.gamesAt5.textContent = `~${Math.ceil(toNext / 5)}`;

  // Progress percent
  const pct = clamp((currentPlayer.assists / recordAssists) * 100, 0, 100);
  els.progressPercent.textContent = `${pct.toFixed(1)}%`;
  els.progressFill.style.width = `${pct}%`;

  // Ticks
  els.tickStart.textContent = fmt(currentPlayer.assists);
  els.tickEnd.textContent = fmt(recordAssists);

  // Timeline visuals
  drawTimeline(sorted);

  // Footer line
  els.playerCurrentLine.textContent = `${currentPlayer.name} currently has ${fmt(currentPlayer.assists)} career assists (Active Player)`;

  // Update player option label
  const opt = els.playerSelect.querySelector(`option[value="${currentPlayer.id}"]`);
  if(opt) opt.textContent = `${currentPlayer.name} (${fmt(currentPlayer.assists)})`;
}

function asPercentOfRange(value, start, end){
  const range = Math.max(1, end - start);
  return clamp(((value - start) / range) * 100, 0, 100);
}

function makeCard({ className, leftPct, title, subtitle, value, rank, index = 0 }){
  const div = document.createElement('div');
  div.className = className;
  
  // Horizontal positioning based on timeline percentage
  const cardWidth = 220; // Updated card width from CSS
  const leftPosition = Math.max(0, Math.min(leftPct - (cardWidth / 2), 100 - (cardWidth / 2)));
  div.style.left = `${leftPosition}%`;
  
  // Horizontal distribution with alternating above/below positioning
  const timelineCenter = 100; // Updated timeline track position
  
  let bottomPosition;
  if (index === 0) {
    // Braden Smith card at bottom
    bottomPosition = 20;
  } else {
    // Alternate cards above and below timeline, but distribute horizontally
    const isAbove = index % 2 === 1; // Alternate positioning
    const verticalSpacing = 80; // Increased vertical distance from timeline
    
    if (isAbove) {
      bottomPosition = timelineCenter + verticalSpacing;
    } else {
      bottomPosition = timelineCenter - verticalSpacing;
    }
  }
  
  div.style.bottom = `${bottomPosition}px`;

  div.innerHTML = `
    <div class="card-title">${rank ? `<span class=rank>${rank}</span>` : ''}<strong>${title}</strong></div>
    <div class="card-sub">${subtitle}</div>
    <div class="card-metric"><strong>${fmt(value)}</strong> career assists</div>
  `;
  return div;
}

function drawTimeline(sortedLeaders){
  els.layer.innerHTML = '';

  // Player card at start
  const startPct = 0;
  const smithCard = makeCard({ className: 'smith-card', leftPct: startPct, title: currentPlayer.name, subtitle: currentPlayer.school, value: currentPlayer.assists, index: 0 });
  els.layer.appendChild(smithCard);

  // Progress overlay from start to player's current vs record
  const progressPct = asPercentOfRange(currentPlayer.assists, 0, recordAssists);
  els.progressTrack.style.width = `${progressPct}%`;

  // Leader cards (those above the player up to the record)
  const filtered = sortedLeaders.filter(p => p.assists > currentPlayer.assists && p.assists <= recordAssists);
  for(let i = 0; i < filtered.length; i++){
    const leader = filtered[i];
    const pct = asPercentOfRange(leader.assists, currentPlayer.assists, recordAssists);
    const card = makeCard({ className: 'leader-card', leftPct: pct, title: leader.name, subtitle: leader.school, value: leader.assists, rank: leader.rank, index: i + 1 });
    els.layer.appendChild(card);
  }
}

function initSelect(){
  els.playerSelect.innerHTML = '';
  for(const p of activePlayers){
    const opt = document.createElement('option');
    opt.value = p.id; opt.textContent = `${p.name} (${fmt(p.assists)})`;
    els.playerSelect.appendChild(opt);
  }
  els.playerSelect.value = currentPlayer.id;
}

function bindEvents(){
  els.btnAdd.addEventListener('click', () => {
    const toAdd = Math.max(0, parseInt(els.assistsInput.value, 10) || 0);
    currentPlayer.assists += toAdd;
    recompute();
  });
  els.btnSubtract.addEventListener('click', () => {
    const toSub = Math.max(0, parseInt(els.assistsInput.value, 10) || 0);
    currentPlayer.assists = Math.max(0, currentPlayer.assists - toSub);
    recompute();
  });
  els.playerSelect.addEventListener('change', (e) => {
    const id = e.target.value;
    const selected = activePlayers.find(p => p.id === id);
    if(selected){ currentPlayer = {...selected}; recompute(); }
  });
  els.toggleAdmin.addEventListener('click', () => {
    const expanded = els.toggleAdmin.getAttribute('aria-expanded') === 'true';
    if(expanded){
      els.adminPanel.style.display = 'none';
      els.toggleAdmin.textContent = 'Show Admin Panel';
      els.toggleAdmin.setAttribute('aria-expanded','false');
    } else {
      els.adminPanel.style.display = '';
      els.toggleAdmin.textContent = 'Hide Admin Panel';
      els.toggleAdmin.setAttribute('aria-expanded','true');
    }
  });
}

function boot(){
  initSelect();
  bindEvents();
  recompute();
}

document.addEventListener('DOMContentLoaded', boot);
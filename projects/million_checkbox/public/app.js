/* ────────────────────────────────────────────────────────────────────
 * Million Checkboxes — Client
 *
 * Renders a 1 000 × 1 000 grid (1 000 000 checkboxes) on a <canvas>.
 * Only the cells visible in the scroll viewport are drawn each frame.
 * State is held locally in a 125 KB Uint8Array bitmap that mirrors
 * the Redis bitmap on the server.
 * ────────────────────────────────────────────────────────────────── */

// ── Constants ───────────────────────────────────────────────────────
const TOTAL     = 1_000_000;
const COLS      = 1000;
const ROWS      = 1000;
const CELL_SIZE = 16;          // px per cell (including 2 px gap)
const BOX_SIZE  = 14;          // actual filled square
const BITMAP_BYTES = Math.ceil(TOTAL / 8);   // 125 000

const GRID_W = COLS * CELL_SIZE;   // 16 000
const GRID_H = ROWS * CELL_SIZE;

// ── Colours ─────────────────────────────────────────────────────────
const COL_OFF        = '#1e1e3a';
const COL_ON         = '#00d4aa';
const COL_HOVER      = '#2e2e5a';
const COL_HOVER_AUTH = '#00ffcc';
const COL_BG         = '#16162a';
const COL_CHECK      = '#0a0a1a';

// ── State ───────────────────────────────────────────────────────────
let state        = new Uint8Array(BITMAP_BYTES);
let checkedCount = 0;
let user         = null;   // set after /auth/me
let ws           = null;
let reconnectDelay = 500;
let hoverIndex   = -1;
let cooldownActive = false;

// ── DOM refs ────────────────────────────────────────────────────────
const scrollContainer = document.getElementById('scroll-container');
const scrollInner     = document.getElementById('scroll-inner');
const canvas          = document.getElementById('grid-canvas');
const ctx             = canvas.getContext('2d');

const checkedCountEl = document.getElementById('checked-count');
const userCountEl    = document.getElementById('user-count');
const statusPill     = document.getElementById('status-pill');
const statusText     = document.getElementById('status-text');
const userInfoEl     = document.getElementById('user-info');
const loginBtn       = document.getElementById('login-btn');
const logoutBtn      = document.getElementById('logout-btn');
const userNameEl     = document.getElementById('user-name');
const authBanner     = document.getElementById('auth-banner');
const rowIndicator   = document.getElementById('row-indicator');
const colIndicator   = document.getElementById('col-indicator');
const jumpInput      = document.getElementById('jump-input');
const jumpBtn        = document.getElementById('jump-btn');

// ── Virtual scroll dimensions ───────────────────────────────────────
scrollInner.style.width  = GRID_W + 'px';
scrollInner.style.height = GRID_H + 'px';

// ── Bitmap helpers ──────────────────────────────────────────────────
function getBit(i) {
  return (state[i >> 3] >> (7 - (i & 7))) & 1;
}
function setBit(i, v) {
  const byteIdx = i >> 3;
  const mask = 0x80 >> (i & 7);
  if (v) state[byteIdx] |= mask;
  else   state[byteIdx] &= ~mask;
}

// ── Canvas sizing ───────────────────────────────────────────────────
function resizeCanvas() {
  const r = scrollContainer.getBoundingClientRect();
  canvas.width  = r.width;
  canvas.height = r.height;
  render();
}
window.addEventListener('resize', resizeCanvas);

// ── Main render ─────────────────────────────────────────────────────
let renderQueued = false;
function scheduleRender() {
  if (!renderQueued) {
    renderQueued = true;
    requestAnimationFrame(() => { renderQueued = false; render(); });
  }
}

function render() {
  const sx = scrollContainer.scrollLeft;
  const sy = scrollContainer.scrollTop;
  const vw = canvas.width;
  const vh = canvas.height;
  if (!vw || !vh) return;

  const startCol = Math.floor(sx / CELL_SIZE);
  const startRow = Math.floor(sy / CELL_SIZE);
  const endCol   = Math.min(startCol + Math.ceil(vw / CELL_SIZE) + 1, COLS);
  const endRow   = Math.min(startRow + Math.ceil(vh / CELL_SIZE) + 1, ROWS);

  // Background
  ctx.fillStyle = COL_BG;
  ctx.fillRect(0, 0, vw, vh);

  for (let row = startRow; row < endRow; row++) {
    for (let col = startCol; col < endCol; col++) {
      const idx = row * COLS + col;
      const x = col * CELL_SIZE - sx;
      const y = row * CELL_SIZE - sy;
      const on = getBit(idx);

      // Hover highlight
      if (idx === hoverIndex) {
        ctx.fillStyle = user ? COL_HOVER_AUTH : COL_HOVER;
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      }

      // Cell box
      ctx.fillStyle = on ? COL_ON : COL_OFF;
      ctx.fillRect(x + 1, y + 1, BOX_SIZE, BOX_SIZE);

      // Checkmark for ON cells
      if (on) {
        ctx.strokeStyle = COL_CHECK;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 8);
        ctx.lineTo(x + 7, y + 11);
        ctx.lineTo(x + 12, y + 4);
        ctx.stroke();
      }
    }
  }

  // Position indicator
  rowIndicator.textContent = startRow + 1;
  colIndicator.textContent = startCol + 1;
}

// ── Scroll handling ─────────────────────────────────────────────────
scrollContainer.addEventListener('scroll', () => {
  scheduleRender();
});

// ── Hover tracking ──────────────────────────────────────────────────
canvas.addEventListener('mousemove', (e) => {
  const r = canvas.getBoundingClientRect();
  const gx = e.clientX - r.left + scrollContainer.scrollLeft;
  const gy = e.clientY - r.top  + scrollContainer.scrollTop;
  const col = Math.floor(gx / CELL_SIZE);
  const row = Math.floor(gy / CELL_SIZE);
  const ni = (col >= 0 && col < COLS && row >= 0 && row < ROWS) ? row * COLS + col : -1;
  if (ni !== hoverIndex) { hoverIndex = ni; scheduleRender(); }
});
canvas.addEventListener('mouseleave', () => { hoverIndex = -1; scheduleRender(); });

// ── Click to toggle ─────────────────────────────────────────────────
canvas.addEventListener('click', (e) => {
  if (!user) return;
  if (cooldownActive) return;
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  const r = canvas.getBoundingClientRect();
  const gx = e.clientX - r.left + scrollContainer.scrollLeft;
  const gy = e.clientY - r.top  + scrollContainer.scrollTop;
  const col = Math.floor(gx / CELL_SIZE);
  const row = Math.floor(gy / CELL_SIZE);

  if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
    ws.send(JSON.stringify({ type: 'toggle', index: row * COLS + col }));
  }
});

// ── Jump to index ───────────────────────────────────────────────────
jumpBtn.addEventListener('click', () => {
  const idx = parseInt(jumpInput.value);
  if (isNaN(idx) || idx < 0 || idx >= TOTAL) return;
  const row = Math.floor(idx / COLS);
  const col = idx % COLS;
  scrollContainer.scrollTo({
    left: col * CELL_SIZE - scrollContainer.clientWidth  / 2,
    top:  row * CELL_SIZE - scrollContainer.clientHeight / 2,
    behavior: 'smooth',
  });
});
jumpInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') jumpBtn.click(); });

// ── Auth ────────────────────────────────────────────────────────────
async function checkAuth() {
  try {
    const res = await fetch('/auth/me');
    const data = await res.json();
    user = data.user;
  } catch { user = null; }
  updateAuthUI();
}

function updateAuthUI() {
  if (user) {
    userInfoEl.classList.remove('hidden');
    loginBtn.classList.add('hidden');
    authBanner.classList.add('hidden');
    userNameEl.textContent = user.name;
    canvas.style.cursor = 'pointer';
  } else {
    userInfoEl.classList.add('hidden');
    loginBtn.classList.remove('hidden');
    authBanner.classList.remove('hidden');
    canvas.style.cursor = 'default';
  }
}

logoutBtn.addEventListener('click', async () => {
  const res = await fetch('/auth/logout', { method: 'POST' });
  const data = await res.json();
  user = null;
  updateAuthUI();
  // Trigger OIDC RP-initiated logout to also clear the OIDC server session
  if (data.logoutUrl) window.location.href = data.logoutUrl;
});

// ── WebSocket ───────────────────────────────────────────────────────
function setStatus(s) {
  statusText.textContent = { connected: 'live', disconnected: 'offline', connecting: 'connecting\u2026' }[s] || s;
  statusPill.className = 'status-pill ' + s;
}

function connectWS() {
  setStatus('connecting');
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${proto}://${location.host}`);

  ws.onopen = () => { setStatus('connected'); reconnectDelay = 500; };

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    switch (msg.type) {
      case 'connected':
        userCountEl.textContent = msg.connectedUsers;
        break;
      case 'toggle': {
        setBit(msg.index, msg.state);
        checkedCount += msg.state ? 1 : -1;
        checkedCountEl.textContent = checkedCount.toLocaleString();
        scheduleRender();
        break;
      }
      case 'users':
        userCountEl.textContent = msg.count;
        break;
      case 'error':
        console.warn('[server]', msg.message);
        if (msg.message && msg.message.includes('Rate limit')) {
          showCooldownPopup();
        }
        break;
    }
  };

  ws.onclose = () => {
    setStatus('disconnected');
    setTimeout(() => {
      reconnectDelay = Math.min(reconnectDelay * 1.5, 10000);
      connectWS();
    }, reconnectDelay);
  };

  ws.onerror = () => ws.close();
}

// ── Fetch initial state ─────────────────────────────────────────────
async function fetchState() {
  try {
    const [bmpRes, statsRes] = await Promise.all([
      fetch('/api/checkboxes'),
      fetch('/api/stats'),
    ]);

    if (bmpRes.ok) {
      const buf = await bmpRes.arrayBuffer();
      state = new Uint8Array(buf);
    }
    if (statsRes.ok) {
      const s = await statsRes.json();
      checkedCount = s.checked;
      checkedCountEl.textContent = checkedCount.toLocaleString();
    }

    render();
  } catch (err) {
    console.error('Failed to fetch initial state:', err);
  }
}

// ── Cooldown popup ──────────────────────────────────────────────────
const cooldownPopup = document.getElementById('cooldown-popup');
const cooldownTimer = document.getElementById('cooldown-timer');

function showCooldownPopup() {
  if (cooldownActive) return;
  cooldownActive = true;
  let remaining = 5;
  cooldownTimer.textContent = remaining;
  cooldownPopup.classList.remove('hidden');

  const interval = setInterval(() => {
    remaining--;
    cooldownTimer.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(interval);
      cooldownActive = false;
      cooldownPopup.classList.add('hidden');
    }
  }, 1000);
}

// ── Boot ────────────────────────────────────────────────────────────
(async function init() {
  resizeCanvas();
  await checkAuth();
  await fetchState();
  connectWS();
})();

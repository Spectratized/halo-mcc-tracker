/**
 * Bungie.net 2007 Halo 3 Service Record Theme - Application Engine
 * Original Xbox Dark Green Edition
 * Halo MCC 700 Achievements Manifest with Active / Next Up Target Tracking
 */

// Application State
const state = {
  achievements: typeof MCC_ACHIEVEMENTS !== 'undefined' ? MCC_ACHIEVEMENTS : [],
  unlockedMap: {}, // api_name (lower) -> timestamp or true
  activeTargets: {}, // api_name (lower) -> true
  filters: {
    search: '',
    status: 'all', // 'all', 'unlocked', 'locked', 'active'
    game: 'all',
    type: 'all',
    rarity: 'all',
    sort: 'default'
  },
  viewMode: 'retro', // 'retro' | 'table'
  collapsedGames: {}, // id -> boolean
  player: null,
  isSyncing: false
};

// Storage Keys
const STORAGE_KEY = 'mcc_xbox_tracker_unlocked_v3';
const STORAGE_PLAYER_KEY = 'mcc_xbox_tracker_player_v3';
const STORAGE_TARGETS_KEY = 'mcc_xbox_active_targets_v1';
const STORAGE_VIEW_MODE_KEY = 'mcc_xbox_view_mode_v1';
const STORAGE_COLLAPSED_GAMES_KEY = 'mcc_xbox_collapsed_games_v1';

// RetroAchievements Game Definitions & Key Art
const RETRO_GAMES = [
  {
    id: 'h1',
    gameKey: 'Halo: Combat Evolved',
    title: 'Halo 1: Combat Evolved',
    short: 'HALO 1',
    tagClass: 'tag-ce',
    appId: 1064221,
    headerImg: 'https://cdn.akamai.steamstatic.com/steam/apps/1064221/header.jpg',
    order: 1
  },
  {
    id: 'h2',
    gameKey: 'Halo 2: Anniversary',
    title: 'Halo 2: Anniversary',
    short: 'HALO 2',
    tagClass: 'tag-h2a',
    appId: 1064270,
    headerImg: 'https://cdn.akamai.steamstatic.com/steam/apps/1064270/header.jpg',
    order: 2
  },
  {
    id: 'h3',
    gameKey: 'Halo 3',
    title: 'Halo 3',
    short: 'HALO 3',
    tagClass: 'tag-h3',
    appId: 1064271,
    headerImg: 'https://cdn.akamai.steamstatic.com/steam/apps/1064271/header.jpg',
    order: 3
  },
  {
    id: 'odst',
    gameKey: 'Halo 3: ODST',
    title: 'Halo 3: ODST',
    short: 'ODST',
    tagClass: 'tag-odst',
    appId: 1064272,
    headerImg: 'https://cdn.akamai.steamstatic.com/steam/apps/1064272/header.jpg',
    order: 4
  },
  {
    id: 'h4',
    gameKey: 'Halo 4',
    title: 'Halo 4',
    short: 'HALO 4',
    tagClass: 'tag-h4',
    appId: 1064273,
    headerImg: 'https://cdn.akamai.steamstatic.com/steam/apps/1064273/header.jpg',
    order: 5
  },
  {
    id: 'reach',
    gameKey: 'Halo: Reach',
    title: 'Halo: Reach',
    short: 'REACH',
    tagClass: 'tag-reach',
    appId: 1064220,
    headerImg: 'https://cdn.akamai.steamstatic.com/steam/apps/1064220/header.jpg',
    order: 6
  },
  {
    id: 'global',
    gameKey: 'Cross-Game / Global',
    title: 'Halo: MCC Global Directives',
    short: 'GLOBAL',
    tagClass: 'tag-global',
    appId: 976730,
    headerImg: 'https://cdn.akamai.steamstatic.com/steam/apps/976730/header.jpg',
    order: 7
  }
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadSavedState();
  initEventListeners();
  initTooltip();
  applyViewMode(state.viewMode);
  renderDashboard();
  renderAchievements();
});

// Load state from localStorage
function loadSavedState() {
  try {
    const savedUnlocked = localStorage.getItem(STORAGE_KEY);
    if (savedUnlocked) {
      state.unlockedMap = JSON.parse(savedUnlocked);
    }
    const savedTargets = localStorage.getItem(STORAGE_TARGETS_KEY);
    if (savedTargets) {
      state.activeTargets = JSON.parse(savedTargets);
    }
    const savedPlayer = localStorage.getItem(STORAGE_PLAYER_KEY);
    if (savedPlayer) {
      state.player = JSON.parse(savedPlayer);
      updateSpartanDossier(state.player);
    }
    const savedViewMode = localStorage.getItem(STORAGE_VIEW_MODE_KEY);
    if (savedViewMode === 'table' || savedViewMode === 'retro') {
      state.viewMode = savedViewMode;
    }
    const savedCollapsed = localStorage.getItem(STORAGE_COLLAPSED_GAMES_KEY);
    if (savedCollapsed) {
      state.collapsedGames = JSON.parse(savedCollapsed);
    }
  } catch (e) {
    console.warn('Failed to load local storage state:', e);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.unlockedMap));
    localStorage.setItem(STORAGE_TARGETS_KEY, JSON.stringify(state.activeTargets));
    localStorage.setItem(STORAGE_VIEW_MODE_KEY, state.viewMode);
    localStorage.setItem(STORAGE_COLLAPSED_GAMES_KEY, JSON.stringify(state.collapsedGames));
    if (state.player) {
      localStorage.setItem(STORAGE_PLAYER_KEY, JSON.stringify(state.player));
    }
  } catch (e) {
    console.warn('Failed to save state to localStorage:', e);
  }
}

// Event Listeners
function initEventListeners() {
  // Steam Sync button
  const syncBtn = document.getElementById('sync-steam-btn');
  const steamInput = document.getElementById('steam-username-input');
  if (syncBtn) {
    syncBtn.addEventListener('click', () => {
      const val = steamInput ? steamInput.value.trim() : '';
      if (val) {
        syncSteamUser(val);
      } else {
        alert('[INPUT REQUIRED]: Enter Steam Username, Custom URL, or SteamID64.');
        if (steamInput) steamInput.focus();
      }
    });
  }

  if (steamInput) {
    steamInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (syncBtn) syncBtn.click();
      }
    });
  }

  // Clear all active targets button
  const clearTargetsBtn = document.getElementById('clear-targets-btn');
  if (clearTargetsBtn) {
    clearTargetsBtn.addEventListener('click', () => {
      const count = Object.keys(state.activeTargets).length;
      if (count === 0) return;
      if (confirm(`[CONFIRMATION]: Clear all ${count} marked 'Next Up' targets?`)) {
        state.activeTargets = {};
        saveState();
        renderDashboard();
        renderAchievements();
      }
    });
  }

  // Search input
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.filters.search = e.target.value.toLowerCase().trim();
      renderAchievements();
    });
  }

  // Status tabs (ALL, UNLOCKED, LOCKED, NEXT UP)
  const statusTabs = document.querySelectorAll('.status-tab-btn');
  statusTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      statusTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.filters.status = tab.getAttribute('data-status');
      renderAchievements();
    });
  });

  // Theater / Game Filter Dropdown
  const gameFilter = document.getElementById('game-filter');
  if (gameFilter) {
    gameFilter.addEventListener('change', (e) => {
      state.filters.game = e.target.value;
      renderAchievements();
    });
  }

  // Classification / Category Filter Dropdown
  const typeFilter = document.getElementById('type-filter');
  if (typeFilter) {
    typeFilter.addEventListener('change', (e) => {
      state.filters.type = e.target.value;
      renderAchievements();
    });
  }

  // Rarity filter dropdown
  const rarityFilter = document.getElementById('rarity-filter');
  if (rarityFilter) {
    rarityFilter.addEventListener('change', (e) => {
      state.filters.rarity = e.target.value;
      renderAchievements();
    });
  }

  // Sort order dropdown
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.filters.sort = e.target.value;
      renderAchievements();
    });
  }

  // View Mode Switcher buttons
  const btnRetro = document.getElementById('view-btn-retro');
  const btnTable = document.getElementById('view-btn-table');
  if (btnRetro) {
    btnRetro.addEventListener('click', () => setViewMode('retro'));
  }
  if (btnTable) {
    btnTable.addEventListener('click', () => setViewMode('table'));
  }

  // Expand / Collapse All buttons (for Retro Grid view)
  const expandAllBtn = document.getElementById('retro-expand-all');
  const collapseAllBtn = document.getElementById('retro-collapse-all');
  if (expandAllBtn) {
    expandAllBtn.addEventListener('click', () => {
      state.collapsedGames = {};
      saveState();
      renderAchievements();
    });
  }
  if (collapseAllBtn) {
    collapseAllBtn.addEventListener('click', () => {
      RETRO_GAMES.forEach(g => {
        state.collapsedGames[g.id] = true;
      });
      saveState();
      renderAchievements();
    });
  }
}

// Switch and Apply View Mode (Table vs Retro Grid)
function applyViewMode(mode) {
  const tableWrapper = document.getElementById('manifest-table-wrapper');
  const retroWrapper = document.getElementById('retro-hub-wrapper');
  const btnRetro = document.getElementById('view-btn-retro');
  const btnTable = document.getElementById('view-btn-table');
  const expandControls = document.getElementById('retro-expand-controls');

  if (mode === 'retro') {
    if (tableWrapper) tableWrapper.style.display = 'none';
    if (retroWrapper) retroWrapper.style.display = 'flex';
    if (btnRetro) btnRetro.classList.add('active');
    if (btnTable) btnTable.classList.remove('active');
    if (expandControls) expandControls.style.display = 'flex';
  } else {
    if (tableWrapper) tableWrapper.style.display = 'block';
    if (retroWrapper) retroWrapper.style.display = 'none';
    if (btnRetro) btnRetro.classList.remove('active');
    if (btnTable) btnTable.classList.add('active');
    if (expandControls) expandControls.style.display = 'none';
  }
}

function setViewMode(mode) {
  state.viewMode = mode;
  applyViewMode(mode);
  saveState();
  renderAchievements();
}

// ===================================================================
// STEAM SYNC ENGINE
// ===================================================================

async function syncSteamUser(username) {
  if (state.isSyncing) return;
  state.isSyncing = true;

  const syncBtn = document.getElementById('sync-steam-btn');
  const originalBtnText = syncBtn ? syncBtn.textContent : '[SYNC SERVICE RECORD]';
  if (syncBtn) {
    syncBtn.textContent = '[CONNECTING TO STEAM...]';
    syncBtn.disabled = true;
  }

  try {
    let res;
    let viaLocal = false;
    try {
      res = await fetch(`/api/steam-stats?user=${encodeURIComponent(username)}`, { signal: AbortSignal.timeout(12000) });
      if (res.ok) {
        viaLocal = true;
      }
    } catch (e) {
      viaLocal = false;
    }

    let data;
    if (viaLocal && res) {
      data = await res.json();
    } else {
      data = await fetchViaCorsProxy(username);
    }

    if (data && data.success) {
      state.unlockedMap = data.unlocked;
      state.player = data.player;
      saveState();

      updateSpartanDossier(data.player);
      renderDashboard();
      renderAchievements();

      alert(`[SERVICE RECORD CONFIRMED]: Synced ${data.player.unlockedCount} / ${data.player.totalCount} directives (${data.player.percentage}%) for '${data.player.customURL || username}'.`);
    } else {
      const errMsg = data && data.error ? data.error : 'Directive query rejected.';
      alert(`[SERVICE RECORD NOTICE]:\n\n${errMsg}\n\nProtocol Verification:\n1. Steam Profile -> Edit Profile -> Privacy Settings -> Set "Game details" to "Public".\n2. Run "start_tracker.bat" or "python server.py" for immediate high-speed link without browser security blocks.`);
    }
  } catch (err) {
    console.error('Sync failure:', err);
    alert(`[COMMUNICATION FAILURE]: ${err.message}.\n\nTo ensure reliable synchronization, launch "start_tracker.bat" in the MCC TRACKER directory.`);
  } finally {
    state.isSyncing = false;
    if (syncBtn) {
      syncBtn.textContent = originalBtnText;
      syncBtn.disabled = false;
    }
  }
}

// Fallback XML fetch via CORS Proxy
async function fetchViaCorsProxy(username) {
  let cleanUser = username.trim().replace(/\/$/, '');
  if (cleanUser.includes('steamcommunity.com/id/')) {
    cleanUser = cleanUser.split('steamcommunity.com/id/')[1].split('/')[0];
  } else if (cleanUser.includes('steamcommunity.com/profiles/')) {
    cleanUser = cleanUser.split('steamcommunity.com/profiles/')[1].split('/')[0];
  }

  const isNumeric = /^\d{16,}$/.test(cleanUser);
  const targetSteamUrl = isNumeric 
    ? `https://steamcommunity.com/profiles/${cleanUser}/stats/976730/?xml=1`
    : `https://steamcommunity.com/id/${cleanUser}/stats/976730/?xml=1`;

  const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(targetSteamUrl)}`;
  const resp = await fetch(proxyUrl, { headers: { 'Accept': 'application/xml, text/xml' } });
  if (!resp.ok) {
    throw new Error(`Proxy status code ${resp.status}`);
  }
  const xmlText = await resp.text();
  return parseSteamXml(xmlText, cleanUser);
}

// Parse Steam XML fallback
function parseSteamXml(xmlText, username) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  const privacy = xmlDoc.querySelector('privacyState')?.textContent;
  if (privacy === 'private' || privacy === 'friendsonly') {
    return {
      success: false,
      error: `Profile '${username}' privacy is set to private/friends-only. Set "Game details" to Public in Steam Privacy Settings.`
    };
  }

  const achievements = xmlDoc.querySelectorAll('achievement');
  if (!achievements || achievements.length === 0) {
    return {
      success: false,
      error: `No Halo MCC service statistics logged for '${username}'. Game must be owned and run on Steam.`
    };
  }

  const unlocked = {};
  achievements.forEach(a => {
    if (a.getAttribute('closed') === '1') {
      const api = a.querySelector('apiname')?.textContent?.toLowerCase();
      const ts = a.querySelector('unlockTimestamp')?.textContent || 0;
      if (api) unlocked[api] = parseInt(ts, 10);
    }
  });

  const total = 700;
  const count = Object.keys(unlocked).length;
  const pct = Math.round((count / total) * 10000) / 100;

  return {
    success: true,
    player: {
      customURL: username,
      unlockedCount: count,
      totalCount: total,
      percentage: pct
    },
    unlocked
  };
}

// Update Spartan Dossier details
function updateSpartanDossier(player) {
  const tagElem = document.getElementById('spartan-tag');
  const rankElem = document.getElementById('spartan-rank-title');
  const steamElem = document.getElementById('spartan-steam-id');

  if (player) {
    const handle = player.customURL || player.steamID64 || 'SPARTAN-117';
    if (tagElem) tagElem.textContent = handle.toUpperCase();
    if (rankElem) {
      const pct = player.percentage || 0;
      let rankTitle = 'RECRUIT GRADE 1';
      if (pct >= 90) rankTitle = 'GENERAL GRADE 4';
      else if (pct >= 70) rankTitle = 'BRIGADIER GRADE 3';
      else if (pct >= 50) rankTitle = 'COLONEL GRADE 2';
      else if (pct >= 30) rankTitle = 'MAJOR GRADE 1';
      else if (pct >= 15) rankTitle = 'SERGEANT';
      rankElem.textContent = `RANK: ${rankTitle} // EXP: ${player.unlockedCount * 100}`;
    }
    if (steamElem) steamElem.textContent = `STEAM ID: ${player.steamID64 || player.customURL}`;
  } else {
    if (tagElem) tagElem.textContent = 'SPARTAN-117';
    if (rankElem) rankElem.textContent = 'GRADE: MASTER CHIEF // COMMAND';
    if (steamElem) steamElem.textContent = 'STEAM ID: NOT SYNCHRONIZED';
  }
}

// ===================================================================
// PROGRESSION GAUGE & TARGETS CALCULATIONS
// ===================================================================

function renderDashboard() {
  const total = state.achievements.length || 700;
  let unlockedCount = 0;

  state.achievements.forEach(a => {
    if (isAchievementUnlocked(a.api)) {
      unlockedCount++;
    }
  });

  const pct = total > 0 ? ((unlockedCount / total) * 100).toFixed(1) : '0.0';
  const remaining = total - unlockedCount;
  const targetCount = Object.keys(state.activeTargets).length;

  // Master Gauge Readouts
  const pctElem = document.getElementById('hud-percentage');
  const unlockedFracElem = document.getElementById('hud-fraction-unlocked');
  const fillElem = document.getElementById('hud-progress-fill');
  const unlockedCountElem = document.getElementById('hud-unlocked-count');
  const remainingCountElem = document.getElementById('hud-remaining-count');
  const targetsCountElem = document.getElementById('hud-targets-count');
  const tabActiveElem = document.getElementById('tab-active-targets');

  if (pctElem) pctElem.textContent = `${pct}%`;
  if (unlockedFracElem) unlockedFracElem.textContent = unlockedCount;
  if (fillElem) fillElem.style.width = `${pct}%`;
  if (unlockedCountElem) unlockedCountElem.textContent = `${unlockedCount} COMPLETED`;
  if (remainingCountElem) remainingCountElem.textContent = `${remaining} REMAINING`;
  if (targetsCountElem) targetsCountElem.textContent = `NEXT UP: ${targetCount} ACTIVE`;
  if (tabActiveElem) tabActiveElem.textContent = `[NEXT UP (${targetCount})]`;
}

function isAchievementUnlocked(apiName) {
  if (!apiName) return false;
  return Boolean(state.unlockedMap[apiName.toLowerCase()]);
}

function isAchievementTarget(apiName) {
  if (!apiName) return false;
  return Boolean(state.activeTargets[apiName.toLowerCase()]);
}

function getUnlockTimestamp(apiName) {
  if (!apiName) return null;
  const val = state.unlockedMap[apiName.toLowerCase()];
  return typeof val === 'number' && val > 0 ? val : null;
}

// Toggle manual check status (completed) on REC cell click
function toggleAchievement(apiName) {
  const key = apiName.toLowerCase();
  if (state.unlockedMap[key]) {
    delete state.unlockedMap[key];
  } else {
    state.unlockedMap[key] = Math.floor(Date.now() / 1000);
  }
  saveState();
  renderDashboard();
  renderAchievements();
}

// Toggle active/next-up target on row click (golden outline)
function toggleTarget(apiName) {
  const key = apiName.toLowerCase();
  if (state.activeTargets[key]) {
    delete state.activeTargets[key];
  } else {
    state.activeTargets[key] = true;
  }
  saveState();
  renderDashboard();
  renderAchievements();
}

// ===================================================================
// ACHIEVEMENT MANIFEST FILTERING & DUAL-VIEW RENDERING
// ===================================================================

function filterAchievements() {
  const filtered = state.achievements.filter(a => {
    // Search query
    if (state.filters.search) {
      const q = state.filters.search;
      const matchName = a.name.toLowerCase().includes(q);
      const matchDesc = a.desc.toLowerCase().includes(q);
      const matchApi = a.api.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchApi) return false;
    }

    // Status filter
    const isUnlocked = isAchievementUnlocked(a.api);
    const isTarget = isAchievementTarget(a.api);

    if (state.filters.status === 'unlocked' && !isUnlocked) return false;
    if (state.filters.status === 'locked' && isUnlocked) return false;
    if (state.filters.status === 'active' && !isTarget) return false;

    // Game filter
    if (state.filters.game !== 'all' && a.game !== state.filters.game) return false;

    // Type filter
    if (state.filters.type !== 'all' && a.type !== state.filters.type) return false;

    // Rarity filter
    if (state.filters.rarity !== 'all') {
      const p = a.pct;
      if (state.filters.rarity === 'legendary' && p >= 1.0) return false;
      if (state.filters.rarity === 'ultra-rare' && (p < 1.0 || p >= 5.0)) return false;
      if (state.filters.rarity === 'rare' && (p < 5.0 || p >= 15.0)) return false;
      if (state.filters.rarity === 'common' && p < 15.0) return false;
    }

    return true;
  });

  // Sort items
  filtered.sort((a, b) => {
    switch (state.filters.sort) {
      case 'rarity-asc':
        return a.pct - b.pct;
      case 'rarity-desc':
        return b.pct - a.pct;
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'unlocked-recent': {
        const tA = getUnlockTimestamp(a.api) || 0;
        const tB = getUnlockTimestamp(b.api) || 0;
        return tB - tA;
      }
      default:
        return a.id - b.id;
    }
  });

  return filtered;
}

function renderAchievements() {
  const filtered = filterAchievements();
  const resultsInfo = document.getElementById('results-count');

  if (resultsInfo) {
    resultsInfo.textContent = `DISPLAYING ${filtered.length} OF ${state.achievements.length}`;
  }

  if (state.viewMode === 'retro') {
    renderRetroView(filtered);
  } else {
    renderTableView(filtered);
  }
}

// -------------------------------------------------------------------
// 1. Classic Carnage Report Tabular Table View
// -------------------------------------------------------------------
function renderTableView(filtered) {
  const tbody = document.getElementById('achievements-tbody');
  if (!tbody) return;

  if (filtered.length === 0) {
    if (state.filters.status === 'active') {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-manifest-notice">
            [NO ACHIEVEMENTS CURRENTLY MARKED AS NEXT UP - CLICK ANY ROW TO SET ACTIVE TARGETS]
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-manifest-notice">
            [NO DIRECTIVES MATCH QUERY PARAMETERS]
          </td>
        </tr>
      `;
    }
    return;
  }

  // Render compact tabular rows
  const fragment = document.createDocumentFragment();
  filtered.forEach(a => {
    const isUnlocked = isAchievementUnlocked(a.api);
    const isTarget = isAchievementTarget(a.api);
    const ts = getUnlockTimestamp(a.api);
    const dateStr = ts ? new Date(ts * 1000).toISOString().split('T')[0] : null;

    const row = document.createElement('tr');
    row.className = `manifest-row ${isUnlocked ? 'unlocked' : ''} ${isTarget ? 'active-target' : ''}`;
    row.setAttribute('data-api', a.api);
    row.title = isTarget ? 'Click row to unmark Next Up' : 'Click row to mark as Next Up (Golden Outline)';

    // Click anywhere on the row to toggle Next Up (golden outline)
    row.addEventListener('click', (e) => {
      if (e.target.closest('.col-status')) return;
      toggleTarget(a.api);
    });

    const gameTagClass = getGameTagClass(a.game);
    const shortGame = shortenGameName(a.game);
    const iconSrc = isUnlocked ? a.icon : (a.icon_locked || a.icon);

    row.innerHTML = `
      <td class="col-status" title="Click to toggle completed [X]/[ ]">
        <span class="status-bracket">${isUnlocked ? '[X]' : '[ ]'}</span>
      </td>
      <td class="col-icon">
        <img class="achievement-icon-thumb" src="${iconSrc}" alt="${escapeHtml(a.name)}" width="38" height="38" loading="lazy" onerror="this.src='${a.icon}'">
      </td>
      <td class="col-directive">
        <div class="directive-title-line">
          <span class="directive-name">${escapeHtml(a.name)}</span>
          ${isTarget ? '<span class="bnet-tag tag-target">[NEXT UP]</span>' : ''}
          <span class="directive-id">#${a.id} // ${escapeHtml(a.api)}</span>
        </div>
        <div class="directive-desc">${escapeHtml(a.desc)}</div>
      </td>
      <td class="col-game">
        <span class="bnet-tag ${gameTagClass}">[${shortGame}]</span>
      </td>
      <td class="col-type">
        <span class="bnet-tag">${escapeHtml(a.type)}</span>
      </td>
      <td class="col-rarity">
        ${a.pct.toFixed(1)}%
      </td>
      <td class="col-date">
        ${isUnlocked ? (dateStr ? dateStr : 'CONFIRMED') : '--'}
      </td>
    `;

    // Click listener specifically for completion toggle in col-status
    const statusCell = row.querySelector('.col-status');
    if (statusCell) {
      statusCell.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleAchievement(a.api);
      });
    }

    fragment.appendChild(row);
  });

  tbody.innerHTML = '';
  tbody.appendChild(fragment);
}

// -------------------------------------------------------------------
// 2. RetroAchievements Style Game Hubs & Badge Matrix View
// -------------------------------------------------------------------
function renderRetroView(filtered) {
  const container = document.getElementById('retro-hub-wrapper');
  if (!container) return;

  // Group filtered achievements by gameKey
  const grouped = {};
  RETRO_GAMES.forEach(g => {
    grouped[g.gameKey] = [];
  });

  filtered.forEach(a => {
    if (grouped[a.game]) {
      grouped[a.game].push(a);
    } else {
      if (!grouped['Cross-Game / Global']) grouped['Cross-Game / Global'] = [];
      grouped['Cross-Game / Global'].push(a);
    }
  });

  const gamesToRender = state.filters.game !== 'all'
    ? RETRO_GAMES.filter(g => g.gameKey === state.filters.game)
    : RETRO_GAMES;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-manifest-notice">
        [NO DIRECTIVES MATCH QUERY PARAMETERS]
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();

  gamesToRender.forEach(gameDef => {
    const allGameAchievements = state.achievements.filter(a => a.game === gameDef.gameKey);
    const gameTotal = allGameAchievements.length;
    const gameUnlocked = allGameAchievements.filter(a => isAchievementUnlocked(a.api)).length;
    const gameRemaining = gameTotal - gameUnlocked;
    const gamePct = gameTotal > 0 ? ((gameUnlocked / gameTotal) * 100).toFixed(0) : '0';
    const isMastered = gameTotal > 0 && gameUnlocked === gameTotal;

    // Find latest unlock timestamp for this game
    let latestUnlockTs = 0;
    allGameAchievements.forEach(a => {
      const ts = getUnlockTimestamp(a.api);
      if (ts && ts > latestUnlockTs) latestUnlockTs = ts;
    });
    const latestDateStr = latestUnlockTs > 0 
      ? new Date(latestUnlockTs * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : null;

    const matchingAchievements = grouped[gameDef.gameKey] || [];
    const isCollapsed = Boolean(state.collapsedGames[gameDef.id]);

    const card = document.createElement('div');
    card.className = `retro-game-card ${isMastered ? 'mastered' : ''}`;
    card.setAttribute('data-game-id', gameDef.id);

    // Format subtitle 2 line
    let sub2Text = `${gameUnlocked} of ${gameTotal} confirmed (${gamePct}%) • ${gameRemaining} remaining`;
    if (latestDateStr) {
      sub2Text += ` • Last unlocked ${latestDateStr}`;
    }

    // Orb indicator HTML
    let orbHtml = '<div class="retro-orb-zero" title="0% Completed"></div>';
    if (isMastered) {
      orbHtml = '<div class="retro-orb-mastered" title="100% Mastered - All Directives Confirmed!"></div>';
    } else if (gameUnlocked > 0) {
      orbHtml = `<div class="retro-orb-progress" title="${gamePct}% Completed (${gameUnlocked}/${gameTotal})"></div>`;
    }

    // Card Header
    const header = document.createElement('div');
    header.className = `retro-card-header ${isCollapsed ? 'collapsed' : ''}`;
    header.title = 'Click to expand / collapse this game';

    header.innerHTML = `
      <div class="retro-header-left">
        <img class="retro-game-thumb" src="${gameDef.headerImg}" alt="${escapeHtml(gameDef.title)}" loading="lazy" onerror="this.src='https://cdn.akamai.steamstatic.com/steam/apps/976730/header.jpg'">
        <div class="retro-game-titles">
          <div class="retro-game-title">${escapeHtml(gameDef.title)}</div>
          <div class="retro-game-sub1">${gameUnlocked} of ${gameTotal} achievements</div>
          <div class="retro-game-sub2">${escapeHtml(sub2Text)}</div>
        </div>
      </div>
      <div class="retro-header-right">
        <span class="retro-platform-badge ${gameDef.tagClass}">[${gameDef.short}]</span>
        <div class="retro-progress-box">
          <div class="retro-track">
            <div class="retro-fill" style="width: ${gamePct}%;"></div>
          </div>
          <div class="retro-pct-text">${gamePct}%</div>
        </div>
        <div class="retro-status-orb">
          ${orbHtml}
        </div>
        <div class="retro-chevron">${isCollapsed ? '▼' : '▲'}</div>
      </div>
    `;

    // Click header to toggle collapse
    header.addEventListener('click', () => {
      const currentlyCollapsed = Boolean(state.collapsedGames[gameDef.id]);
      state.collapsedGames[gameDef.id] = !currentlyCollapsed;
      saveState();

      header.classList.toggle('collapsed', !currentlyCollapsed);
      const body = card.querySelector('.retro-card-body');
      if (body) {
        body.classList.toggle('collapsed', !currentlyCollapsed);
      }
      const chevron = header.querySelector('.retro-chevron');
      if (chevron) {
        chevron.textContent = !currentlyCollapsed ? '▼' : '▲';
      }
    });

    // Card Body with Badge Grid
    const body = document.createElement('div');
    body.className = `retro-card-body ${isCollapsed ? 'collapsed' : ''}`;

    if (matchingAchievements.length === 0) {
      body.innerHTML = `
        <div class="retro-empty-card">
          [NO DIRECTIVES MATCH CURRENT QUERY / FILTERS IN THIS THEATER (${gameTotal} TOTAL IN GAME)]
        </div>
      `;
    } else {
      const grid = document.createElement('div');
      grid.className = 'retro-badge-grid';

      matchingAchievements.forEach(a => {
        const isUnlocked = isAchievementUnlocked(a.api);
        const isTarget = isAchievementTarget(a.api);
        const iconSrc = isUnlocked ? a.icon : (a.icon_locked || a.icon);

        const badge = document.createElement('div');
        badge.className = `retro-badge ${isUnlocked ? 'unlocked' : ''} ${isTarget ? 'active-target' : ''}`;
        badge.setAttribute('data-api', a.api);

        badge.innerHTML = `
          <img src="${iconSrc}" alt="${escapeHtml(a.name)}" loading="lazy" onerror="this.src='${a.icon}'">
        `;

        // Tooltip events
        badge.addEventListener('mouseenter', (e) => {
          showRetroTooltip(a, e);
        });
        badge.addEventListener('mousemove', (e) => {
          positionRetroTooltip(e);
        });
        badge.addEventListener('mouseleave', () => {
          hideRetroTooltip();
        });

        // Left Click -> Toggle completion (or Alt+Click -> Toggle Next Up)
        badge.addEventListener('click', (e) => {
          e.preventDefault();
          if (e.altKey) {
            toggleTarget(a.api);
          } else {
            toggleAchievement(a.api);
          }
        });

        // Right Click -> Toggle Next Up Target
        badge.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          toggleTarget(a.api);
        });

        grid.appendChild(badge);
      });

      body.appendChild(grid);
    }

    card.appendChild(header);
    card.appendChild(body);
    fragment.appendChild(card);
  });

  container.innerHTML = '';
  container.appendChild(fragment);
}

// -------------------------------------------------------------------
// 3. Floating Tooltip Popover Engine
// -------------------------------------------------------------------
let tooltipElem = null;
let tooltipIcon = null;
let tooltipTitle = null;
let tooltipDesc = null;
let tooltipRarity = null;
let tooltipType = null;
let tooltipGame = null;
let tooltipStatus = null;

function initTooltip() {
  tooltipElem = document.getElementById('retro-tooltip');
  tooltipIcon = document.getElementById('retro-tooltip-icon');
  tooltipTitle = document.getElementById('retro-tooltip-title');
  tooltipDesc = document.getElementById('retro-tooltip-desc');
  tooltipRarity = document.getElementById('retro-tooltip-rarity');
  tooltipType = document.getElementById('retro-tooltip-type');
  tooltipGame = document.getElementById('retro-tooltip-game');
  tooltipStatus = document.getElementById('retro-tooltip-status');
}

function showRetroTooltip(a, event) {
  if (!tooltipElem) initTooltip();
  if (!tooltipElem) return;

  const isUnlocked = isAchievementUnlocked(a.api);
  const isTarget = isAchievementTarget(a.api);
  const iconSrc = isUnlocked ? a.icon : (a.icon_locked || a.icon);

  if (tooltipIcon) {
    tooltipIcon.src = iconSrc;
    tooltipIcon.alt = a.name;
  }
  if (tooltipTitle) tooltipTitle.textContent = a.name;
  if (tooltipDesc) tooltipDesc.textContent = a.desc;
  if (tooltipRarity) {
    let rarityLabel = 'Standard';
    if (a.pct < 1.0) rarityLabel = 'Legendary';
    else if (a.pct < 5.0) rarityLabel = 'Ultra-Rare';
    else if (a.pct < 15.0) rarityLabel = 'Rare';
    tooltipRarity.textContent = `${a.pct.toFixed(1)}% (${rarityLabel})`;
  }
  if (tooltipType) tooltipType.textContent = a.type;
  if (tooltipGame) tooltipGame.textContent = a.game;

  if (tooltipStatus) {
    tooltipStatus.className = 'tooltip-status-tag';
    if (isTarget) {
      tooltipStatus.textContent = '[NEXT UP TARGET]';
      tooltipStatus.classList.add('target');
    } else if (isUnlocked) {
      const ts = getUnlockTimestamp(a.api);
      const dateStr = ts ? new Date(ts * 1000).toISOString().split('T')[0] : null;
      tooltipStatus.textContent = dateStr ? `[CONFIRMED: ${dateStr}]` : '[CONFIRMED]';
      tooltipStatus.classList.add('confirmed');
    } else {
      tooltipStatus.textContent = '[LOCKED]';
      tooltipStatus.classList.add('locked');
    }
  }

  tooltipElem.style.display = 'block';
  positionRetroTooltip(event);
}

function positionRetroTooltip(e) {
  if (!tooltipElem || tooltipElem.style.display === 'none') return;

  const margin = 14;
  const tooltipWidth = tooltipElem.offsetWidth || 340;
  const tooltipHeight = tooltipElem.offsetHeight || 140;

  let x = e.clientX + margin;
  let y = e.clientY + margin;

  // Prevent right edge overflow
  if (x + tooltipWidth > window.innerWidth - 10) {
    x = e.clientX - tooltipWidth - margin;
  }
  // Prevent bottom edge overflow
  if (y + tooltipHeight > window.innerHeight - 10) {
    y = e.clientY - tooltipHeight - margin;
  }
  // Prevent left edge overflow
  if (x < 10) x = 10;
  // Prevent top edge overflow
  if (y < 10) y = 10;

  tooltipElem.style.left = `${x}px`;
  tooltipElem.style.top = `${y}px`;
}

function hideRetroTooltip() {
  if (tooltipElem) {
    tooltipElem.style.display = 'none';
  }
}

// ===================================================================
// UTILITY HELPERS
// ===================================================================

function getGameTagClass(game) {
  switch (game) {
    case 'Halo: Reach': return 'tag-reach';
    case 'Halo: Combat Evolved': return 'tag-ce';
    case 'Halo 2: Anniversary': return 'tag-h2a';
    case 'Halo 3': return 'tag-h3';
    case 'Halo 3: ODST': return 'tag-odst';
    case 'Halo 4': return 'tag-h4';
    default: return 'tag-global';
  }
}

function shortenGameName(game) {
  switch (game) {
    case 'Halo: Reach': return 'REACH';
    case 'Halo: Combat Evolved': return 'H:CE';
    case 'Halo 2: Anniversary': return 'H2:A';
    case 'Halo 3': return 'HALO 3';
    case 'Halo 3: ODST': return 'ODST';
    case 'Halo 4': return 'HALO 4';
    case 'Cross-Game / Global': return 'GLOBAL';
    default: return game.toUpperCase();
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}

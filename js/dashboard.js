/* =========================================================
   FarmGuard AI – Dashboard JavaScript (Blynk Connected)
   ========================================================= */

'use strict';

// Blynk Auth Token Configuration
const BLYNK_TOKEN = "deZoSSU9pU5aZUGqqhC_ordg66xxcVyM";

// Helper to resolve the Blynk token, prioritizing UI inputs (localStorage) over code defaults
function getBlynkToken() {
  const stored = localStorage.getItem('blynk_auth_token');
  if (stored && stored !== 'YOUR_AUTH_TOKEN' && stored.trim() !== '') {
    return stored.trim();
  }
  return BLYNK_TOKEN;
}

// Global state trackers
let prevValues = { temp: null, hr: null, gas: null, movement: null };
let isFetching = false;
let checkCount = 0;

// Chart history datasets
const chartHistory = {
  labels: [],
  temp: [],
  hr: [],
  gas: []
};

let tempChart = null;
let hrChart = null;
let gasChart = null;

// ============================================================
//  API POLLING ENGINE
// ============================================================

async function fetchBlynkPin(token, pin) {
  const url = `https://blynk.cloud/external/api/get?token=${token}&${pin}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const text = await res.text();
    return text.trim();
  } catch (err) {
    console.warn(`Blynk Fetch Failed for ${pin}:`, err);
    return null;
  }
}

async function fetchBlynkConnection(token) {
  const url = `https://blynk.cloud/external/api/isHardwareConnected?token=${token}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const text = await res.text();
    return text.trim() === 'true';
  } catch (err) {
    console.warn('Blynk Fetch Failed for connection status:', err);
    return false;
  }
}

async function pollBlynkData() {
  if (isFetching) return;
  
  const token = getBlynkToken();
  if (!token || token === 'YOUR_AUTH_TOKEN' || token.trim() === '') {
    updateTokenStateUI(false);
    return;
  }

  isFetching = true;
  updateConnectionStatusUI('configuring', 'POLLING...');

  try {
    // Parallel fetches for V0-V4 and hardware connection status
    const [tempRaw, hrRaw, gasRaw, moveRaw, statusRaw, isConnected] = await Promise.all([
      fetchBlynkPin(token, 'V0'),
      fetchBlynkPin(token, 'V1'),
      fetchBlynkPin(token, 'V2'),
      fetchBlynkPin(token, 'V3'),
      fetchBlynkPin(token, 'V4'),
      fetchBlynkConnection(token)
    ]);

    // Parse data safely
    const data = {
      temp: (tempRaw !== null && tempRaw !== '') ? parseFloat(tempRaw) : null,
      hr: (hrRaw !== null && hrRaw !== '') ? parseInt(hrRaw) : null,
      gas: (gasRaw !== null && gasRaw !== '') ? parseInt(gasRaw) : null,
      movement: (moveRaw !== null && moveRaw !== '') ? parseFloat(moveRaw) : null,
      health: (statusRaw !== null && statusRaw !== '') ? statusRaw.toUpperCase() : 'UNKNOWN',
      connected: isConnected
    };

    // If any sensor fetching was successful, treat connection as online, otherwise rely on isHardwareConnected
    const isOnline = data.connected || (data.temp !== null || data.hr !== null || data.gas !== null);
    
    updateConnectionStatusUI(isOnline ? 'online' : 'offline', isOnline ? 'ONLINE' : 'OFFLINE');
    
    if (isOnline) {
      updateDashboardData(data);
    }
  } catch (err) {
    console.error('Error polling Blynk data:', err);
    updateConnectionStatusUI('offline', 'CONN ERROR');
  } finally {
    isFetching = false;
  }
}

// ============================================================
//  UI UPDATING LOGIC
// ============================================================

function updateTokenStateUI(hasToken) {
  const emptyPanel = document.getElementById('blynkEmptyStatePanel');
  const workspace = document.getElementById('blynkDashboardWorkspace');
  
  if (hasToken) {
    if (emptyPanel) emptyPanel.style.display = 'none';
    if (workspace) workspace.style.display = 'block';
  } else {
    if (emptyPanel) emptyPanel.style.display = 'block';
    if (workspace) workspace.style.display = 'none';
    updateConnectionStatusUI('offline', 'TOKEN REQ');
  }
}

function updateConnectionStatusUI(state, text) {
  const statusPill = document.getElementById('blynkConnectionStatus');
  const statusText = document.getElementById('blynkConnectionText');

  if (!statusPill || !statusText) return;

  statusPill.className = 'topbar-live-indicator ' + state;
  statusText.textContent = text;
}

function updateDashboardData(data) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  // Update topbar time
  const topbarDate = document.getElementById('topbarDate');
  if (topbarDate) topbarDate.textContent = `${dateStr} · ${timeStr}`;

  // 1. Temperature Card (V0)
  if (data.temp !== null && !isNaN(data.temp)) {
    const elVal = document.getElementById('tempValue');
    const elBar = document.getElementById('tempBar');
    const elBadge = document.getElementById('tempStatusBadge');
    const elUpdated = document.getElementById('tempUpdated');
    const elTrend = document.getElementById('tempTrend');

    if (elVal) elVal.textContent = data.temp.toFixed(1);
    if (elUpdated) elUpdated.textContent = `Updated at ${timeStr}`;

    // Bar width: scale 30°C - 45°C
    const pct = Math.min(100, Math.max(0, ((data.temp - 30) / 15) * 100));
    if (elBar) {
      elBar.style.width = `${pct}%`;
      // Colors
      if (data.temp >= 35 && data.temp <= 39.5) {
        elBar.className = 'metric-bar-fill metric-bar-green';
        if (elBadge) { elBadge.textContent = 'Normal'; elBadge.className = 'metric-status-badge'; }
      } else if (data.temp < 30 || data.temp > 41) {
        elBar.className = 'metric-bar-fill metric-bar-red';
        if (elBadge) { elBadge.textContent = 'Critical'; elBadge.className = 'metric-status-badge danger'; }
      } else {
        elBar.className = 'metric-bar-fill metric-bar-yellow';
        if (elBadge) { elBadge.textContent = 'Warning'; elBadge.className = 'metric-status-badge warning'; }
      }
    }

    // Trend logic
    if (prevValues.temp !== null && elTrend) {
      const diff = data.temp - prevValues.temp;
      if (diff > 0.05) { elTrend.textContent = `▲ +${diff.toFixed(1)}°C`; elTrend.className = 'trend-label trend-up'; }
      else if (diff < -0.05) { elTrend.textContent = `▼ ${diff.toFixed(1)}°C`; elTrend.className = 'trend-down'; }
      else { elTrend.textContent = '— Stable'; elTrend.className = 'trend-label trend-neutral'; }
    }
    prevValues.temp = data.temp;
  }

  // 2. Heart Rate Card (V1)
  if (data.hr !== null && !isNaN(data.hr)) {
    const elVal = document.getElementById('hrValue');
    const elBar = document.getElementById('hrBar');
    const elBadge = document.getElementById('hrStatusBadge');
    const elUpdated = document.getElementById('hrUpdated');
    const elTrend = document.getElementById('hrTrend');

    if (elVal) elVal.textContent = data.hr;
    if (elUpdated) elUpdated.textContent = `Updated at ${timeStr}`;

    // Bar width: scale 40 - 130
    const pct = Math.min(100, Math.max(0, ((data.hr - 40) / 90) * 100));
    if (elBar) {
      elBar.style.width = `${pct}%`;
      // Colors
      if (data.hr >= 60 && data.hr <= 90) {
        elBar.className = 'metric-bar-fill metric-bar-green';
        if (elBadge) { elBadge.textContent = 'Normal'; elBadge.className = 'metric-status-badge'; }
      } else if (data.hr < 45 || data.hr > 110) {
        elBar.className = 'metric-bar-fill metric-bar-red';
        if (elBadge) { elBadge.textContent = 'Critical'; elBadge.className = 'metric-status-badge danger'; }
      } else {
        elBar.className = 'metric-bar-fill metric-bar-yellow';
        if (elBadge) { elBadge.textContent = 'Warning'; elBadge.className = 'metric-status-badge warning'; }
      }
    }

    // Trend logic
    if (prevValues.hr !== null && elTrend) {
      const diff = data.hr - prevValues.hr;
      if (diff > 1) { elTrend.textContent = `▲ +${diff} BPM`; elTrend.className = 'trend-label trend-up'; }
      else if (diff < -1) { elTrend.textContent = `▼ ${diff} BPM`; elTrend.className = 'trend-down'; }
      else { elTrend.textContent = '— Stable'; elTrend.className = 'trend-label trend-neutral'; }
    }
    prevValues.hr = data.hr;
  }

  // 3. Gas Level Card (V2)
  if (data.gas !== null && !isNaN(data.gas)) {
    const elVal = document.getElementById('gasValue');
    const elBar = document.getElementById('gasBar');
    const elBadge = document.getElementById('gasStatusBadge');
    const elUpdated = document.getElementById('gasUpdated');
    const elTrend = document.getElementById('gasTrend');

    if (elVal) elVal.textContent = data.gas;
    if (elUpdated) elUpdated.textContent = `Updated at ${timeStr}`;

    // Bar width: scale 0 - 500
    const pct = Math.min(100, Math.max(0, (data.gas / 500) * 100));
    if (elBar) {
      elBar.style.width = `${pct}%`;
      // Colors
      if (data.gas <= 200) {
        elBar.className = 'metric-bar-fill metric-bar-green';
        if (elBadge) { elBadge.textContent = 'Safe'; elBadge.className = 'metric-status-badge'; }
      } else if (data.gas > 350) {
        elBar.className = 'metric-bar-fill metric-bar-red';
        if (elBadge) { elBadge.textContent = 'Danger!'; elBadge.className = 'metric-status-badge danger'; }
      } else {
        elBar.className = 'metric-bar-fill metric-bar-yellow';
        if (elBadge) { elBadge.textContent = 'Moderate'; elBadge.className = 'metric-status-badge warning'; }
      }
    }

    // Trend logic
    if (prevValues.gas !== null && elTrend) {
      const diff = data.gas - prevValues.gas;
      if (diff > 5) { elTrend.textContent = `▲ +${diff} ppm`; elTrend.className = 'trend-label trend-up'; }
      else if (diff < -5) { elTrend.textContent = `▼ ${Math.abs(diff)} ppm`; elTrend.className = 'trend-down'; }
      else { elTrend.textContent = '— Stable'; elTrend.className = 'trend-label trend-neutral'; }
    }
    prevValues.gas = data.gas;
  }

  // 4. Movement Card (V3)
  if (data.movement !== null && !isNaN(data.movement)) {
    const elVal = document.getElementById('movementValue');
    const elBar = document.getElementById('movementBar');
    const elBadge = document.getElementById('movementStatusBadge');
    const elUpdated = document.getElementById('movementUpdated');
    const elTrend = document.getElementById('movementTrend');

    if (elVal) elVal.textContent = data.movement.toFixed(1);
    if (elUpdated) elUpdated.textContent = `Updated at ${timeStr}`;

    // Bar width: scale 0 - 20 m/s^2
    const pct = Math.min(100, Math.max(0, (data.movement / 20) * 100));
    if (elBar) {
      elBar.style.width = `${pct}%`;
      // Colors
      if (data.movement >= 2.0) {
        elBar.className = 'metric-bar-fill metric-bar-green';
        if (elBadge) { elBadge.textContent = 'Active'; elBadge.className = 'metric-status-badge'; }
      } else if (data.movement < 0.5) {
        elBar.className = 'metric-bar-fill metric-bar-red';
        if (elBadge) { elBadge.textContent = 'Inactive'; elBadge.className = 'metric-status-badge danger'; }
      } else {
        elBar.className = 'metric-bar-fill metric-bar-yellow';
        if (elBadge) { elBadge.textContent = 'Lethargic'; elBadge.className = 'metric-status-badge warning'; }
      }
    }

    // Trend logic
    if (prevValues.movement !== null && elTrend) {
      const diff = data.movement - prevValues.movement;
      if (diff > 0.1) { elTrend.textContent = `▲ +${diff.toFixed(1)} m/s²`; elTrend.className = 'trend-label trend-up'; }
      else if (diff < -0.1) { elTrend.textContent = `▼ ${diff.toFixed(1)} m/s²`; elTrend.className = 'trend-down'; }
      else { elTrend.textContent = '— Stable'; elTrend.className = 'trend-label trend-neutral'; }
    }
    prevValues.movement = data.movement;
  }

  // 5. Health Status Card (V4)
  const healthCard = document.getElementById('healthStatusCard');
  const healthVal = document.getElementById('healthStatusValue');
  const healthIcon = document.getElementById('healthStatusIcon');
  const healthUpdated = document.getElementById('healthUpdated');
  const healthDesc = document.getElementById('healthStatusDesc');

  if (healthVal) {
    const status = data.health;
    healthVal.textContent = status;
    if (healthUpdated) healthUpdated.textContent = `Updated at ${timeStr}`;

    // Clean critical classes
    if (healthCard) healthCard.classList.remove('metric-card-pulse', 'warning-card', 'danger-card');

    if (status === 'HEALTHY') {
      healthVal.className = 'status-value healthy';
      if (healthIcon) { healthIcon.textContent = '🟢'; healthIcon.style.transform = 'scale(1)'; }
      if (healthDesc) healthDesc.textContent = 'All vital parameters are within normal physiological ranges. No immediate health concerns.';
    } else if (status === 'WARNING') {
      healthVal.className = 'status-value warning';
      if (healthIcon) { healthIcon.textContent = '🟡'; healthIcon.style.transform = 'scale(1.1)'; }
      if (healthDesc) healthDesc.textContent = 'Elevated sensor trends. Monitor livestock activity and parameters closely.';
      if (healthCard) healthCard.classList.add('warning-card');
    } else if (status === 'CRITICAL') {
      healthVal.className = 'status-value critical';
      if (healthIcon) { healthIcon.textContent = '🔴'; healthIcon.style.transform = 'scale(1.2)'; }
      if (healthDesc) healthDesc.textContent = '🚨 Severe health event detected! Contact veterinary support immediately.';
      if (healthCard) healthCard.classList.add('danger-card', 'metric-card-pulse');
    } else {
      healthVal.className = 'status-value';
      if (healthIcon) healthIcon.textContent = '❔';
      if (healthDesc) healthDesc.textContent = `Hardware returned status code: ${status}`;
    }

    // Trigger AI message typewriter effect on change/initial
    const msgs = aiMessages[status] || aiMessages.HEALTHY;
    checkCount++;
    if (checkCount === 1 || (checkCount % 10 === 0)) {
      updateAIPanel(msgs, checkCount === 1);
    }
  }

  // 6. Update Real-Time Charts (V0, V1, V2)
  updateCharts(timeStr, data.temp, data.hr, data.gas);
}

// ============================================================
//  AI ANALYSIS WRAPPER
// ============================================================

const aiMessages = {
  HEALTHY: {
    status: 'All vital parameters are within normal physiological ranges. The animal displays healthy temperature, stable heart rate, normal motion, and optimal air quality. No immediate health concerns detected.',
    risk: 'Risk level is LOW. Device status is online and continuous monitoring is maintaining vigilance. Trajectory is stable.',
    causes: 'No anomalies detected. Environmental conditions and livestock vital signs are ideal.',
    actions: 'Continue routine monitoring. Maintain normal feeding and hydration schedules. Ensure adequate ventilation.'
  },
  WARNING: {
    status: 'Elevated sensor trends detected. Temperature and heart rate parameters are trending slightly higher than baseline, combined with decreased movement patterns.',
    risk: 'Risk level is MODERATE. Parameters are approaching critical boundaries. Action within 4–6 hours is recommended to avoid critical status escalation.',
    causes: 'Possible heat stress, early-stage infection, minor physical exhaustion, or poor environmental air circulation.',
    actions: '⚠️ 1) Provide shade/cooling. 2) Increase ventilation. 3) Separate and check hydration. 4) Monitor sensor updates closely.'
  },
  CRITICAL: {
    status: '🚨 CRITICAL ANOMALY: Vital signs are highly abnormal. High body temperature, rapid heart rate, and extremely low activity indicate a severe health emergency.',
    risk: 'Risk level is CRITICAL. Delayed treatment could lead to severe systemic infection or death. Immediate response required.',
    causes: 'Likely severe infection, systemic illness, toxic environment (gas buildup), acute respiratory distress, or severe metabolic trauma.',
    actions: '🔴 IMMEDIATE ACTIONS: 1) Call veterinary support NOW. 2) Isolate the animal. 3) Move to a cool, well-ventilated stall. 4) Offer clean drinking water. 5) Prepare sensor history logs for vet review.'
  }
};

let aiUpdateInProgress = false;
let currentUpdateId = 0;

function typewriterUpdate(el, text, delay = 0, myId) {
  if (el._typewriterTimeout) {
    clearTimeout(el._typewriterTimeout);
    el._typewriterTimeout = null;
  }
  if (el._typewriterInterval) {
    clearInterval(el._typewriterInterval);
    el._typewriterInterval = null;
  }

  return new Promise(resolve => {
    if (myId !== currentUpdateId) {
      resolve();
      return;
    }

    el._typewriterTimeout = setTimeout(() => {
      if (myId !== currentUpdateId) {
        el._typewriterTimeout = null;
        resolve();
        return;
      }

      el.textContent = '';
      let i = 0;
      const speed = Math.max(10, 20 - Math.floor(text.length / 50));
      
      el._typewriterInterval = setInterval(() => {
        if (myId !== currentUpdateId) {
          clearInterval(el._typewriterInterval);
          el._typewriterInterval = null;
          el._typewriterTimeout = null;
          resolve();
          return;
        }

        el.textContent += text[i];
        i++;
        if (i >= text.length) {
          clearInterval(el._typewriterInterval);
          el._typewriterInterval = null;
          el._typewriterTimeout = null;
          resolve();
        }
      }, speed);
    }, delay);
  });
}

async function updateAIPanel(msgs, force = false) {
  if (aiUpdateInProgress && !force) return;
  aiUpdateInProgress = true;

  const myId = ++currentUpdateId;

  const thinking = document.getElementById('aiThinking');
  if (thinking) thinking.style.opacity = '1';

  const runStep = async (el, text, delay) => {
    if (myId !== currentUpdateId) return false;
    await typewriterUpdate(el, text, delay, myId);
    return myId === currentUpdateId;
  };

  if (await runStep(document.getElementById('aiHealthStatus'), msgs.status, 100)) {
    if (await runStep(document.getElementById('aiRiskAssessment'), msgs.risk, 0)) {
      if (await runStep(document.getElementById('aiCauses'), msgs.causes, 0)) {
        await runStep(document.getElementById('aiActions'), msgs.actions, 0);
      }
    }
  }

  if (myId === currentUpdateId) {
    if (thinking) thinking.style.opacity = '0';
    aiUpdateInProgress = false;
  }
}

// ============================================================
//  CHART.JS IMPLEMENTATION
// ============================================================

function initRealtimeCharts() {
  const tempCtx = document.getElementById('tempChart');
  const hrCtx = document.getElementById('hrChart');
  const gasCtx = document.getElementById('gasChart');

  if (!tempCtx || !hrCtx || !gasCtx) return;

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(5, 5, 8, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        titleColor: '#94a3b8',
        bodyColor: '#f8fafc',
        padding: 8,
        cornerRadius: 6,
        bodyFont: { family: 'Outfit, sans-serif', weight: 'bold' }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 9, family: 'Outfit' } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#64748b', font: { size: 9, family: 'Outfit' } }
      }
    }
  };

  tempChart = new Chart(tempCtx, {
    type: 'line',
    data: {
      labels: chartHistory.labels,
      datasets: [{
        data: chartHistory.temp,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.05)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointBackgroundColor: '#22c55e'
      }]
    },
    options: commonOptions
  });

  hrChart = new Chart(hrCtx, {
    type: 'line',
    data: {
      labels: chartHistory.labels,
      datasets: [{
        data: chartHistory.hr,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointBackgroundColor: '#ef4444'
      }]
    },
    options: commonOptions
  });

  gasChart = new Chart(gasCtx, {
    type: 'line',
    data: {
      labels: chartHistory.labels,
      datasets: [{
        data: chartHistory.gas,
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.05)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointBackgroundColor: '#f97316'
      }]
    },
    options: commonOptions
  });
}

function updateCharts(timeStr, temp, hr, gas) {
  if (!tempChart || !hrChart || !gasChart) return;

  // Add labels & data
  chartHistory.labels.push(timeStr);
  chartHistory.temp.push(temp);
  chartHistory.hr.push(hr);
  chartHistory.gas.push(gas);

  // Keep last 15 readings
  if (chartHistory.labels.length > 15) {
    chartHistory.labels.shift();
    chartHistory.temp.shift();
    chartHistory.hr.shift();
    chartHistory.gas.shift();
  }

  tempChart.update();
  hrChart.update();
  gasChart.update();

  // Update current labels
  const tempCurr = document.getElementById('chartTempCurrent');
  const hrCurr = document.getElementById('chartHRCurrent');
  const gasCurr = document.getElementById('chartGasCurrent');

  if (tempCurr && temp !== null) tempCurr.textContent = `${temp.toFixed(1)} °C`;
  if (hrCurr && hr !== null) hrCurr.textContent = `${hr} BPM`;
  if (gasCurr && gas !== null) gasCurr.textContent = `${gas} ppm`;
}

// ============================================================
//  TOKEN & SIDEBAR INTERACTION
// ============================================================

function setupTokenHandlers() {
  const inputTop = document.getElementById('blynkTokenInput');
  const btnTop = document.getElementById('blynkTokenSaveBtn');
  
  const inputOverlay = document.getElementById('blynkOverlayTokenInput');
  const btnOverlay = document.getElementById('blynkOverlaySaveBtn');

  const saveAction = (token) => {
    if (token && token.trim() !== '') {
      localStorage.setItem('blynk_auth_token', token.trim());
      location.reload();
    } else {
      alert('Please enter a valid Blynk Auth Token.');
    }
  };

  if (btnTop && inputTop) {
    btnTop.addEventListener('click', () => saveAction(inputTop.value));
    // Load existing
    const curr = getBlynkToken();
    if (curr && curr !== 'YOUR_AUTH_TOKEN') {
      inputTop.value = curr;
    }
  }

  if (btnOverlay && inputOverlay) {
    btnOverlay.addEventListener('click', () => saveAction(inputOverlay.value));
  }
}

function setupSidebarToggle() {
  const btnToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (!btnToggle || !sidebar || !overlay) return;

  btnToggle.addEventListener('click', () => {
    sidebar.classList.add('open');
    overlay.classList.add('visible');
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
  });
}

function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const sidebarTime = document.getElementById('sidebarTime');
  const topbarDate = document.getElementById('topbarDate');

  if (sidebarTime) sidebarTime.textContent = timeStr;
  if (topbarDate) topbarDate.textContent = `${dateStr} · ${timeStr}`;
}

// ============================================================
//  INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  setupSidebarToggle();
  setupTokenHandlers();
  
  const token = getBlynkToken();
  const hasToken = (token && token !== 'YOUR_AUTH_TOKEN' && token.trim() !== '');
  
  updateTokenStateUI(hasToken);

  if (hasToken) {
    initRealtimeCharts();
    
    // Poll immediately
    pollBlynkData();
    
    // Poll every 3 seconds
    setInterval(pollBlynkData, 3000);
  }

  // Live sidebar clock ticking
  setInterval(updateClock, 1000);
  updateClock();

  console.log('🌿 FarmGuard AI Blynk-Connected Dashboard Loaded.');
});

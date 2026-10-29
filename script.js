// --- DONNÉES & LOCALSTORAGE ---
let appData = {
  modules: JSON.parse(localStorage.getItem('study_modules')) || [],
  planning: JSON.parse(localStorage.getItem('study_planning')) || []
};

function saveData() {
  localStorage.setItem('study_modules', JSON.stringify(appData.modules));
  localStorage.setItem('study_planning', JSON.stringify(appData.planning));
  updateGlobalStats();
}

// Changement d'onglet
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(`tab-${tabId}`).classList.add('active');
  event.target.classList.add('active');

  if (tabId === 'pomodoro') updatePomodoroDropdown();
}

function toggleForm(formId) {
  const form = document.getElementById(formId);
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

// --- GESTION DES MODULES ---
function createModule() {
  const name = document.getElementById('mod-title').value.trim();
  const color = document.getElementById('mod-color').value;
  const tp = parseInt(document.getElementById('mod-tp').value) || 0;
  const td = parseInt(document.getElementById('mod-td').value) || 0;

  if (!name) return alert('Veuillez entrer un nom de module.');

  const newModule = {
    id: Date.now(),
    name: name,
    color: color,
    tpCount: tp,
    tdCount: td,
    chapters: []
  };

  appData.modules.push(newModule);
  saveData();
  renderModules();
  document.getElementById('mod-title').value = '';
  toggleForm('form-add-module');
}

function deleteModule(modId) {
  if (confirm('Voulez-vous vraiment supprimer ce module ?')) {
    appData.modules = appData.modules.filter(m => m.id !== modId);
    saveData();
    renderModules();
  }
}

// Changement d'emplacement/ordre
function moveModule(index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= appData.modules.length) return;
  const temp = appData.modules[index];
  appData.modules[index] = appData.modules[newIndex];
  appData.modules[newIndex] = temp;
  saveData();
  renderModules();
}

// --- GESTION DES CHAPITRES & ÉTAPES ---
function addChapter(modId) {
  const title = prompt('Titre du chapitre :');
  if (!title) return;

  const mod = appData.modules.find(m => m.id === modId);
  if (mod) {
    mod.chapters.push({
      id: Date.now(),
      title: title,
      steps: [
        { id: 1, label: "1. Écouter / noter l'audio", done: false },
        { id: 2, label: "2. Comprendre le reste", done: false },
        { id: 3, label: "3. Faire un résumé", done: false }
      ]
    });
    saveData();
    renderModules();
  }
}

function deleteChapter(modId, chapId) {
  const mod = appData.modules.find(m => m.id === modId);
  if (mod) {
    mod.chapters = mod.chapters.filter(c => c.id !== chapId);
    saveData();
    renderModules();
  }
}

function toggleStep(modId, chapId, stepId) {
  const mod = appData.modules.find(m => m.id === modId);
  if (mod) {
    const chap = mod.chapters.find(c => c.id === chapId);
    if (chap) {
      const step = chap.steps.find(s => s.id === stepId);
      if (step) step.done = !step.done;
      saveData();
      renderModules();
    }
  }
}

function renderModules() {
  const container = document.getElementById('modules-list');
  container.innerHTML = '';

  if (appData.modules.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted);">Aucun module ajouté pour le moment.</p>';
    return;
  }

  appData.modules.forEach((mod, index) => {
    const card = document.createElement('div');
    card.className = 'module-card';
    card.style.borderLeftColor = mod.color;

    let chaptersHTML = mod.chapters.map(chap => `
      <div class="chapter-item">
        <div class="chapter-header">
          <span>📖 ${chap.title}</span>
          <button class="btn btn-danger btn-small" onclick="deleteChapter(${mod.id}, ${chap.id})">✕</button>
        </div>
        <ul class="steps-list">
          ${chap.steps.map(step => `
            <li class="step-item ${step.done ? 'completed' : ''}">
              <input type="checkbox" ${step.done ? 'checked' : ''} onchange="toggleStep(${mod.id}, ${chap.id}, ${step.id})">
              <span>${step.label}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `).join('');

    card.innerHTML = `
      <div>
        <div class="module-header">
          <div class="module-title" style="color: ${mod.color}">${mod.name}</div>
          <div class="module-actions">
            <button class="btn btn-secondary btn-small" onclick="moveModule(${index}, -1)">▲</button>
            <button class="btn btn-secondary btn-small" onclick="moveModule(${index}, 1)">▼</button>
            <button class="btn btn-danger btn-small" onclick="deleteModule(${mod.id})">✕</button>
          </div>
        </div>
        
        <div class="module-info">
          🧪 TP : ${mod.tpCount} | 📝 TD : ${mod.tdCount} | 📚 Chapitres : ${mod.chapters.length}
        </div>

        <button class="btn btn-small full-width" style="margin-bottom: 10px;" onclick="addChapter(${mod.id})">+ Ajouter un chapitre</button>
        
        <div class="chapter-container">
          ${chaptersHTML}
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

// --- STATISTIQUES ---
function updateGlobalStats() {
  document.getElementById('stat-modules-count').innerText = appData.modules.length;

  let totalTP = 0, totalTD = 0, totalSteps = 0, completedSteps = 0;

  appData.modules.forEach(m => {
    totalTP += m.tpCount || 0;
    totalTD += m.tdCount || 0;
    m.chapters.forEach(c => {
      c.steps.forEach(s => {
        totalSteps++;
        if (s.done) completedSteps++;
      });
    });
  });

  document.getElementById('stat-tp-count').innerText = totalTP;
  document.getElementById('stat-td-count').innerText = totalTD;

  const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  document.getElementById('stat-progression').innerText = `${progressPct}%`;
}

// --- RECOMMANDATEUR ANTI-MOOD ---
function generateRecommendation() {
  const time = parseInt(document.getElementById('mood-time').value) || 30;
  const fatigue = parseInt(document.getElementById('mood-fatigue').value);
  const mood = document.getElementById('mood-state').value;
  const output = document.getElementById('recommendation-output');

  if (appData.modules.length === 0) {
    output.style.display = 'block';
    output.innerHTML = '<strong>Remarque :</strong> Ajoutez au moins un module pour recevoir une recommandation.';
    return;
  }

  const randomMod = appData.modules[Math.floor(Math.random() * appData.modules.length)];
  let advice = "";

  if (fatigue >= 4 || mood === 'demotivated') {
    advice = `💡 <strong>Stratégie Basse Énergie (${time} min)</strong> :<br>Ne forcez pas sur la théorie lourde. Prenez le module <strong>${randomMod.name}</strong> et réalisez l'<strong>Étape 1 (Écouter / noter l'audio)</strong> ou révisez un exercice de TD simple.`;
  } else if (fatigue === 3 || mood === 'distracted') {
    advice = `⚡ <strong>Stratégie Focus Modéré (${time} min)</strong> :<br>Lancez une session Pomodoro de 20-25 min sur <strong>${randomMod.name}</strong>. Effectuez l'<strong>Étape 3 (Faire un résumé)</strong> d'un chapitre.`;
  } else {
    advice = `🚀 <strong>Stratégie Haute Énergie (${time} min)</strong> :<br>Profitez de votre état ! Attaquez l'<strong>Étape 2 (Comprendre le reste)</strong> ou travaillez vos TP sur le module <strong>${randomMod.name}</strong>.`;
  }

  output.style.display = 'block';
  output.innerHTML = advice;
}

// --- PLANNING ---
function addPlanningItem() {
  const title = document.getElementById('plan-title').value.trim();
  const date = document.getElementById('plan-date').value;

  if (!title || !date) return alert('Veuillez remplir le titre et la date.');

  appData.planning.push({ id: Date.now(), title, date });
  saveData();
  renderPlanning();
  document.getElementById('plan-title').value = '';
}

function deletePlanningItem(id) {
  appData.planning = appData.planning.filter(p => p.id !== id);
  saveData();
  renderPlanning();
}

function renderPlanning() {
  const container = document.getElementById('planning-list');
  if (appData.planning.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">Aucun événement planifié.</p>';
    return;
  }

  container.innerHTML = appData.planning.map(item => `
    <div class="planning-item">
      <div>
        <div style="font-weight: 600;">${item.title}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${new Date(item.date).toLocaleString('fr-FR')}</div>
      </div>
      <button class="btn btn-danger btn-small" onclick="deletePlanningItem(${item.id})">✕</button>
    </div>
  `).join('');
}

// --- MINUTEUR POMODORO ---
let timerInterval = null;
let timeLeft = 25 * 60;
let isRunning = false;

function updatePomodoroDropdown() {
  const select = document.getElementById('pomo-module-select');
  select.innerHTML = appData.modules.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  document.getElementById('pomo-start-btn').innerText = 'En cours...';

  timerInterval = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateTimerDisplay();
    } else {
      clearInterval(timerInterval);
      isRunning = false;
      document.getElementById('pomo-start-btn').innerText = 'Démarrer';
      alert('Session Pomodoro terminée ! Prenez une pause.');
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  document.getElementById('pomo-start-btn').innerText = 'Démarrer';
}

function resetTimer() {
  pauseTimer();
  const workDur = parseInt(document.getElementById('pomo-work').value) || 25;
  timeLeft = workDur * 60;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  document.getElementById('timer-display').innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Initialisation au chargement
renderModules();
renderPlanning();
updateGlobalStats();

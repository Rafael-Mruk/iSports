/* ============================================
   CONSTANTES GLOBAIS
   ============================================ */
const STORAGE_KEY = 'sports_events';
const LAST_ADMIN_KEY = 'last_admin_login';
const JOINED_PREFIX = 'joined_event_';
const TRASH_KEY = 'events_trash';
const USERS_KEY = 'sports_events_users';
const CURRENT_USER_KEY = 'sports_events_current_user';
const GOOGLE_MAPS_API_KEY = ''; // Configure sua API Key do Google Maps
const SUPABASE_URL = ''; // Configure sua URL do Supabase
const SUPABASE_ANON_KEY = ''; // Configure sua Anon Key do Supabase
const SUPABASE_TABLE = 'events';
const CLOUD_SYNC_INTERVAL_MS = 3000;

// Usuário de teste padrão (criado automaticamente se não existir)
const TEST_USER = {
  email: 'teste@sportsevents.com',
  password: '123456',
  name: 'Usuário Teste',
  createdAt: Date.now()
};

/* ============================================
   SISTEMA DE TOASTS
   ============================================ */
class ToastSystem {
  constructor() {
    this.container = null;
    this.toasts = [];
    this.init();
  }

  init() {
    // Criar container de toasts se não existir
    if (!document.querySelector('.toast-container')) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    } else {
      this.container = document.querySelector('.toast-container');
    }
  }

  show({ type = 'info', title, message, duration = 5000, action = null }) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${this.escapeHtml(title)}</div>` : ''}
        ${message ? `<div class="toast-message">${this.escapeHtml(message)}</div>` : ''}
      </div>
      ${action ? `<button class="toast-action">${this.escapeHtml(action.label)}</button>` : ''}
    `;

    // Adicionar ação se existir
    if (action) {
      const actionBtn = toast.querySelector('.toast-action');
      actionBtn.addEventListener('click', () => {
        action.onClick();
        this.hide(toast);
      });
    }

    this.container.appendChild(toast);
    this.toasts.push(toast);

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => this.hide(toast), duration);
    }

    return toast;
  }

  hide(toast) {
    if (!toast) return;
    
    toast.classList.add('toast-hiding');
    setTimeout(() => {
      toast.remove();
      this.toasts = this.toasts.filter(t => t !== toast);
    }, 300);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  success(title, message, options = {}) {
    return this.show({ type = 'success', title, message, ...options });
  }

  error(title, message, options = {}) {
    return this.show({ type = 'error', title, message, ...options });
  }

  warning(title, message, options = {}) {
    return this.show({ type = 'warning', title, message, ...options });
  }

  info(title, message, options = {}) {
    return this.show({ type = 'info', title, message, ...options });
  }
}

const toast = new ToastSystem();

/* ============================================
   SISTEMA DE MODAIS
   ============================================ */
class ModalSystem {
  constructor() {
    this.activeModal = null;
    this.previousFocus = null;
    this.init();
  }

  init() {
    // Fechar modal com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.close();
      }
    });

    // Fechar ao clicar no overlay
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay') && e.target.classList.contains('active')) {
        this.close();
      }
    });
  }

  open(content, options = {}) {
    const { onClose } = options;

    // Salvar foco atual
    this.previousFocus = document.activeElement;

    // Criar overlay se não existir
    let overlay = document.querySelector('.modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h2 class="modal-title"></h2>
            <button class="modal-close" aria-label="Fechar">&times;</button>
          </div>
          <div class="modal-body"></div>
          <div class="modal-footer"></div>
        </div>
      `;
      document.body.appendChild(overlay);

      // Event listener para botão de fechar
      overlay.querySelector('.modal-close').addEventListener('click', () => this.close());
    }

    // Preencher conteúdo
    const modal = overlay.querySelector('.modal');
    const titleEl = overlay.querySelector('.modal-title');
    const bodyEl = overlay.querySelector('.modal-body');
    const footerEl = overlay.querySelector('.modal-footer');

    if (options.title) {
      titleEl.textContent = options.title;
      titleEl.parentElement.classList.remove('hidden');
    } else {
      titleEl.parentElement.classList.add('hidden');
    }

    bodyEl.innerHTML = typeof content === 'string' ? content : '';
    if (typeof content !== 'string') {
      bodyEl.appendChild(content);
    }

    if (options.footer) {
      footerEl.innerHTML = '';
      options.footer.forEach(btn => {
        const button = document.createElement('button');
        button.className = `btn ${btn.class || 'btn-secondary'}`;
        button.textContent = btn.label;
        button.addEventListener('click', () => {
          if (btn.onClick) btn.onClick();
          if (btn.close !== false) this.close();
        });
        footerEl.appendChild(button);
      });
      footerEl.classList.remove('hidden');
    } else {
      footerEl.classList.add('hidden');
    }

    // Mostrar modal
    overlay.classList.add('active');
    this.activeModal = overlay;

    // Trap focus
    this.trapFocus(modal);

    // Callback de abertura
    if (options.onOpen) options.onOpen();
  }

  close() {
    if (!this.activeModal) return;

    this.activeModal.classList.remove('active');
    const modal = this.activeModal;

    setTimeout(() => {
      if (this.activeModal === modal) {
        this.activeModal = null;
      }
    }, 300);

    // Restaurar foco
    if (this.previousFocus) {
      this.previousFocus.focus();
    }

    // Callback de fechamento
    if (this.activeModal && this.activeModal._onClose) {
      this.activeModal._onClose();
    }
  }

  trapFocus(modal) {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    modal.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    });

    // Focar primeiro elemento
    setTimeout(() => firstFocusable?.focus(), 100);
  }
}

const modal = new ModalSystem();

/* ============================================
   GERENCIAMENTO DE DADOS
   ============================================ */
const DataManager = {
  getEvents() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Erro ao ler eventos:', e);
      return [];
    }
  },

  saveEvents(events) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
      this.syncToCloud(events);
    } catch (e) {
      console.error('Erro ao salvar eventos:', e);
      toast.error('Erro', 'Não foi possível salvar os dados localmente');
    }
  },

  getEventById(id) {
    const events = this.getEvents();
    return events.find(e => e.id === id);
  },

  addEvent(event) {
    const events = this.getEvents();
    event.id = event.id || this.generateId();
    event.createdAt = event.createdAt || Date.now();
    event.updatedAt = Date.now();
    events.unshift(event);
    this.saveEvents(events);
    return event;
  },

  updateEvent(id, updates) {
    const events = this.getEvents();
    const index = events.findIndex(e => e.id === id);
    if (index === -1) return null;

    events[index] = { ...events[index], ...updates, updatedAt: Date.now() };
    this.saveEvents(events);
    return events[index];
  },

  deleteEvent(id, permanent = false) {
    const events = this.getEvents();
    const index = events.findIndex(e => e.id === id);
    if (index === -1) return false;

    if (permanent) {
      events.splice(index, 1);
    } else {
      // Mover para lixeira
      const trash = this.getTrash();
      trash.push({ ...events[index], deletedAt: Date.now() });
      this.saveTrash(trash);
      events.splice(index, 1);
    }

    this.saveEvents(events);
    return true;
  },

  restoreFromTrash(id) {
    const trash = this.getTrash();
    const index = trash.findIndex(e => e.id === id);
    if (index === -1) return false;

    const event = trash[index];
    delete event.deletedAt;
    event.updatedAt = Date.now();

    trash.splice(index, 1);
    this.saveTrash(trash);
    this.addEvent(event);
    return true;
  },

  getTrash() {
    try {
      const data = localStorage.getItem(TRASH_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveTrash(trash) {
    localStorage.setItem(TRASH_KEY, JSON.stringify(trash));
  },

  generateId() {
    return 'evt_' + Math.random().toString(36).substr(2, 9);
  },

  generateSnapshot() {
    const events = this.getEvents();
    return btoa(JSON.stringify(events));
  },

  loadFromSnapshot(snapshot) {
    try {
      return JSON.parse(atob(snapshot));
    } catch (e) {
      return null;
    }
  },

  /* ============================================
     SINCRONIZAÇÃO COM SUPABASE
     ============================================ */
  async syncToCloud(events) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;

    try {
      for (const event of events) {
        await this.cloudUpsertEvent(event);
      }
    } catch (e) {
      console.warn('Sync falhou, tentará novamente:', e);
    }
  },

  async cloudPullEvents() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?select=*&deleted_at=is.null`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error('Falha ao buscar eventos');
      
      const events = await response.json();
      return events;
    } catch (e) {
      console.warn('Pull falhou:', e);
      return null;
    }
  },

  async cloudUpsertEvent(event) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`,
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(event)
        }
      );

      return await response.json();
    } catch (e) {
      console.warn('Upsert falhou:', e);
      return null;
    }
  },

  async cloudMarkDeleted(id) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=eq.${id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ deleted_at: new Date().toISOString() })
        }
      );

      return await response.json();
    } catch (e) {
      console.warn('Delete marking falhou:', e);
      return null;
    }
  }
};

/* ============================================
   AUTENTICAÇÃO ADMIN
   ============================================ */
const AuthManager = {
  isLoggedIn() {
    return localStorage.getItem(LAST_ADMIN_KEY) !== null;
  },

  login(email, password) {
    // Login simples - em produção usar autenticação real
    if (email && password) {
      localStorage.setItem(LAST_ADMIN_KEY, email);
      return true;
    }
    return false;
  },

  logout() {
    localStorage.removeItem(LAST_ADMIN_KEY);
  },

  getEmail() {
    return localStorage.getItem(LAST_ADMIN_KEY) || '';
  }
};

/* ============================================
   SISTEMA DE AUTENTICAÇÃO COM USUÁRIOS
   ============================================ */
const UserManager = {
  init() {
    // Criar usuário de teste se não existir
    const users = this.getUsers();
    if (users.length === 0) {
      this.createUser(TEST_USER.name, TEST_USER.email, TEST_USER.password);
      console.log('Usuário de teste criado:', TEST_USER.email);
    }
  },

  getUsers() {
    try {
      const data = localStorage.getItem(USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  getCurrentUser() {
    try {
      const data = localStorage.getItem(CURRENT_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  },

  createUser(name, email, password) {
    const users = this.getUsers();
    
    // Verificar se email já existe
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'E-mail já cadastrado' };
    }

    const user = {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      name,
      email,
      password, // Em produção, usar hash
      createdAt: Date.now(),
      eventsCreated: []
    };

    users.push(user);
    this.saveUsers(users);
    return { success: true, user };
  },

  login(email, password) {
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      this.setCurrentUser(user);
      localStorage.setItem(LAST_ADMIN_KEY, email);
      return { success: true, user };
    }

    return { success: false, error: 'E-mail ou senha inválidos' };
  },

  logout() {
    this.setCurrentUser(null);
    localStorage.removeItem(LAST_ADMIN_KEY);
  },

  isLoggedIn() {
    return this.getCurrentUser() !== null;
  },

  getUserById(id) {
    const users = this.getUsers();
    return users.find(u => u.id === id);
  },

  updateUserEvents(userId, eventId, action = 'add') {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    
    if (index === -1) return false;

    if (action === 'add') {
      if (!users[index].eventsCreated.includes(eventId)) {
        users[index].eventsCreated.push(eventId);
      }
    } else if (action === 'remove') {
      users[index].eventsCreated = users[index].eventsCreated.filter(id => id !== eventId);
    }

    this.saveUsers(users);
    
    // Atualizar usuário atual se for o mesmo
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      this.setCurrentUser(users[index]);
    }

    return true;
  }
};

/* ============================================
   UTILITÁRIOS
   ============================================ */
const Utils = {
  formatDateTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  },

  formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  getTimeUntil(timestamp) {
    if (!timestamp) return '';
    const diff = timestamp - Date.now();
    if (diff <= 0) return 'Iniciado';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      return `${Math.floor(hours / 24)} dias`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}min`;
    } else {
      return `${minutes}min`;
    }
  },

  isLessThan1Hour(timestamp) {
    if (!timestamp) return false;
    return timestamp - Date.now() < 3600000;
  },

  hasEventStarted(event) {
    return event.dateTime && Date.now() >= event.dateTime;
  },

  calculateValuePerPerson(event) {
    if (!event.totalCost || !event.maxParticipants) return 0;
    const participants = (event.participants || []).length;
    if (participants === 0) return 0;
    return event.totalCost / participants;
  },

  getRandomColor() {
    const colors = [
      '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
      '#f97316', '#eab308', '#22c55e', '#14b8a6',
      '#06b6d4', '#3b82f6'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  },

  getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substr(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

/* ============================================
   GERENCIADOR DE PARTIDAS
   ============================================ */
class MatchManager {
  constructor(eventId) {
    this.eventId = eventId;
    this.timerInterval = null;
    this.startTime = null;
    this.elapsedTime = 0;
    this.isRunning = false;
    this.homeScore = 0;
    this.awayScore = 0;
    this.whistleSound = null;
    this.loadState();
    this.initWhistle();
  }

  initWhistle() {
    // Criar apito usando Web Audio API
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API não suportada');
    }
  }

  playWhistle() {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = 2000;
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.5);

    // Segundo apito após breve pausa
    setTimeout(() => {
      const osc2 = this.audioContext.createOscillator();
      const gain2 = this.audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(this.audioContext.destination);
      osc2.frequency.value = 2000;
      osc2.type = 'square';
      gain2.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
      osc2.start();
      osc2.stop(this.audioContext.currentTime + 0.5);
    }, 600);
  }

  loadState() {
    const state = localStorage.getItem(`match_${this.eventId}`);
    if (state) {
      const parsed = JSON.parse(state);
      this.elapsedTime = parsed.elapsedTime || 0;
      this.homeScore = parsed.homeScore || 0;
      this.awayScore = parsed.awayScore || 0;
      this.isRunning = parsed.isRunning || false;
      this.startTime = parsed.startTime;
    }
  }

  saveState() {
    const state = {
      elapsedTime: this.elapsedTime,
      homeScore: this.homeScore,
      awayScore: this.awayScore,
      isRunning: this.isRunning,
      startTime: this.startTime
    };
    localStorage.setItem(`match_${this.eventId}`, JSON.stringify(state));
  }

  start(duration = 30 * 60) {
    if (this.isRunning) return;

    this.startTime = Date.now() - this.elapsedTime;
    this.isRunning = true;
    this.saveState();

    this.timerInterval = setInterval(() => {
      if (!this.isRunning) return;

      this.elapsedTime = Date.now() - this.startTime;

      // Verificar se tempo acabou
      if (this.elapsedTime >= duration * 1000) {
        this.elapsedTime = duration * 1000;
        this.finish();
      }

      this.updateDisplay();
    }, 100);

    // Otimização: pausar quando aba estiver em background
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.isRunning) {
        this.pause();
      } else if (!document.hidden && this.isRunning && this.elapsedTime < duration * 1000) {
        this.resume();
      }
    });
  }

  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    clearInterval(this.timerInterval);
    this.saveState();
  }

  resume() {
    if (this.isRunning) return;
    this.startTime = Date.now() - this.elapsedTime;
    this.isRunning = true;
    this.saveState();

    this.timerInterval = setInterval(() => {
      if (!this.isRunning) return;
      this.elapsedTime = Date.now() - this.startTime;
      this.updateDisplay();
    }, 100);
  }

  reset() {
    this.pause();
    this.elapsedTime = 0;
    this.homeScore = 0;
    this.awayScore = 0;
    this.saveState();
    this.updateDisplay();
  }

  finish() {
    this.pause();
    this.playWhistle();
    toast.success('Partida Finalizada', 'Fim de jogo!');
  }

  addGoal(team) {
    if (team === 'home') {
      this.homeScore++;
    } else {
      this.awayScore++;
    }
    this.saveState();
    this.updateDisplay();
  }

  updateDisplay() {
    const display = document.getElementById('timer-display');
    if (!display) return;

    const totalSeconds = Math.floor(this.elapsedTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    display.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    if (this.isRunning) {
      display.className = 'timer-display timer-running';
    } else if (this.elapsedTime > 0) {
      display.className = 'timer-display timer-paused';
    } else {
      display.className = 'timer-display';
    }

    // Atualizar placar
    const homeScoreEl = document.getElementById('home-score');
    const awayScoreEl = document.getElementById('away-score');
    if (homeScoreEl) homeScoreEl.textContent = this.homeScore;
    if (awayScoreEl) awayScoreEl.textContent = this.awayScore;
  }

  cleanup() {
    clearInterval(this.timerInterval);
  }
}

/* ============================================
   GERENCIADOR DE TIMES
   ============================================ */
class TeamGenerator {
  static generateTeams(participants, teamCount = 2) {
    if (!participants || participants.length < teamCount) {
      return { error: 'Participantes insuficientes' };
    }

    // Embaralhar participantes (Fisher-Yates shuffle)
    const shuffled = [...participants];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Distribuir equilibradamente
    const teams = Array.from({ length: teamCount }, () => []);
    shuffled.forEach((participant, index) => {
      teams[index % teamCount].push(participant);
    });

    return { teams, participants: shuffled };
  }

  static calculateTeamBalance(teams) {
    // Calcular "força" média dos times baseado em histórico (se disponível)
    // Por enquanto, apenas verifica se tamanhos são equilibrados
    const sizes = teams.map(t => t.length);
    const maxDiff = Math.max(...sizes) - Math.min(...sizes);
    return maxDiff <= 1;
  }
}

/* ============================================
   RENDERIZADORES DE UI
   ============================================ */
const UIRenderer = {
  renderEventCard(event, isAdmin = false) {
    const card = document.createElement('div');
    card.className = 'card fade-in-up';
    card.setAttribute('data-event-id', event.id);

    const statusBadge = this.getStatusBadge(event);
    const participantCount = (event.participants || []).length;
    const spotsLeft = (event.maxParticipants || 0) - participantCount;

    card.innerHTML = `
      <div class="card-header">
        <h3 class="card-title">${this.escapeHtml(event.name || 'Evento sem nome')}</h3>
        ${statusBadge}
      </div>
      <div class="mb-md">
        <div class="flex items-center gap-sm mb-sm">
          <span>📅</span>
          <span>${Utils.formatDate(event.dateTime)}</span>
        </div>
        <div class="flex items-center gap-sm mb-sm">
          <span>⏰</span>
          <span>${Utils.formatTime(event.dateTime)}</span>
        </div>
        <div class="flex items-center gap-sm mb-sm">
          <span>👥</span>
          <span>${participantCount}/${event.maxParticipants || '∞'} participantes</span>
        </div>
        ${event.location ? `
        <div class="flex items-center gap-sm">
          <span>📍</span>
          <span class="text-muted">${this.escapeHtml(event.location)}</span>
        </div>
        ` : ''}
      </div>
      ${event.totalCost ? `
      <div class="badge badge-info mb-md">
        Valor: R$ ${(event.totalCost / (participantCount || 1)).toFixed(2)} por pessoa
      </div>
      ` : ''}
      <div class="flex gap-sm mt-lg">
        <a href="evento.html?id=${event.id}" class="btn btn-primary" style="flex: 1">
          Ver Detalhes
        </a>
        ${isAdmin ? `
        <button class="btn btn-secondary btn-icon" onclick="editEvent('${event.id}')">
          ✏️
        </button>
        <button class="btn btn-danger btn-icon" onclick="deleteEvent('${event.id}')">
          🗑️
        </button>
        ` : ''}
      </div>
    `;

    return card;
  },

  getStatusBadge(event) {
    const now = Date.now();
    const eventTime = event.dateTime;

    if (!eventTime) {
      return '<span class="badge badge-warning">Sem data</span>';
    }

    if (now >= eventTime) {
      return '<span class="badge badge-success">Em andamento</span>';
    }

    if (Utils.isLessThan1Hour(eventTime)) {
      return '<span class="badge badge-error">Começa em breve!</span>';
    }

    return '<span class="badge badge-info">Agendado</span>';
  },

  renderParticipantCard(participant, canRemove = false, onRemove = null) {
    const card = document.createElement('div');
    card.className = 'participant-card fade-in-up';
    card.setAttribute('data-participant', participant.id);

    const initials = Utils.getInitials(participant.name);
    const avatarColor = participant.color || Utils.getRandomColor();

    card.innerHTML = `
      <div class="participant-avatar" style="background: ${avatarColor}">
        ${initials}
      </div>
      <div class="participant-info">
        <div class="participant-name">${this.escapeHtml(participant.name)}</div>
        <div class="participant-status">
          ${participant.isReserve ? '🔄 Reserva' : '✓ Confirmado'}
          ${participant.guests ? ` • +${participant.guests} convidados` : ''}
        </div>
      </div>
      ${canRemove ? `
      <div class="participant-actions">
        <button class="btn btn-danger btn-icon" onclick="${onRemove ? `removeParticipant('${participant.id}')` : ''}" 
                aria-label="Remover participante">
          🗑️
        </button>
      </div>
      ` : ''}
    `;

    return card;
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

/* ============================================
   FUNÇÕES GLOBAIS (INDEX.HTML)
   ============================================ */
let currentEditEventId = null;

function initAdminPage() {
  const eventsList = document.getElementById('events-list');
  const loginSection = document.getElementById('login-section');
  const adminPanel = document.getElementById('admin-panel');
  const loginForm = document.getElementById('login-form');
  const createEventBtn = document.getElementById('create-event-btn');
  const eventModal = document.getElementById('event-modal');
  
  // Verificar autenticação
  if (UserManager.isLoggedIn()) {
    showAdminPanel();
  }
  
  // Login form submit
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;

    const result = UserManager.login(email, password);
    if (result.success) {
      toast.success('Login realizado', `Bem-vindo, ${result.user.name}!`);
      showAdminPanel();
    } else {
      toast.error('Erro no login', result.error);
    }
  });
  
  // Botão de criar evento
  createEventBtn?.addEventListener('click', () => {
    if (!UserManager.isLoggedIn()) {
      toast.warning('Login necessário', 'Faça login ou crie uma conta para criar eventos');
      showLoginModal();
      return;
    }
    openEventModal();
  });
  
  // Sincronização com nuvem
  setupCloudSync();
  
  // Renderizar eventos
  renderEventsList();
  
  // Expurar lixeira automaticamente (30 dias)
  expireTrash();
}


function showAdminPanel() {
  const loginSection = document.getElementById('login-section');
  const adminPanel = document.getElementById('admin-panel');
  
  loginSection?.classList.add('hidden');
  adminPanel?.classList.remove('hidden');
  
  // Atualizar informações do usuário logado
  const userInfo = document.getElementById('user-info');
  const currentUser = UserManager.getCurrentUser();
  if (userInfo && currentUser) {
    userInfo.textContent = `Olá, ${currentUser.name}`;
  }
  
  // Mostrar botão de logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn && !logoutBtn.hasAttribute('data-initialized')) {
    logoutBtn.addEventListener('click', () => {
      UserManager.logout();
      toast.info('Logout realizado', 'Até logo!');
      setTimeout(() => location.reload(), 500);
    });
    logoutBtn.setAttribute('data-initialized', 'true');
  }
}

function openEventModal(event = null) {
  currentEditEventId = event?.id || null;

  const content = `
    <form id="event-form" class="flex flex-col gap-md">
      <div class="form-group">
        <label class="form-label" for="event-name">Nome do Evento *</label>
        <input type="text" id="event-name" class="form-input" required 
               placeholder="Ex: Futebol Sábado" value="${event?.name || ''}">
      </div>
      
      <div class="form-group">
        <label class="form-label" for="event-date">Data e Hora *</label>
        <input type="datetime-local" id="event-date" class="form-input" required 
               value="${event?.dateTime ? new Date(event.dateTime).toISOString().slice(0, 16) : ''}">
        <div class="form-hint">A trava de remoção ativa 1h antes deste horário</div>
      </div>
      
      <div class="form-group">
        <label class="form-label" for="event-location">Local</label>
        <input type="text" id="event-location" class="form-input" 
               placeholder="Endereço ou nome do local" value="${event?.location || ''}">
      </div>
      
      <div class="form-group">
        <label class="form-label" for="event-max-participants">Máximo de Participantes</label>
        <input type="number" id="event-max-participants" class="form-input" 
               min="2" placeholder="Ex: 22" value="${event?.maxParticipants || ''}">
      </div>
      
      <div class="form-group">
        <label class="form-label" for="event-total-cost">Custo Total (R$)</label>
        <input type="number" id="event-total-cost" class="form-input" step="0.01" 
               placeholder="Ex: 200.00" value="${event?.totalCost || ''}">
        <div class="form-hint">Valor será dividido entre participantes</div>
      </div>
      
      <div class="form-group">
        <label class="form-label" for="event-description">Descrição</label>
        <textarea id="event-description" class="form-textarea" rows="3" 
                  placeholder="Detalhes adicionais...">${event?.description || ''}</textarea>
      </div>
    </form>
  `;

  modal.open(content, {
    title: event ? 'Editar Evento' : 'Novo Evento',
    footer: [
      {
        label: 'Cancelar',
        class: 'btn-secondary'
      },
      {
        label: event ? 'Salvar Alterações' : 'Criar Evento',
        class: 'btn-primary',
        onClick: saveEvent
      }
    ]
  });
}

function saveEvent() {
  const form = document.getElementById('event-form');
  if (!form) return;

  const name = document.getElementById('event-name')?.value?.trim();
  const dateTimeStr = document.getElementById('event-date')?.value;
  const location = document.getElementById('event-location')?.value?.trim();
  const maxParticipants = parseInt(document.getElementById('event-max-participants')?.value) || null;
  const totalCost = parseFloat(document.getElementById('event-total-cost')?.value) || 0;
  const description = document.getElementById('event-description')?.value?.trim();

  // Validação
  if (!name) {
    toast.error('Campo obrigatório', 'Informe o nome do evento');
    return;
  }

  if (!dateTimeStr) {
    toast.error('Campo obrigatório', 'Informe data e hora');
    return;
  }

  // Verificar se usuário está logado para criar/editar
  const currentUser = UserManager.getCurrentUser();
  if (!currentUser) {
    toast.error('Login necessário', 'Faça login para criar ou editar eventos');
    showLoginModal();
    return;
  }

  const eventData = {
    name,
    dateTime: new Date(dateTimeStr).getTime(),
    location: location || null,
    maxParticipants: maxParticipants || null,
    totalCost: totalCost || 0,
    description: description || '',
    participants: currentEditEventId ? DataManager.getEventById(currentEditEventId)?.participants || [] : [],
    reserves: currentEditEventId ? DataManager.getEventById(currentEditEventId)?.reserves || [] : [],
    status: 'scheduled',
    createdBy: currentUser.id,
    creatorName: currentUser.name
  };

  if (currentEditEventId) {
    // Atualizar evento existente
    DataManager.updateEvent(currentEditEventId, eventData);
    toast.success('Evento atualizado', 'As alterações foram salvas');
  } else {
    // Criar novo evento
    const newEvent = DataManager.addEvent(eventData);
    // Associar evento ao criador
    UserManager.updateUserEvents(currentUser.id, newEvent.id, 'add');
    toast.success('Evento criado', `ID: ${newEvent.id}`);
  }

  modal.close();
  renderEventsList();
}

function editEvent(eventId) {
  const event = DataManager.getEventById(eventId);
  if (!event) {
    toast.error('Erro', 'Evento não encontrado');
    return;
  }
  openEventModal(event);
}

function deleteEvent(eventId) {
  const event = DataManager.getEventById(eventId);
  if (!event) return;

  modal.open(
    `<p>Tem certeza que deseja remover o evento "<strong>${event.name}</strong>"?</p>
     <p class="text-muted">Ele será movido para a lixeira e poderá ser restaurado por 30 dias.</p>`,
    {
      title: 'Confirmar Exclusão',
      footer: [
        { label: 'Cancelar', class: 'btn-secondary' },
        { 
          label: 'Excluir', 
          class: 'btn-danger',
          onClick: () => {
            DataManager.deleteEvent(eventId);
            toast.success('Evento removido', 'Encontrado na lixeira se precisar restaurar');
            renderEventsList();
          }
        }
      ]
    }
  );
}

function renderEventsList() {
  const eventsList = document.getElementById('events-list');
  if (!eventsList) return;

  const events = DataManager.getEvents();

  if (events.length === 0) {
    eventsList.innerHTML = `
      <div class="card text-center">
        <p class="text-muted mb-md">Nenhum evento encontrado</p>
        <button class="btn btn-primary" onclick="openEventModal()">
          Criar Primeiro Evento
        </button>
      </div>
    `;
    return;
  }

  eventsList.innerHTML = '';
  events.forEach(event => {
    const card = UIRenderer.renderEventCard(event, true);
    eventsList.appendChild(card);
  });
}

function setupCloudSync() {
  // Pull inicial
  pullFromCloud();

  // Sync periódico
  setInterval(pullFromCloud, CLOUD_SYNC_INTERVAL_MS);
}

async function pullFromCloud() {
  const cloudEvents = await DataManager.cloudPullEvents();
  if (!cloudEvents) return;

  const localEvents = DataManager.getEvents();
  let hasChanges = false;

  cloudEvents.forEach(cloudEvent => {
    const localIndex = localEvents.findIndex(e => e.id === cloudEvent.id);
    if (localIndex === -1) {
      // Novo evento da nuvem
      localEvents.push(cloudEvent);
      hasChanges = true;
    } else if (cloudEvent.updatedAt > localEvents[localIndex].updatedAt) {
      // Atualizar versão mais recente
      localEvents[localIndex] = cloudEvent;
      hasChanges = true;
    }
  });

  if (hasChanges) {
    DataManager.saveEvents(localEvents);
    renderEventsList();
  }
}

function expireTrash() {
  const trash = DataManager.getTrash();
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  const validTrash = trash.filter(item => item.deletedAt > thirtyDaysAgo);
  
  if (validTrash.length !== trash.length) {
    DataManager.saveTrash(validTrash);
  }
}

/* ============================================
   FUNÇÕES GLOBAIS (EVENTO.HTML)
   ============================================ */
let currentEvent = null;
let matchManager = null;
let googleMap = null;

async function initEventPage() {
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('id');
  const snapshot = params.get('s');

  // Carregar de snapshot ou do ID
  if (snapshot) {
    const events = DataManager.loadFromSnapshot(snapshot);
    if (events) {
      currentEvent = events.find(e => e.id === eventId);
    }
  }

  if (!currentEvent && eventId) {
    currentEvent = DataManager.getEventById(eventId);
  }

  if (!currentEvent) {
    showErrorPage();
    return;
  }

  renderEventDetails();
  setupEventActions();
  initMatchControls();
  setupAutoPromotion();
}

function showErrorPage() {
  document.body.innerHTML = `
    <div class="page-enter container" style="padding-top: 100px; text-align: center;">
      <div class="card">
        <h2>Evento não encontrado</h2>
        <p class="text-muted mb-lg">Este evento pode ter sido removido ou o link está incorreto.</p>
        <a href="index.html" class="btn btn-primary">Voltar ao Início</a>
      </div>
    </div>
  `;
}

function renderEventDetails() {
  if (!currentEvent) return;

  // Header
  document.getElementById('event-name')?.textContent = currentEvent.name;
  document.getElementById('event-status')?.innerHTML = UIRenderer.getStatusBadge(currentEvent).outerHTML;

  // Info
  document.getElementById('event-date-time')?.textContent = Utils.formatDateTime(currentEvent.dateTime);
  document.getElementById('event-countdown')?.textContent = Utils.getTimeUntil(currentEvent.dateTime);
  
  if (currentEvent.location) {
    document.getElementById('event-location')?.textContent = currentEvent.location;
    document.getElementById('location-section')?.classList.remove('hidden');
  }

  if (currentEvent.description) {
    document.getElementById('event-description')?.textContent = currentEvent.description;
    document.getElementById('description-section')?.classList.remove('hidden');
  }

  // Custo por pessoa
  const valuePerPerson = Utils.calculateValuePerPerson(currentEvent);
  if (valuePerPerson > 0) {
    document.getElementById('value-per-person')?.textContent = `R$ ${valuePerPerson.toFixed(2)}`;
    document.getElementById('cost-section')?.classList.remove('hidden');
  }

  // Participantes
  renderParticipants();
  renderReserves();

  // Mapa (oculto até confirmar presença)
  if (!localStorage.getItem(JOINED_PREFIX + currentEvent.id)) {
    document.getElementById('map-section')?.classList.add('hidden');
  } else {
    loadGoogleMaps();
  }

  // Botão de confirmação
  updateJoinButton();
}

function renderParticipants() {
  const container = document.getElementById('participants-list');
  if (!container) return;

  const participants = currentEvent.participants || [];
  
  if (participants.length === 0) {
    container.innerHTML = '<p class="text-muted text-center">Seja o primeiro a confirmar!</p>';
    return;
  }

  container.innerHTML = '';
  participants.forEach(p => {
    const card = UIRenderer.renderParticipantCard(p, false);
    container.appendChild(card);
  });

  // Atualizar contador
  document.getElementById('participants-count')?.textContent = participants.length;
  document.getElementById('max-participants')?.textContent = currentEvent.maxParticipants || '∞';
}

function renderReserves() {
  const container = document.getElementById('reserves-list');
  if (!container) return;

  const reserves = currentEvent.reserves || [];
  
  if (reserves.length === 0) {
    container.innerHTML = '<p class="text-muted text-center">Ninguém na lista de espera</p>';
    return;
  }

  container.innerHTML = '';
  reserves.forEach((r, index) => {
    const card = UIRenderer.renderParticipantCard(r, false);
    const position = card.querySelector('.participant-status');
    if (position) {
      position.textContent = `🔄 Reserva #${index + 1}`;
    }
    container.appendChild(card);
  });
}

function updateJoinButton() {
  const joinBtn = document.getElementById('join-btn');
  if (!joinBtn) return;

  const hasJoined = localStorage.getItem(JOINED_PREFIX + currentEvent.id);
  const participants = currentEvent.participants || [];
  const isFull = currentEvent.maxParticipants && participants.length >= currentEvent.maxParticipants;
  const hasStarted = Utils.hasEventStarted(currentEvent);

  if (hasJoined) {
    joinBtn.textContent = '✓ Presença Confirmada';
    joinBtn.className = 'btn btn-success';
    joinBtn.disabled = true;
  } else if (hasStarted) {
    joinBtn.textContent = 'Evento já iniciado';
    joinBtn.disabled = true;
  } else if (isFull) {
    joinBtn.textContent = 'Entrar na Lista de Espera';
    joinBtn.className = 'btn btn-warning';
  } else {
    joinBtn.textContent = 'Confirmar Presença';
    joinBtn.className = 'btn btn-primary';
  }
}

function setupEventActions() {
  // Botão de confirmar presença
  document.getElementById('join-btn')?.addEventListener('click', handleJoin);

  // Botão de adicionar convidado
  document.getElementById('add-guest-btn')?.addEventListener('click', handleAddGuest);

  // Botão de copiar link
  document.getElementById('share-btn')?.addEventListener('click', handleShare);
}

function handleJoin() {
  const hasJoined = localStorage.getItem(JOINED_PREFIX + currentEvent.id);
  if (hasJoined) return;

  const hasStarted = Utils.hasEventStarted(currentEvent);
  if (hasStarted) {
    toast.warning('Evento iniciado', 'Não é mais possível confirmar presença');
    return;
  }

  // Modal de confirmação
  const content = `
    <form id="join-form" class="flex flex-col gap-md">
      <div class="form-group">
        <label class="form-label" for="participant-name">Seu Nome *</label>
        <input type="text" id="participant-name" class="form-input" required 
               placeholder="Como você quer aparecer na lista">
      </div>
      <div class="form-group">
        <label class="form-label" for="guest-count">Número de Convidados</label>
        <input type="number" id="guest-count" class="form-input" min="0" max="5" value="0">
        <div class="form-hint">Máximo 5 convidados</div>
      </div>
    </form>
  `;

  modal.open(content, {
    title: 'Confirmar Presença',
    footer: [
      { label: 'Cancelar', class: 'btn-secondary' },
      {
        label: 'Confirmar',
        class: 'btn-primary',
        onClick: submitJoin
      }
    ]
  });
}

function submitJoin() {
  const name = document.getElementById('participant-name')?.value?.trim();
  const guestCount = parseInt(document.getElementById('guest-count')?.value) || 0;

  if (!name) {
    toast.error('Campo obrigatório', 'Informe seu nome');
    return;
  }

  const participants = currentEvent.participants || [];
  const reserves = currentEvent.reserves || [];
  const isFull = currentEvent.maxParticipants && participants.length >= currentEvent.maxParticipants;

  const participant = {
    id: 'p_' + Math.random().toString(36).substr(2, 9),
    name,
    guests: guestCount > 0 ? guestCount : null,
    joinedAt: Date.now(),
    color: Utils.getRandomColor()
  };

  if (isFull) {
    // Adicionar como reserva
    reserves.push(participant);
    toast.info('Lista de espera', 'Você foi adicionado como reserva');
  } else {
    // Adicionar como participante
    participants.push(participant);
    localStorage.setItem(JOINED_PREFIX + currentEvent.id, JSON.stringify(participant));
    toast.success('Presença confirmada', 'Te esperamos lá!');
    
    // Mostrar mapa
    document.getElementById('map-section')?.classList.remove('hidden');
    loadGoogleMaps();
  }

  // Atualizar evento
  DataManager.updateEvent(currentEvent.id, { participants, reserves });
  currentEvent = DataManager.getEventById(currentEvent.id);

  modal.close();
  renderParticipants();
  renderReserves();
  updateJoinButton();
}

function handleAddGuest() {
  const hasJoined = localStorage.getItem(JOINED_PREFIX + currentEvent.id);
  if (!hasJoined) {
    toast.warning('Confirme presença primeiro', 'Você precisa estar confirmado para adicionar convidados');
    return;
  }

  const myData = JSON.parse(hasJoined);
  toast.info('Convidados', `Você já tem ${myData.guests || 0} convidados registrados`);
}

function handleShare() {
  const shareUrl = `${window.location.origin}${window.location.pathname}?id=${currentEvent.id}&s=${DataManager.generateSnapshot()}`;
  
  navigator.clipboard.writeText(shareUrl).then(() => {
    toast.success('Link copiado', 'Compartilhe com seus amigos!');
  }).catch(() => {
    // Fallback
    prompt('Copie este link:', shareUrl);
  });
}

function removeParticipant(participantId) {
  const lessThan1Hour = Utils.isLessThan1Hour(currentEvent.dateTime);
  if (lessThan1Hour) {
    toast.warning('Trava ativada', 'Não é possível remover menos de 1h antes do evento');
    return;
  }

  const participants = currentEvent.participants || [];
  const index = participants.findIndex(p => p.id === participantId);
  
  if (index === -1) return;

  // Remover da lista
  const removed = participants.splice(index, 1)[0];

  // Promover reserva se existir
  const reserves = currentEvent.reserves || [];
  if (reserves.length > 0) {
    const promoted = reserves.shift();
    promoted.isReserve = false;
    participants.push(promoted);
    toast.info('Reserva promovida', `${promoted.name} assumiu a vaga!`);
  }

  // Atualizar
  DataManager.updateEvent(currentEvent.id, { participants, reserves });
  currentEvent = DataManager.getEventById(currentEvent.id);

  // Limpar join local se for o usuário
  localStorage.removeItem(JOINED_PREFIX + currentEvent.id);

  toast.success('Removido', 'Sua presença foi cancelada');
  renderParticipants();
  renderReserves();
  updateJoinButton();
}

function initMatchControls() {
  const matchSection = document.getElementById('match-section');
  if (!matchSection) return;

  // Só mostrar para admin ou após evento iniciar
  const hasStarted = Utils.hasEventStarted(currentEvent);
  if (!hasStarted && !AuthManager.isLoggedIn()) {
    matchSection.classList.add('hidden');
    return;
  }

  matchManager = new MatchManager(currentEvent.id);
  matchManager.updateDisplay();

  // Controles
  document.getElementById('start-match-btn')?.addEventListener('click', () => {
    const duration = parseInt(document.getElementById('match-duration')?.value) || 30;
    matchManager.start(duration * 60);
    matchManager.playWhistle();
    toast.info('Partida iniciada', `${duration} minutos no relógio`);
  });

  document.getElementById('pause-match-btn')?.addEventListener('click', () => {
    matchManager.pause();
    toast.info('Partida pausada', '');
  });

  document.getElementById('resume-match-btn')?.addEventListener('click', () => {
    matchManager.resume();
    toast.info('Partida retomada', '');
  });

  document.getElementById('reset-match-btn')?.addEventListener('click', () => {
    modal.open(
      '<p>Tem certeza que deseja zerar o placar e o timer?</p>',
      {
        title: 'Resetar Partida',
        footer: [
          { label: 'Cancelar', class: 'btn-secondary' },
          {
            label: 'Resetar',
            class: 'btn-warning',
            onClick: () => {
              matchManager.reset();
              toast.info('Partida resetada', '');
            }
          }
        ]
      }
    );
  });

  document.getElementById('home-goal-btn')?.addEventListener('click', () => {
    matchManager.addGoal('home');
    matchManager.playWhistle();
  });

  document.getElementById('away-goal-btn')?.addEventListener('click', () => {
    matchManager.addGoal('away');
    matchManager.playWhistle();
  });

  document.getElementById('whistle-btn')?.addEventListener('click', () => {
    matchManager.playWhistle();
  });
}

function setupAutoPromotion() {
  // Verificar periodicamente se há vagas e reservas
  setInterval(() => {
    if (!currentEvent) return;

    const participants = currentEvent.participants || [];
    const reserves = currentEvent.reserves || [];

    if (reserves.length > 0 && (!currentEvent.maxParticipants || participants.length < currentEvent.maxParticipants)) {
      // Há vaga e reserva - promover automaticamente
      const promoted = reserves.shift();
      promoted.isReserve = false;
      participants.push(promoted);

      DataManager.updateEvent(currentEvent.id, { participants, reserves });
      currentEvent = DataManager.getEventById(currentEvent.id);

      toast.info('Vaga aberta!', `${promoted.name} foi promovido da reserva`);
      renderParticipants();
      renderReserves();
    }
  }, 10000);
}

function loadGoogleMaps() {
  if (!currentEvent?.location) return;
  if (googleMap) return; // Já carregado

  const mapContainer = document.getElementById('map-container');
  if (!mapContainer) return;

  if (!GOOGLE_MAPS_API_KEY) {
    // Mostrar placeholder com link
    mapContainer.innerHTML = `
      <div class="map-placeholder">
        <div class="map-placeholder-icon">🗺️</div>
        <p>Configure sua API Key do Google Maps</p>
        <a href="https://maps.google.com/?q=${encodeURIComponent(currentEvent.location)}" 
           target="_blank" class="btn btn-primary mt-md">
          Abrir no Google Maps
        </a>
      </div>
    `;
    return;
  }

  // Carregar script do Google Maps
  if (typeof google === 'undefined') {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  } else {
    initMap();
  }
}

// Callback global para Google Maps
window.initMap = function() {
  if (!currentEvent?.location || !google?.maps) return;

  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({ address: currentEvent.location }, (results, status) => {
    if (status === 'OK' && results[0]) {
      const location = results[0].geometry.location;

      const map = new google.maps.Map(document.getElementById('map-container'), {
        zoom: 15,
        center: location,
        disableDefaultUI: false,
        styles: [
          {
            featureType: 'all',
            elementType: 'geometry',
            stylers: [{ saturation: -80 }]
          }
        ]
      });

      new google.maps.Marker({
        position: location,
        map: map,
        title: currentEvent.name
      });

      googleMap = map;
    } else {
      document.getElementById('map-container').innerHTML = `
        <div class="map-placeholder">
          <p>Localização não encontrada: ${currentEvent.location}</p>
        </div>
      `;
    }
  });
};

/* ============================================
   TEAM GENERATOR PAGE
   ============================================ */
function generateTeamsForEvent() {
  const participants = currentEvent?.participants || [];
  
  if (participants.length < 2) {
    toast.warning('Participantes insuficientes', 'Mínimo 2 participantes necessários');
    return;
  }

  const result = TeamGenerator.generateTeams(participants);
  
  if (result.error) {
    toast.error('Erro', result.error);
    return;
  }

  const content = `
    <div class="flex flex-col gap-lg">
      ${result.teams.map((team, index) => `
        <div class="card">
          <h4 class="mb-md">Time ${index + 1} (${team.length} jogadores)</h4>
          <ul class="list">
            ${team.map(p => `<li class="list-item">${p.name}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </div>
  `;

  modal.open(content, {
    title: 'Times Sorteados',
    footer: [
      { label: 'Sortear Novamente', class: 'btn-secondary', onClick: generateTeamsForEvent, close: false },
      { label: 'Fechar', class: 'btn-primary' }
    ]
  });

  toast.success('Times gerados', 'Boa partida!');
}

/* ============================================
   INICIALIZAÇÃO
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar sistema de usuários (cria usuário de teste se necessário)
  UserManager.init();

  // Detectar página atual
  const isEventPage = window.location.pathname.includes('evento.html');
  
  if (isEventPage) {
    initEventPage();
  } else {
    initAdminPage();
  }

  // Ripple effect em botões
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;

    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';

    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
});

// Expor funções globalmente
window.editEvent = editEvent;
window.deleteEvent = deleteEvent;
window.openEventModal = openEventModal;
window.saveEvent = saveEvent;
window.removeParticipant = removeParticipant;
window.generateTeamsForEvent = generateTeamsForEvent;
window.initMap = window.initMap;
window.showLoginModal = showLoginModal;
window.showRegisterModal = showRegisterModal;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;

/* ============================================
   FUNÇÕES DE AUTENTICAÇÃO (LOGIN/REGISTRO)
   ============================================ */
function showLoginModal() {
  const content = `
    <form id="login-form-modal" class="flex flex-col gap-md">
      <div class="form-group">
        <label class="form-label" for="modal-login-email">E-mail *</label>
        <input type="email" id="modal-login-email" class="form-input" required 
               placeholder="seu@email.com" value="${TEST_USER.email}">
      </div>
      <div class="form-group">
        <label class="form-label" for="modal-login-password">Senha *</label>
        <input type="password" id="modal-login-password" class="form-input" required 
               placeholder="Sua senha" value="${TEST_USER.password}">
        <div class="form-hint">Usuário de teste: ${TEST_USER.email} | Senha: ${TEST_USER.password}</div>
      </div>
    </form>
    <div class="mt-md text-center">
      <p class="text-muted">Não tem conta? <a href="#" id="show-register-link" class="link">Criar conta</a></p>
    </div>
  `;

  modal.open(content, {
    title: 'Login',
    footer: [
      { label: 'Cancelar', class: 'btn-secondary' },
      { 
        label: 'Entrar', 
        class: 'btn-primary',
        onClick: () => handleLogin(),
        close: false
      }
    ],
    onOpen: () => {
      document.getElementById('show-register-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        modal.close();
        showRegisterModal();
      });
    }
  });
}

function showRegisterModal() {
  const content = `
    <form id="register-form-modal" class="flex flex-col gap-md">
      <div class="form-group">
        <label class="form-label" for="modal-register-name">Nome *</label>
        <input type="text" id="modal-register-name" class="form-input" required 
               placeholder="Seu nome completo">
      </div>
      <div class="form-group">
        <label class="form-label" for="modal-register-email">E-mail *</label>
        <input type="email" id="modal-register-email" class="form-input" required 
               placeholder="seu@email.com">
      </div>
      <div class="form-group">
        <label class="form-label" for="modal-register-password">Senha *</label>
        <input type="password" id="modal-register-password" class="form-input" required 
               placeholder="Mínimo 6 caracteres" minlength="6">
        <div class="form-hint">Use uma senha segura</div>
      </div>
      <div class="form-group">
        <label class="form-label" for="modal-register-confirm">Confirmar Senha *</label>
        <input type="password" id="modal-register-confirm" class="form-input" required 
               placeholder="Repita sua senha" minlength="6">
      </div>
    </form>
    <div class="mt-md text-center">
      <p class="text-muted">Já tem conta? <a href="#" id="show-login-link" class="link">Fazer login</a></p>
    </div>
  `;

  modal.open(content, {
    title: 'Criar Conta',
    footer: [
      { label: 'Cancelar', class: 'btn-secondary' },
      { 
        label: 'Cadastrar', 
        class: 'btn-primary',
        onClick: () => handleRegister(),
        close: false
      }
    ],
    onOpen: () => {
      document.getElementById('show-login-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        modal.close();
        showLoginModal();
      });
    }
  });
}

function handleLogin() {
  const email = document.getElementById('modal-login-email')?.value?.trim();
  const password = document.getElementById('modal-login-password')?.value;

  if (!email || !password) {
    toast.error('Campos obrigatórios', 'Preencha e-mail e senha');
    return;
  }

  const result = UserManager.login(email, password);
  if (result.success) {
    toast.success('Login realizado', `Bem-vindo, ${result.user.name}!`);
    modal.close();
    setTimeout(() => location.reload(), 500);
  } else {
    toast.error('Erro no login', result.error);
  }
}

function handleRegister() {
  const name = document.getElementById('modal-register-name')?.value?.trim();
  const email = document.getElementById('modal-register-email')?.value?.trim();
  const password = document.getElementById('modal-register-password')?.value;
  const confirm = document.getElementById('modal-register-confirm')?.value;

  // Validações
  if (!name || !email || !password) {
    toast.error('Campos obrigatórios', 'Preencha todos os campos');
    return;
  }

  if (password.length < 6) {
    toast.error('Senha muito curta', 'A senha deve ter pelo menos 6 caracteres');
    return;
  }

  if (password !== confirm) {
    toast.error('Senhas não conferem', 'Digite a mesma senha nos dois campos');
    return;
  }

  const result = UserManager.createUser(name, email, password);
  if (result.success) {
    toast.success('Conta criada', 'Faça login para continuar');
    modal.close();
    showLoginModal();
  } else {
    toast.error('Erro no cadastro', result.error);
  }
}

function handleLogout() {
  UserManager.logout();
  toast.info('Logout realizado', 'Até logo!');
  setTimeout(() => location.reload(), 500);
}

/* ============================================
   CONSTANTES GLOBAIS
   ============================================ */
export const STORAGE_KEY = 'sports_events';
export const LAST_ADMIN_KEY = 'last_admin_login';
export const JOINED_PREFIX = 'joined_event_';
export const TRASH_KEY = 'events_trash';
export const USERS_KEY = 'sports_events_users';
export const CURRENT_USER_KEY = 'sports_events_current_user';
export const GOOGLE_MAPS_API_KEY = ''; // Configure sua API Key do Google Maps
export const SUPABASE_URL = ''; // Configure sua URL do Supabase
export const SUPABASE_ANON_KEY = ''; // Configure sua Anon Key do Supabase
export const SUPABASE_TABLE = 'events';
export const CLOUD_SYNC_INTERVAL_MS = 3000;

// Usuário de teste padrão (criado automaticamente se não existir)
export const TEST_USER = {
  email: 'teste@sportsevents.com',
  password: '123456',
  name: 'Usuário Teste',
  createdAt: Date.now()
};

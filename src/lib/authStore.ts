'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'admin' | 'supervisor' | 'agent';

export interface LoginUser {
  id: string;
  username: string;
  password: string; // plain-text for demo; in production use a hashed backend
  role: UserRole;
  agentId?: string; // links to an Agent id when role === 'agent'
  displayName: string;
  email: string;
  active: boolean;
  createdAt: string;
}

// ── Default credentials ──────────────────────────────────────────────────────
const DEFAULT_USERS: LoginUser[] = [
  {
    id: 'u0',
    username: 'admin',
    password: 'Admin@SWAT2026',
    role: 'admin',
    displayName: 'Administrator',
    email: 'admin@swat.ca',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'u1',
    username: 'damien.marie',
    password: 'Super@SWAT2026',
    role: 'supervisor',
    agentId: '5',
    displayName: 'Damien Marie',
    email: 'damien.marie@swat.ca',
    active: true,
    createdAt: new Date().toISOString(),
  },
  { id: 'u2',  username: 'ahmed.amasha',    password: 'Agent@2026', role: 'agent', agentId: '1',  displayName: 'Ahmed AMasha',            email: 'ahmed.amasha@swat.ca',    active: true, createdAt: new Date().toISOString() },
  { id: 'u3',  username: 'alejandro',        password: 'Agent@2026', role: 'agent', agentId: '2',  displayName: 'Gonzalez Alejandro Munoz',email: 'alejandro@swat.ca',        active: true, createdAt: new Date().toISOString() },
  { id: 'u4',  username: 'brahim.hamimoum', password: 'Agent@2026', role: 'agent', agentId: '3',  displayName: 'Brahim Hamimoum',         email: 'brahim.hamimoum@swat.ca', active: true, createdAt: new Date().toISOString() },
  { id: 'u5',  username: 'constance.fode',  password: 'Agent@2026', role: 'agent', agentId: '4',  displayName: 'Constance Fode',          email: 'constance.fode@swat.ca',  active: true, createdAt: new Date().toISOString() },
  { id: 'u6',  username: 'edgar.castro',    password: 'Agent@2026', role: 'agent', agentId: '6',  displayName: 'Edgar Castro Zambrano',   email: 'edgar.castro@swat.ca',    active: true, createdAt: new Date().toISOString() },
  { id: 'u7',  username: 'francis.poirier', password: 'Agent@2026', role: 'agent', agentId: '7',  displayName: 'Francis Poirier',         email: 'francis.poirier@swat.ca', active: true, createdAt: new Date().toISOString() },
  { id: 'u8',  username: 'gabriel.april',   password: 'Agent@2026', role: 'agent', agentId: '8',  displayName: 'Gabriel April',           email: 'gabriel.april@swat.ca',   active: true, createdAt: new Date().toISOString() },
  { id: 'u9',  username: 'hassan',           password: 'Agent@2026', role: 'agent', agentId: '9',  displayName: 'Hassan Chamkmaki',        email: 'hassan@swat.ca',           active: true, createdAt: new Date().toISOString() },
  { id: 'u10', username: 'kamel.belblidi',  password: 'Agent@2026', role: 'agent', agentId: '10', displayName: 'Kamel Belblidi',          email: 'kamel.belblidi@swat.ca',  active: true, createdAt: new Date().toISOString() },
  { id: 'u11', username: 'kelly',            password: 'Agent@2026', role: 'agent', agentId: '11', displayName: 'Paradowski Kelly',        email: 'kelly@swat.ca',            active: true, createdAt: new Date().toISOString() },
  { id: 'u12', username: 'martha.jimenez',  password: 'Agent@2026', role: 'agent', agentId: '12', displayName: 'Martha Jimenez',          email: 'martha.jimenez@swat.ca',  active: true, createdAt: new Date().toISOString() },
  { id: 'u13', username: 'sarim.ramos',     password: 'Agent@2026', role: 'agent', agentId: '13', displayName: 'Sarim Ramos',             email: 'sarim.ramos@swat.ca',     active: true, createdAt: new Date().toISOString() },
  { id: 'u14', username: 'sepideh.amiri',   password: 'Agent@2026', role: 'agent', agentId: '14', displayName: 'Sepideh Amiri',           email: 'sepideh.amiri@swat.ca',   active: true, createdAt: new Date().toISOString() },
  { id: 'u15', username: 'thomas',           password: 'Agent@2026', role: 'agent', agentId: '15', displayName: 'Thomas Houdebert',        email: 'thomas@swat.ca',           active: true, createdAt: new Date().toISOString() },
  { id: 'u16', username: 'vincent',          password: 'Agent@2026', role: 'agent', agentId: '16', displayName: 'Vincent Rancourt',        email: 'vincent@swat.ca',          active: true, createdAt: new Date().toISOString() },
  { id: 'u17', username: 'vitalie',          password: 'Agent@2026', role: 'agent', agentId: '17', displayName: 'Vitalie Mihaila',         email: 'vitalie@swat.ca',          active: true, createdAt: new Date().toISOString() },
];

function genId() { return Math.random().toString(36).slice(2, 11) + Date.now().toString(36); }

interface AuthStore {
  users: LoginUser[];
  currentUser: LoginUser | null;
  sessionExpiry: number | null;

  login: (username: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  addUser: (user: Omit<LoginUser, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updates: Partial<Omit<LoginUser, 'id' | 'createdAt'>>) => void;
  removeUser: (id: string) => void;
  changePassword: (id: string, newPassword: string) => void;
  isAdmin: () => boolean;
  isSupervisor: () => boolean;
  canEdit: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      users: DEFAULT_USERS,
      currentUser: null,
      sessionExpiry: null,

      login: (username, password) => {
        const user = get().users.find(
          (u) => u.username.toLowerCase() === username.toLowerCase().trim() &&
                 u.password === password &&
                 u.active
        );
        if (!user) return { ok: false, error: 'Invalid username or password.' };
        set({
          currentUser: user,
          sessionExpiry: Date.now() + 8 * 60 * 60 * 1000, // 8-hour session
        });
        return { ok: true };
      },

      logout: () => set({ currentUser: null, sessionExpiry: null }),

      addUser: (userData) => {
        const newUser: LoginUser = { ...userData, id: genId(), createdAt: new Date().toISOString() };
        set((s) => ({ users: [...s.users, newUser] }));
      },

      updateUser: (id, updates) => {
        set((s) => ({
          users: s.users.map((u) => u.id === id ? { ...u, ...updates } : u),
          currentUser: s.currentUser?.id === id ? { ...s.currentUser, ...updates } : s.currentUser,
        }));
      },

      removeUser: (id) => {
        if (id === 'u0') return; // Cannot remove main admin
        set((s) => ({ users: s.users.filter((u) => u.id !== id) }));
      },

      changePassword: (id, newPassword) => {
        set((s) => ({ users: s.users.map((u) => u.id === id ? { ...u, password: newPassword } : u) }));
      },

      isAdmin:      () => get().currentUser?.role === 'admin',
      isSupervisor: () => ['admin', 'supervisor'].includes(get().currentUser?.role ?? ''),
      canEdit:      () => ['admin', 'supervisor'].includes(get().currentUser?.role ?? ''),
    }),
    {
      name: 'agent-auth-store',
      partialize: (s) => ({ users: s.users, currentUser: s.currentUser, sessionExpiry: s.sessionExpiry }),
    }
  )
);

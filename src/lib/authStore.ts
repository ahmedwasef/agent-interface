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

// ── Default credentials (demo only — not real passwords) ─────────────────────
const DEFAULT_USERS: LoginUser[] = [
  {
    id: 'u0',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    displayName: 'Administrator',
    email: 'admin@example.com',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'u1',
    username: 'damien.marie',
    password: 'super123',
    role: 'supervisor',
    agentId: '5',
    displayName: 'Damien Marie',
    email: 'damien.marie@example.com',
    active: true,
    createdAt: new Date().toISOString(),
  },
  { id: 'u2',  username: 'ahmed.amasha',    password: 'agent123', role: 'agent', agentId: '1',  displayName: 'Ahmed AMasha',            email: 'agent01@example.com', active: true, createdAt: new Date().toISOString() },
  { id: 'u3',  username: 'alejandro',        password: 'agent123', role: 'agent', agentId: '2',  displayName: 'Gonzalez Alejandro Munoz',email: 'agent02@example.com', active: true, createdAt: new Date().toISOString() },
  { id: 'u4',  username: 'brahim.hamimoum', password: 'agent123', role: 'agent', agentId: '3',  displayName: 'Brahim Hamimoum',         email: 'agent03@example.com', active: true, createdAt: new Date().toISOString() },
  { id: 'u5',  username: 'constance.fode',  password: 'agent123', role: 'agent', agentId: '4',  displayName: 'Constance Fode',          email: 'agent04@example.com', active: true, createdAt: new Date().toISOString() },
  { id: 'u6',  username: 'edgar.castro',    password: 'agent123', role: 'agent', agentId: '6',  displayName: 'Edgar Castro Zambrano',   email: 'agent05@example.com', active: true, createdAt: new Date().toISOString() },
  { id: 'u7',  username: 'francis.poirier', password: 'agent123', role: 'agent', agentId: '7',  displayName: 'Francis Poirier',         email: 'agent06@example.com', active: true, createdAt: new Date().toISOString() },
  { id: 'u8',  username: 'gabriel.april',   password: 'agent123', role: 'agent', agentId: '8',  displayName: 'Gabriel April',           email: 'agent07@example.com', active: true, createdAt: new Date().toISOString() },
  { id: 'u9',  username: 'hassan',           password: 'agent123', role: 'agent', agentId: '9',  displayName: 'Hassan Chamkmaki',        email: 'agent08@example.com', active: true, createdAt: new Date().toISOString() },
  { id: 'u10', username: 'kamel.belblidi',  password: 'agent123', role: 'agent', agentId: '10', displayName: 'Kamel Belblidi',          email: 'agent09@example.com', active: true, createdAt: new Date().toISOString() },
  { id: 'u11', username: 'kelly',            password: 'agent123', role: 'agent', agentId: '11', displayName: 'Paradowski Kelly',        email: 'agent10@example.com', active: true, createdAt: new Date().toISOString() },
  { id: 'u12', username: 'martha.jimenez',  password: 'agent123', role: 'agent', agentId: '12', displayName: 'Martha Jimenez',          email: 'agent11@example.com', active: true, createdAt: new Date().toISOString() },
  { id: 'u13', username: 'sarim.ramos',     password: 'agent123', role: 'agent', agentId: '13', displayName: 'Sarim Ramos',             email: 'agent12@example.com', active: true, createdAt: new Date().toISOString() },
  { id: 'u14', username: 'sepideh.amiri',   password: 'agent123', role: 'agent', agentId: '14', displayName: 'Sepideh Amiri',           email: 'agent13@example.com', active: true, createdAt: new Date().toISOString() },
  { id: 'u15', username: 'thomas',           password: 'agent123', role: 'agent', agentId: '15', displayName: 'Thomas Houdebert',        email: 'agent14@example.com', active: true, createdAt: new Date().toISOString() },
  { id: 'u16', username: 'vincent',          password: 'agent123', role: 'agent', agentId: '16', displayName: 'Vincent Rancourt',        email: 'agent15@example.com', active: true, createdAt: new Date().toISOString() },
  { id: 'u17', username: 'vitalie',          password: 'agent123', role: 'agent', agentId: '17', displayName: 'Vitalie Mihaila',         email: 'agent16@example.com', active: true, createdAt: new Date().toISOString() },
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
      name: 'agent-auth-store-v3',
      partialize: (s) => ({ users: s.users, currentUser: s.currentUser, sessionExpiry: s.sessionExpiry }),
    }
  )
);

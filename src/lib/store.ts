'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, TaskStatus, StatusChange, Agent } from './types';
import { AGENTS as DEFAULT_AGENTS } from './agents';
import { generateMockTasks } from './mockData';

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

interface AppStore {
  tasks: Task[];
  agents: Agent[];
  hasSeenOnboarding: boolean;
  initialized: boolean;

  // Initialization
  initialize: () => void;

  // Task status + notes
  updateTaskStatus: (taskId: string, status: TaskStatus, changedBy: string, note?: string) => void;
  updateTaskNotes: (taskId: string, notes: string) => void;

  // Full task edit (admin)
  updateTask: (taskId: string, updates: Partial<Task>) => void;

  // Task reassignment (admin)
  reassignTasks: (taskIds: string[], newAgentId: string, changedBy: string, note?: string) => void;

  // Task CRUD
  importTasks: (tasks: Partial<Task>[]) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>) => void;
  deleteTask: (taskId: string) => void;
  deleteTasks: (taskIds: string[]) => void;

  // Agent CRUD (admin)
  addAgent: (agent: Omit<Agent, 'id'>) => void;
  updateAgent: (agentId: string, updates: Partial<Omit<Agent, 'id'>>) => void;
  removeAgent: (agentId: string) => void;

  // Onboarding
  markOnboardingDone: () => void;
  resetOnboarding: () => void;
  clearAllTasks: () => void;
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      agents: DEFAULT_AGENTS,
      hasSeenOnboarding: false,
      initialized: false,

      initialize: () => {
        if (get().initialized) return;
        set({ tasks: generateMockTasks(), initialized: true });
      },

      updateTaskStatus: (taskId, status, changedBy, note) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id !== taskId) return task;
            const change: StatusChange = {
              id: generateId(),
              status,
              timestamp: new Date().toISOString(),
              changedBy,
              note,
            };
            return { ...task, status, statusHistory: [...task.statusHistory, change], updatedAt: change.timestamp };
          }),
        }));
      },

      updateTaskNotes: (taskId, notes) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, notes, updatedAt: new Date().toISOString() } : t
          ),
        }));
      },

      updateTask: (taskId, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        }));
      },

      reassignTasks: (taskIds, newAgentId, changedBy, note) => {
        const ts = new Date().toISOString();
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (!taskIds.includes(task.id)) return task;
            const change: StatusChange = {
              id: generateId(),
              status: task.status,
              timestamp: ts,
              changedBy,
              note: note || `Reassigned to agent ${newAgentId}`,
            };
            return {
              ...task,
              agentId: newAgentId,
              statusHistory: [...task.statusHistory, change],
              updatedAt: ts,
            };
          }),
        }));
      },

      importTasks: (incoming) => {
        const newTasks: Task[] = incoming.map((t) => ({
          id: generateId(),
          agentId: t.agentId || '',
          title: t.title || 'Untitled',
          description: t.description || '',
          date: t.date || new Date().toISOString().split('T')[0],
          dayName: t.dayName || new Date(t.date || Date.now()).toLocaleDateString('en-US', { weekday: 'long' }),
          priority: t.priority || 'medium',
          status: t.status || 'not_started',
          category: t.category || 'TBD',
          estimatedHours: t.estimatedHours || 1,
          statusHistory: [{
            id: generateId(),
            status: 'not_started' as TaskStatus,
            timestamp: new Date().toISOString(),
            changedBy: 'SWAT Import',
            note: 'Imported from Excel/CSV',
          }],
          notes: t.notes || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // SWAT fields
          swatId: t.swatId,
          projet: t.projet,
          avion: t.avion,
          position: t.position,
          cahier: t.cahier,
          rv: t.rv,
          codif: t.codif,
          pctProd: t.pctProd,
          groupe: t.groupe,
          rfc: t.rfc,
          statutRv: t.statutRv,
          periode: t.periode,
          superviseur: t.superviseur,
          programme: t.programme,
          manager: t.manager,
          dt1: t.dt1,
          dt2: t.dt2,
          harmoManuel: t.harmoManuel,
          prioriteNum: t.prioriteNum,
        }));
        set((state) => ({ tasks: [...state.tasks, ...newTasks] }));
      },

      addTask: (taskData) => {
        const task: Task = {
          ...taskData,
          id: generateId(),
          statusHistory: [{
            id: generateId(),
            status: 'not_started',
            timestamp: new Date().toISOString(),
            changedBy: 'Manual Entry',
          }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ tasks: [...state.tasks, task] }));
      },

      deleteTask: (taskId) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) }));
      },

      deleteTasks: (taskIds) => {
        set((state) => ({ tasks: state.tasks.filter((t) => !taskIds.includes(t.id)) }));
      },

      // ── Agent CRUD ────────────────────────────────────────────────────────
      addAgent: (agentData) => {
        const id = generateId();
        set((state) => ({ agents: [...state.agents, { ...agentData, id }] }));
      },

      updateAgent: (agentId, updates) => {
        set((state) => ({
          agents: state.agents.map((a) => a.id === agentId ? { ...a, ...updates } : a),
        }));
      },

      removeAgent: (agentId) => {
        set((state) => ({
          agents: state.agents.filter((a) => a.id !== agentId),
          // Orphan tasks (don't delete — admin can reassign)
        }));
      },

      markOnboardingDone: () => set({ hasSeenOnboarding: true }),
      resetOnboarding: () => set({ hasSeenOnboarding: false }),
      clearAllTasks: () => set({ tasks: [], initialized: false }),
    }),
    {
      name: 'agent-interface-store-v2',
      partialize: (state) => ({
        tasks: state.tasks,
        agents: state.agents,
        hasSeenOnboarding: state.hasSeenOnboarding,
        initialized: state.initialized,
      }),
    }
  )
);

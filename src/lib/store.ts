'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, TaskStatus, StatusChange, Agent } from './types';
import { AGENTS } from './agents';
import { generateMockTasks } from './mockData';

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

interface AppStore {
  tasks: Task[];
  agents: Agent[];
  hasSeenOnboarding: boolean;
  initialized: boolean;

  // Actions
  initialize: () => void;
  updateTaskStatus: (taskId: string, status: TaskStatus, changedBy: string, note?: string) => void;
  updateTaskNotes: (taskId: string, notes: string) => void;
  importTasks: (tasks: Partial<Task>[]) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>) => void;
  deleteTask: (taskId: string) => void;
  markOnboardingDone: () => void;
  resetOnboarding: () => void;
  clearAllTasks: () => void;
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      agents: AGENTS,
      hasSeenOnboarding: false,
      initialized: false,

      initialize: () => {
        if (get().initialized) return;
        const tasks = generateMockTasks();
        set({ tasks, initialized: true });
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
            return {
              ...task,
              status,
              statusHistory: [...task.statusHistory, change],
              updatedAt: change.timestamp,
            };
          }),
        }));
      },

      updateTaskNotes: (taskId, notes) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId ? { ...task, notes, updatedAt: new Date().toISOString() } : task
          ),
        }));
      },

      importTasks: (incoming) => {
        const newTasks: Task[] = incoming.map((t) => ({
          id: generateId(),
          agentId: t.agentId || '',
          title: t.title || 'Untitled Task',
          description: t.description || '',
          date: t.date || new Date().toISOString().split('T')[0],
          dayName: t.dayName || new Date(t.date || Date.now()).toLocaleDateString('en-US', { weekday: 'long' }),
          priority: t.priority || 'medium',
          status: 'not_started',
          category: t.category || 'General',
          estimatedHours: t.estimatedHours || 1,
          statusHistory: [
            {
              id: generateId(),
              status: 'not_started',
              timestamp: new Date().toISOString(),
              changedBy: 'Excel Import',
              note: 'Imported from Excel',
            },
          ],
          notes: t.notes || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        set((state) => ({ tasks: [...state.tasks, ...newTasks] }));
      },

      addTask: (taskData) => {
        const task: Task = {
          ...taskData,
          id: generateId(),
          status: 'not_started',
          statusHistory: [
            {
              id: generateId(),
              status: 'not_started',
              timestamp: new Date().toISOString(),
              changedBy: 'Manual Entry',
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ tasks: [...state.tasks, task] }));
      },

      deleteTask: (taskId) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) }));
      },

      markOnboardingDone: () => set({ hasSeenOnboarding: true }),
      resetOnboarding: () => set({ hasSeenOnboarding: false }),
      clearAllTasks: () => set({ tasks: [], initialized: false }),
    }),
    {
      name: 'agent-interface-store',
      partialize: (state) => ({
        tasks: state.tasks,
        hasSeenOnboarding: state.hasSeenOnboarding,
        initialized: state.initialized,
      }),
    }
  )
);

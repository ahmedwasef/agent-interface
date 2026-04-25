'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Lang = 'en' | 'fr';

interface LangState {
  lang: Lang;
  toggle: () => void;
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: 'fr',
      toggle: () => set((s) => ({ lang: s.lang === 'en' ? 'fr' : 'en' })),
    }),
    { name: 'maad-lang' }
  )
);

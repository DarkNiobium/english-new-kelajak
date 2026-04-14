import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GeneratedLesson } from './types';

interface LessonState {
  currentLesson: GeneratedLesson | null;
  setCurrentLesson: (lesson: GeneratedLesson | null) => void;
  updateLesson: (lesson: Partial<GeneratedLesson>) => void;
}

export const useLessonStore = create<LessonState>()(
  persist(
    (set) => ({
      currentLesson: null,
      setCurrentLesson: (lesson) => set({ currentLesson: lesson }),
      updateLesson: (lesson) => set((state) => ({
        currentLesson: state.currentLesson ? { ...state.currentLesson, ...lesson } : null
      }))
    }),
    {
      name: 'lesson-storage',
    }
  )
);

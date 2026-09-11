import { Era, Milestone, Task, TimeBlock, DailyCheckin, Habit, MonthFocus, SemesterGoal } from '../types';

export const getTodayDateStr = (): string => {
  // Use UTC to avoid timezone issues
  const today = new Date();
  const year = today.getUTCFullYear();
  const month = String(today.getUTCMonth() + 1).padStart(2, '0');
  const day = String(today.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getRelativeDateStr = (offsetDays: number): string => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Dados limpos para início real do usuário
export const initialEras: Era[] = [];

export const initialMilestones: Milestone[] = [];

export const initialTasks: Task[] = [];

export const initialTimeBlocks: TimeBlock[] = [];

export const initialCheckin: DailyCheckin = {
  date: getTodayDateStr(),
  energyLevel: 'medium',
  selectedPillars: [],
  intention: '',
  completedCheckin: false,
};

export const initialHabits: Habit[] = [];

export const initialMonthFocuses: MonthFocus[] = [];

export const initialSemesterGoals: SemesterGoal[] = [];

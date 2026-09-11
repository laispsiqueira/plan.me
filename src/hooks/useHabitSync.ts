import { useReducer, useCallback } from 'react';
import { Habit, Task } from '../types';
import { getTodayDateStr } from '../data/initialData';

export interface HabitSyncState {
  habits: Habit[];
  tasks: Task[];
}

export type HabitSyncAction =
  | {
      type: 'TOGGLE_HABIT_DATE';
      payload: { habitId: string; dateStr: string };
    }
  | {
      type: 'SET_HABITS';
      payload: Habit[];
    }
  | {
      type: 'SET_TASKS';
      payload: Task[];
    }
  | {
      type: 'SYNC_STATE';
      payload: { habits: Habit[]; tasks: Task[] };
    };

export function habitSyncReducer(state: HabitSyncState, action: HabitSyncAction): HabitSyncState {
  const today = getTodayDateStr();

  switch (action.type) {
    case 'TOGGLE_HABIT_DATE': {
      const { habitId, dateStr } = action.payload;

      const updatedHabits = state.habits.map((h) => {
        if (h.id !== habitId) return h;
        const exists = h.completedDates.includes(dateStr);
        const newDates = exists
          ? h.completedDates.filter((d) => d !== dateStr)
          : [...h.completedDates, dateStr];
        return { ...h, completedDates: newDates };
      });

      const updatedHabit = updatedHabits.find((h) => h.id === habitId);
      if (dateStr === today && updatedHabit?.taskId) {
        const taskId = updatedHabit.taskId;
        const isCompleted = updatedHabit.completedDates.includes(dateStr);

        const updatedTasks = state.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: isCompleted ? ('completed' as const) : ('todo' as const),
                completedAt: isCompleted ? new Date().toISOString() : undefined,
              }
            : t
        );

        return { habits: updatedHabits, tasks: updatedTasks };
      }

      return { ...state, habits: updatedHabits };
    }
    case 'SET_HABITS':
      return { ...state, habits: action.payload };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'SYNC_STATE':
      return { habits: action.payload.habits, tasks: action.payload.tasks };
    default:
      return state;
  }
}

export function useHabitSync(initialState: HabitSyncState) {
  const [state, dispatch] = useReducer(habitSyncReducer, initialState);

  const toggleHabitDate = useCallback((habitId: string, dateStr: string) => {
    dispatch({
      type: 'TOGGLE_HABIT_DATE',
      payload: { habitId, dateStr },
    });
  }, []);

  const setHabits = useCallback((habits: Habit[]) => {
    dispatch({ type: 'SET_HABITS', payload: habits });
  }, []);

  const setTasks = useCallback((tasks: Task[]) => {
    dispatch({ type: 'SET_TASKS', payload: tasks });
  }, []);

  return { state, toggleHabitDate, setHabits, setTasks, dispatch };
}

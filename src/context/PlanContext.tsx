import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Era,
  Milestone,
  Task,
  TimeBlock,
  DailyCheckin,
  EnergyLevel,
  ActiveTab,
  TaskStatus,
  Habit,
  MonthFocus,
  SemesterGoal,
} from '../types';
import {
  initialEras,
  initialMilestones,
  initialTasks,
  initialTimeBlocks,
  initialCheckin,
  initialHabits,
  initialMonthFocuses,
  initialSemesterGoals,
  getTodayDateStr,
} from '../data/initialData';

interface PlanContextType {
  // State
  eras: Era[];
  milestones: Milestone[];
  tasks: Task[];
  timeBlocks: TimeBlock[];
  dailyCheckin: DailyCheckin;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  habits: Habit[];
  monthFocuses: MonthFocus[];
  semesterGoals: SemesterGoal[];

  // Modals & UI controls
  isCheckinOpen: boolean;
  setIsCheckinOpen: (open: boolean) => void;
  isRespiteBoxOpen: boolean;
  setIsRespiteBoxOpen: (open: boolean) => void;
  isTaskModalOpen: boolean;
  setIsTaskModalOpen: (open: boolean) => void;
  isEraModalOpen: boolean;
  setIsEraModalOpen: (open: boolean) => void;
  isTimeBlockModalOpen: boolean;
  setIsTimeBlockModalOpen: (open: boolean) => void;
  isRespiteTriggerModalOpen: boolean;
  setIsRespiteTriggerModalOpen: (open: boolean) => void;

  editingTask: Task | null;
  setEditingTask: (task: Task | null) => void;
  editingEra: Era | null;
  setEditingEra: (era: Era | null) => void;
  editingTimeBlock: TimeBlock | null;
  setEditingTimeBlock: (tb: TimeBlock | null) => void;
  preselectedMilestoneId: string | null;
  setPreselectedMilestoneId: (id: string | null) => void;
  preselectedDueDate: string | null;
  setPreselectedDueDate: (date: string | null) => void;
  preselectedStartTime: string | null;
  setPreselectedStartTime: (time: string | null) => void;
  preselectedEndTime: string | null;
  setPreselectedEndTime: (time: string | null) => void;

  // Action methods
  setEnergyLevel: (level: EnergyLevel, intention?: string, pillars?: string[]) => void;
  toggleTaskStatus: (taskId: string) => void;
  setTaskStatus: (taskId: string, status: TaskStatus) => void;
  togglePillar: (taskId: string) => void;
  saveTask: (task: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => void;
  deleteTask: (taskId: string) => void;
  moveTaskToDate: (taskId: string, newDate: string) => void;
  moveToRespite: (taskId: string, reason?: string) => void;
  moveMultipleToRespite: (taskIds: string[], reason?: string) => void;
  restoreFromRespite: (taskId: string, targetDate?: string) => void;

  saveEra: (era: Omit<Era, 'id' | 'createdAt'> & { id?: string }) => void;
  deleteEra: (eraId: string) => void;

  saveMilestone: (milestone: Omit<Milestone, 'id'> & { id?: string }) => void;
  deleteMilestone: (milestoneId: string) => void;

  saveTimeBlock: (timeBlock: Omit<TimeBlock, 'id'> & { id?: string }) => void;
  deleteTimeBlock: (timeBlockId: string) => void;

  // Habits methods
  saveHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'completedDates'> & { id?: string; completedDates?: string[] }) => void;
  deleteHabit: (habitId: string) => void;
  toggleHabitDate: (habitId: string, dateStr: string) => void;

  // Monthly & Semester Focus methods
  saveMonthFocus: (focus: MonthFocus) => void;
  saveSemesterGoal: (goal: Omit<SemesterGoal, 'id'> & { id?: string }) => void;
  deleteSemesterGoal: (goalId: string) => void;
  toggleSemesterGoalStatus: (goalId: string) => void;

  // Computed & Query Helpers
  getMilestoneProgress: (milestoneId: string) => number;
  getEraProgress: (eraId: string) => number;
  getMilestoneById: (milestoneId: string) => Milestone | undefined;
  getEraById: (eraId: string) => Era | undefined;
  getEraByMilestoneId: (milestoneId: string) => Era | undefined;

  // Smart Prioritized Tasks according to energy level
  prioritizedDailyTasks: Task[];
  respiteTasks: Task[];

  // Clear data utility
  clearAllData: () => void;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ERAS: 'planme_eras_v2',
  MILESTONES: 'planme_milestones_v2',
  TASKS: 'planme_tasks_v2',
  TIMEBLOCKS: 'planme_timeblocks_v2',
  CHECKIN: 'planme_checkin_v2',
  HABITS: 'planme_habits_v2',
  MONTH_FOCUSES: 'planme_month_focuses_v2',
  SEMESTER_GOALS: 'planme_semester_goals_v2',
};

export const PlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [eras, setEras] = useState<Era[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ERAS);
      return stored ? JSON.parse(stored) : initialEras;
    } catch {
      return initialEras;
    }
  });

  const [milestones, setMilestones] = useState<Milestone[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MILESTONES);
      return stored ? JSON.parse(stored) : initialMilestones;
    } catch {
      return initialMilestones;
    }
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
      return stored ? JSON.parse(stored) : initialTasks;
    } catch {
      return initialTasks;
    }
  });

  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TIMEBLOCKS);
      return stored ? JSON.parse(stored) : initialTimeBlocks;
    } catch {
      return initialTimeBlocks;
    }
  });

  const [dailyCheckin, setDailyCheckin] = useState<DailyCheckin>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CHECKIN);
      const parsed = stored ? JSON.parse(stored) : initialCheckin;
      if (parsed && parsed.date === getTodayDateStr()) {
        return parsed;
      }
      return {
        date: getTodayDateStr(),
        energyLevel: 'medium',
        selectedPillars: [],
        intention: '',
        completedCheckin: false,
      };
    } catch {
      return initialCheckin;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dump');
  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HABITS);
      return stored ? JSON.parse(stored) : initialHabits;
    } catch {
      return initialHabits;
    }
  });

  const [monthFocuses, setMonthFocuses] = useState<MonthFocus[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MONTH_FOCUSES);
      return stored ? JSON.parse(stored) : initialMonthFocuses;
    } catch {
      return initialMonthFocuses;
    }
  });

  const [semesterGoals, setSemesterGoals] = useState<SemesterGoal[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SEMESTER_GOALS);
      return stored ? JSON.parse(stored) : initialSemesterGoals;
    } catch {
      return initialSemesterGoals;
    }
  });

  const [isCheckinOpen, setIsCheckinOpen] = useState<boolean>(false);
  const [isRespiteBoxOpen, setIsRespiteBoxOpen] = useState<boolean>(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [isEraModalOpen, setIsEraModalOpen] = useState<boolean>(false);
  const [isTimeBlockModalOpen, setIsTimeBlockModalOpen] = useState<boolean>(false);
  const [isRespiteTriggerModalOpen, setIsRespiteTriggerModalOpen] = useState<boolean>(false);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingEra, setEditingEra] = useState<Era | null>(null);
  const [editingTimeBlock, setEditingTimeBlock] = useState<TimeBlock | null>(null);
  const [preselectedMilestoneId, setPreselectedMilestoneId] = useState<string | null>(null);
  const [preselectedDueDate, setPreselectedDueDate] = useState<string | null>(null);
  const [preselectedStartTime, setPreselectedStartTime] = useState<string | null>(null);
  const [preselectedEndTime, setPreselectedEndTime] = useState<string | null>(null);

  // Cleanup old v1 test keys on initial mount
  useEffect(() => {
    try {
      const oldKeys = [
        'planme_eras_v1',
        'planme_milestones_v1',
        'planme_tasks_v1',
        'planme_timeblocks_v1',
        'planme_checkin_v1',
        'planme_habits_v1',
        'planme_month_focuses_v1',
        'planme_semester_goals_v1',
      ];
      oldKeys.forEach((k) => localStorage.removeItem(k));
    } catch {}
  }, []);

  const clearAllData = () => {
    setEras([]);
    setMilestones([]);
    setTasks([]);
    setTimeBlocks([]);
    setHabits([]);
    setMonthFocuses([]);
    setSemesterGoals([]);
    setDailyCheckin({
      date: getTodayDateStr(),
      energyLevel: 'medium',
      selectedPillars: [],
      intention: '',
      completedCheckin: false,
    });
    try {
      Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    } catch {}
  };

  // Persistence effects
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ERAS, JSON.stringify(eras));
    } catch {}
  }, [eras]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(milestones));
    } catch {}
  }, [milestones]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TIMEBLOCKS, JSON.stringify(timeBlocks));
    } catch {}
  }, [timeBlocks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CHECKIN, JSON.stringify(dailyCheckin));
    } catch {}
  }, [dailyCheckin]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
    } catch {}
  }, [habits]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MONTH_FOCUSES, JSON.stringify(monthFocuses));
    } catch {}
  }, [monthFocuses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SEMESTER_GOALS, JSON.stringify(semesterGoals));
    } catch {}
  }, [semesterGoals]);

  // Open checkin automatically if not yet completed for today
  useEffect(() => {
    if (!dailyCheckin.completedCheckin && dailyCheckin.date === getTodayDateStr()) {
      setIsCheckinOpen(true);
    }
  }, [dailyCheckin.completedCheckin, dailyCheckin.date]);

  // Helper query methods
  const getMilestoneById = (id: string): Milestone | undefined => {
    return milestones.find((m) => m.id === id);
  };

  const getEraById = (id: string): Era | undefined => {
    return eras.find((e) => e.id === id);
  };

  const getEraByMilestoneId = (milestoneId: string): Era | undefined => {
    const milestone = getMilestoneById(milestoneId);
    if (!milestone) return undefined;
    return getEraById(milestone.eraId);
  };

  const getMilestoneProgress = (milestoneId: string): number => {
    const milestoneTasks = tasks.filter((t) => t.milestoneId === milestoneId && t.status !== 'respite_moved');
    if (milestoneTasks.length === 0) return 0;
    const completed = milestoneTasks.filter((t) => t.status === 'completed').length;
    return Math.round((completed / milestoneTasks.length) * 100);
  };

  const getEraProgress = (eraId: string): number => {
    const eraMilestones = milestones.filter((m) => m.eraId === eraId);
    if (eraMilestones.length === 0) return 0;
    const totalProgress = eraMilestones.reduce((acc, m) => acc + getMilestoneProgress(m.id), 0);
    return Math.round(totalProgress / eraMilestones.length);
  };

  // Actions
  const setEnergyLevel = (level: EnergyLevel, intention?: string, pillars?: string[]) => {
    setDailyCheckin((prev) => ({
      ...prev,
      date: getTodayDateStr(),
      energyLevel: level,
      intention: intention !== undefined ? intention : prev.intention,
      selectedPillars: pillars !== undefined ? pillars : prev.selectedPillars,
      completedCheckin: true,
    }));

    if (pillars && pillars.length > 0) {
      setTasks((prev) =>
        prev.map((t) => ({
          ...t,
          isPillar: pillars.includes(t.id),
        }))
      );
    }

    // If level is low_respite, gently suggest activating the Respite Flow if there are heavy tasks
    if (level === 'low_respite') {
      const activeTasksCount = tasks.filter(
        (t) => t.status !== 'completed' && t.status !== 'respite_moved' && !t.isPillar
      ).length;
      if (activeTasksCount > 0) {
        setIsRespiteTriggerModalOpen(true);
      }
    }
  };

  const toggleTaskStatus = (taskId: string) => {
    const todayStr = getTodayDateStr();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const newStatus = t.status === 'completed' ? 'todo' : 'completed';

          // Sync with linked habit if any
          const targetHabitId = t.habitId || habits.find((h) => h.taskId === taskId)?.id;
          if (targetHabitId) {
            setHabits((prevH) =>
              prevH.map((h) => {
                if (h.id !== targetHabitId) return h;
                const hasToday = h.completedDates.includes(todayStr);
                if (newStatus === 'completed' && !hasToday) {
                  return { ...h, completedDates: [...h.completedDates, todayStr] };
                } else if (newStatus !== 'completed' && hasToday) {
                  return { ...h, completedDates: h.completedDates.filter((d) => d !== todayStr) };
                }
                return h;
              })
            );
          }

          return {
            ...t,
            status: newStatus,
            completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );
  };

  const setTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status,
            completedAt: status === 'completed' ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );
  };

  const togglePillar = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const newIsPillar = !t.isPillar;
          return { ...t, isPillar: newIsPillar };
        }
        return t;
      })
    );

    setDailyCheckin((prev) => {
      const isAlready = prev.selectedPillars.includes(taskId);
      const newPillars = isAlready
        ? prev.selectedPillars.filter((id) => id !== taskId)
        : [...prev.selectedPillars.slice(0, 2), taskId]; // max 3
      return { ...prev, selectedPillars: newPillars };
    });
  };

  const saveTask = (taskData: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => {
    if (taskData.id) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskData.id ? { ...t, ...taskData } : t))
      );
    } else {
      const newTask: Task = {
        ...taskData,
        id: `task-${Date.now()}`,
        createdAt: getTodayDateStr(),
      };
      setTasks((prev) => [newTask, ...prev]);
    }
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    // Also remove from timeblocks if linked
    setTimeBlocks((prev) => prev.map((tb) => (tb.taskId === taskId ? { ...tb, taskId: undefined } : tb)));
  };

  const moveTaskToDate = (taskId: string, newDate: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, dueDate: newDate } : t))
    );
  };

  const moveToRespite = (taskId: string, reason?: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status: 'respite_moved',
            isPillar: false,
            respiteReason: reason || 'Movida com acolhimento para a Caixa de Descanso.',
          };
        }
        return t;
      })
    );
  };

  const moveMultipleToRespite = (taskIds: string[], reason?: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (taskIds.includes(t.id)) {
          return {
            ...t,
            status: 'respite_moved',
            isPillar: false,
            respiteReason: reason || 'Pausa intencional para descompressão sem culpa.',
          };
        }
        return t;
      })
    );
  };

  const restoreFromRespite = (taskId: string, targetDate?: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status: 'todo',
            dueDate: targetDate || getTodayDateStr(),
            respiteReason: undefined,
          };
        }
        return t;
      })
    );
  };

  const saveEra = (eraData: Omit<Era, 'id' | 'createdAt'> & { id?: string }) => {
    if (eraData.id) {
      setEras((prev) => prev.map((e) => (e.id === eraData.id ? { ...e, ...eraData } : e)));
    } else {
      const newEra: Era = {
        ...eraData,
        id: `era-${Date.now()}`,
        createdAt: getTodayDateStr(),
      };
      setEras((prev) => [...prev, newEra]);
    }
  };

  const deleteEra = (eraId: string) => {
    setEras((prev) => prev.filter((e) => e.id !== eraId));
    // Find milestones of this era
    const childMilestones = milestones.filter((m) => m.eraId === eraId).map((m) => m.id);
    setMilestones((prev) => prev.filter((m) => m.eraId !== eraId));
    setTasks((prev) => prev.filter((t) => !childMilestones.includes(t.milestoneId)));
  };

  const saveMilestone = (milestoneData: Omit<Milestone, 'id'> & { id?: string }) => {
    if (milestoneData.id) {
      setMilestones((prev) =>
        prev.map((m) => (m.id === milestoneData.id ? { ...m, ...milestoneData } : m))
      );
    } else {
      const newMilestone: Milestone = {
        ...milestoneData,
        id: `mile-${Date.now()}`,
      };
      setMilestones((prev) => [...prev, newMilestone]);
    }
  };

  const deleteMilestone = (milestoneId: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== milestoneId));
    setTasks((prev) => prev.filter((t) => t.milestoneId !== milestoneId));
  };

  const saveTimeBlock = (tbData: Omit<TimeBlock, 'id'> & { id?: string }) => {
    if (tbData.id) {
      setTimeBlocks((prev) => prev.map((tb) => (tb.id === tbData.id ? { ...tb, ...tbData } : tb)));
    } else {
      const newTb: TimeBlock = {
        ...tbData,
        id: `tb-${Date.now()}`,
      };
      setTimeBlocks((prev) => [...prev, newTb]);
    }
  };

  const deleteTimeBlock = (timeBlockId: string) => {
    setTimeBlocks((prev) => prev.filter((tb) => tb.id !== timeBlockId));
  };

  // Habits methods
  const saveHabit = (habitData: Omit<Habit, 'id' | 'createdAt' | 'completedDates'> & { id?: string; completedDates?: string[] }) => {
    if (habitData.id) {
      setHabits((prev) =>
        prev.map((h) => (h.id === habitData.id ? { ...h, ...habitData } : h))
      );
      if (habitData.taskId) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === habitData.taskId
              ? { ...t, title: habitData.title, lifeArea: habitData.lifeArea, isHabit: true }
              : t
          )
        );
      }
    } else {
      const habitId = `habit-${Date.now()}`;
      let createdTaskId = habitData.taskId;

      if (habitData.isTask && !createdTaskId) {
        createdTaskId = `task-${Date.now()}`;
        const newTask: Task = {
          id: createdTaskId,
          title: habitData.title,
          milestoneId: milestones[0]?.id || '',
          dueDate: getTodayDateStr(),
          createdAt: getTodayDateStr(),
          priorityType: 'deadline',
          status: 'todo',
          estimatedMinutes: 20,
          isHabit: true,
          habitId: habitId,
          lifeArea: habitData.lifeArea,
          notes: habitData.description,
        };
        setTasks((prev) => [newTask, ...prev]);
      }

      const newHabit: Habit = {
        ...habitData,
        id: habitId,
        taskId: createdTaskId,
        createdAt: getTodayDateStr(),
        completedDates: habitData.completedDates || [],
      };
      setHabits((prev) => [...prev, newHabit]);
    }
  };

  const deleteHabit = (habitId: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
  };

  const toggleHabitDate = (habitId: string, dateStr: string) => {
    const todayStr = getTodayDateStr();
    let willBeCompleted = false;
    let linkedTaskId: string | undefined = undefined;

    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        linkedTaskId = h.taskId;
        const exists = h.completedDates.includes(dateStr);
        willBeCompleted = !exists;
        const newDates = exists
          ? h.completedDates.filter((d) => d !== dateStr)
          : [...h.completedDates, dateStr];
        return { ...h, completedDates: newDates };
      })
    );

    // If toggled for today and has linked task, sync task status
    if (dateStr === todayStr && linkedTaskId) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === linkedTaskId
            ? {
                ...t,
                status: willBeCompleted ? 'completed' : 'todo',
                completedAt: willBeCompleted ? new Date().toISOString() : undefined,
              }
            : t
        )
      );
    }
  };

  // Monthly & Semester Focus methods
  const saveMonthFocus = (focus: MonthFocus) => {
    setMonthFocuses((prev) => {
      const exists = prev.some((mf) => mf.monthKey === focus.monthKey);
      if (exists) {
        return prev.map((mf) => (mf.monthKey === focus.monthKey ? focus : mf));
      }
      return [...prev, focus];
    });
  };

  const saveSemesterGoal = (goalData: Omit<SemesterGoal, 'id'> & { id?: string }) => {
    if (goalData.id) {
      setSemesterGoals((prev) =>
        prev.map((g) => (g.id === goalData.id ? { ...g, ...goalData } : g))
      );
    } else {
      const newGoal: SemesterGoal = {
        ...goalData,
        id: `sem-${Date.now()}`,
      };
      setSemesterGoals((prev) => [...prev, newGoal]);
    }
  };

  const deleteSemesterGoal = (goalId: string) => {
    setSemesterGoals((prev) => prev.filter((g) => g.id !== goalId));
  };

  const toggleSemesterGoalStatus = (goalId: string) => {
    setSemesterGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const nextStatus: SemesterGoal['status'] =
          g.status === 'completed' ? 'in_progress' : g.status === 'in_progress' ? 'completed' : 'in_progress';
        return { ...g, status: nextStatus };
      })
    );
  };

  // Prioritized Tasks Calculation based on Algoritmo de Priorização Automática
  const prioritizedDailyTasks = useMemo(() => {
    const todayStr = getTodayDateStr();
    // Exclude tasks in respite box and tasks in brain dump without a scheduled date
    const activeCandidates = tasks.filter(
      (t) => t.status !== 'respite_moved' && !!t.dueDate && t.dueDate.trim() !== ''
    );

    const energy = dailyCheckin.energyLevel;

    if (energy === 'high') {
      // Energia "Alta": As tarefas são ordenadas de forma mista priorizando o prazo de
      // vencimento da meta-mãe (targetDate mais próxima) em conjunto com tarefas de criação
      // mais antiga que estejam estagnadas, maximizando a entrega de impacto.
      return [...activeCandidates].sort((a, b) => {
        // Pillars come first
        if (a.isPillar && !b.isPillar) return -1;
        if (!a.isPillar && b.isPillar) return 1;

        const parentMileA = getMilestoneById(a.milestoneId);
        const parentMileB = getMilestoneById(b.milestoneId);

        const targetA = parentMileA?.targetDate || '9999-12-31';
        const targetB = parentMileB?.targetDate || '9999-12-31';

        if (targetA !== targetB) {
          return targetA.localeCompare(targetB);
        }

        // Secondary: creation date (older first to unblock stagnated)
        return a.createdAt.localeCompare(b.createdAt);
      });
    }

    if (energy === 'medium') {
      // Energia "Média": O algoritmo filtra o volume de tarefas diárias sugerindo apenas as 3
      // principais não-negociáveis vinculadas às prioridades do dia, reduzindo o escopo sem paralisar.
      const pillars = activeCandidates.filter((t) => t.isPillar);
      const others = activeCandidates.filter((t) => !t.isPillar && (t.dueDate <= todayStr || t.status === 'in_progress'));
      return [...pillars, ...others];
    }

    // Energia "Baixa" / Resguardo:
    // O sistema oculta a urgência por prazos e prioriza exclusivamente tarefas leves de manutenção ou autocuidado.
    return [...activeCandidates].sort((a, b) => {
      // Prioritize smaller duration (light maintenance)
      return a.estimatedMinutes - b.estimatedMinutes;
    });
  }, [tasks, dailyCheckin.energyLevel, milestones]);

  const respiteTasks = useMemo(() => {
    return tasks.filter((t) => t.status === 'respite_moved');
  }, [tasks]);

  return (
    <PlanContext.Provider
      value={{
        eras,
        milestones,
        tasks,
        timeBlocks,
        dailyCheckin,
        activeTab,
        setActiveTab,
        habits,
        monthFocuses,
        semesterGoals,
        isCheckinOpen,
        setIsCheckinOpen,
        isRespiteBoxOpen,
        setIsRespiteBoxOpen,
        isTaskModalOpen,
        setIsTaskModalOpen,
        isEraModalOpen,
        setIsEraModalOpen,
        isTimeBlockModalOpen,
        setIsTimeBlockModalOpen,
        isRespiteTriggerModalOpen,
        setIsRespiteTriggerModalOpen,
        editingTask,
        setEditingTask,
        editingEra,
        setEditingEra,
        editingTimeBlock,
        setEditingTimeBlock,
        preselectedMilestoneId,
        setPreselectedMilestoneId,
        preselectedDueDate,
        setPreselectedDueDate,
        preselectedStartTime,
        setPreselectedStartTime,
        preselectedEndTime,
        setPreselectedEndTime,
        setEnergyLevel,
        toggleTaskStatus,
        setTaskStatus,
        togglePillar,
        saveTask,
        deleteTask,
        moveTaskToDate,
        moveToRespite,
        moveMultipleToRespite,
        restoreFromRespite,
        saveEra,
        deleteEra,
        saveMilestone,
        deleteMilestone,
        saveTimeBlock,
        deleteTimeBlock,
        saveHabit,
        deleteHabit,
        toggleHabitDate,
        saveMonthFocus,
        saveSemesterGoal,
        deleteSemesterGoal,
        toggleSemesterGoalStatus,
        getMilestoneProgress,
        getEraProgress,
        getMilestoneById,
        getEraById,
        getEraByMilestoneId,
        prioritizedDailyTasks,
        respiteTasks,
        clearAllData,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = () => {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
};

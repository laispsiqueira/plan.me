import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from './AuthContext';
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
import { habitSyncReducer } from '../hooks/useHabitSync';
import { Logger } from '../lib/logger/Logger';

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

export const PlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [eras, setEras] = useState<Era[]>(initialEras);
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(initialTimeBlocks);
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [monthFocuses, setMonthFocuses] = useState<MonthFocus[]>(initialMonthFocuses);
  const [semesterGoals, setSemesterGoals] = useState<SemesterGoal[]>(initialSemesterGoals);
  const [dailyCheckin, setDailyCheckin] = useState<DailyCheckin>({
    date: getTodayDateStr(),
    energyLevel: 'medium',
    selectedPillars: [],
    intention: '',
    completedCheckin: false,
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dump');

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

  // Firestore Sync: when user changes, bind isolated subcollections
  useEffect(() => {
    if (!user) {
      // Clear data if logged out
      setEras([]);
      setMilestones([]);
      setTasks([]);
      setTimeBlocks([]);
      setHabits([]);
      setMonthFocuses([]);
      setSemesterGoals([]);
      return;
    }

    const uid = user.uid;

    // 1. Tasks Listener
    const tasksUnsub = onSnapshot(
      collection(db, 'users', uid, 'tasks'),
      (snapshot) => {
        const loaded: Task[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ ...docSnap.data(), id: docSnap.id } as Task);
        });
        setTasks(loaded);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${uid}/tasks`);
      }
    );

    // 2. Habits Listener
    const habitsUnsub = onSnapshot(
      collection(db, 'users', uid, 'habits'),
      (snapshot) => {
        const loaded: Habit[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ ...docSnap.data(), id: docSnap.id } as Habit);
        });
        setHabits(loaded);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${uid}/habits`);
      }
    );

    // 3. TimeBlocks Listener
    const timeBlocksUnsub = onSnapshot(
      collection(db, 'users', uid, 'timeBlocks'),
      (snapshot) => {
        const loaded: TimeBlock[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ ...docSnap.data(), id: docSnap.id } as TimeBlock);
        });
        setTimeBlocks(loaded);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${uid}/timeBlocks`);
      }
    );

    // 4. Eras Listener
    const erasUnsub = onSnapshot(
      collection(db, 'users', uid, 'eras'),
      (snapshot) => {
        const loaded: Era[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ ...docSnap.data(), id: docSnap.id } as Era);
        });
        setEras(loaded);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${uid}/eras`);
      }
    );

    // 5. Milestones Listener
    const milestonesUnsub = onSnapshot(
      collection(db, 'users', uid, 'milestones'),
      (snapshot) => {
        const loaded: Milestone[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ ...docSnap.data(), id: docSnap.id } as Milestone);
        });
        setMilestones(loaded);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${uid}/milestones`);
      }
    );

    // 6. Month Focuses Listener
    const monthFocusesUnsub = onSnapshot(
      collection(db, 'users', uid, 'monthFocuses'),
      (snapshot) => {
        const loaded: MonthFocus[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ ...docSnap.data(), monthKey: docSnap.id } as MonthFocus);
        });
        setMonthFocuses(loaded);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${uid}/monthFocuses`);
      }
    );

    // 7. Semester Goals Listener
    const semesterGoalsUnsub = onSnapshot(
      collection(db, 'users', uid, 'semesterGoals'),
      (snapshot) => {
        const loaded: SemesterGoal[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ ...docSnap.data(), id: docSnap.id } as SemesterGoal);
        });
        setSemesterGoals(loaded);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${uid}/semesterGoals`);
      }
    );

    // 8. Daily Checkin Listener for Today
    const todayStr = getTodayDateStr();
    const checkinDocRef = doc(db, 'users', uid, 'dailyCheckins', todayStr);
    const checkinUnsub = onSnapshot(
      checkinDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setDailyCheckin(docSnap.data() as DailyCheckin);
        } else {
          setDailyCheckin({
            date: todayStr,
            energyLevel: 'medium',
            selectedPillars: [],
            intention: '',
            completedCheckin: false,
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${uid}/dailyCheckins/${todayStr}`);
      }
    );

    return () => {
      tasksUnsub();
      habitsUnsub();
      timeBlocksUnsub();
      erasUnsub();
      milestonesUnsub();
      monthFocusesUnsub();
      semesterGoalsUnsub();
      checkinUnsub();
    };
  }, [user]);

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

  // Actions with isolated Firestore persistence
  const setEnergyLevel = async (level: EnergyLevel, intention?: string, pillars?: string[]) => {
    const todayStr = getTodayDateStr();
    const updatedCheckin: DailyCheckin = {
      date: todayStr,
      energyLevel: level,
      intention: intention !== undefined ? intention : dailyCheckin.intention,
      selectedPillars: pillars !== undefined ? pillars : dailyCheckin.selectedPillars,
      completedCheckin: true,
      userId: user?.uid,
    };

    setDailyCheckin(updatedCheckin);

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'dailyCheckins', todayStr), updatedCheckin, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/dailyCheckins/${todayStr}`);
      }
    }

    if (pillars && pillars.length > 0) {
      setTasks((prev) =>
        prev.map((t) => {
          const isPillar = pillars.includes(t.id);
          if (user && t.isPillar !== isPillar) {
            setDoc(doc(db, 'users', user.uid, 'tasks', t.id), { isPillar }, { merge: true }).catch(console.error);
          }
          return { ...t, isPillar };
        })
      );
    }

    if (level === 'low_respite') {
      const activeTasksCount = tasks.filter(
        (t) => t.status !== 'completed' && t.status !== 'respite_moved' && !t.isPillar
      ).length;
      if (activeTasksCount > 0) {
        setIsRespiteTriggerModalOpen(true);
      }
    }
  };

  const toggleTaskStatus = async (taskId: string) => {
    const todayStr = getTodayDateStr();
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const newStatus: TaskStatus = targetTask.status === 'completed' ? 'todo' : 'completed';
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : undefined;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus, completedAt } : t))
    );

    if (user) {
      try {
        await setDoc(
          doc(db, 'users', user.uid, 'tasks', taskId),
          { status: newStatus, completedAt: completedAt || null },
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/tasks/${taskId}`);
      }
    }

    // Sync with linked habit if any
    const targetHabitId = targetTask.habitId || habits.find((h) => h.taskId === taskId)?.id;
    if (targetHabitId) {
      setHabits((prevH) =>
        prevH.map((h) => {
          if (h.id !== targetHabitId) return h;
          const hasToday = h.completedDates.includes(todayStr);
          let newDates = h.completedDates;
          if (newStatus === 'completed' && !hasToday) {
            newDates = [...h.completedDates, todayStr];
          } else if (newStatus !== 'completed' && hasToday) {
            newDates = h.completedDates.filter((d) => d !== todayStr);
          }
          if (user) {
            setDoc(doc(db, 'users', user.uid, 'habits', h.id), { completedDates: newDates }, { merge: true }).catch(console.error);
          }
          return { ...h, completedDates: newDates };
        })
      );
    }
  };

  const setTaskStatus = async (taskId: string, status: TaskStatus) => {
    const completedAt = status === 'completed' ? new Date().toISOString() : undefined;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status, completedAt } : t))
    );

    if (user) {
      try {
        await setDoc(
          doc(db, 'users', user.uid, 'tasks', taskId),
          { status, completedAt: completedAt || null },
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/tasks/${taskId}`);
      }
    }
  };

  const togglePillar = async (taskId: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const newIsPillar = !targetTask.isPillar;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isPillar: newIsPillar } : t))
    );

    if (user) {
      try {
        await setDoc(
          doc(db, 'users', user.uid, 'tasks', taskId),
          { isPillar: newIsPillar },
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/tasks/${taskId}`);
      }
    }

    setDailyCheckin((prev) => {
      const isAlready = prev.selectedPillars.includes(taskId);
      const newPillars = isAlready
        ? prev.selectedPillars.filter((id) => id !== taskId)
        : [...prev.selectedPillars.slice(0, 2), taskId];
      
      const updated = { ...prev, selectedPillars: newPillars };
      if (user) {
        setDoc(doc(db, 'users', user.uid, 'dailyCheckins', prev.date), { selectedPillars: newPillars }, { merge: true }).catch(console.error);
      }
      return updated;
    });
  };

  const saveTask = async (taskData: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => {
    const taskId = taskData.id || `task-${Date.now()}`;
    const taskToSave: Task = {
      ...taskData,
      id: taskId,
      userId: user?.uid,
      createdAt: taskData.id ? (tasks.find((t) => t.id === taskData.id)?.createdAt || getTodayDateStr()) : getTodayDateStr(),
    };

    setTasks((prev) => {
      const exists = prev.some((t) => t.id === taskId);
      return exists ? prev.map((t) => (t.id === taskId ? taskToSave : t)) : [taskToSave, ...prev];
    });

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'tasks', taskId), taskToSave, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/tasks/${taskId}`);
      }
    }
  };

  const deleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setTimeBlocks((prev) => prev.map((tb) => (tb.taskId === taskId ? { ...tb, taskId: undefined } : tb)));

    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'tasks', taskId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/tasks/${taskId}`);
      }
    }
  };

  const moveTaskToDate = async (taskId: string, newDate: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, dueDate: newDate } : t))
    );

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'tasks', taskId), { dueDate: newDate }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/tasks/${taskId}`);
      }
    }
  };

  const moveToRespite = async (taskId: string, reason?: string) => {
    const respiteReason = reason || 'Movida com acolhimento para a Caixa de Descanso.';
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: 'respite_moved', isPillar: false, respiteReason }
          : t
      )
    );

    if (user) {
      try {
        await setDoc(
          doc(db, 'users', user.uid, 'tasks', taskId),
          { status: 'respite_moved', isPillar: false, respiteReason },
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/tasks/${taskId}`);
      }
    }
  };

  const moveMultipleToRespite = async (taskIds: string[], reason?: string) => {
    const respiteReason = reason || 'Pausa intencional para descompressão sem culpa.';
    setTasks((prev) =>
      prev.map((t) =>
        taskIds.includes(t.id)
          ? { ...t, status: 'respite_moved', isPillar: false, respiteReason }
          : t
      )
    );

    if (user) {
      taskIds.forEach((id) => {
        setDoc(
          doc(db, 'users', user.uid, 'tasks', id),
          { status: 'respite_moved', isPillar: false, respiteReason },
          { merge: true }
        ).catch(console.error);
      });
    }
  };

  const restoreFromRespite = async (taskId: string, targetDate?: string) => {
    const dueDate = targetDate || getTodayDateStr();
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: 'todo', dueDate, respiteReason: undefined }
          : t
      )
    );

    if (user) {
      try {
        await setDoc(
          doc(db, 'users', user.uid, 'tasks', taskId),
          { status: 'todo', dueDate, respiteReason: null },
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/tasks/${taskId}`);
      }
    }
  };

  const saveEra = async (eraData: Omit<Era, 'id' | 'createdAt'> & { id?: string }) => {
    const eraId = eraData.id || `era-${Date.now()}`;
    const eraToSave: Era = {
      ...eraData,
      id: eraId,
      userId: user?.uid,
      createdAt: eraData.id ? (eras.find((e) => e.id === eraData.id)?.createdAt || getTodayDateStr()) : getTodayDateStr(),
    };

    setEras((prev) => {
      const exists = prev.some((e) => e.id === eraId);
      return exists ? prev.map((e) => (e.id === eraId ? eraToSave : e)) : [...prev, eraToSave];
    });

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'eras', eraId), eraToSave, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/eras/${eraId}`);
      }
    }
  };

  const deleteEra = async (eraId: string) => {
    setEras((prev) => prev.filter((e) => e.id !== eraId));
    const childMilestones = milestones.filter((m) => m.eraId === eraId).map((m) => m.id);
    setMilestones((prev) => prev.filter((m) => m.eraId !== eraId));
    setTasks((prev) => prev.filter((t) => !childMilestones.includes(t.milestoneId)));

    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'eras', eraId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/eras/${eraId}`);
      }
    }
  };

  const saveMilestone = async (milestoneData: Omit<Milestone, 'id'> & { id?: string }) => {
    const milestoneId = milestoneData.id || `mile-${Date.now()}`;
    const milestoneToSave: Milestone = {
      ...milestoneData,
      id: milestoneId,
      userId: user?.uid,
    };

    setMilestones((prev) => {
      const exists = prev.some((m) => m.id === milestoneId);
      return exists ? prev.map((m) => (m.id === milestoneId ? milestoneToSave : m)) : [...prev, milestoneToSave];
    });

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'milestones', milestoneId), milestoneToSave, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/milestones/${milestoneId}`);
      }
    }
  };

  const deleteMilestone = async (milestoneId: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== milestoneId));
    setTasks((prev) => prev.filter((t) => t.milestoneId !== milestoneId));

    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'milestones', milestoneId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/milestones/${milestoneId}`);
      }
    }
  };

  const saveTimeBlock = async (tbData: Omit<TimeBlock, 'id'> & { id?: string }) => {
    const blockId = tbData.id || `tb-${Date.now()}`;
    const blockToSave: TimeBlock = {
      ...tbData,
      id: blockId,
      userId: user?.uid,
    };

    setTimeBlocks((prev) => {
      const exists = prev.some((tb) => tb.id === blockId);
      return exists ? prev.map((tb) => (tb.id === blockId ? blockToSave : tb)) : [...prev, blockToSave];
    });

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'timeBlocks', blockId), blockToSave, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/timeBlocks/${blockId}`);
      }
    }
  };

  const deleteTimeBlock = async (timeBlockId: string) => {
    setTimeBlocks((prev) => prev.filter((tb) => tb.id !== timeBlockId));

    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'timeBlocks', timeBlockId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/timeBlocks/${timeBlockId}`);
      }
    }
  };

  // Habits methods
  const saveHabit = async (
    habitData: Omit<Habit, 'id' | 'createdAt' | 'completedDates'> & { id?: string; completedDates?: string[] }
  ) => {
    const habitId = habitData.id || `habit-${Date.now()}`;
    let createdTaskId = habitData.taskId;

    if (habitData.isTask && !createdTaskId) {
      createdTaskId = `task-${Date.now()}`;
      const newTask: Task = {
        id: createdTaskId,
        userId: user?.uid,
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
      if (user) {
        setDoc(doc(db, 'users', user.uid, 'tasks', createdTaskId), newTask, { merge: true }).catch(console.error);
      }
    }

    const habitToSave: Habit = {
      ...habitData,
      id: habitId,
      userId: user?.uid,
      taskId: createdTaskId,
      createdAt: habitData.id ? (habits.find((h) => h.id === habitData.id)?.createdAt || getTodayDateStr()) : getTodayDateStr(),
      completedDates: habitData.completedDates || [],
    };

    setHabits((prev) => {
      const exists = prev.some((h) => h.id === habitId);
      return exists ? prev.map((h) => (h.id === habitId ? habitToSave : h)) : [...prev, habitToSave];
    });

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'habits', habitId), habitToSave, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/habits/${habitId}`);
      }
    }
  };

  const deleteHabit = async (habitId: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));

    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'habits', habitId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/habits/${habitId}`);
      }
    }
  };

  const toggleHabitDate = async (habitId: string, dateStr: string) => {
    const nextState = habitSyncReducer(
      { habits, tasks },
      { type: 'TOGGLE_HABIT_DATE', payload: { habitId, dateStr } }
    );

    setHabits(nextState.habits);
    setTasks(nextState.tasks);

    if (user) {
      const updatedH = nextState.habits.find((h) => h.id === habitId);
      if (updatedH) {
        setDoc(
          doc(db, 'users', user.uid, 'habits', habitId),
          { completedDates: updatedH.completedDates },
          { merge: true }
        ).catch((err) => {
          Logger.log('error', `Falha ao sincronizar hábito ${habitId}`, err);
        });
      }

      const updatedT = nextState.tasks.find((t) => t.id === updatedH?.taskId);
      if (updatedT) {
        setDoc(
          doc(db, 'users', user.uid, 'tasks', updatedT.id),
          { status: updatedT.status, completedAt: updatedT.completedAt || null },
          { merge: true }
        ).catch((err) => {
          Logger.log('error', `Falha ao sincronizar tarefa do hábito ${updatedT.id}`, err);
        });
      }
    }
  };

  // Monthly & Semester Focus methods
  const saveMonthFocus = async (focus: MonthFocus) => {
    const toSave = { ...focus, userId: user?.uid };
    setMonthFocuses((prev) => {
      const exists = prev.some((mf) => mf.monthKey === focus.monthKey);
      return exists ? prev.map((mf) => (mf.monthKey === focus.monthKey ? toSave : mf)) : [...prev, toSave];
    });

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'monthFocuses', focus.monthKey), toSave, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/monthFocuses/${focus.monthKey}`);
      }
    }
  };

  const saveSemesterGoal = async (goalData: Omit<SemesterGoal, 'id'> & { id?: string }) => {
    const goalId = goalData.id || `sem-${Date.now()}`;
    const toSave: SemesterGoal = { ...goalData, id: goalId, userId: user?.uid };

    setSemesterGoals((prev) => {
      const exists = prev.some((g) => g.id === goalId);
      return exists ? prev.map((g) => (g.id === goalId ? toSave : g)) : [...prev, toSave];
    });

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'semesterGoals', goalId), toSave, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/semesterGoals/${goalId}`);
      }
    }
  };

  const deleteSemesterGoal = async (goalId: string) => {
    setSemesterGoals((prev) => prev.filter((g) => g.id !== goalId));

    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'semesterGoals', goalId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/semesterGoals/${goalId}`);
      }
    }
  };

  const toggleSemesterGoalStatus = async (goalId: string) => {
    const target = semesterGoals.find((g) => g.id === goalId);
    if (!target) return;

    const nextStatus: SemesterGoal['status'] =
      target.status === 'completed' ? 'in_progress' : target.status === 'in_progress' ? 'completed' : 'in_progress';

    setSemesterGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, status: nextStatus } : g))
    );

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'semesterGoals', goalId), { status: nextStatus }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/semesterGoals/${goalId}`);
      }
    }
  };

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
  };

  // Prioritized Tasks Calculation based on Algoritmo de Priorização Automática
  const prioritizedDailyTasks = useMemo(() => {
    const todayStr = getTodayDateStr();
    const activeCandidates = tasks.filter(
      (t) => t.status !== 'respite_moved' && !!t.dueDate && t.dueDate.trim() !== ''
    );

    const energy = dailyCheckin.energyLevel;

    if (energy === 'high') {
      return [...activeCandidates].sort((a, b) => {
        if (a.isPillar && !b.isPillar) return -1;
        if (!a.isPillar && b.isPillar) return 1;

        const parentMileA = getMilestoneById(a.milestoneId);
        const parentMileB = getMilestoneById(b.milestoneId);

        const targetA = parentMileA?.targetDate || '9999-12-31';
        const targetB = parentMileB?.targetDate || '9999-12-31';

        if (targetA !== targetB) {
          return targetA.localeCompare(targetB);
        }

        return a.createdAt.localeCompare(b.createdAt);
      });
    }

    if (energy === 'medium') {
      const pillars = activeCandidates.filter((t) => t.isPillar);
      const others = activeCandidates.filter((t) => !t.isPillar && (t.dueDate <= todayStr || t.status === 'in_progress'));
      return [...pillars, ...others];
    }

    // Energia "Baixa" / Resguardo
    return [...activeCandidates].sort((a, b) => a.estimatedMinutes - b.estimatedMinutes);
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

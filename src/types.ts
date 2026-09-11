export type EnergyLevel = 'high' | 'medium' | 'low_respite';

export type PriorityCriterion = 'deadline' | 'creation_date';

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'respite_moved';

export type EraStatus = 'active' | 'completed' | 'paused';

export type LifeArea =
  | 'Trabalho & Negócio'
  | 'Saúde & Vitalidade'
  | 'Mente & Conhecimento'
  | 'Sonhos Pessoais'
  | 'Finanças & Futuro'
  | 'Relacionamentos & Família';

export interface Era {
  id: string;
  userId?: string;
  title: string;
  description: string;
  category: LifeArea;
  status: EraStatus;
  targetDate?: string; // Prazo de conclusão do sonho
  color: string; // Hex or theme color for tag
  accentBg: string;
  createdAt: string;
  imageUrl?: string; // Moodboard ou foto inspiradora da Era
}

export interface Milestone {
  id: string;
  userId?: string;
  eraId: string;
  title: string;
  targetDate: string; // YYYY-MM-DD
  status: 'pending' | 'in_progress' | 'completed';
  imageUrl?: string; // Moodboard da meta (imagem carregada por upload ou URL)
  notes?: string;
}

export type HabitFrequencyType =
  | 'weekdays'       // Dias específicos da semana (Seg a Dom)
  | 'times_per_week' // X vezes na semana
  | 'times_per_month';// X vezes no mês

export interface Habit {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  lifeArea: LifeArea;
  frequencyType: HabitFrequencyType;
  selectedDays?: number[]; // [1, 2, 3, 4, 5] para Seg-Sex, etc. (0 = Dom, 1 = Seg...)
  targetCount?: number;    // ex: 3 vezes na semana ou 10 vezes no mês
  targetTime?: 'morning' | 'afternoon' | 'evening' | 'any';
  
  // Vínculo com tarefas:
  isTask?: boolean;
  taskId?: string;

  completedDates: string[]; // datas YYYY-MM-DD em que foi cumprido
  createdAt: string;
  targetStreak?: number;

  // Legado / compatibilidade:
  frequency?: 'daily' | 'weekdays' | 'weekends' | string;
  period?: 'morning' | 'afternoon' | 'evening' | 'anytime';
  category?: string;
  milestoneId?: string;
}

export interface MonthFocus {
  userId?: string;
  monthKey: string; // e.g. "2026-09"
  theme: string;
  primaryDeliverable: string;
  notes?: string;
}

export interface SemesterGoal {
  id: string;
  userId?: string;
  semesterKey: string; // e.g. "2026-S2"
  monthKey: string; // e.g. "2026-09"
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  milestoneId?: string;
}

export interface Task {
  id: string;
  userId?: string;
  milestoneId: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  createdAt: string;
  priorityType: PriorityCriterion;
  status: TaskStatus;
  estimatedMinutes: number;
  isPillar?: boolean; // Não-negociável do dia
  isHabit?: boolean; // Tarefas podem ser hábitos recorrentes
  habitId?: string;  // Vínculo com hábito correspondente
  lifeArea?: LifeArea; // Área da vida vinculada
  notes?: string;
  imageUrl?: string; // Imagem anexada à tarefa
  audioUrl?: string; // Áudio gravado anexado à tarefa
  completedAt?: string;
  respiteReason?: string;
}

export interface TimeBlock {
  id: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "08:30"
  endTime: string;   // e.g. "10:00"
  title: string;
  type: 'focus' | 'commitment' | 'rest' | 'routine';
  taskId?: string;
}

export interface DailyCheckin {
  userId?: string;
  date: string; // YYYY-MM-DD
  energyLevel: EnergyLevel;
  selectedPillars: string[]; // Task IDs chosen as non-negotiable for the day
  intention?: string;
  completedCheckin: boolean;
}

export type ActiveTab = 'dump' | 'daily' | 'weekly' | 'monthly' | 'semester' | 'habits' | 'trail';

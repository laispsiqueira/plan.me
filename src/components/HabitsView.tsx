import React, { useState } from 'react';
import { usePlan } from '../context/PlanContext';
import { Habit, HabitFrequencyType, LifeArea } from '../types';
import { getTodayDateStr } from '../data/initialData';
import {
  CheckSquare2,
  Plus,
  Flame,
  Check,
  Calendar,
  Sparkles,
  Trash2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sun,
  Sunset,
  Moon,
  Coffee,
  RotateCw,
  Repeat,
  CheckCircle2,
  Circle,
  Tag,
  Briefcase,
  Activity,
  BookOpen,
  Sparkle,
  DollarSign,
  Users,
  Edit2,
  X
} from 'lucide-react';

const WEEKDAYS = [
  { short: 'Seg', index: 1 },
  { short: 'Ter', index: 2 },
  { short: 'Qua', index: 3 },
  { short: 'Qui', index: 4 },
  { short: 'Sex', index: 5 },
  { short: 'Sáb', index: 6 },
  { short: 'Dom', index: 0 },
];

const LIFE_AREAS: { name: LifeArea; color: string; bg: string; border: string; icon: React.FC<{ className?: string }> }[] = [
  { name: 'Trabalho & Negócio', color: '#1B4D3E', bg: '#EDF5F1', border: '#C5DDCF', icon: Briefcase },
  { name: 'Saúde & Vitalidade', color: '#824614', bg: '#FDF6F0', border: '#EED9C7', icon: Activity },
  { name: 'Mente & Conhecimento', color: '#4B336B', bg: '#F5F1FA', border: '#DCCEEB', icon: BookOpen },
  { name: 'Sonhos Pessoais', color: '#915316', bg: '#FCF7ED', border: '#EBDCBF', icon: Sparkle },
  { name: 'Finanças & Futuro', color: '#184E59', bg: '#EEF6F8', border: '#C6E3E9', icon: DollarSign },
  { name: 'Relacionamentos & Família', color: '#802640', bg: '#FBF0F3', border: '#ECC8D3', icon: Users },
];

export const HabitsView: React.FC = () => {
  const { habits, tasks, saveHabit, deleteHabit, toggleHabitDate } = usePlan();

  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);

  // Filters
  const [selectedLifeArea, setSelectedLifeArea] = useState<LifeArea | 'all'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');
  const [weekOffset, setWeekOffset] = useState(0); // 0 = semana atual

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lifeArea, setLifeArea] = useState<LifeArea>('Saúde & Vitalidade');
  const [frequencyType, setFrequencyType] = useState<HabitFrequencyType>('weekdays');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Seg-Sex por padrão
  const [timesPerWeek, setTimesPerWeek] = useState<number>(3);
  const [timesPerMonth, setTimesPerMonth] = useState<number>(10);
  const [targetTime, setTargetTime] = useState<'morning' | 'afternoon' | 'evening' | 'any'>('morning');
  const [isTask, setIsTask] = useState<boolean>(true); // Tarefas podem ser hábitos
  const [linkedTaskId, setLinkedTaskId] = useState<string>('');

  const todayStr = getTodayDateStr();

  // Helper de cálculo dos 7 dias da semana (Segunda a Domingo)
  const getWeekDays = (offsetWeeks: number) => {
    const curr = new Date();
    const day = curr.getDay(); // 0 é Dom, 1 é Seg...
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() + diffToMonday + offsetWeeks * 7);

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayStr}`;

      return {
        dateStr,
        dayNum: d.getDate(),
        monthNum: d.getMonth() + 1,
        dayOfWeek: d.getDay(),
        short: WEEKDAYS[i].short,
        isToday: dateStr === todayStr,
      };
    });
  };

  const weekDays = getWeekDays(weekOffset);

  // Abrir modal de criação
  const handleOpenNewHabit = () => {
    setTitle('');
    setDescription('');
    setLifeArea('Saúde & Vitalidade');
    setFrequencyType('weekdays');
    setSelectedDays([1, 2, 3, 4, 5]);
    setTimesPerWeek(3);
    setTimesPerMonth(10);
    setTargetTime('morning');
    setIsTask(true);
    setLinkedTaskId('');
    setEditingHabitId(null);
    setIsAddingHabit(true);
  };

  // Abrir modal de edição
  const handleEditHabit = (habit: Habit) => {
    setTitle(habit.title);
    setDescription(habit.description || '');
    setLifeArea(habit.lifeArea || 'Saúde & Vitalidade');
    setFrequencyType(habit.frequencyType || 'weekdays');
    setSelectedDays(habit.selectedDays || [1, 2, 3, 4, 5]);
    setTimesPerWeek(habit.targetCount || 3);
    setTimesPerMonth(habit.targetCount || 10);
    setTargetTime(habit.targetTime || 'morning');
    setIsTask(!!habit.isTask || !!habit.taskId);
    setLinkedTaskId(habit.taskId || '');
    setEditingHabitId(habit.id);
    setIsAddingHabit(true);
  };

  // Salvar Hábito
  const handleSaveHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const targetCount =
      frequencyType === 'times_per_week'
        ? timesPerWeek
        : frequencyType === 'times_per_month'
        ? timesPerMonth
        : selectedDays.length;

    saveHabit({
      id: editingHabitId || undefined,
      title: title.trim(),
      description: description.trim() || undefined,
      lifeArea,
      frequencyType,
      selectedDays: frequencyType === 'weekdays' ? selectedDays : undefined,
      targetCount,
      targetTime,
      isTask,
      taskId: linkedTaskId || undefined,
    });

    setIsAddingHabit(false);
    setEditingHabitId(null);
  };

  // Toggle dia selecionado na frequência 'weekdays'
  const toggleSelectedDay = (dayIndex: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
  };

  // Presets de dias
  const applyDaysPreset = (preset: 'all' | 'weekdays' | 'weekend') => {
    if (preset === 'all') setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    if (preset === 'weekdays') setSelectedDays([1, 2, 3, 4, 5]);
    if (preset === 'weekend') setSelectedDays([6, 0]);
  };

  // Calcular sequência (streak) do hábito
  const calculateStreak = (completedDates: string[] = []) => {
    if (!completedDates || completedDates.length === 0) return 0;
    const sorted = [...completedDates].sort().reverse();
    let streak = 0;
    const checkDate = new Date();

    // Se hoje não estiver feito, verifica ontem para não quebrar a sequência
    const isDoneToday = sorted.includes(todayStr);
    if (!isDoneToday) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const year = checkDate.getFullYear();
      const month = String(checkDate.getMonth() + 1).padStart(2, '0');
      const day = String(checkDate.getDate()).padStart(2, '0');
      const curStr = `${year}-${month}-${day}`;

      if (sorted.includes(curStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  // Calcular progresso na semana atual
  const getWeeklyProgress = (habit: Habit) => {
    const datesThisWeek = weekDays.map((d) => d.dateStr);
    const completedCount = habit.completedDates.filter((date) =>
      datesThisWeek.includes(date)
    ).length;
    return completedCount;
  };

  // Calcular progresso no mês atual
  const getMonthlyProgress = (habit: Habit) => {
    const currentYearMonth = todayStr.substring(0, 7); // "YYYY-MM"
    const completedCount = habit.completedDates.filter((date) =>
      date.startsWith(currentYearMonth)
    ).length;
    return completedCount;
  };

  // Filtragem dos hábitos
  const filteredHabits = habits.filter((h) => {
    if (selectedLifeArea !== 'all' && h.lifeArea !== selectedLifeArea) {
      return false;
    }
    if (selectedPeriod !== 'all' && h.targetTime !== selectedPeriod) {
      return false;
    }
    return true;
  });

  // Estatísticas gerais
  const totalHabits = habits.length;
  const completedTodayCount = habits.filter((h) =>
    h.completedDates?.includes(todayStr)
  ).length;
  const maxStreak = habits.reduce(
    (max, h) => Math.max(max, calculateStreak(h.completedDates)),
    0
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Banner com Subtítulo integrado (texto da base inferior promovido) */}
      <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E8E2D8] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#EFE9DF] text-[#4A443D]">
                Rotina & Sustentabilidade
              </span>
              <span className="text-xs text-[#7A736A] font-medium">
                {completedTodayCount} de {totalHabits} cumpridos hoje
              </span>
              {maxStreak > 0 && (
                <span className="inline-flex items-center space-x-1 text-xs text-[#A3521A] font-semibold bg-[#FAF0E6] px-2 py-0.5 rounded-md">
                  <Flame className="w-3.5 h-3.5 text-[#D96B27]" />
                  <span>Maior sequência: {maxStreak} dias</span>
                </span>
              )}
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242220]">
              Rastreador de Hábitos
            </h2>

            {/* Texto de orientação promovido da base inferior para o subtítulo */}
            <p className="text-xs sm:text-sm text-[#6A635B] leading-relaxed">
              "Se falhar um dia, apenas retome no dia seguinte sem autocobrança desmedida. O objetivo do rastreador não é a perfeição artificial, mas manter a visibilidade e o ritmo sustentável do que nutre a sua operação e sua saúde."
            </p>
          </div>

          <button
            onClick={handleOpenNewHabit}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#2D332F] text-[#FAF8F5] text-xs font-semibold hover:bg-[#1A1E1C] transition-all cursor-pointer shadow-xs shrink-0 self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Hábito</span>
          </button>
        </div>
      </div>

      {/* 2. Filtro por Área da Vida */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7A736A] block">
          Filtrar por Área da Vida
        </span>
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedLifeArea('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              selectedLifeArea === 'all'
                ? 'bg-[#2D332F] text-white font-semibold shadow-xs'
                : 'bg-white border border-[#E8E2D8] text-[#69635C] hover:bg-[#FAF8F5]'
            }`}
          >
            Todas as Áreas ({habits.length})
          </button>

          {LIFE_AREAS.map((area) => {
            const count = habits.filter((h) => h.lifeArea === area.name).length;
            const isSelected = selectedLifeArea === area.name;
            const AreaIcon = area.icon;

            return (
              <button
                key={area.name}
                onClick={() => setSelectedLifeArea(area.name)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap border ${
                  isSelected
                    ? 'font-semibold shadow-2xs'
                    : 'bg-white hover:bg-[#FAF8F5] text-[#59534C]'
                }`}
                style={{
                  backgroundColor: isSelected ? area.bg : undefined,
                  borderColor: isSelected ? area.border : '#E8E2D8',
                  color: isSelected ? area.color : undefined,
                }}
              >
                <AreaIcon className="w-3.5 h-3.5" />
                <span>{area.name}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Filtro por Turno & Navegação Semanal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Filtro por Horário */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Todos os Horários', icon: Coffee },
            { id: 'morning', label: 'Manhã', icon: Sun },
            { id: 'afternoon', label: 'Tarde', icon: Sunset },
            { id: 'evening', label: 'Noite', icon: Moon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedPeriod === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedPeriod(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#2D332F] text-white font-semibold shadow-xs'
                    : 'bg-white border border-[#E8E2D8] text-[#69635C] hover:bg-[#FAF8F5]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Navegação Semanal */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="p-1.5 rounded-lg border border-[#D9D1C5] bg-white hover:bg-[#FAF8F5] text-[#4A443D] transition-all cursor-pointer"
            title="Semana anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-[#D9D1C5] bg-white hover:bg-[#FAF8F5] text-[#4A443D] transition-all cursor-pointer"
          >
            {weekOffset === 0 ? 'Esta Semana' : 'Voltar para Hoje'}
          </button>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="p-1.5 rounded-lg border border-[#D9D1C5] bg-white hover:bg-[#FAF8F5] text-[#4A443D] transition-all cursor-pointer"
            title="Próxima semana"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. Lista e Grade de Hábitos com Check e Frequência */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-xs overflow-hidden">
        {filteredHabits.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <CheckSquare2 className="w-10 h-10 text-[#C4BCB0] mx-auto" />
            <h4 className="font-serif text-lg font-semibold text-[#242220]">
              Nenhum hábito cadastrado para este filtro
            </h4>
            <p className="text-xs text-[#7A736A] max-w-sm mx-auto">
              Cadastre hábitos com frequência definida (dias da semana, vezes por semana ou no mês) vinculados às áreas da sua vida.
            </p>
            <button
              onClick={handleOpenNewHabit}
              className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#2D332F] text-white text-xs font-semibold hover:bg-[#1A1E1C] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar Hábito</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#EBE5DB]">
                  <th className="py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-[#69635C] min-w-[240px]">
                    Hábito & Área da Vida
                  </th>
                  <th className="py-3.5 px-3 text-center text-xs font-semibold uppercase tracking-wider text-[#69635C] w-28">
                    Hoje
                  </th>
                  <th className="py-3.5 px-2 text-center text-xs font-semibold uppercase tracking-wider text-[#69635C] w-36">
                    Frequência / Meta
                  </th>
                  <th className="py-3.5 px-2 text-center text-xs font-semibold uppercase tracking-wider text-[#69635C] w-20">
                    Sequência
                  </th>
                  {weekDays.map((d) => (
                    <th
                      key={d.dateStr}
                      className={`py-3 px-2 text-center text-xs font-semibold w-12 sm:w-14 ${
                        d.isToday ? 'text-[#385A48] bg-[#EFF6F1]' : 'text-[#69635C]'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-bold">{d.short}</div>
                      <div
                        className={`text-xs font-mono font-bold mt-0.5 ${
                          d.isToday ? 'text-[#385A48]' : 'text-[#2D2A26]'
                        }`}
                      >
                        {d.dayNum}
                      </div>
                    </th>
                  ))}
                  <th className="py-3.5 px-3 text-right text-xs font-semibold uppercase tracking-wider text-[#69635C] w-16">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE4] text-xs">
                {filteredHabits.map((habit) => {
                  const streak = calculateStreak(habit.completedDates);
                  const isDoneToday = habit.completedDates?.includes(todayStr);
                  const areaConfig = LIFE_AREAS.find((a) => a.name === habit.lifeArea) || LIFE_AREAS[0];
                  const weeklyProgress = getWeeklyProgress(habit);
                  const monthlyProgress = getMonthlyProgress(habit);

                  return (
                    <tr key={habit.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      {/* Info do hábito */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span className="font-semibold text-sm text-[#242220]">
                              {habit.title}
                            </span>

                            {/* Badge da Área da Vida */}
                            <span
                              className="inline-flex items-center space-x-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border"
                              style={{
                                backgroundColor: areaConfig.bg,
                                color: areaConfig.color,
                                borderColor: areaConfig.border,
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: areaConfig.color }}
                              />
                              <span>{habit.lifeArea}</span>
                            </span>

                            {/* Turno */}
                            {habit.targetTime && habit.targetTime !== 'any' && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#EFEAE1] text-[#554E45] uppercase font-medium">
                                {habit.targetTime === 'morning'
                                  ? 'Manhã'
                                  : habit.targetTime === 'afternoon'
                                  ? 'Tarde'
                                  : 'Noite'}
                              </span>
                            )}

                            {/* Tag de Tarefa vinculada */}
                            {(habit.isTask || habit.taskId) && (
                              <span
                                className="inline-flex items-center space-x-0.5 text-[9px] px-1.5 py-0.2 rounded bg-[#EBF3ED] text-[#244E33] font-medium"
                                title="Tarefa sincronizada com a rotina diária"
                              >
                                <Repeat className="w-2.5 h-2.5" />
                                <span>Tarefa diária</span>
                              </span>
                            )}
                          </div>

                          {habit.description && (
                            <p className="text-[11px] text-[#7A736A] line-clamp-1 italic">
                              "{habit.description}"
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Botão Imediato: Dar o Check Hoje */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleHabitDate(habit.id, todayStr)}
                          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                            isDoneToday
                              ? 'bg-[#385A48] text-white shadow-2xs hover:bg-[#2A4537]'
                              : 'bg-[#FAF8F5] border border-[#D9D1C5] text-[#59534C] hover:border-[#385A48] hover:text-[#385A48]'
                          }`}
                          title={isDoneToday ? 'Feito hoje! Clique para desmarcar' : 'Dar o check hoje'}
                        >
                          <Check className={`w-3.5 h-3.5 stroke-[2.5] ${isDoneToday ? 'text-white' : 'text-[#8C847B]'}`} />
                          <span>{isDoneToday ? 'Feito' : 'Check'}</span>
                        </button>
                      </td>

                      {/* Indicador de Frequência / Meta */}
                      <td className="py-3.5 px-2 text-center">
                        {habit.frequencyType === 'weekdays' && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-semibold text-[#5A534B] block">
                              {habit.selectedDays && habit.selectedDays.length === 7
                                ? 'Todos os dias'
                                : habit.selectedDays &&
                                  habit.selectedDays.length === 5 &&
                                  !habit.selectedDays.includes(0) &&
                                  !habit.selectedDays.includes(6)
                                ? 'Dias úteis (Seg-Sex)'
                                : `${habit.selectedDays?.length || 0} dias/sem`}
                            </span>
                            <span className="text-[10px] text-[#8C847B]">
                              {weeklyProgress} feito(s) esta sem
                            </span>
                          </div>
                        )}

                        {habit.frequencyType === 'times_per_week' && (
                          <div className="space-y-1 px-1">
                            <div className="flex items-center justify-between text-[10px] font-semibold text-[#5A534B]">
                              <span>{weeklyProgress} / {habit.targetCount || 3}x</span>
                              <span className="text-[9px] text-[#8C847B]">na semana</span>
                            </div>
                            <div className="w-full bg-[#EAE4DA] h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-[#385A48] h-full rounded-full transition-all"
                                style={{
                                  width: `${Math.min(100, (weeklyProgress / (habit.targetCount || 3)) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {habit.frequencyType === 'times_per_month' && (
                          <div className="space-y-1 px-1">
                            <div className="flex items-center justify-between text-[10px] font-semibold text-[#5A534B]">
                              <span>{monthlyProgress} / {habit.targetCount || 10}x</span>
                              <span className="text-[9px] text-[#8C847B]">no mês</span>
                            </div>
                            <div className="w-full bg-[#EAE4DA] h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-[#B85D3B] h-full rounded-full transition-all"
                                style={{
                                  width: `${Math.min(100, (monthlyProgress / (habit.targetCount || 10)) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Sequência (Streak) */}
                      <td className="py-3.5 px-2 text-center">
                        <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#FAF0E6] text-[#A3521A] text-[11px] font-bold">
                          <Flame className="w-3.5 h-3.5 text-[#D96B27]" />
                          <span>{streak}d</span>
                        </div>
                      </td>

                      {/* 7 Checkboxes dos Dias da Semana */}
                      {weekDays.map((d) => {
                        const isDone = habit.completedDates.includes(d.dateStr);

                        return (
                          <td
                            key={d.dateStr}
                            className={`py-3.5 px-1.5 text-center ${
                              d.isToday ? 'bg-[#F7FAF8]' : ''
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => toggleHabitDate(habit.id, d.dateStr)}
                              title={
                                isDone
                                  ? `Concluído em ${d.dateStr} (clique para desmarcar)`
                                  : `Marcar como feito em ${d.dateStr}`
                              }
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl mx-auto flex items-center justify-center transition-all cursor-pointer border ${
                                isDone
                                  ? 'bg-[#385A48] border-[#385A48] text-white shadow-2xs'
                                  : d.isToday
                                  ? 'border-[#C2D6C7] bg-[#FFFFFF] hover:border-[#385A48] text-transparent hover:text-[#385A48]/40'
                                  : 'border-[#E2DCCE] bg-white hover:border-[#A89F93] text-transparent hover:text-[#9E978F]'
                              }`}
                            >
                              <Check className="w-4 h-4 stroke-[2.5]" />
                            </button>
                          </td>
                        );
                      })}

                      {/* Ações */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            type="button"
                            onClick={() => handleEditHabit(habit)}
                            className="p-1 rounded text-[#9E968D] hover:text-[#242220] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            title="Editar hábito"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteHabit(habit.id)}
                            className="p-1 rounded text-[#9E968D] hover:text-[#B84035] hover:bg-[#F9ECEB] transition-colors cursor-pointer"
                            title="Excluir hábito"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Modal / Formulário de Cadastro ou Edição de Hábito */}
      {isAddingHabit && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#D9D1C5] shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE4]">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#B85D3B]" />
                <h3 className="font-serif text-base font-semibold text-[#242220]">
                  {editingHabitId ? 'Editar Hábito Recorrente' : 'Novo Hábito Recorrente'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingHabit(false)}
                className="p-1 rounded-lg text-[#7B746D] hover:text-[#242220] hover:bg-[#F5F0E6] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveHabit} className="space-y-4 text-xs">
              {/* Nome do Hábito */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#69635C] mb-1">
                  Nome do Hábito *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Leitura de 20 min, Corrida matinal, Revisão financeira semanal..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-xs text-[#242220] focus:outline-none focus:border-[#385A48] focus:bg-white transition-all"
                />
              </div>

              {/* Área da Vida (Regra: Habito ligado à área da vida) */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#69635C] mb-1">
                  Área da Vida *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {LIFE_AREAS.map((area) => {
                    const isSelected = lifeArea === area.name;
                    const AreaIcon = area.icon;

                    return (
                      <button
                        key={area.name}
                        type="button"
                        onClick={() => setLifeArea(area.name)}
                        className={`flex items-center space-x-1.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'font-semibold shadow-2xs'
                            : 'bg-[#FAF8F5] border-[#E8E2D8] text-[#59534C] hover:bg-[#FFFFFF]'
                        }`}
                        style={{
                          backgroundColor: isSelected ? area.bg : undefined,
                          borderColor: isSelected ? area.border : undefined,
                          color: isSelected ? area.color : undefined,
                        }}
                      >
                        <AreaIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate text-[11px]">{area.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Frequência (Regra: dias da semana, x vezes na semana ou no mês) */}
              <div className="p-3.5 rounded-xl border border-[#E8E2D8] bg-[#FAF8F5] space-y-3">
                <label className="block font-semibold uppercase tracking-wider text-[#69635C]">
                  Frequência & Recorrência *
                </label>

                {/* Seletor de Tipo de Frequência */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'weekdays', label: 'Dias da Semana' },
                    { id: 'times_per_week', label: 'X vezes na semana' },
                    { id: 'times_per_month', label: 'X vezes no mês' },
                  ].map((freq) => (
                    <button
                      key={freq.id}
                      type="button"
                      onClick={() => setFrequencyType(freq.id as HabitFrequencyType)}
                      className={`py-2 px-2 rounded-xl text-center font-medium text-[11px] transition-all cursor-pointer border ${
                        frequencyType === freq.id
                          ? 'bg-[#2D332F] text-white border-[#2D332F] font-semibold shadow-2xs'
                          : 'bg-white border-[#D9D1C5] text-[#59534C] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      {freq.label}
                    </button>
                  ))}
                </div>

                {/* Opção 1: Dias da Semana */}
                {frequencyType === 'weekdays' && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-[#7A736A]">
                      <span>Selecione os dias:</span>
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={() => applyDaysPreset('all')}
                          className="px-1.5 py-0.5 text-[10px] rounded bg-[#EAE4DA] text-[#4A443D] hover:bg-[#DDD6CA]"
                        >
                          Todos
                        </button>
                        <button
                          type="button"
                          onClick={() => applyDaysPreset('weekdays')}
                          className="px-1.5 py-0.5 text-[10px] rounded bg-[#EAE4DA] text-[#4A443D] hover:bg-[#DDD6CA]"
                        >
                          Seg-Sex
                        </button>
                        <button
                          type="button"
                          onClick={() => applyDaysPreset('weekend')}
                          className="px-1.5 py-0.5 text-[10px] rounded bg-[#EAE4DA] text-[#4A443D] hover:bg-[#DDD6CA]"
                        >
                          Sáb-Dom
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5">
                      {WEEKDAYS.map((wd) => {
                        const isDaySelected = selectedDays.includes(wd.index);

                        return (
                          <button
                            key={wd.index}
                            type="button"
                            onClick={() => toggleSelectedDay(wd.index)}
                            className={`py-2 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer border ${
                              isDaySelected
                                ? 'bg-[#385A48] border-[#385A48] text-white shadow-2xs'
                                : 'bg-white border-[#D9D1C5] text-[#59534C] hover:border-[#385A48]'
                            }`}
                          >
                            {wd.short}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Opção 2: X vezes na semana */}
                {frequencyType === 'times_per_week' && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] text-[#7A736A] block">
                      Quantas vezes por semana deseja cumprir?
                    </span>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setTimesPerWeek(num)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                            timesPerWeek === num
                              ? 'bg-[#385A48] border-[#385A48] text-white shadow-2xs'
                              : 'bg-white border-[#D9D1C5] text-[#59534C] hover:border-[#385A48]'
                          }`}
                        >
                          {num}x
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Opção 3: X vezes no mês */}
                {frequencyType === 'times_per_month' && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] text-[#7A736A] block">
                      Quantas vezes no mês deseja cumprir?
                    </span>
                    <div className="flex items-center space-x-2">
                      {[4, 8, 10, 12, 15, 20, 25].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setTimesPerMonth(num)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                            timesPerMonth === num
                              ? 'bg-[#385A48] border-[#385A48] text-white shadow-2xs'
                              : 'bg-white border-[#D9D1C5] text-[#59534C] hover:border-[#385A48]'
                          }`}
                        >
                          {num}x
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Momento do Dia */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#69635C] mb-1">
                  Momento do Dia
                </label>
                <select
                  value={targetTime}
                  onChange={(e) => setTargetTime(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-xs text-[#242220] focus:outline-none focus:border-[#385A48] focus:bg-white transition-all cursor-pointer"
                >
                  <option value="morning">Manhã (Abertura / Rotina Matinal)</option>
                  <option value="afternoon">Tarde (Foco / Execução)</option>
                  <option value="evening">Noite (Fechamento / Desacelerar)</option>
                  <option value="any">Qualquer horário do dia</option>
                </select>
              </div>

              {/* Regra: as tarefas podem ser habitos (vínculo) */}
              <div className="p-3 rounded-xl border border-[#D4E2D8] bg-[#F4FAF6] space-y-2">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTask}
                    onChange={(e) => setIsTask(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-[#385A48] border-[#A8C4B1] focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-xs text-[#1F412D] block">
                      Disponibilizar como tarefa na rotina diária
                    </span>
                    <p className="text-[11px] text-[#4A6D56] leading-relaxed">
                      Permite dar o check tanto aqui na tela de hábitos quanto na lista diária de tarefas de forma sincronizada.
                    </p>
                  </div>
                </label>
              </div>

              {/* Motivo prático */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#69635C] mb-1">
                  Motivo / Benefício Prático (opcional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Reduz a ansiedade antes da operação e melhora a clareza mental..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-xs text-[#242220] focus:outline-none focus:border-[#385A48] focus:bg-white transition-all"
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#F0ECE4]">
                <button
                  type="button"
                  onClick={() => setIsAddingHabit(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#6B655F] hover:bg-[#F2ECE1] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#2D332F] text-white text-xs font-semibold hover:bg-[#1A1E1C] cursor-pointer shadow-xs"
                >
                  {editingHabitId ? 'Salvar Alterações' : 'Cadastrar Hábito'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

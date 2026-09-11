import React, { useState } from 'react';
import { usePlan } from '../context/PlanContext';
import { Milestone, Task, TaskStatus } from '../types';
import { WheelOfLife } from './WheelOfLife';
import { 
  Columns3, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Target, 
  Sparkles, 
  Compass, 
  Trash2, 
  Edit2, 
  ArrowRight,
  Check,
  Filter,
  CheckSquare,
  ListTodo,
  X
} from 'lucide-react';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

type StatusFilter = 'all' | 'todo' | 'in_progress' | 'completed';

export const SemesterView: React.FC = () => {
  const {
    monthFocuses,
    milestones,
    tasks,
    eras,
    saveMilestone,
    deleteMilestone,
    saveTask,
    deleteTask,
    setTaskStatus,
    toggleTaskStatus,
  } = usePlan();

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentSemesterInitial = today.getMonth() < 6 ? 1 : 2;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(currentSemesterInitial as 1 | 2);

  // Filter per month card
  const [monthFilters, setMonthFilters] = useState<Record<string, StatusFilter>>({});

  // Quick Add Modal / State
  const [addingType, setAddingType] = useState<'milestone' | 'task' | null>(null);
  const [targetMonthKey, setTargetMonthKey] = useState<string | null>(null);
  const [itemTitle, setItemTitle] = useState('');
  const [itemStatus, setItemStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  const [selectedEraId, setSelectedEraId] = useState<string>('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('');

  // Months in selected semester (1 = Jan-Jun (0-5), 2 = Jul-Dec (6-11))
  const semesterMonthIndices = selectedSemester === 1 ? [0, 1, 2, 3, 4, 5] : [6, 7, 8, 9, 10, 11];

  const handleOpenAddModal = (monthKey: string, type: 'milestone' | 'task') => {
    setTargetMonthKey(monthKey);
    setAddingType(type);
    setItemTitle('');
    setItemStatus(type === 'milestone' ? 'in_progress' : 'in_progress');
    setSelectedEraId(eras[0]?.id || '');
    const monthMilestones = milestones.filter((m) => m.targetDate.startsWith(monthKey));
    setSelectedMilestoneId(monthMilestones[0]?.id || milestones[0]?.id || '');
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim() || !targetMonthKey) return;

    // Use day 15 or current day of the month as default target date
    const defaultDate = `${targetMonthKey}-15`;

    if (addingType === 'milestone') {
      saveMilestone({
        title: itemTitle.trim(),
        eraId: selectedEraId || eras[0]?.id || '',
        targetDate: defaultDate,
        status: itemStatus,
      });
    } else {
      const taskSt: TaskStatus = itemStatus === 'pending' ? 'todo' : itemStatus;
      saveTask({
        title: itemTitle.trim(),
        milestoneId: selectedMilestoneId || milestones[0]?.id || '',
        dueDate: defaultDate,
        status: taskSt,
        priorityType: 'deadline',
        estimatedMinutes: 60,
      });
    }

    setAddingType(null);
    setItemTitle('');
    setTargetMonthKey(null);
  };

  const handleToggleMilestone = (m: Milestone) => {
    const nextStatus: Record<Milestone['status'], Milestone['status']> = {
      pending: 'in_progress',
      in_progress: 'completed',
      completed: 'pending',
    };
    saveMilestone({
      ...m,
      status: nextStatus[m.status],
    });
  };

  const handleToggleTask = (t: Task) => {
    const nextStatus: Record<string, TaskStatus> = {
      todo: 'in_progress',
      in_progress: 'completed',
      completed: 'todo',
      respite_moved: 'todo',
    };
    setTaskStatus(t.id, nextStatus[t.status] || 'todo');
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* 1. Semester Header */}
      <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E8E2D8] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#EFE9DF] text-[#4A443D]">
                Visão Estratégica Semestral
              </span>
              <span className="text-xs text-[#7A736A]">
                {selectedSemester === 1 ? '1º Semestre (Jan – Jun)' : '2º Semestre (Jul – Dez)'}
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242220] mt-1">
              Planejamento {selectedSemester}S {selectedYear}
            </h2>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            {/* Year selector */}
            <div className="flex items-center border border-[#D9D1C5] rounded-xl overflow-hidden bg-[#FAF8F5]">
              <button
                onClick={() => setSelectedYear((y) => y - 1)}
                className="px-2.5 py-1.5 hover:bg-[#EFEAE1] text-[#4A443D] text-xs transition-all cursor-pointer"
                title="Ano anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-xs font-mono font-semibold text-[#242220]">
                {selectedYear}
              </span>
              <button
                onClick={() => setSelectedYear((y) => y + 1)}
                className="px-2.5 py-1.5 hover:bg-[#EFEAE1] text-[#4A443D] text-xs transition-all cursor-pointer"
                title="Próximo ano"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Semester selector pills */}
            <div className="flex rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] p-0.5">
              <button
                onClick={() => setSelectedSemester(1)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  selectedSemester === 1
                    ? 'bg-[#2D332F] text-white font-semibold'
                    : 'text-[#69635C] hover:text-[#242220]'
                }`}
              >
                1º Semestre
              </button>
              <button
                onClick={() => setSelectedSemester(2)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  selectedSemester === 2
                    ? 'bg-[#2D332F] text-white font-semibold'
                    : 'text-[#69635C] hover:text-[#242220]'
                }`}
              >
                2º Semestre
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Roda da Vida (Diagnóstico Semestral em Radar) */}
      <WheelOfLife year={selectedYear} semester={selectedSemester} />

      {/* 3. Visão Mês a Mês: Metas e Tarefas Completas, To-do e In-Progress */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-serif text-xl font-semibold text-[#242220] flex items-center space-x-2">
              <Columns3 className="w-5 h-5 text-[#385A48]" />
              <span>Metas & Tarefas por Mês ({selectedSemester}S {selectedYear})</span>
            </h3>
            <p className="text-xs text-[#7A736A]">
              Visualize e gerencie entregas completas, em andamento e a fazer distribuídas ao longo dos 6 meses.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {semesterMonthIndices.map((monthIdx) => {
            const monthKey = `${selectedYear}-${String(monthIdx + 1).padStart(2, '0')}`;
            const monthName = MONTH_NAMES[monthIdx];
            const currentFilter = monthFilters[monthKey] || 'all';

            // Milestones scheduled for this month
            const rawMilestones = milestones.filter((m) => m.targetDate.startsWith(monthKey));

            // Tasks scheduled for this month
            const rawTasks = tasks.filter(
              (t) => t.dueDate?.startsWith(monthKey) && t.status !== 'respite_moved'
            );

            // Filtered lists
            const monthMilestones = rawMilestones.filter((m) => {
              if (currentFilter === 'all') return true;
              if (currentFilter === 'todo') return m.status === 'pending';
              if (currentFilter === 'in_progress') return m.status === 'in_progress';
              if (currentFilter === 'completed') return m.status === 'completed';
              return true;
            });

            const monthTasks = rawTasks.filter((t) => {
              if (currentFilter === 'all') return true;
              if (currentFilter === 'todo') return t.status === 'todo';
              if (currentFilter === 'in_progress') return t.status === 'in_progress';
              if (currentFilter === 'completed') return t.status === 'completed';
              return true;
            });

            const completedMilestones = rawMilestones.filter((m) => m.status === 'completed').length;
            const completedTasks = rawTasks.filter((t) => t.status === 'completed').length;
            const totalItems = rawMilestones.length + rawTasks.length;
            const totalCompleted = completedMilestones + completedTasks;

            return (
              <div
                key={monthKey}
                className="bg-white rounded-2xl border border-[#E8E2D8] p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#D4CCC0] transition-all"
              >
                <div className="space-y-3.5">
                  {/* Card Month Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE2]">
                    <div>
                      <span className="text-[10px] font-semibold text-[#8C7654] uppercase tracking-wider block">
                        Mês {monthIdx + 1}
                      </span>
                      <h4 className="font-serif text-lg font-semibold text-[#242220]">
                        {monthName}
                      </h4>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-[#2D2822] block">
                        {totalCompleted}/{totalItems}
                      </span>
                      <span className="text-[10px] text-[#8A837A]">
                        concluídos
                      </span>
                    </div>
                  </div>

                  {/* Status Filter Tabs */}
                  <div className="flex rounded-lg border border-[#EAE3D7] bg-[#FAF8F5] p-0.5 text-[10px] font-medium overflow-x-auto no-scrollbar">
                    {[
                      { id: 'all', label: 'Todas' },
                      { id: 'todo', label: 'To-do' },
                      { id: 'in_progress', label: 'Em Curso' },
                      { id: 'completed', label: 'Feitas' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() =>
                          setMonthFilters((prev) => ({
                            ...prev,
                            [monthKey]: tab.id as StatusFilter,
                          }))
                        }
                        className={`flex-1 px-1.5 py-1 rounded text-center whitespace-nowrap transition-all cursor-pointer ${
                          currentFilter === tab.id
                            ? 'bg-white text-[#242220] font-semibold shadow-2xs'
                            : 'text-[#69635C] hover:text-[#242220]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Actions to Add Meta or Task */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenAddModal(monthKey, 'milestone')}
                      className="flex-1 flex items-center justify-center space-x-1 py-1 px-2 rounded-lg bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-[#E5DEC\-D] text-[#38332D] text-[11px] font-medium transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-[#B85D3B]" />
                      <span>+ Meta</span>
                    </button>
                    <button
                      onClick={() => handleOpenAddModal(monthKey, 'task')}
                      className="flex-1 flex items-center justify-center space-x-1 py-1 px-2 rounded-lg bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-[#E5DECD] text-[#38332D] text-[11px] font-medium transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-[#385A48]" />
                      <span>+ Tarefa</span>
                    </button>
                  </div>

                  {/* Metas da Trilha (Milestones) */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#69635C] uppercase tracking-wider">
                      <span className="flex items-center space-x-1">
                        <Compass className="w-3 h-3 text-[#B85D3B]" />
                        <span>Metas ({monthMilestones.length})</span>
                      </span>
                    </div>

                    {monthMilestones.length === 0 ? (
                      <p className="text-[11px] text-[#A39C93] italic py-1">
                        Nenhuma meta cadastrada para este filtro.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {monthMilestones.map((m) => (
                          <div
                            key={m.id}
                            className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 transition-all ${
                              m.status === 'completed'
                                ? 'bg-[#F2F6F3] border-[#D4E3D8]'
                                : m.status === 'in_progress'
                                ? 'bg-[#FAF8F5] border-[#EAE3D7]'
                                : 'bg-white border-[#E8E2D8]'
                            }`}
                          >
                            <div className="flex items-center space-x-2 min-w-0">
                              <button
                                onClick={() => handleToggleMilestone(m)}
                                className="cursor-pointer shrink-0"
                                title="Alternar status: A Fazer -> Em Curso -> Concluído"
                              >
                                {m.status === 'completed' ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#385A48]" />
                                ) : m.status === 'in_progress' ? (
                                  <Clock className="w-3.5 h-3.5 text-[#C4883A]" />
                                ) : (
                                  <Circle className="w-3.5 h-3.5 text-[#9E978F]" />
                                )}
                              </button>
                              <span
                                className={`truncate font-medium text-[11px] ${
                                  m.status === 'completed'
                                    ? 'line-through text-[#7A8A7E]'
                                    : 'text-[#2E2822]'
                                }`}
                              >
                                {m.title}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1 shrink-0">
                              <span
                                className={`text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded ${
                                  m.status === 'completed'
                                    ? 'bg-[#E3EFE5] text-[#2C5237]'
                                    : m.status === 'in_progress'
                                    ? 'bg-[#FDF3E5] text-[#8C5D20]'
                                    : 'bg-[#F3EFE9] text-[#69635C]'
                                }`}
                              >
                                {m.status === 'completed' ? 'Feita' : m.status === 'in_progress' ? 'Em Curso' : 'To-do'}
                              </span>
                              <button
                                onClick={() => deleteMilestone(m.id)}
                                className="text-[#A39C93] hover:text-[#B84035] p-0.5 cursor-pointer"
                                title="Excluir meta"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tarefas Operacionais (Tasks) */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#69635C] uppercase tracking-wider">
                      <span className="flex items-center space-x-1">
                        <CheckSquare className="w-3 h-3 text-[#385A48]" />
                        <span>Tarefas ({monthTasks.length})</span>
                      </span>
                    </div>

                    {monthTasks.length === 0 ? (
                      <p className="text-[11px] text-[#A39C93] italic py-1">
                        Nenhuma tarefa cadastrada para este filtro.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {monthTasks.map((t) => (
                          <div
                            key={t.id}
                            className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 transition-all ${
                              t.status === 'completed'
                                ? 'bg-[#F2F6F3] border-[#D4E3D8]'
                                : t.status === 'in_progress'
                                ? 'bg-[#FAF8F5] border-[#EAE3D7]'
                                : 'bg-white border-[#E8E2D8]'
                            }`}
                          >
                            <div className="flex items-center space-x-2 min-w-0">
                              <button
                                onClick={() => handleToggleTask(t)}
                                className="cursor-pointer shrink-0"
                                title="Alternar status: A Fazer -> Em Curso -> Concluído"
                              >
                                {t.status === 'completed' ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#385A48]" />
                                ) : t.status === 'in_progress' ? (
                                  <Clock className="w-3.5 h-3.5 text-[#C4883A]" />
                                ) : (
                                  <Circle className="w-3.5 h-3.5 text-[#9E978F]" />
                                )}
                              </button>
                              <span
                                className={`truncate text-[11px] font-medium ${
                                  t.status === 'completed'
                                    ? 'line-through text-[#7A8A7E]'
                                    : 'text-[#2E2822]'
                                }`}
                              >
                                {t.title}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1 shrink-0">
                              <span
                                className={`text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded ${
                                  t.status === 'completed'
                                    ? 'bg-[#E3EFE5] text-[#2C5237]'
                                    : t.status === 'in_progress'
                                    ? 'bg-[#FDF3E5] text-[#8C5D20]'
                                    : 'bg-[#F3EFE9] text-[#69635C]'
                                }`}
                              >
                                {t.status === 'completed' ? 'Feita' : t.status === 'in_progress' ? 'Em Curso' : 'To-do'}
                              </span>
                              <button
                                onClick={() => deleteTask(t.id)}
                                className="text-[#A39C93] hover:text-[#B84035] p-0.5 cursor-pointer"
                                title="Excluir tarefa"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar footer */}
                <div className="pt-2 border-t border-[#F0EBE2]">
                  <div className="flex items-center justify-between text-[11px] text-[#7A736A] mb-1">
                    <span>Execução do mês:</span>
                    <span className="font-semibold text-[#2D2822]">
                      {totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-[#EFEAE2] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#385A48] rounded-full transition-all duration-300"
                      style={{
                        width: `${totalItems > 0 ? (totalCompleted / totalItems) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Add Modal */}
      {addingType && targetMonthKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1C1A]/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E8E2D8] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F0EBE2] bg-[#FAF8F5] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {addingType === 'milestone' ? (
                  <Compass className="w-4 h-4 text-[#B85D3B]" />
                ) : (
                  <CheckSquare className="w-4 h-4 text-[#385A48]" />
                )}
                <h3 className="font-serif text-base font-semibold text-[#242220]">
                  {addingType === 'milestone' ? 'Nova Meta para o Mês' : 'Nova Tarefa para o Mês'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setAddingType(null);
                  setTargetMonthKey(null);
                }}
                className="text-[#9E978F] hover:text-[#242220] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#69635C] mb-1">
                  Título da {addingType === 'milestone' ? 'Meta' : 'Tarefa'} *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  placeholder={
                    addingType === 'milestone'
                      ? 'Ex: Contratar primeiro suporte operacional'
                      : 'Ex: Gravar tutoriais em vídeo de onboarding'
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D9D1C5] text-xs text-[#242220] focus:outline-none focus:border-[#385A48]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#69635C] mb-1">
                  Status Inicial
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'pending', label: 'To-do (A Fazer)' },
                    { id: 'in_progress', label: 'Em Curso' },
                    { id: 'completed', label: 'Concluída' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setItemStatus(st.id as any)}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                        itemStatus === st.id
                          ? 'bg-[#2D332F] text-white border-[#2D332F]'
                          : 'bg-white text-[#635D55] border-[#D9D1C5] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {addingType === 'milestone' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#69635C] mb-1">
                    Vincular ao Sonho / Trilha:
                  </label>
                  <select
                    value={selectedEraId}
                    onChange={(e) => setSelectedEraId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D9D1C5] text-xs text-[#242220] bg-white"
                  >
                    {eras.map((era) => (
                      <option key={era.id} value={era.id}>
                        {era.title} ({era.category})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setAddingType(null);
                    setTargetMonthKey(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#6B655F] hover:bg-[#FAF8F5] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2D332F] text-white text-xs font-semibold hover:bg-[#1A1E1C] cursor-pointer shadow-xs"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

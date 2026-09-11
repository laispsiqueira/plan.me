import React, { useState } from 'react';
import { usePlan } from '../context/PlanContext';
import { getTodayDateStr } from '../data/initialData';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Target, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Sparkles, 
  Compass, 
  Edit3, 
  CalendarDays,
  ArrowRight
} from 'lucide-react';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAY_ABBR = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const MonthlyView: React.FC = () => {
  const {
    tasks,
    milestones,
    monthFocuses,
    saveMonthFocus,
    setIsTaskModalOpen,
    setEditingTask,
    setPreselectedDueDate,
    setPreselectedMilestoneId,
    setActiveTab,
  } = usePlan();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState(today.getMonth()); // 0-11
  const [isEditingFocus, setIsEditingFocus] = useState(false);

  // Month Key: "YYYY-MM"
  const currentMonthKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}`;
  const currentMonthFocus = monthFocuses.find((mf) => mf.monthKey === currentMonthKey);

  const [focusTheme, setFocusTheme] = useState(currentMonthFocus?.focusTheme || '');
  const [keyGoal1, setKeyGoal1] = useState(currentMonthFocus?.keyGoals?.[0] || '');
  const [keyGoal2, setKeyGoal2] = useState(currentMonthFocus?.keyGoals?.[1] || '');
  const [keyGoal3, setKeyGoal3] = useState(currentMonthFocus?.keyGoals?.[2] || '');

  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonthIndex((m) => m - 1);
    }
    setIsEditingFocus(false);
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonthIndex((m) => m + 1);
    }
    setIsEditingFocus(false);
  };

  const handleSaveFocus = (e: React.FormEvent) => {
    e.preventDefault();
    const goals = [keyGoal1, keyGoal2, keyGoal3].filter((g) => g.trim().length > 0);
    saveMonthFocus({
      monthKey: currentMonthKey,
      focusTheme: focusTheme.trim(),
      keyGoals: goals,
    });
    setIsEditingFocus(false);
  };

  const handleStartEditFocus = () => {
    setFocusTheme(currentMonthFocus?.focusTheme || '');
    setKeyGoal1(currentMonthFocus?.keyGoals?.[0] || '');
    setKeyGoal2(currentMonthFocus?.keyGoals?.[1] || '');
    setKeyGoal3(currentMonthFocus?.keyGoals?.[2] || '');
    setIsEditingFocus(true);
  };

  // Calendar calculations
  const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();

  // Tasks in this month
  const monthTasks = tasks.filter((t) => {
    if (!t.dueDate) return false;
    return t.dueDate.startsWith(currentMonthKey) && t.status !== 'respite_moved';
  });

  // Milestones in this month
  const monthMilestones = milestones.filter((m) => {
    return m.targetDate.startsWith(currentMonthKey);
  });

  const handleAddTaskForDate = (dateStr: string) => {
    setEditingTask(null);
    setPreselectedDueDate(dateStr);
    setPreselectedMilestoneId(null);
    setIsTaskModalOpen(true);
  };

  const todayStr = getTodayDateStr();

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* 1. Caixa Unificada: Mês & Foco Central */}
      <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F0EBE2]">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#EFE9DF] text-[#4A443D]">
                Planejamento Tático
              </span>
              <span className="text-xs text-[#7A736A]">
                {monthTasks.length} tarefas cadastradas • {monthMilestones.length} metas da Trilha
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#242220] mt-1 flex items-center space-x-3">
              <span>{MONTH_NAMES[currentMonthIndex]} {currentYear}</span>
            </h2>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] hover:bg-[#F2ECE1] text-[#4A443D] transition-all cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setCurrentYear(today.getFullYear());
                setCurrentMonthIndex(today.getMonth());
                setIsEditingFocus(false);
              }}
              className="px-3 py-1.5 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] hover:bg-[#F2ECE1] text-xs font-medium text-[#4A443D] transition-all cursor-pointer"
            >
              Mês Atual
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] hover:bg-[#F2ECE1] text-[#4A443D] transition-all cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Foco Principal Integrado */}
        <div className="bg-[#FAF8F5] p-5 rounded-xl border border-[#EAE3D7]">
          <div className="flex items-start justify-between pb-3 border-b border-[#EAE3D7] mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-[#385A48] text-white flex items-center justify-center">
                <Target className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-semibold text-[#242220]">
                  Foco Principal do Mês
                </h3>
                <p className="text-[11px] text-[#7A736A]">
                  Organizamos primeiro, executamos depois. Uma direção clara para não se perder na rotina.
                </p>
              </div>
            </div>

            {!isEditingFocus && (
              <button
                onClick={handleStartEditFocus}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-lg border border-[#D9D1C5] bg-white text-xs font-medium text-[#38332D] hover:bg-[#FAF8F5] transition-all cursor-pointer shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#385A48]" />
                <span>{currentMonthFocus ? 'Editar Foco' : 'Definir Foco'}</span>
              </button>
            )}
          </div>

          {isEditingFocus ? (
            <form onSubmit={handleSaveFocus} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#69635C] mb-1">
                  Tema / Intenção Central do Mês
                </label>
                <input
                  type="text"
                  value={focusTheme}
                  onChange={(e) => setFocusTheme(e.target.value)}
                  placeholder="Ex: Padronização operacional e recuperação de energia..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#D9D1C5] bg-white text-xs text-[#242220] focus:outline-none focus:border-[#385A48]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#69635C] mb-1">
                    Meta-Chave 1:
                  </label>
                  <input
                    type="text"
                    value={keyGoal1}
                    onChange={(e) => setKeyGoal1(e.target.value)}
                    placeholder="Ex: Contratar e treinar assistente"
                    className="w-full px-3 py-1.5 rounded-lg border border-[#D9D1C5] bg-white text-xs text-[#242220] focus:outline-none focus:border-[#385A48]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#69635C] mb-1">
                    Meta-Chave 2:
                  </label>
                  <input
                    type="text"
                    value={keyGoal2}
                    onChange={(e) => setKeyGoal2(e.target.value)}
                    placeholder="Ex: Concluir módulo 2 de automação"
                    className="w-full px-3 py-1.5 rounded-lg border border-[#D9D1C5] bg-white text-xs text-[#242220] focus:outline-none focus:border-[#385A48]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#69635C] mb-1">
                    Meta-Chave 3:
                  </label>
                  <input
                    type="text"
                    value={keyGoal3}
                    onChange={(e) => setKeyGoal3(e.target.value)}
                    placeholder="Ex: Manter 3x por semana de treino"
                    className="w-full px-3 py-1.5 rounded-lg border border-[#D9D1C5] bg-white text-xs text-[#242220] focus:outline-none focus:border-[#385A48]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingFocus(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#6B655F] hover:bg-white/60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#2D332F] text-white text-xs font-medium hover:bg-[#1A1E1C] cursor-pointer shadow-xs"
                >
                  Salvar Planejamento do Mês
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-semibold text-[#8C7654] uppercase tracking-wider block">
                  Tema Condutor:
                </span>
                <p className="font-serif text-base font-medium text-[#242220] mt-0.5">
                  {currentMonthFocus?.focusTheme || 'Nenhum foco definido ainda para este mês. Clique em "Definir Foco" para estruturar suas prioridades.'}
                </p>
              </div>

              {currentMonthFocus?.keyGoals && currentMonthFocus.keyGoals.length > 0 && (
                <div className="pt-1">
                  <span className="text-[11px] font-semibold text-[#8C7654] uppercase tracking-wider block mb-1.5">
                    3 Entregas Indispensáveis:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {currentMonthFocus.keyGoals.map((goal, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white border border-[#E6DCCF] flex items-center space-x-2 text-xs text-[#2D2A26] shadow-2xs"
                      >
                        <span className="w-5 h-5 rounded-full bg-[#EFE9DF] text-[#4A443D] text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-medium line-clamp-2">{goal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Galhos da Trilha & Equilíbrio Operacional (Lado a Lado) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Metas da Trilha com prazo neste mês */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE2]">
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-[#B85D3B]" />
              <h4 className="font-serif text-base font-semibold text-[#242220]">
                Galhos da Trilha (Prazos do Mês)
              </h4>
            </div>
            <button
              onClick={() => setActiveTab('trail')}
              className="text-xs text-[#385A48] hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>Ver Trilha Completa</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {monthMilestones.length === 0 ? (
            <p className="text-xs text-[#8A837A] italic py-4">
              Nenhuma meta intermediária da Trilha dos Sonhos prevista para este mês.
            </p>
          ) : (
            <div className="space-y-2">
              {monthMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="p-3 rounded-xl border border-[#EAE3D6] bg-[#FAF8F5] flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-[#242220] block">
                      {milestone.title}
                    </span>
                    <span className="text-[11px] text-[#7A736A]">
                      Data-alvo: {milestone.targetDate}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      milestone.status === 'completed'
                        ? 'bg-[#E3EFE5] text-[#2C5237]'
                        : 'bg-[#F9ECEB] text-[#8C3A2E]'
                    }`}
                  >
                    {milestone.status === 'completed' ? 'Concluído' : 'Em Curso'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumo do Volume de Trabalho (Equilíbrio Operacional) */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-[#F0EBE2]">
            <Sparkles className="w-4 h-4 text-[#C4883A]" />
            <h4 className="font-serif text-base font-semibold text-[#242220]">
              Equilíbrio Operacional do Mês
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE3D6]">
              <span className="text-[11px] text-[#7A736A] uppercase font-semibold block">
                Total de Tarefas
              </span>
              <span className="font-mono text-2xl font-bold text-[#242220] block mt-1">
                {monthTasks.length}
              </span>
              <span className="text-[10px] text-[#8A837A] mt-0.5 block">
                Agendadas para {MONTH_NAMES[currentMonthIndex]}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F2F7F3] border border-[#CDE0D2]">
              <span className="text-[11px] text-[#345840] uppercase font-semibold block">
                Concluídas
              </span>
              <span className="font-mono text-2xl font-bold text-[#20402B] block mt-1">
                {monthTasks.filter((t) => t.status === 'completed').length}
              </span>
              <span className="text-[10px] text-[#345840] mt-0.5 block">
                {monthTasks.length > 0
                  ? `${Math.round(
                      (monthTasks.filter((t) => t.status === 'completed').length /
                        monthTasks.length) *
                        100
                    )}% de execução`
                  : '0% de execução'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs text-[#6A635B] space-y-1">
            <p className="font-semibold text-[#2D2A26]">Princípio da Clareza Mensal:</p>
            <p className="leading-relaxed">
              Não tente agendar 50 prioridades no mesmo mês. Três vitórias sólidas constroem mais progresso do que dezenas de tarefas fragmentadas.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Calendário Mensal (Abaixo de Galhos e Equilíbrio) */}
      <div className="bg-white p-6 rounded-2xl border border-[#E8E2D8] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg font-semibold text-[#242220] flex items-center space-x-2">
            <CalendarDays className="w-5 h-5 text-[#385A48]" />
            <span>Distribuição dos Dias e Entregas</span>
          </h3>
          <span className="text-xs text-[#7A736A]">
            Clique em qualquer dia para adicionar uma tarefa com data pré-definida.
          </span>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center text-xs font-semibold text-[#7A736A] uppercase tracking-wider">
          {WEEKDAY_ABBR.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {/* Blank spaces before first day of month */}
          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="min-h-[85px] sm:min-h-[105px] rounded-xl bg-[#FAF8F5]/40 border border-transparent p-2"
            />
          ))}

          {/* Actual days of current month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${currentMonthKey}-${String(dayNum).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;

            const dayTasks = monthTasks.filter((t) => t.dueDate === dateStr);
            const dayMilestones = monthMilestones.filter((m) => m.targetDate === dateStr);
            const completedTasks = dayTasks.filter((t) => t.status === 'completed').length;

            return (
              <div
                key={dateStr}
                onClick={() => handleAddTaskForDate(dateStr)}
                className={`min-h-[85px] sm:min-h-[105px] rounded-xl border p-2 flex flex-col justify-between transition-all cursor-pointer group hover:border-[#385A48] hover:shadow-xs ${
                  isToday
                    ? 'border-[#385A48] bg-[#F4F8F5]'
                    : 'border-[#EAE4D9] bg-[#FAF8F5]/80 hover:bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold font-mono ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-[#385A48] text-white flex items-center justify-center text-[11px]'
                          : 'text-[#4A443D]'
                      }`}
                    >
                      {dayNum}
                    </span>
                    <Plus className="w-3 h-3 text-[#A89F93] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Milestones badge if any */}
                  {dayMilestones.length > 0 && (
                    <div className="mt-1">
                      {dayMilestones.map((m) => (
                        <div
                          key={m.id}
                          title={`Meta da Trilha: ${m.title}`}
                          className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#F7EFE4] text-[#8C5E28] border border-[#E8DCB8] truncate mb-0.5"
                        >
                          ★ {m.title}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Mini tasks tags */}
                  <div className="mt-1 space-y-0.5">
                    {dayTasks.slice(0, 2).map((t) => (
                      <div
                        key={t.id}
                        className={`text-[9px] px-1.5 py-0.5 rounded truncate ${
                          t.status === 'completed'
                            ? 'line-through text-[#9E978F] bg-[#EDE9E1]'
                            : 'text-[#2D2822] bg-[#FFFFFF] border border-[#E6E0D4]'
                        }`}
                      >
                        {t.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <span className="text-[9px] text-[#8A837A] block font-medium">
                        +{dayTasks.length - 2} mais
                      </span>
                    )}
                  </div>
                </div>

                {dayTasks.length > 0 && (
                  <div className="text-[10px] text-[#7A736A] font-medium pt-1 border-t border-[#EDE6DC]/60 flex items-center justify-between">
                    <span>{completedTasks}/{dayTasks.length}</span>
                    {completedTasks === dayTasks.length && (
                      <CheckCircle2 className="w-3 h-3 text-[#385A48]" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

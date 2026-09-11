import React, { useState } from 'react';
import { usePlan } from '../context/PlanContext';
import { Task } from '../types';
import { getTodayDateStr } from '../data/initialData';
import {
  CalendarRange,
  Plus,
  CheckCircle2,
  Circle,
  Star,
  Wind,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Layers,
  Inbox,
  Volume2,
  Image as ImageIcon,
} from 'lucide-react';

export const WeeklyView: React.FC = () => {
  const {
    tasks,
    toggleTaskStatus,
    setEditingTask,
    setIsTaskModalOpen,
    setPreselectedDueDate,
    moveTaskToDate,
    moveToRespite,
    deleteTask,
    getMilestoneById,
    getEraByMilestoneId,
    setActiveTab,
  } = usePlan();

  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Helper to generate the 7 days of the target week (Monday to Sunday)
  const getWeekDays = (offsetWeeks: number) => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
    // In Brazil/business standard, week starts on Monday
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday + offsetWeeks * 7);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const weekdayLong = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(d);
      const weekdayShort = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(d).replace('.', '');
      const dayNum = d.getDate();
      const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(d).replace('.', '');

      const isToday = dateStr === getTodayDateStr();

      days.push({
        dateStr,
        weekdayLong: weekdayLong.charAt(0).toUpperCase() + weekdayLong.slice(1),
        weekdayShort: weekdayShort.toUpperCase(),
        dayNum,
        monthName,
        isToday,
        dateObj: d,
      });
    }
    return days;
  };

  const weekDays = getWeekDays(weekOffset);

  // Formatted interval for banner (e.g. "07 de Set - 13 de Set, 2026")
  const startDay = weekDays[0];
  const endDay = weekDays[6];
  const formattedWeekInterval = `${startDay.dayNum} de ${startDay.monthName} — ${endDay.dayNum} de ${endDay.monthName} de ${startDay.dateObj.getFullYear()}`;

  // Weekly stats
  const activeWeekTasks = tasks.filter((t) => {
    const isThisWeek = weekDays.some((d) => d.dateStr === t.dueDate);
    return isThisWeek && t.status !== 'respite_moved';
  });

  const completedWeekCount = activeWeekTasks.filter((t) => t.status === 'completed').length;
  const totalWeekCount = activeWeekTasks.length;
  const percentComplete = totalWeekCount > 0 ? Math.round((completedWeekCount / totalWeekCount) * 100) : 0;

  const dumpTasks = tasks.filter(
    (t) => (!t.dueDate || t.dueDate.trim() === '') && t.status !== 'respite_moved' && t.status !== 'completed'
  );

  // Open modal with preselected due date
  const handleAddNewTask = (dateStr: string) => {
    setEditingTask(null);
    setPreselectedDueDate(dateStr);
    setIsTaskModalOpen(true);
  };

  // Move task to adjacent day
  const handleShiftDay = (task: Task, direction: 'prev' | 'next') => {
    const currentIndex = weekDays.findIndex((d) => d.dateStr === task.dueDate);
    if (currentIndex === -1) {
      // If task date is outside current view, shift by 1 day using Date
      const d = new Date(task.dueDate + 'T00:00:00');
      d.setDate(d.getDate() + (direction === 'next' ? 1 : -1));
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      moveTaskToDate(task.id, `${year}-${month}-${day}`);
      return;
    }

    const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex >= 0 && targetIndex < weekDays.length) {
      moveTaskToDate(task.id, weekDays[targetIndex].dateStr);
    } else {
      const d = new Date(task.dueDate + 'T00:00:00');
      d.setDate(d.getDate() + (direction === 'next' ? 1 : -1));
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      moveTaskToDate(task.id, `${year}-${month}-${day}`);
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDate !== dateStr) {
      setDragOverDate(dateStr);
    }
  };

  const handleDragLeave = (e: React.DragEvent, dateStr: string) => {
    if (dragOverDate === dateStr) {
      setDragOverDate(null);
    }
  };

  const handleDrop = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      moveTaskToDate(taskId, dateStr);
    }
    setDragOverDate(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 1. Weekly Banner & Navigation */}
      <div className="bg-[#FFFFFF] p-5 sm:p-6 rounded-2xl border border-[#E8E2D8] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#EAF1EB] text-[#2C4835] flex items-center justify-center">
                <CalendarRange className="w-5 h-5 text-[#385A48]" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-semibold text-[#242220]">
                  Visão Semanal
                </h2>
                <p className="text-xs text-[#7B746D]">
                  {formattedWeekInterval}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            {/* Week navigation buttons */}
            <div className="flex items-center space-x-1.5 bg-[#FAF8F5] p-1 rounded-xl border border-[#E8E2D8]">
              <button
                onClick={() => setWeekOffset((prev) => prev - 1)}
                className="p-1.5 rounded-lg hover:bg-[#FFFFFF] text-[#69635C] hover:text-[#242220] transition-colors cursor-pointer"
                title="Semana anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setWeekOffset(0)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  weekOffset === 0
                    ? 'bg-[#2D332F] text-[#FAF8F5]'
                    : 'text-[#69635C] hover:bg-[#FFFFFF] hover:text-[#242220]'
                }`}
              >
                Esta Semana
              </button>
              <button
                onClick={() => setWeekOffset((prev) => prev + 1)}
                className="p-1.5 rounded-lg hover:bg-[#FFFFFF] text-[#69635C] hover:text-[#242220] transition-colors cursor-pointer"
                title="Próxima semana"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekly Completion Progress */}
            <div className="flex items-center space-x-3 px-3.5 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs">
              <div className="text-right">
                <span className="font-semibold text-[#242220]">{completedWeekCount}</span> de{' '}
                <span className="font-semibold text-[#242220]">{totalWeekCount}</span> tarefas concluídas
              </div>
              <div className="w-16 bg-[#E8E2D8] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#385A48] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${percentComplete}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Dump Tray if any tasks are in brain dump */}
      {dumpTasks.length > 0 && (
        <div className="bg-[#FFFFFF] p-3.5 sm:p-4 rounded-2xl border border-[#E8E2D8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#FCF3E8] text-[#8C581E] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <Inbox className="w-4 h-4 text-[#9C6528]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="text-xs font-semibold text-[#242220]">
                  Página de Despejo ({dumpTasks.length} pendências sem data)
                </span>
                <span className="text-[11px] text-[#7B746D]">
                  Arraste os cartões abaixo para um dia da semana para agendar:
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2 overflow-x-auto no-scrollbar py-0.5">
                {dumpTasks.map((dt) => (
                  <div
                    key={dt.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, dt.id)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#DDD5C7] text-xs font-medium text-[#403A34] shadow-2xs hover:border-[#385A48] hover:bg-[#FFFFFF] transition-all cursor-grab active:cursor-grabbing shrink-0"
                    title="Arraste para uma coluna de dia da semana"
                  >
                    <span className="truncate max-w-[200px]">{dt.title}</span>
                    <span className="text-[10px] font-mono text-[#8C847B] bg-[#F0ECE4] px-1.5 py-0.2 rounded">
                      {dt.estimatedMinutes}m
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('dump')}
            className="text-xs font-semibold text-[#8C581E] hover:text-[#69431A] hover:underline cursor-pointer shrink-0 self-start md:self-center flex items-center space-x-1"
          >
            <span>Gerenciar Despejo</span>
            <span>›</span>
          </button>
        </div>
      )}

      {/* 3. 7-Day Kanban Board */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3.5 min-w-[980px]">
          {weekDays.map((day) => {
            const dayTasks = tasks.filter(
              (t) => t.dueDate === day.dateStr && t.status !== 'respite_moved'
            );
            const isTargeted = dragOverDate === day.dateStr;

            return (
              <div
                key={day.dateStr}
                onDragOver={(e) => handleDragOver(e, day.dateStr)}
                onDragLeave={(e) => handleDragLeave(e, day.dateStr)}
                onDrop={(e) => handleDrop(e, day.dateStr)}
                className={`flex flex-col rounded-2xl border transition-all duration-150 min-h-[520px] ${
                  day.isToday
                    ? 'border-[#385A48]/30 bg-[#FAF9F6] shadow-xs ring-1 ring-[#385A48]/20'
                    : isTargeted
                    ? 'border-[#385A48] bg-[#F1F6F2] shadow-sm'
                    : 'border-[#EAE4DA] bg-[#FAF8F5]/80'
                }`}
              >
                {/* Column Header: Day, Date, Today Badge, Count and Add Button */}
                <div className={`p-3.5 border-b rounded-t-2xl transition-colors ${
                  day.isToday ? 'bg-[#FFFFFF] border-[#E8E2D8]' : 'bg-[#FAF8F5] border-[#EBE5DA]'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[11px] font-bold tracking-wider text-[#69635C] uppercase">
                        {day.weekdayShort}
                      </span>
                      {day.isToday && (
                        <span className="px-1.5 py-0.2 rounded-full bg-[#E1EDE4] text-[#284835] text-[9px] font-semibold tracking-tight">
                          Hoje
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddNewTask(day.dateStr)}
                      className="p-1 rounded-md text-[#69635C] hover:text-[#242220] hover:bg-[#EFEAE1] transition-colors cursor-pointer"
                      title={`Adicionar tarefa em ${day.dayNum}/${day.monthName}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="font-serif text-lg font-bold text-[#242220]">
                      {day.dayNum} <span className="text-xs font-normal text-[#8A837A] font-sans">{day.monthName}</span>
                    </span>

                    <span className="text-[10px] font-medium text-[#7A736C] px-2 py-0.5 rounded-full bg-[#F0ECE4]">
                      {dayTasks.length} {dayTasks.length === 1 ? 'tarefa' : 'tarefas'}
                    </span>
                  </div>
                </div>

                {/* Column Body: Tasks List */}
                <div className="p-2.5 flex-1 flex flex-col space-y-2.5">
                  {dayTasks.length === 0 ? (
                    <div
                      onClick={() => handleAddNewTask(day.dateStr)}
                      className="flex-1 flex flex-col items-center justify-center p-4 text-center border border-dashed border-[#E5DFD4] rounded-xl text-[#9E978F] hover:border-[#D1C8B9] hover:bg-[#FFFFFF]/60 cursor-pointer transition-colors group"
                    >
                      <span className="text-[11px] font-medium text-[#7E7870] group-hover:text-[#242220]">
                        Sem tarefas agendadas
                      </span>
                      <span className="text-[10px] text-[#A8A198] mt-0.5">
                        Clique para adicionar ou solte uma tarefa aqui
                      </span>
                    </div>
                  ) : (
                    dayTasks.map((task) => {
                      const milestone = getMilestoneById(task.milestoneId);
                      const era = getEraByMilestoneId(task.milestoneId);
                      const isDone = task.status === 'completed';

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          className={`p-3 rounded-xl border transition-all shadow-2xs group cursor-grab active:cursor-grabbing ${
                            isDone
                              ? 'border-[#EAE5DC] bg-[#FAF8F5]/80 opacity-75'
                              : task.isPillar
                              ? 'border-[#C8D6CA] bg-[#FFFFFF] shadow-xs'
                              : 'border-[#E8E2D8] bg-[#FFFFFF] hover:border-[#D5CCC0]'
                          }`}
                        >
                          <div className="flex items-start space-x-2">
                            {/* Checkbox button */}
                            <button
                              type="button"
                              onClick={() => toggleTaskStatus(task.id)}
                              className="mt-0.5 text-[#385A48] hover:text-[#253D30] cursor-pointer shrink-0"
                              title={isDone ? 'Marcar como pendente' : 'Marcar como concluída'}
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-[#385A48] fill-[#EAF0EB]" />
                              ) : (
                                <Circle className="w-4 h-4 text-[#B3ABA0] hover:text-[#385A48]" />
                              )}
                            </button>

                            {/* Task Content */}
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-xs font-medium leading-snug break-words ${
                                  isDone
                                    ? 'line-through text-[#8A837A]'
                                    : 'text-[#242220]'
                                }`}
                              >
                                {task.title}
                              </p>

                              {/* Mother Goal / Era Link Chip */}
                              {era && milestone && (
                                <div className="mt-1.5 flex items-center space-x-1 text-[10px] flex-wrap gap-y-0.5">
                                  <span
                                    className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded-md font-medium truncate max-w-full"
                                    style={{
                                      backgroundColor: era.accentBg,
                                      color: era.color,
                                    }}
                                  >
                                    <span
                                      className="w-1 h-1 rounded-full shrink-0"
                                      style={{ backgroundColor: era.color }}
                                    />
                                    <span className="truncate">{era.title}</span>
                                  </span>
                                </div>
                              )}

                              {/* Badges: Minutes, Pillar, Media */}
                              <div className="flex items-center space-x-1.5 mt-2 text-[10px]">
                                <span className="font-mono bg-[#F5F1E9] text-[#7A736A] px-1.5 py-0.2 rounded">
                                  {task.estimatedMinutes}m
                                </span>

                                {task.isPillar && (
                                  <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.2 rounded bg-[#EAF0EB] text-[#2C4835] font-semibold">
                                    <Star className="w-2.5 h-2.5 fill-[#2C4835]" />
                                    <span>Pilar</span>
                                  </span>
                                )}

                                {task.audioUrl && (
                                  <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.2 rounded bg-[#FAF4ED] text-[#8C581E] border border-[#ECDCC9]" title="Possui áudio de voz gravado">
                                    <Volume2 className="w-2.5 h-2.5 text-[#B85D3B]" />
                                    <span>Voz</span>
                                  </span>
                                )}

                                {task.imageUrl && (
                                  <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.2 rounded bg-[#F4F1EA] text-[#3E3832] border border-[#DED7CB]" title="Possui anexo de imagem">
                                    <ImageIcon className="w-2.5 h-2.5 text-[#385A48]" />
                                    <span>Foto</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions Footer (Move left/right, Respite, Edit, Delete) */}
                          <div className="mt-2.5 pt-2 border-t border-[#F0ECE4] flex items-center justify-between text-[11px] text-[#8C847B]">
                            {/* Day shifting buttons */}
                            <div className="flex items-center space-x-0.5">
                              <button
                                type="button"
                                onClick={() => handleShiftDay(task, 'prev')}
                                className="p-1 rounded hover:bg-[#EFEAE1] text-[#8C847B] hover:text-[#242220] transition-colors cursor-pointer"
                                title="Mover para o dia anterior"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleShiftDay(task, 'next')}
                                className="p-1 rounded hover:bg-[#EFEAE1] text-[#8C847B] hover:text-[#242220] transition-colors cursor-pointer"
                                title="Mover para o dia seguinte"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="flex items-center space-x-0.5">
                              {/* Move to Dump (Unschedule) Button */}
                              {!isDone && (
                                <button
                                  type="button"
                                  onClick={() => moveTaskToDate(task.id, '')}
                                  className="p-1 rounded hover:bg-[#FCF3E8] text-[#8C847B] hover:text-[#9C6528] transition-colors cursor-pointer"
                                  title="Desagendar e mover para a Página de Despejo"
                                >
                                  <Inbox className="w-3 h-3" />
                                </button>
                              )}

                              {/* Respite Button */}
                              {!isDone && (
                                <button
                                  type="button"
                                  onClick={() => moveToRespite(task.id, 'Pausa intencional da semana')}
                                  className="p-1 rounded hover:bg-[#F6F1E4] text-[#8C847B] hover:text-[#887447] transition-colors cursor-pointer"
                                  title="Mover para Caixa de Descanso sem culpa"
                                >
                                  <Wind className="w-3 h-3" />
                                </button>
                              )}

                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTask(task);
                                  setIsTaskModalOpen(true);
                                }}
                                className="p-1 rounded hover:bg-[#EFEAE1] text-[#8C847B] hover:text-[#242220] transition-colors cursor-pointer"
                                title="Editar tarefa"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => deleteTask(task.id)}
                                className="p-1 rounded hover:bg-[#F9ECEB] text-[#8C847B] hover:text-[#B84035] transition-colors cursor-pointer"
                                title="Excluir tarefa"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

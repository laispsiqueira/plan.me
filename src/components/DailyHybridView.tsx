import React, { useState, useRef } from 'react';
import { usePlan } from '../context/PlanContext';
import { Task, TimeBlock } from '../types';
import { getTodayDateStr } from '../data/initialData';
import {
  CheckCircle2,
  Circle,
  Clock,
  Wind,
  Plus,
  Compass,
  Star,
  Sparkles,
  ChevronRight,
  Coffee,
  Sun,
  Feather,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  ShieldCheck,
  MoreVertical,
  Layers,
  Play,
  Square,
  Volume2,
  Image as ImageIcon,
  Maximize2,
  X,
  GripVertical,
  RotateCw,
} from 'lucide-react';

export const DailyHybridView: React.FC = () => {
  const {
    dailyCheckin,
    prioritizedDailyTasks,
    tasks,
    timeBlocks,
    eras,
    milestones,
    toggleTaskStatus,
    togglePillar,
    moveToRespite,
    deleteTask,
    saveTimeBlock,
    setEditingTask,
    setIsTaskModalOpen,
    setIsCheckinOpen,
    setIsRespiteTriggerModalOpen,
    setIsTimeBlockModalOpen,
    setEditingTimeBlock,
    setPreselectedStartTime,
    setPreselectedEndTime,
    deleteTimeBlock,
    getMilestoneById,
    getEraByMilestoneId,
  } = usePlan();

  const [taskFilter, setTaskFilter] = useState<'all' | 'pillars' | 'pending' | 'completed'>('all');
  const [playingTaskId, setPlayingTaskId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [hoveredSlotTime, setHoveredSlotTime] = useState<string | null>(null);
  const [scheduleToast, setScheduleToast] = useState<string | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const todayStr = getTodayDateStr();
  const todayBlocks = timeBlocks
    .filter((tb) => tb.date === todayStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const showScheduleToast = (msg: string) => {
    setScheduleToast(msg);
    setTimeout(() => setScheduleToast(null), 3500);
  };

  const handleDropTaskOnSlot = (slotTime: string, e: React.DragEvent) => {
    e.preventDefault();
    setHoveredSlotTime(null);
    const taskId = e.dataTransfer.getData('task-id') || e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const duration = task.estimatedMinutes || 30;
    const [h, m] = slotTime.split(':').map(Number);
    const totalM = (h || 0) * 60 + (m || 0) + duration;
    const endH = Math.min(23, Math.floor(totalM / 60));
    const endM = totalM % 60;
    const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    saveTimeBlock({
      date: todayStr,
      startTime: slotTime,
      endTime: endTimeStr,
      title: task.title,
      type: task.isPillar ? 'focus' : 'execution' as any,
      taskId: task.id,
    });

    showScheduleToast(`Tarefa "${task.title}" agendada no bloco das ${slotTime} às ${endTimeStr}!`);
    setDraggedTaskId(null);
  };

  const handleDropTaskOnBlock = (blockId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const taskId = e.dataTransfer.getData('task-id') || e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const targetBlock = timeBlocks.find((b) => b.id === blockId);
    if (!targetBlock) return;

    saveTimeBlock({
      ...targetBlock,
      taskId: task.id,
    });

    showScheduleToast(`Tarefa "${task.title}" vinculada ao bloco das ${targetBlock.startTime}!`);
    setDraggedTaskId(null);
  };

  const handleQuickScheduleTask = (task: Task) => {
    const occupiedSlots = new Set(todayBlocks.map((b) => b.startTime));
    const preferredSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
    ];
    const freeSlot = preferredSlots.find((s) => !occupiedSlots.has(s)) || '09:00';
    const duration = task.estimatedMinutes || 30;
    const [h, m] = freeSlot.split(':').map(Number);
    const totalM = (h || 0) * 60 + (m || 0) + duration;
    const endH = Math.min(23, Math.floor(totalM / 60));
    const endM = totalM % 60;
    const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    saveTimeBlock({
      date: todayStr,
      startTime: freeSlot,
      endTime: endTimeStr,
      title: task.title,
      type: task.isPillar ? ('focus' as any) : ('execution' as any),
      taskId: task.id,
    });
    showScheduleToast(`Tarefa "${task.title}" colocada no bloco das ${freeSlot} às ${endTimeStr}!`);
  };

  const handlePlayAudio = (taskId: string, audioUrl: string) => {
    if (playingTaskId === taskId && audioElementRef.current) {
      audioElementRef.current.pause();
      setPlayingTaskId(null);
    } else {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;
      audio.onended = () => setPlayingTaskId(null);
      audio.play();
      setPlayingTaskId(taskId);
    }
  };

  // Google Calendar 30-min Grid Setup
  const START_HOUR = 6;
  const END_HOUR = 23;
  const SLOT_HEIGHT = 48; // px per 30-minute slot

  const timeSlots: { time: string; isHalf: boolean; hour: number }[] = [];
  for (let hour = START_HOUR; hour < END_HOUR; hour++) {
    const hStr = String(hour).padStart(2, '0');
    timeSlots.push({ time: `${hStr}:00`, isHalf: false, hour });
    timeSlots.push({ time: `${hStr}:30`, isHalf: true, hour });
  }

  const timeToMinutesFromStart = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    const totalMinutes = (h || 0) * 60 + (m || 0);
    return Math.max(0, totalMinutes - START_HOUR * 60);
  };

  const getNext30Min = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    let nextM = (m || 0) + 30;
    let nextH = h || 0;
    if (nextM >= 60) {
      nextH += 1;
      nextM = 0;
    }
    return `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`;
  };

  const handleEmptySlotClick = (slotTime: string) => {
    setEditingTimeBlock(null);
    setPreselectedStartTime(slotTime);
    setPreselectedEndTime(getNext30Min(slotTime));
    setIsTimeBlockModalOpen(true);
  };

  // Current time line calculation
  const now = new Date();
  const currentMinutesFromStart =
    now.getHours() * 60 + now.getMinutes() - START_HOUR * 60;
  const isCurrentTimeVisible =
    currentMinutesFromStart >= 0 &&
    currentMinutesFromStart <= (END_HOUR - START_HOUR) * 60;
  const currentTimeTop = (currentMinutesFromStart / 30) * SLOT_HEIGHT;

  // Compute stats
  const totalMinutes = prioritizedDailyTasks
    .filter((t) => t.status !== 'completed')
    .reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  const completedTasksCount = prioritizedDailyTasks.filter((t) => t.status === 'completed').length;
  const totalTasksCount = prioritizedDailyTasks.length;
  const percentComplete = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Filter tasks
  const displayedTasks = prioritizedDailyTasks.filter((t) => {
    if (taskFilter === 'pillars') return t.isPillar;
    if (taskFilter === 'pending') return t.status !== 'completed';
    if (taskFilter === 'completed') return t.status === 'completed';
    return true;
  });

  const getEnergyGuidance = () => {
    switch (dailyCheckin.energyLevel) {
      case 'high':
        return {
          title: 'Ritmo Estratégico Ativo',
          desc: 'Priorizando metas com prazos iminentes e destravando pendências mais antigas.',
          icon: Sun,
          textColor: 'text-[#2D4D3A]',
          bg: 'bg-[#F1F6F2]',
          border: 'border-[#C8DBCF]',
        };
      case 'medium':
        return {
          title: 'Ritmo Equilibrado e Focado',
          desc: 'Foco direcionado nas 3 prioridades não-negociáveis para evitar dispersão mental.',
          icon: Coffee,
          textColor: 'text-[#69431A]',
          bg: 'bg-[#FCF7F0]',
          border: 'border-[#EADBCA]',
        };
      case 'low_respite':
        return {
          title: 'Resguardo & Autocuidado Protegido',
          desc: 'Urgências ocultadas. Priorizando apenas tarefas leves de manutenção ou descanso.',
          icon: Feather,
          textColor: 'text-[#503C66]',
          bg: 'bg-[#F7F3FA]',
          border: 'border-[#DCCFE6]',
        };
    }
  };

  const guidance = getEnergyGuidance();
  const GuidanceIcon = guidance.icon;

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleEditTimeBlock = (tb: TimeBlock) => {
    setEditingTimeBlock(tb);
    setIsTimeBlockModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Main Grid: Time Blocks (Left) + Prioritized Tasks with Energy Rhythm (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Grade de Blocos de Tempo no estilo Google Agenda (6 cols on lg) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#E8E2D8] shadow-xs flex flex-col">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#F0EBE2]">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-[#385A48]" />
                <h3 className="font-serif text-base font-semibold text-[#242220]">
                  Agenda de Blocos do Dia
                </h3>
              </div>
              <button
                id="add-timeblock-button"
                onClick={() => {
                  setEditingTimeBlock(null);
                  setPreselectedStartTime('09:00');
                  setPreselectedEndTime('10:00');
                  setIsTimeBlockModalOpen(true);
                }}
                className="flex items-center space-x-1 text-xs font-medium text-[#385A48] hover:text-[#243B2E] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Bloco</span>
              </button>
            </div>

            {/* Subtitle & Legend with Clarity Guidance moved to top */}
            <div className="py-2.5 space-y-2 border-b border-[#F0EBE2]">
              <p className="text-xs text-[#69635C] leading-relaxed">
                "Organizamos primeiro, automatizamos depois." A duração esperada para as tarefas ativas de hoje é de{' '}
                <strong className="text-[#242220]">{totalMinutes} minutos</strong> (~{Math.round(totalMinutes / 60 * 10) / 10}h).
                Os horários sem blocos permanecem abertos para amortecer a carga mental e acolher o imprevisto.
              </p>
              <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-[#7B746D]">
                <span>Grade de 30 minutos. Arraste tarefas ou clique no relógio para colocar no bloco.</span>
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="inline-flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-xs bg-[#356344]" />
                    <span>Foco</span>
                  </span>
                  <span className="inline-flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-xs bg-[#C87D32]" />
                    <span>Rotina</span>
                  </span>
                  <span className="inline-flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-xs bg-[#85559F]" />
                    <span>Pausa</span>
                  </span>
                  <span className="inline-flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-xs bg-[#2F6D7B]" />
                    <span>Compromisso</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Schedule Toast notification */}
            {scheduleToast && (
              <div className="mb-2 p-2.5 rounded-xl bg-[#EAF2EB] border border-[#C5DDCB] text-[#244E33] text-xs flex items-center space-x-2 animate-fadeIn">
                <Check className="w-4 h-4 text-[#2C5F3E] shrink-0" />
                <span>{scheduleToast}</span>
              </div>
            )}

            {/* Drag helper indicator */}
            {draggedTaskId && (
              <div className="mb-2 p-2 rounded-xl bg-[#EAF2EB] border-2 border-dashed border-[#385A48] text-[#244E33] text-xs flex items-center justify-between animate-pulse">
                <span>⬇ Arraste e solte sobre qualquer linha de horário abaixo para agendar</span>
              </div>
            )}

            {/* Google Calendar 30-min View Container */}
            <div className="mt-1 rounded-xl border border-[#E8E2D8] bg-[#FFFFFF] overflow-hidden">
              <div className="max-h-[560px] overflow-y-auto relative">
                <div className="flex relative" style={{ height: `${timeSlots.length * SLOT_HEIGHT}px` }}>
                  {/* Left Column: Hours */}
                  <div className="w-14 shrink-0 bg-[#FAF8F5]/80 select-none border-r border-[#EFEAE1]">
                    {timeSlots.map((slot) => (
                      <div
                        key={`hour-${slot.time}`}
                        style={{ height: `${SLOT_HEIGHT}px` }}
                        className="flex items-start justify-end pr-2 pt-1 font-mono text-[11px] text-[#8C847B]"
                      >
                        {!slot.isHalf ? (
                          <span className="font-semibold text-[#4F4942]">{slot.time}</span>
                        ) : (
                          <span className="text-[#AFA79D] text-[10px]">{slot.time}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Right Column: 30-min Grid Slots & Events */}
                  <div className="flex-1 relative bg-[#FFFFFF]">
                    {/* Background Grid Lines and Clickable/Droppable Empty Slots */}
                    {timeSlots.map((slot) => {
                      const isHovered = hoveredSlotTime === slot.time;

                      return (
                        <div
                          key={`slot-${slot.time}`}
                          style={{ height: `${SLOT_HEIGHT}px` }}
                          onClick={() => handleEmptySlotClick(slot.time)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'copy';
                            if (hoveredSlotTime !== slot.time) {
                              setHoveredSlotTime(slot.time);
                            }
                          }}
                          onDragLeave={() => {
                            if (hoveredSlotTime === slot.time) {
                              setHoveredSlotTime(null);
                            }
                          }}
                          onDrop={(e) => handleDropTaskOnSlot(slot.time, e)}
                          title={`Clique ou solte tarefa para agendar bloco às ${slot.time}`}
                          className={`w-full group/slot cursor-pointer transition-all relative flex items-center justify-between px-3 ${
                            isHovered
                              ? 'bg-[#EAF2EB] border-2 border-dashed border-[#385A48] z-20 shadow-xs'
                              : !slot.isHalf
                              ? 'border-t border-[#E5DFD4] hover:bg-[#FAF8F4]'
                              : 'border-t border-dashed border-[#F0ECE4] hover:bg-[#FAF8F4]'
                          }`}
                        >
                          <span
                            className={`text-[10px] font-mono transition-opacity ${
                              isHovered
                                ? 'text-[#244E33] font-bold opacity-100'
                                : 'text-[#A89F94] opacity-0 group-hover/slot:opacity-100'
                            }`}
                          >
                            {isHovered ? `⬇ Soltar para agendar às ${slot.time}` : `+ Agendar às ${slot.time}`}
                          </span>
                        </div>
                      );
                    })}

                    {/* Current Time Indicator Line (Google Calendar Red Line) */}
                    {isCurrentTimeVisible && (
                      <div
                        style={{ top: `${currentTimeTop}px` }}
                        className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-[#D85A48] -ml-1.5 shadow-xs" />
                        <div className="h-[2px] w-full bg-[#D85A48]" />
                      </div>
                    )}

                    {/* Rendered Time Blocks placed according to startTime and endTime */}
                    {todayBlocks.map((block) => {
                      const startMin = timeToMinutesFromStart(block.startTime);
                      const endMin = timeToMinutesFromStart(block.endTime);
                      const durationMin = Math.max(endMin - startMin, 25);

                      const topPx = (startMin / 30) * SLOT_HEIGHT;
                      const heightPx = Math.max((durationMin / 30) * SLOT_HEIGHT - 2, 40);

                      const linkedTask = block.taskId
                        ? prioritizedDailyTasks.find((t) => t.id === block.taskId)
                        : undefined;

                      const getCalendarBlockStyle = (type: TimeBlock['type']) => {
                        switch (type) {
                          case 'focus':
                            return {
                              container: 'bg-[#EBF3ED] border-l-[#356344] text-[#1F3D2A] hover:bg-[#E2EEE5]',
                              badge: 'bg-[#D7E8DC] text-[#244E33]',
                              label: 'Foco Protegido',
                            };
                          case 'routine':
                            return {
                              container: 'bg-[#FCF5EC] border-l-[#C87D32] text-[#633917] hover:bg-[#F9EBDC]',
                              badge: 'bg-[#F5DEC6] text-[#633917]',
                              label: 'Rotina',
                            };
                          case 'rest':
                            return {
                              container: 'bg-[#F6EFFB] border-l-[#85559F] text-[#48285C] hover:bg-[#EFE3F7]',
                              badge: 'bg-[#E7D6F3] text-[#48285C]',
                              label: 'Pausa & Respiro',
                            };
                          case 'commitment':
                            return {
                              container: 'bg-[#EEF5F8] border-l-[#2F6D7B] text-[#1A454E] hover:bg-[#E3EFF3]',
                              badge: 'bg-[#D1E6EC] text-[#1A454E]',
                              label: 'Compromisso',
                            };
                        }
                      };

                      const styleInfo = getCalendarBlockStyle(block.type);

                      return (
                        <div
                          key={block.id}
                          style={{
                            top: `${topPx}px`,
                            height: `${heightPx}px`,
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={(e) => handleDropTaskOnBlock(block.id, e)}
                          title="Solte uma tarefa aqui para vinculá-la a este bloco"
                          className={`absolute left-1.5 right-2 rounded-lg border border-transparent border-l-4 shadow-xs p-2 overflow-hidden z-10 transition-all flex flex-col justify-between group ${styleInfo.container}`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center space-x-1.5 min-w-0">
                                <span className="font-mono text-[11px] font-semibold tracking-tight">
                                  {block.startTime} — {block.endTime}
                                </span>
                                <span
                                  className={`text-[9px] font-medium px-1.5 py-0.2 rounded ${styleInfo.badge}`}
                                >
                                  {styleInfo.label}
                                </span>
                              </div>

                              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditTimeBlock(block);
                                  }}
                                  className="p-1 rounded hover:bg-black/10 transition-colors cursor-pointer"
                                  title="Editar bloco"
                                >
                                  <Edit2 className="w-3 h-3 text-current" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteTimeBlock(block.id);
                                  }}
                                  className="p-1 rounded hover:bg-red-500/20 hover:text-red-700 transition-colors cursor-pointer"
                                  title="Excluir bloco"
                                >
                                  <Trash2 className="w-3 h-3 text-current" />
                                </button>
                              </div>
                            </div>

                            <h4 className="font-semibold text-xs leading-snug mt-0.5 text-current line-clamp-2">
                              {block.title}
                            </h4>
                          </div>

                          {linkedTask && (
                            <div className="flex items-center space-x-1 text-[10px] opacity-85 mt-0.5 truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                              <span className="italic truncate">{linkedTask.title}</span>
                              {linkedTask.status === 'completed' && (
                                <span className="font-bold text-[9px]">(Feita)</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Ritmo & Tarefas Priorizadas (Pedras do Caminho) (6 cols on lg) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Botão & Banner de Ritmo Equilibrado / Energia */}
          <div className={`p-4 rounded-2xl border ${guidance.border} ${guidance.bg} transition-all shadow-2xs`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#FFFFFF]/90 flex items-center justify-center shrink-0 shadow-2xs">
                  <GuidanceIcon className={`w-4.5 h-4.5 ${guidance.textColor}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className={`font-serif font-semibold text-sm sm:text-base truncate ${guidance.textColor}`}>
                      {guidance.title}
                    </h3>
                    <button
                      id="adjust-energy-checkin-btn"
                      onClick={() => setIsCheckinOpen(true)}
                      className="text-[11px] font-medium underline opacity-80 hover:opacity-100 cursor-pointer shrink-0"
                    >
                      (Alterar)
                    </button>
                  </div>
                  <p className="text-[11px] text-[#5E574F] mt-0.5 line-clamp-1">
                    {dailyCheckin.intention ? (
                      <>
                        <strong className="text-[#322E29]">Intenção:</strong> "{dailyCheckin.intention}"
                      </>
                    ) : (
                      guidance.desc
                    )}
                  </p>
                </div>
              </div>

              {/* Botão de Respiro */}
              <button
                id="respite-trigger-button"
                onClick={() => setIsRespiteTriggerModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-[#D9CEBA] bg-[#FFFFFF] text-[#695834] text-xs font-semibold hover:bg-[#F9F7F1] transition-all cursor-pointer shadow-2xs shrink-0"
                title="Ativar o Botão de Respiro para aliviar a carga sem culpa"
              >
                <Wind className="w-3.5 h-3.5 text-[#887447]" />
                <span className="hidden sm:inline">Botão de</span> Respiro
              </button>
            </div>
          </div>

          <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#E8E2D8] shadow-xs">
            {/* Header with Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-[#F0EBE2] gap-2">
              <div className="flex items-center space-x-2">
                <Compass className="w-4 h-4 text-[#B85D3B]" />
                <h3 className="font-serif text-base font-semibold text-[#242220]">
                  Pedras do Caminho (Tarefas Acionáveis)
                </h3>
              </div>

              {/* Filter pills */}
              <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: `Todas (${totalTasksCount})` },
                  { id: 'pillars', label: 'Pilares' },
                  { id: 'pending', label: 'Pendentes' },
                  { id: 'completed', label: `Feitas (${completedTasksCount})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTaskFilter(f.id as any)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                      taskFilter === f.id
                        ? 'bg-[#2D332F] text-[#FAF8F5]'
                        : 'text-[#7B746D] hover:bg-[#F2ECE2]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Progress status bar */}
            <div className="py-3 flex items-center justify-between text-xs text-[#7B746D]">
              <div className="flex items-center space-x-2">
                <span>Progresso do dia:</span>
                <span className="font-semibold text-[#242220]">{percentComplete}%</span>
              </div>
              <div className="w-32 bg-[#EFEAE1] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#385A48] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${percentComplete}%` }}
                />
              </div>
            </div>

            {/* Tasks List */}
            {displayedTasks.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-[#E5DFD4] rounded-xl">
                <CheckCircle2 className="w-7 h-7 text-[#385A48] mx-auto mb-2 opacity-80" />
                <p className="text-xs font-medium text-[#2E2925]">
                  {taskFilter === 'completed'
                    ? 'Nenhuma tarefa concluída ainda hoje.'
                    : 'Nenhuma tarefa encontrada neste filtro.'}
                </p>
                <p className="text-[11px] text-[#8A837A] mt-1">
                  Mantenha a leveza. A realização dos sonhos é construída pedra por pedra.
                </p>
                <button
                  onClick={() => setIsTaskModalOpen(true)}
                  className="mt-3 inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#2D332F] text-[#FAF8F5] text-xs font-medium hover:bg-[#1C201E] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Tarefa</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {displayedTasks.map((task) => {
                  const milestone = getMilestoneById(task.milestoneId);
                  const era = getEraByMilestoneId(task.milestoneId);
                  const isDone = task.status === 'completed';

                  return (
                    <div
                      key={task.id}
                      draggable={!isDone}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', task.id);
                        e.dataTransfer.setData('task-id', task.id);
                        setDraggedTaskId(task.id);
                      }}
                      onDragEnd={() => {
                        setDraggedTaskId(null);
                        setHoveredSlotTime(null);
                      }}
                      className={`p-3.5 rounded-xl border transition-all group ${
                        !isDone ? 'cursor-grab active:cursor-grabbing' : ''
                      } ${
                        draggedTaskId === task.id
                          ? 'opacity-40 border-dashed border-[#385A48] bg-[#EAF2EB]'
                          : isDone
                          ? 'border-[#E9E4DB] bg-[#FAF8F5]/60 opacity-75'
                          : task.isPillar
                          ? 'border-[#C8D6CA] bg-[#F7FAF8] shadow-2xs hover:border-[#385A48]'
                          : 'border-[#EBE5DA] bg-[#FFFFFF] hover:border-[#D9D1C5]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Drag grip + Checkbox and Info */}
                        <div className="flex items-start space-x-2.5 flex-1 min-w-0">
                          {!isDone && (
                            <span
                              className="mt-1 text-[#C4BCB1] group-hover:text-[#6E6760] transition-colors shrink-0 cursor-grab active:cursor-grabbing"
                              title="Arraste para agendar em um bloco de horário na grade à esquerda"
                            >
                              <GripVertical className="w-4 h-4" />
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => toggleTaskStatus(task.id)}
                            className="mt-0.5 text-[#385A48] hover:text-[#253D30] transition-transform active:scale-90 cursor-pointer shrink-0"
                            title={isDone ? 'Marcar como pendente' : 'Marcar como concluída'}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-5 h-5 text-[#385A48] fill-[#EAF0EB]" />
                            ) : (
                              <Circle className="w-5 h-5 text-[#B3ABA0] hover:text-[#385A48]" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <span
                                className={`text-xs sm:text-sm font-medium ${
                                  isDone
                                    ? 'line-through text-[#8A837A]'
                                    : 'text-[#242220]'
                                }`}
                              >
                                {task.title}
                              </span>

                              {task.isPillar && (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#E1EDE4] text-[#284835] text-[10px] font-semibold tracking-tight">
                                  <Star className="w-2.5 h-2.5 fill-[#284835]" />
                                  <span>Pilar Não-Negociável</span>
                                </span>
                              )}

                              {task.isHabit && (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#EDE7F6] text-[#4A2D73] text-[10px] font-semibold tracking-tight" title="Hábito recorrente">
                                  <RotateCw className="w-2.5 h-2.5" />
                                  <span>Hábito</span>
                                </span>
                              )}
                            </div>

                            {/* Explicit Mother-Goal Link Chips (Galho & Era) */}
                            {era && milestone && (
                              <div className="flex items-center space-x-1.5 mt-1.5 text-[11px] text-[#6E6760] flex-wrap">
                                <span
                                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md font-medium"
                                  style={{
                                    backgroundColor: era.accentBg,
                                    color: era.color,
                                  }}
                                >
                                  <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: era.color }}
                                  />
                                  <span>{era.title}</span>
                                </span>
                                <span className="text-[#A39B91]">›</span>
                                <span className="text-[#59534C] font-medium">
                                  {milestone.title}
                                </span>
                              </div>
                            )}

                            {task.notes && (
                              <p className="text-[11px] text-[#807971] mt-1 italic">
                                {task.notes}
                              </p>
                            )}

                            {/* Audio and Image Media */}
                            {(task.audioUrl || task.imageUrl) && (
                              <div className="flex items-center space-x-2 mt-1.5 flex-wrap gap-y-1">
                                {task.audioUrl && (
                                  <button
                                    type="button"
                                    onClick={() => handlePlayAudio(task.id, task.audioUrl!)}
                                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-[#FBF5ED] border border-[#E8DEC9] text-[#7B4D1B] text-[10px] font-semibold hover:bg-[#F2E5D0] cursor-pointer"
                                    title="Reproduzir nota de voz"
                                  >
                                    {playingTaskId === task.id ? (
                                      <Square className="w-3 h-3 text-[#B85D3B]" />
                                    ) : (
                                      <Play className="w-3 h-3 text-[#B85D3B]" />
                                    )}
                                    <span>{playingTaskId === task.id ? 'Pausar' : 'Ouvir voz'}</span>
                                  </button>
                                )}

                                {task.imageUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setLightboxImage(task.imageUrl!)}
                                    className="relative group/img inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-[#F4F1EA] border border-[#DED7CB] text-[10px] text-[#3E3832] hover:border-[#385A48] cursor-pointer"
                                    title="Ver foto anexada"
                                  >
                                    <ImageIcon className="w-3 h-3 text-[#385A48]" />
                                    <span>Foto</span>
                                    <img
                                      src={task.imageUrl}
                                      alt="Thumbnail"
                                      className="w-4 h-4 rounded-xs object-cover ml-0.5"
                                    />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions & Meta right */}
                        <div className="flex items-center space-x-1.5 shrink-0 pt-0.5">
                          <span className="text-[11px] text-[#8C847B] font-mono whitespace-nowrap bg-[#F5F1E9] px-2 py-0.5 rounded">
                            {task.estimatedMinutes}m
                          </span>

                          {/* Toggle Pillar star */}
                          <button
                            type="button"
                            onClick={() => togglePillar(task.id)}
                            className={`p-1 rounded hover:bg-[#EFEAE1] transition-all cursor-pointer ${
                              task.isPillar ? 'text-[#C2813E]' : 'text-[#B8B1A5] hover:text-[#C2813E]'
                            }`}
                            title={task.isPillar ? 'Remover dos pilares' : 'Tornar pilar do dia'}
                          >
                            <Star className={`w-3.5 h-3.5 ${task.isPillar ? 'fill-[#C2813E]' : ''}`} />
                          </button>

                          {/* Quick Place in Time Block button */}
                          {!isDone && (
                            <button
                              type="button"
                              onClick={() => handleQuickScheduleTask(task)}
                              className="p-1 rounded text-[#968E84] hover:text-[#385A48] hover:bg-[#EAF2EB] transition-all cursor-pointer"
                              title="Colocar no bloco do dia (ou arraste para o horário desejado)"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Move to Respite Button */}
                          {!isDone && (
                            <button
                              type="button"
                              onClick={() => moveToRespite(task.id, 'Pausa intencional do dia')}
                              className="p-1 rounded text-[#968E84] hover:text-[#887447] hover:bg-[#F6F1E4] transition-all cursor-pointer"
                              title="Mover para Caixa de Descanso sem culpa"
                            >
                              <Wind className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => handleEditTask(task)}
                            className="p-1 rounded text-[#968E84] hover:text-[#242220] hover:bg-[#EFEAE1] transition-all cursor-pointer"
                            title="Editar tarefa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => deleteTask(task.id)}
                            className="p-1 rounded text-[#968E84] hover:text-[#B84035] hover:bg-[#F9ECEB] transition-all cursor-pointer"
                            title="Excluir tarefa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal for enlarged image */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1C1A]/80 backdrop-blur-xs animate-fadeIn"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl">
            <img src={lightboxImage} alt="Anexo ampliado" className="max-h-[75vh] w-auto object-contain rounded-xl" />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-[#1F1C1A]/70 text-white hover:bg-[#1F1C1A] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

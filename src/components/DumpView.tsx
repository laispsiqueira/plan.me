import React, { useState, useRef } from 'react';
import { usePlan } from '../context/PlanContext';
import { DumpChat } from './DumpChat';
import { Task } from '../types';
import { getTodayDateStr, getRelativeDateStr } from '../data/initialData';
import {
  Inbox,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  ArrowRight,
  Sun,
  Edit2,
  Trash2,
  Sparkles,
  Tag,
  Check,
  Image as ImageIcon,
  Play,
  Square,
  Volume2,
  X,
  Maximize2,
  ListTodo,
} from 'lucide-react';

export const DumpView: React.FC = () => {
  const {
    tasks,
    deleteTask,
    toggleTaskStatus,
    setEditingTask,
    setIsTaskModalOpen,
    moveTaskToDate,
    milestones,
    getMilestoneById,
    getEraByMilestoneId,
  } = usePlan();

  const [filterDuration, setFilterDuration] = useState<'all' | 'quick' | 'deep'>('all');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [playingTaskId, setPlayingTaskId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Dump tasks are active tasks with no dueDate assigned (dueDate === '' or !dueDate)
  const dumpTasks = tasks.filter(
    (t) => (!t.dueDate || t.dueDate.trim() === '') && t.status !== 'respite_moved'
  );

  const pendingDumpTasks = dumpTasks.filter((t) => t.status !== 'completed');
  const totalDumpMinutes = pendingDumpTasks.reduce(
    (acc, t) => acc + (t.estimatedMinutes || 0),
    0
  );

  // Filtered by user selection
  const filteredTasks = dumpTasks.filter((t) => {
    if (filterDuration === 'quick') return t.estimatedMinutes <= 25;
    if (filterDuration === 'deep') return t.estimatedMinutes >= 45;
    return true;
  });

  const showToast = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3000);
  };

  const handlePlayAudio = (taskId: string, audioUrl: string) => {
    if (playingTaskId === taskId) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
      setPlayingTaskId(null);
      return;
    }

    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audioElementRef.current = audio;
    setPlayingTaskId(taskId);

    audio.onended = () => {
      setPlayingTaskId(null);
      audioElementRef.current = null;
    };

    audio.onerror = () => {
      setPlayingTaskId(null);
      audioElementRef.current = null;
    };

    audio.play();
  };

  const handleScheduleToday = (taskId: string) => {
    const today = getTodayDateStr();
    moveTaskToDate(taskId, today);
    showToast('Tarefa agendada para Hoje! Visível na Visão Diária e Semanal.');
  };

  const handleScheduleTomorrow = (taskId: string) => {
    const tomorrow = getRelativeDateStr(1);
    moveTaskToDate(taskId, tomorrow);
    showToast('Tarefa agendada para Amanhã no Kanban Semanal!');
  };

  const handleScheduleCustomDate = (taskId: string, targetDate: string) => {
    if (!targetDate) return;
    moveTaskToDate(taskId, targetDate);
    showToast(`Tarefa agendada para ${targetDate}!`);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 1. Header Banner */}
      <div className="bg-[#FFFFFF] p-5 sm:p-6 rounded-2xl border border-[#E8E2D8] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FCF3E8] text-[#8C581E] flex items-center justify-center">
              <Inbox className="w-5 h-5 text-[#9C6528]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-serif text-xl font-semibold text-[#242220]">
                  Página de Despejo
                </h2>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FAF4ED] text-[#8C581E] border border-[#ECDCC9]">
                  Caixa de Entrada
                </span>
              </div>
              <p className="text-xs text-[#7B746D] mt-0.5">
                Esvazie a mente das pendências que precisam ser colocadas em prática logo, por texto, áudio ou imagem.
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            {/* Quick Metrics */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] text-xs">
              <span className="font-semibold text-[#242220]">{pendingDumpTasks.length}</span>
              <span className="text-[#7B746D]">
                {pendingDumpTasks.length === 1 ? 'pendência ativa' : 'pendências ativas'}
              </span>
              <span className="text-[#D5CEC2]">•</span>
              <span className="font-mono font-medium text-[#242220]">{totalDumpMinutes}m</span>
              <span className="text-[#7B746D]">de duração esperada</span>
            </div>

            <button
              onClick={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#2D332F] text-[#FAF8F5] text-xs font-semibold hover:bg-[#1E2320] transition-colors cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Tarefa</span>
            </button>
          </div>
        </div>

        {/* Feedback notification toast */}
        {feedbackMessage && (
          <div className="mt-3.5 p-2.5 rounded-xl bg-[#EAF2EB] border border-[#C5DDCB] text-[#244E33] text-xs flex items-center space-x-2 animate-fadeIn">
            <Check className="w-4 h-4 text-[#2C5F3E] shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}
      </div>

      {/* 2. Two-Column Layout: Chat on the Left, Dumped Tasks on the Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Chat */}
        <div className="lg:col-span-6 xl:col-span-6 h-full">
          <DumpChat />
        </div>

        {/* Right Column: Tarefas Despejadas */}
        <div className="lg:col-span-6 xl:col-span-6 space-y-4">
          <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-4 min-h-[560px] flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0EBE2]">
                <div className="flex items-center space-x-2">
                  <ListTodo className="w-4 h-4 text-[#9C6528]" />
                  <h3 className="font-serif text-base font-semibold text-[#242220]">
                    Tarefas Despejadas ({dumpTasks.length})
                  </h3>
                </div>

                {/* Duration Filter Pills */}
                <div className="flex items-center space-x-1 bg-[#FAF8F5] p-0.5 rounded-lg border border-[#EAE4D9] text-[11px]">
                  <button
                    type="button"
                    onClick={() => setFilterDuration('all')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      filterDuration === 'all'
                        ? 'bg-[#FFFFFF] text-[#242220] shadow-2xs font-semibold'
                        : 'text-[#7B746D] hover:text-[#242220]'
                    }`}
                  >
                    Todas ({dumpTasks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterDuration('quick')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      filterDuration === 'quick'
                        ? 'bg-[#FFFFFF] text-[#242220] shadow-2xs font-semibold'
                        : 'text-[#7B746D] hover:text-[#242220]'
                    }`}
                  >
                    Rápidas (≤25m)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterDuration('deep')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      filterDuration === 'deep'
                        ? 'bg-[#FFFFFF] text-[#242220] shadow-2xs font-semibold'
                        : 'text-[#7B746D] hover:text-[#242220]'
                    }`}
                  >
                    Foco Profundo (≥45m)
                  </button>
                </div>
              </div>

              {/* Tasks List */}
              {filteredTasks.length === 0 ? (
                <div className="p-8 text-center space-y-3 my-8">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF5EC] flex items-center justify-center text-[#B87C38]">
                    <Inbox className="w-6 h-6 text-[#9C6528]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#242220]">
                      Nenhuma pendência solta no momento
                    </h4>
                    <p className="text-xs text-[#8C847B] max-w-sm mx-auto mt-1">
                      Digite ou fale uma pendência no Chat ao lado para colocá-la aqui sem sobrecarregar sua mente.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 pt-3 max-h-[600px] overflow-y-auto pr-1">
                  {filteredTasks.map((task) => {
                    const isDone = task.status === 'completed';
                    const milestone = getMilestoneById(task.milestoneId);
                    const era = milestone ? getEraByMilestoneId(milestone.id) : undefined;
                    const isPlaying = playingTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isDone
                            ? 'bg-[#FAF8F5]/60 border-[#E8E2D8] opacity-60'
                            : 'bg-[#FFFFFF] border-[#E8E2D8] hover:border-[#D4CCC0] hover:shadow-2xs'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          {/* Left: Task check and Title */}
                          <div className="flex items-start space-x-3 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => toggleTaskStatus(task.id)}
                              className="mt-0.5 text-[#8C847B] hover:text-[#385A48] transition-colors cursor-pointer shrink-0"
                              title={isDone ? 'Marcar como pendente' : 'Concluir pendência'}
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-[#385A48]" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </button>

                            <div className="space-y-1 min-w-0 flex-1">
                              <span
                                className={`text-xs sm:text-sm font-medium block leading-snug break-words ${
                                  isDone ? 'line-through text-[#8C847B]' : 'text-[#242220]'
                                }`}
                              >
                                {task.title}
                              </span>

                              {/* Badges */}
                              <div className="flex items-center flex-wrap gap-1.5 text-[10px]">
                                {era && (
                                  <span className="px-1.5 py-0.2 rounded bg-[#F2EDE4] text-[#59524A] font-medium flex items-center space-x-1">
                                    <Tag className="w-2.5 h-2.5 text-[#7B746D]" />
                                    <span className="truncate max-w-[130px]">{era.title}</span>
                                  </span>
                                )}

                                <span className="px-1.5 py-0.2 rounded bg-[#FAF8F5] border border-[#E8E2D8] text-[#7B746D] font-mono flex items-center space-x-1">
                                  <Clock className="w-2.5 h-2.5 text-[#7B746D]" />
                                  <span>{task.estimatedMinutes}m</span>
                                </span>

                                {task.isPillar && (
                                  <span className="px-1.5 py-0.2 rounded bg-[#FAF4ED] text-[#8C581E] border border-[#ECDCC9] font-medium">
                                    Não-negociável
                                  </span>
                                )}

                                {/* Attached Audio Pill */}
                                {task.audioUrl && (
                                  <button
                                    type="button"
                                    onClick={() => handlePlayAudio(task.id, task.audioUrl!)}
                                    className={`px-2 py-0.5 rounded-full flex items-center space-x-1 font-medium text-[10px] transition-all cursor-pointer ${
                                      isPlaying
                                        ? 'bg-[#385A48] text-white animate-pulse'
                                        : 'bg-[#F2ECE4] text-[#59524A] hover:bg-[#E5DDCF]'
                                    }`}
                                  >
                                    {isPlaying ? <Square className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                                    <span>{isPlaying ? 'Pausar' : 'Áudio'}</span>
                                  </button>
                                )}

                                {/* Attached Image Thumbnail Pill */}
                                {task.imageUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setLightboxImage(task.imageUrl!)}
                                    className="px-2 py-0.5 rounded-full bg-[#F2ECE4] text-[#59524A] hover:bg-[#E5DDCF] flex items-center space-x-1 font-medium text-[10px] cursor-pointer"
                                  >
                                    <ImageIcon className="w-2.5 h-2.5 text-[#385A48]" />
                                    <span>Ver Imagem</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Quick Schedule Action Buttons */}
                          <div className="flex items-center flex-wrap gap-1.5 shrink-0 justify-between sm:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-[#F0EBE2]">
                            <div className="flex items-center space-x-1.5">
                              {/* Agendar para Hoje */}
                              <button
                                type="button"
                                onClick={() => handleScheduleToday(task.id)}
                                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#EAF1EB] text-[#284835] hover:bg-[#DFEBE1] text-xs font-semibold transition-colors cursor-pointer border border-[#C6DEC9]"
                                title="Mover para a Visão Diária de Hoje"
                              >
                                <Sun className="w-3 h-3 text-[#385A48]" />
                                <span>Hoje</span>
                              </button>

                              {/* Agendar para Amanhã */}
                              <button
                                type="button"
                                onClick={() => handleScheduleTomorrow(task.id)}
                                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#FAF5EC] text-[#734A1B] hover:bg-[#F3EBDB] text-xs font-medium transition-colors cursor-pointer border border-[#E9DAC1]"
                                title="Agendar para o dia de amanhã"
                              >
                                <ArrowRight className="w-3 h-3 text-[#C87D32]" />
                                <span>Amanhã</span>
                              </button>

                              {/* Agendar data específica */}
                              <div className="relative inline-flex items-center">
                                <label
                                  htmlFor={`date-picker-${task.id}`}
                                  className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-[#FAF8F5] text-[#59524A] hover:bg-[#EFEAE1] text-xs font-medium transition-colors cursor-pointer border border-[#D9D1C5]"
                                  title="Escolher dia no calendário"
                                >
                                  <Calendar className="w-3 h-3 text-[#7A736A]" />
                                  <span>Data</span>
                                </label>
                                <input
                                  id={`date-picker-${task.id}`}
                                  type="date"
                                  onChange={(e) => handleScheduleCustomDate(task.id, e.target.value)}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                              </div>
                            </div>

                            {/* Edit & Delete actions */}
                            <div className="flex items-center space-x-0.5 ml-1 border-l border-[#EBE5DA] pl-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTask(task);
                                  setIsTaskModalOpen(true);
                                }}
                                className="p-1 rounded-lg text-[#8C847B] hover:text-[#242220] hover:bg-[#EFEAE1] transition-colors cursor-pointer"
                                title="Editar detalhes da tarefa"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteTask(task.id)}
                                className="p-1 rounded-lg text-[#8C847B] hover:text-[#B84035] hover:bg-[#F9ECEB] transition-colors cursor-pointer"
                                title="Excluir pendência"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Strategic clarity note */}
            <div className="pt-3 border-t border-[#F0EBE2] text-[11px] text-[#7A736A] flex items-center justify-between">
              <span>Tarefas nesta lista não possuem data e não geram ansiedade.</span>
              <span className="font-semibold text-[#385A48]">Clareza é poder.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for enlarged image viewing */}
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

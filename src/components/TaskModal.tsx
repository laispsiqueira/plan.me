import React, { useState, useEffect, useRef } from 'react';
import { usePlan } from '../context/PlanContext';
import { Task, PriorityCriterion, LifeArea, HabitFrequencyType } from '../types';
import { getTodayDateStr } from '../data/initialData';
import {
  X,
  Check,
  Sparkles,
  Clock,
  Target,
  Calendar,
  Mic,
  MicOff,
  Image as ImageIcon,
  Trash2,
  Play,
  Square,
  Volume2,
  RotateCw,
} from 'lucide-react';

export const TaskModal: React.FC = () => {
  const {
    isTaskModalOpen,
    setIsTaskModalOpen,
    editingTask,
    setEditingTask,
    preselectedMilestoneId,
    preselectedDueDate,
    saveTask,
    saveHabit,
    habits,
    milestones,
    eras,
    getEraById,
  } = usePlan();

  const [title, setTitle] = useState('');
  const [milestoneId, setMilestoneId] = useState('');
  const [dueDate, setDueDate] = useState(getTodayDateStr());
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [priorityType, setPriorityType] = useState<PriorityCriterion>('deadline');
  const [isPillar, setIsPillar] = useState(false);
  const [isHabit, setIsHabit] = useState(false);
  const [habitLifeArea, setHabitLifeArea] = useState<LifeArea>('Trabalho & Negócio');
  const [habitFrequencyType, setHabitFrequencyType] = useState<HabitFrequencyType>('weekdays');
  const [habitSelectedDays, setHabitSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [habitTargetCount, setHabitTargetCount] = useState<number>(3);
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setMilestoneId(editingTask.milestoneId);
      setDueDate(editingTask.dueDate ?? '');
      setEstimatedMinutes(editingTask.estimatedMinutes || 30);
      setPriorityType(editingTask.priorityType || 'deadline');
      setIsPillar(!!editingTask.isPillar);
      setIsHabit(!!editingTask.isHabit);
      if (editingTask.lifeArea) {
        setHabitLifeArea(editingTask.lifeArea);
      }
      const linkedH = habits.find((h) => h.taskId === editingTask.id || h.id === editingTask.habitId);
      if (linkedH) {
        setIsHabit(true);
        setHabitLifeArea(linkedH.lifeArea || 'Trabalho & Negócio');
        setHabitFrequencyType(linkedH.frequencyType || 'weekdays');
        if (linkedH.selectedDays) setHabitSelectedDays(linkedH.selectedDays);
        if (linkedH.targetCount) setHabitTargetCount(linkedH.targetCount);
      }
      setNotes(editingTask.notes || '');
      setImageUrl(editingTask.imageUrl);
      setAudioUrl(editingTask.audioUrl);
    } else {
      setTitle('');
      setMilestoneId(preselectedMilestoneId || (milestones[0]?.id ?? ''));
      setDueDate(preselectedDueDate !== null ? preselectedDueDate : getTodayDateStr());
      setEstimatedMinutes(30);
      setPriorityType('deadline');
      setIsPillar(false);
      setIsHabit(false);
      setHabitLifeArea('Trabalho & Negócio');
      setHabitFrequencyType('weekdays');
      setHabitSelectedDays([1, 2, 3, 4, 5]);
      setHabitTargetCount(3);
      setNotes('');
      setImageUrl(undefined);
      setAudioUrl(undefined);
    }
  }, [editingTask, isTaskModalOpen, preselectedMilestoneId, preselectedDueDate, milestones]);

  if (!isTaskModalOpen) return null;

  // Handle Speech Recognition & Voice recording
  const handleToggleVoiceRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    // Try Speech Recognition for instant transcription
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsRecording(true);
        };

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript) {
            setTitle((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.onerror = () => {
          setIsRecording(false);
        };

        recognition.start();
      } catch (err) {
        console.warn('SpeechRecognition failed, falling back to MediaRecorder', err);
      }
    }

    // Also record actual voice note via MediaRecorder
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setAudioUrl(reader.result);
          }
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.warn('Audio recording permission denied or unavailable', err);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Por favor, selecione uma imagem de até 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTogglePlayAudio = () => {
    if (!audioUrl) return;
    if (isPlayingAudio && audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;
      audio.onended = () => setIsPlayingAudio(false);
      audio.play();
      setIsPlayingAudio(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskId = editingTask?.id || `task-${Date.now()}`;

    saveTask({
      id: editingTask?.id,
      title: title.trim(),
      milestoneId: milestoneId || '',
      dueDate,
      estimatedMinutes: Number(estimatedMinutes) || 30,
      priorityType,
      isPillar,
      isHabit,
      lifeArea: isHabit ? habitLifeArea : undefined,
      notes: notes.trim() || undefined,
      imageUrl,
      audioUrl,
      status: editingTask?.status || 'todo',
    });

    if (isHabit) {
      const existingHabit = habits.find((h) => h.taskId === taskId || h.id === editingTask?.habitId);
      saveHabit({
        id: existingHabit?.id,
        title: title.trim(),
        lifeArea: habitLifeArea,
        frequencyType: habitFrequencyType,
        selectedDays: habitFrequencyType === 'weekdays' ? habitSelectedDays : undefined,
        targetCount: habitFrequencyType === 'times_per_week' || habitFrequencyType === 'times_per_month' ? habitTargetCount : undefined,
        isTask: true,
        taskId: taskId,
      });
    }

    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1C1A]/40 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div
        id="task-form-dialog"
        className="w-full max-w-lg bg-[#FFFFFF] rounded-2xl shadow-xl border border-[#E8E2D8] overflow-hidden flex flex-col my-8"
      >
        <div className="px-6 py-4.5 border-b border-[#F0EBE2] bg-[#FAF8F5] flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#242220]">
              {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
            </h3>
            <p className="text-xs text-[#7B746D]">
              Cada tarefa diária mantém um vínculo explícito com o Sonho e Galho correspondentes.
            </p>
          </div>
          <button
            onClick={() => {
              setIsTaskModalOpen(false);
              setEditingTask(null);
            }}
            className="p-2 rounded-lg text-[#8C857D] hover:text-[#242220] hover:bg-[#EFEAE1] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          {/* Title with Speech Button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-semibold uppercase tracking-wider text-[#69635C]">
                Título da Tarefa *
              </label>
              <button
                type="button"
                onClick={handleToggleVoiceRecording}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  isRecording
                    ? 'bg-[#BA392C] text-white animate-pulse'
                    : 'bg-[#F0ECE4] text-[#4A443D] hover:bg-[#E5DFD4]'
                }`}
                title="Ditar título por voz ou gravar áudio"
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-[#B85D3B]" />}
                <span>{isRecording ? 'Gravando voz...' : 'Ditar por Voz'}</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Mapear os 4 tópicos do capítulo..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-sm text-[#242220] placeholder-[#9E978F] focus:outline-none focus:border-[#385A48] focus:bg-[#FFFFFF] transition-all"
            />
          </div>

          {/* Voice Note Player if recorded */}
          {audioUrl && (
            <div className="p-3 rounded-xl bg-[#FAF6F0] border border-[#E8DFD3] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-[#B85D3B]" />
                <span className="font-semibold text-xs text-[#38332E]">Nota de voz anexada</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleTogglePlayAudio}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#385A48] text-white text-xs font-semibold cursor-pointer"
                >
                  {isPlayingAudio ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{isPlayingAudio ? 'Pausar' : 'Ouvir'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAudioUrl(undefined)}
                  className="p-1 text-[#8C847B] hover:text-[#B84035] cursor-pointer"
                  title="Remover áudio"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Image Attachment with Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-semibold uppercase tracking-wider text-[#69635C] flex items-center space-x-1">
                <ImageIcon className="w-3.5 h-3.5 text-[#385A48]" />
                <span>Anexo de Imagem (Documento, Foto ou Ideia)</span>
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] font-semibold text-[#385A48] hover:underline cursor-pointer"
              >
                {imageUrl ? 'Alterar foto' : '+ Escolher foto'}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              className="hidden"
            />

            {imageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-[#D9D1C5] bg-[#FAF8F5] max-h-48 group">
                <img src={imageUrl} alt="Anexo da tarefa" className="w-full h-40 object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl(undefined)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-[#1F1C1A]/80 text-white hover:bg-[#BA392C] transition-colors cursor-pointer"
                  title="Remover imagem"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-[#D9D1C5] rounded-xl p-3 text-center cursor-pointer hover:bg-[#FAF8F5] transition-colors"
              >
                <ImageIcon className="w-5 h-5 text-[#8C847B] mx-auto mb-1 opacity-70" />
                <span className="text-[11px] text-[#69635C]">
                  Clique para anexar foto de anotação, quadro ou referência visual
                </span>
              </div>
            )}
          </div>

          {/* Parent Milestone selector */}
          <div>
            <label className="block font-semibold uppercase tracking-wider text-[#69635C] mb-1.5">
              Vínculo com o Sonho e Galho da Trilha
            </label>
            <select
              value={milestoneId}
              onChange={(e) => setMilestoneId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-xs text-[#242220] focus:outline-none focus:border-[#385A48] focus:bg-[#FFFFFF] transition-all cursor-pointer"
            >
              <option value="">Sem vínculo com meta (Geral / Despejo)</option>
              {milestones.map((m) => {
                const era = getEraById(m.eraId);
                return (
                  <option key={m.id} value={m.id}>
                    {era ? `[${era.title}] ` : ''}{m.title}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Due date and Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-[#69635C] mb-1.5 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Data Final</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-xs text-[#242220] focus:outline-none focus:border-[#385A48] focus:bg-[#FFFFFF] transition-all cursor-pointer"
              />
              <div className="flex items-center justify-between mt-1 text-[10px]">
                {dueDate ? (
                  <button
                    type="button"
                    onClick={() => setDueDate('')}
                    className="text-[#9C6528] hover:text-[#7A4B1A] font-medium cursor-pointer"
                  >
                    Sem data (enviar para Despejo)
                  </button>
                ) : (
                  <span className="text-[#9C6528] font-medium">
                    Sem data (ficará no Despejo)
                  </span>
                )}
                {!dueDate && (
                  <button
                    type="button"
                    onClick={() => setDueDate(getTodayDateStr())}
                    className="text-[#385A48] hover:underline font-medium cursor-pointer"
                  >
                    Agendar Hoje
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-[#69635C] mb-1.5 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Duração Esperada (minutos)</span>
              </label>
              <select
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-xs text-[#242220] focus:outline-none focus:border-[#385A48] focus:bg-[#FFFFFF] transition-all cursor-pointer"
              >
                <option value={15}>15 minutos (tarefa rápida/leve)</option>
                <option value={25}>25 minutos (1 pomodoro)</option>
                <option value={45}>45 minutos (bloco médio)</option>
                <option value={60}>60 minutos (1 hora)</option>
                <option value={90}>90 minutos (foco profundo)</option>
              </select>
            </div>
          </div>

          {/* Non-negotiable checkbox & Priority Type */}
          <div className="p-3 rounded-xl border border-[#E9E3D8] bg-[#FAF8F5] space-y-3">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isPillar}
                onChange={(e) => setIsPillar(e.target.checked)}
                className="w-4 h-4 rounded text-[#385A48] border-[#B8B1A5] focus:ring-0 cursor-pointer"
              />
              <div>
                <span className="font-semibold text-xs text-[#262320]">
                  Definir como Pilar Não-Negociável do Dia
                </span>
                <p className="text-[11px] text-[#7A736B]">
                  Protegida contra dispersão e mantida em destaque mesmo em dias de energia média.
                </p>
              </div>
            </label>

            {/* Hábito Recorrente Checkbox */}
            <div className="pt-2 border-t border-[#EAE4DA] space-y-2.5">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHabit}
                  onChange={(e) => setIsHabit(e.target.checked)}
                  className="w-4 h-4 rounded text-[#385A48] border-[#B8B1A5] focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="font-semibold text-xs text-[#262320] flex items-center space-x-1">
                    <RotateCw className="w-3.5 h-3.5 text-[#385A48]" />
                    <span>Esta tarefa é um hábito recorrente</span>
                  </span>
                  <p className="text-[11px] text-[#7A736B]">
                    Permite dar o check tanto pela lista diária quanto pelo Rastreador de Hábitos com sincronização automática.
                  </p>
                </div>
              </label>

              {isHabit && (
                <div className="p-2.5 rounded-lg bg-white border border-[#DDD6C8] space-y-2 mt-2">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#69635C] mb-1">
                      Área da Vida do Hábito
                    </label>
                    <select
                      value={habitLifeArea}
                      onChange={(e) => setHabitLifeArea(e.target.value as LifeArea)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#D9D1C5] bg-[#FAF8F5] text-xs text-[#242220] cursor-pointer"
                    >
                      <option value="Trabalho & Negócio">Trabalho & Negócio</option>
                      <option value="Saúde & Vitalidade">Saúde & Vitalidade</option>
                      <option value="Mente & Conhecimento">Mente & Conhecimento</option>
                      <option value="Sonhos Pessoais">Sonhos Pessoais</option>
                      <option value="Finanças & Futuro">Finanças & Futuro</option>
                      <option value="Relacionamentos & Família">Relacionamentos & Família</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#69635C] mb-1">
                      Frequência
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                      {[
                        { id: 'weekdays', label: 'Dias da Semana' },
                        { id: 'times_per_week', label: 'X vezes/sem' },
                        { id: 'times_per_month', label: 'X vezes/mês' },
                      ].map((freq) => (
                        <button
                          key={freq.id}
                          type="button"
                          onClick={() => setHabitFrequencyType(freq.id as HabitFrequencyType)}
                          className={`py-1 px-1 rounded-md text-center font-medium cursor-pointer border ${
                            habitFrequencyType === freq.id
                              ? 'bg-[#385A48] text-white border-[#385A48] font-bold'
                              : 'bg-[#FAF8F5] border-[#D9D1C5] text-[#59534C]'
                          }`}
                        >
                          {freq.label}
                        </button>
                      ))}
                    </div>

                    {habitFrequencyType === 'weekdays' && (
                      <div className="flex gap-1 mt-1.5">
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dName, idx) => {
                          const isSel = habitSelectedDays.includes(idx);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() =>
                                setHabitSelectedDays((prev) =>
                                  prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
                                )
                              }
                              className={`flex-1 py-1 rounded text-[10px] font-bold cursor-pointer border ${
                                isSel
                                  ? 'bg-[#385A48] text-white border-[#385A48]'
                                  : 'bg-white text-[#69635C] border-[#D9D1C5]'
                              }`}
                            >
                              {dName}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {habitFrequencyType === 'times_per_week' && (
                      <div className="flex items-center space-x-1 mt-1.5">
                        {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setHabitTargetCount(num)}
                            className={`flex-1 py-1 rounded text-[10px] font-bold cursor-pointer border ${
                              habitTargetCount === num
                                ? 'bg-[#385A48] text-white border-[#385A48]'
                                : 'bg-white text-[#69635C] border-[#D9D1C5]'
                            }`}
                          >
                            {num}x
                          </button>
                        ))}
                      </div>
                    )}

                    {habitFrequencyType === 'times_per_month' && (
                      <div className="flex items-center space-x-1 mt-1.5">
                        {[4, 8, 10, 12, 15, 20].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setHabitTargetCount(num)}
                            className={`flex-1 py-1 rounded text-[10px] font-bold cursor-pointer border ${
                              habitTargetCount === num
                                ? 'bg-[#385A48] text-white border-[#385A48]'
                                : 'bg-white text-[#69635C] border-[#D9D1C5]'
                            }`}
                          >
                            {num}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#EAE4DA]">
              <span className="block font-medium text-[11px] text-[#69635C] mb-1.5">
                Critério de Priorização Inteligente
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPriorityType('deadline')}
                  className={`px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all text-left cursor-pointer ${
                    priorityType === 'deadline'
                      ? 'border-[#385A48] bg-[#F2F7F3] text-[#2D4D3A]'
                      : 'border-[#E2DCCE] bg-[#FFFFFF] text-[#635D55]'
                  }`}
                >
                  Prazo da Meta-mãe
                </button>
                <button
                  type="button"
                  onClick={() => setPriorityType('creation_date')}
                  className={`px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all text-left cursor-pointer ${
                    priorityType === 'creation_date'
                      ? 'border-[#385A48] bg-[#F2F7F3] text-[#2D4D3A]'
                      : 'border-[#E2DCCE] bg-[#FFFFFF] text-[#635D55]'
                  }`}
                >
                  Destravar Antigas
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold uppercase tracking-wider text-[#69635C] mb-1.5">
              Observações & Lembrete Acolhedor
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Fazer com calma, sem perfeccionismo desnecessário..."
              className="w-full px-3.5 py-2 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-xs text-[#242220] placeholder-[#9E978F] focus:outline-none focus:border-[#385A48] focus:bg-[#FFFFFF] transition-all resize-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setIsTaskModalOpen(false);
                setEditingTask(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#6B655F] hover:bg-[#EBE5DA] transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="save-task-submit-btn"
              className="px-5 py-2 rounded-xl bg-[#2D332F] text-[#FAF8F5] text-xs font-semibold hover:bg-[#1A1E1C] transition-all cursor-pointer shadow-xs"
            >
              {editingTask ? 'Salvar Alterações' : 'Salvar Tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { usePlan } from '../context/PlanContext';
import { TimeBlock } from '../types';
import { getTodayDateStr } from '../data/initialData';
import { X, Clock, ShieldCheck, Coffee, Calendar } from 'lucide-react';

export const TimeBlockModal: React.FC = () => {
  const {
    isTimeBlockModalOpen,
    setIsTimeBlockModalOpen,
    editingTimeBlock,
    setEditingTimeBlock,
    preselectedStartTime,
    preselectedEndTime,
    saveTimeBlock,
    tasks,
  } = usePlan();

  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [type, setType] = useState<TimeBlock['type']>('focus');
  const [taskId, setTaskId] = useState<string>('');
  const [date, setDate] = useState(getTodayDateStr());

  useEffect(() => {
    if (editingTimeBlock) {
      setTitle(editingTimeBlock.title);
      setStartTime(editingTimeBlock.startTime);
      setEndTime(editingTimeBlock.endTime);
      setType(editingTimeBlock.type);
      setTaskId(editingTimeBlock.taskId || '');
      setDate(editingTimeBlock.date);
    } else {
      setTitle('');
      setStartTime(preselectedStartTime || '09:00');
      setEndTime(preselectedEndTime || '10:00');
      setType('focus');
      setTaskId('');
      setDate(getTodayDateStr());
    }
  }, [editingTimeBlock, isTimeBlockModalOpen, preselectedStartTime, preselectedEndTime]);

  if (!isTimeBlockModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime || !endTime) return;

    saveTimeBlock({
      id: editingTimeBlock?.id,
      date,
      startTime,
      endTime,
      title: title.trim(),
      type,
      taskId: taskId || undefined,
    });

    setIsTimeBlockModalOpen(false);
    setEditingTimeBlock(null);
  };

  const handleTaskSelect = (selectedId: string) => {
    setTaskId(selectedId);
    if (selectedId) {
      const t = tasks.find((item) => item.id === selectedId);
      if (t && !title) {
        setTitle(`Foco: ${t.title}`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1C1A]/40 backdrop-blur-xs animate-fadeIn">
      <div
        id="timeblock-form-dialog"
        className="w-full max-w-md bg-[#FFFFFF] rounded-2xl shadow-xl border border-[#E8E2D8] overflow-hidden flex flex-col"
      >
        <div className="px-6 py-4.5 border-b border-[#F0EBE2] bg-[#FAF8F5] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EFE9DE] text-[#4A443E] flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#385A48]" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#242220]">
                {editingTimeBlock ? 'Editar Bloco de Tempo' : 'Novo Bloco de Tempo'}
              </h3>
              <p className="text-xs text-[#7B746D]">
                Blocos de foco protegido e compromissos fixos.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsTimeBlockModalOpen(false);
              setEditingTimeBlock(null);
            }}
            className="p-2 rounded-lg text-[#8C857D] hover:text-[#242220] hover:bg-[#EFEAE1] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-[#69635C] mb-1.5">
              Título do Bloco *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Bloco de Foco: Escrita do Capítulo..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-sm text-[#242220] placeholder-[#9E978F] focus:outline-none focus:border-[#385A48] focus:bg-[#FFFFFF] transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-[#69635C] mb-1.5">
                Horário Inicial
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-xs text-[#242220] focus:outline-none focus:border-[#385A48] focus:bg-[#FFFFFF] transition-all cursor-pointer"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase tracking-wider text-[#69635C] mb-1.5">
                Horário Final
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-xs text-[#242220] focus:outline-none focus:border-[#385A48] focus:bg-[#FFFFFF] transition-all cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-[#69635C] mb-1.5">
              Tipo de Bloco
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'focus', label: 'Foco', desc: 'Protegido' },
                { id: 'routine', label: 'Rotina', desc: 'Hábitos' },
                { id: 'commitment', label: 'Agenda', desc: 'Reuniões' },
                { id: 'rest', label: 'Pausa', desc: 'Descanso' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setType(item.id as TimeBlock['type'])}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    type === item.id
                      ? 'border-[#385A48] bg-[#F2F7F3] text-[#2D4D3A] font-semibold'
                      : 'border-[#E2DCCE] bg-[#FFFFFF] text-[#635D55]'
                  }`}
                >
                  <div className="font-medium text-xs">{item.label}</div>
                  <div className="text-[10px] text-[#857E76]">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-[#69635C] mb-1.5">
              Vincular a uma Pedra do Caminho (Opcional)
            </label>
            <select
              value={taskId}
              onChange={(e) => handleTaskSelect(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-xs text-[#242220] focus:outline-none focus:border-[#385A48] focus:bg-[#FFFFFF] transition-all cursor-pointer"
            >
              <option value="">Sem tarefa vinculada (bloco livre/rotina)</option>
              {tasks
                .filter((t) => t.status !== 'completed' && t.status !== 'respite_moved')
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.estimatedMinutes} min)
                  </option>
                ))}
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setIsTimeBlockModalOpen(false);
                setEditingTimeBlock(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#6B655F] hover:bg-[#EBE5DA] transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#2D332F] text-[#FAF8F5] text-xs font-semibold hover:bg-[#1A1E1C] transition-all cursor-pointer shadow-xs"
            >
              {editingTimeBlock ? 'Salvar Alterações' : 'Criar Bloco'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

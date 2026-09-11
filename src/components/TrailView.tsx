import React, { useState } from 'react';
import { usePlan } from '../context/PlanContext';
import { Era, Milestone, Task } from '../types';
import { MilestoneModal } from './MilestoneModal';
import {
  Compass,
  GitBranch,
  Sparkles,
  Plus,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Wind,
  Check,
  Award,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';

export const TrailView: React.FC = () => {
  const {
    eras,
    milestones,
    tasks,
    getMilestoneProgress,
    getEraProgress,
    setIsEraModalOpen,
    setEditingEra,
    setIsTaskModalOpen,
    setEditingTask,
    setPreselectedMilestoneId,
    deleteEra,
    deleteMilestone,
    saveMilestone,
    toggleTaskStatus,
    moveToRespite,
  } = usePlan();

  const [selectedEraId, setSelectedEraId] = useState<string>(eras[0]?.id || '');
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

  const selectedEra = eras.find((e) => e.id === selectedEraId) || eras[0];
  const eraMilestones = selectedEra
    ? milestones.filter((m) => m.eraId === selectedEra.id)
    : [];

  const handleOpenNewMilestone = (eraId: string) => {
    setSelectedEraId(eraId);
    setEditingMilestone(null);
    setIsMilestoneModalOpen(true);
  };

  const handleEditMilestone = (m: Milestone) => {
    setEditingMilestone(m);
    setIsMilestoneModalOpen(true);
  };

  const handleAddTaskToMilestone = (milestoneId: string) => {
    setEditingTask(null);
    setPreselectedMilestoneId(milestoneId);
    setIsTaskModalOpen(true);
  };

  const handleQuickImageUpload = (milestone: Milestone, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Por favor, selecione uma imagem de até 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          saveMilestone({
            ...milestone,
            imageUrl: reader.result,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* 1. Header Banner */}
      <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E8E2D8] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Compass className="w-5 h-5 text-[#B85D3B]" />
              <h2 className="font-serif text-xl font-semibold text-[#242220]">
                Trilha dos Sonhos
              </h2>
            </div>
            <p className="text-xs text-[#7B746D] max-w-2xl leading-relaxed">
              Descompressão lógica do macro para o micro: da <strong>Estrada Principal</strong> (Grandes Sonhos de Vida),
              passando pelos <strong>Galhos</strong> (Etapas intermediárias), até as <strong>Pedras do Caminho</strong> (Tarefas diárias).
            </p>
          </div>

          <button
            onClick={() => {
              setEditingEra(null);
              setIsEraModalOpen(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#2D332F] text-[#FAF8F5] text-xs font-semibold hover:bg-[#1A1E1C] transition-all cursor-pointer shadow-xs self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Sonho</span>
          </button>
        </div>
      </div>

      {/* 2. Sinuous Trail Roadmap (Visual Map of Eras) */}
      <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#EBE4D8] overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif text-base font-semibold text-[#2E2822]">
              Estrada Principal: Grandes Sonhos Ativos
            </h3>
            <p className="text-xs text-[#7A736A]">
              Selecione um sonho na trilha para navegar pelos galhos e tarefas conectadas.
            </p>
          </div>
        </div>

        {/* Interactive Sinuous Node Stepper */}
        {eras.length === 0 ? (
          <div className="text-center py-10 px-4 border border-dashed border-[#D9D1C5] rounded-2xl bg-[#FFFFFF]/60">
            <Compass className="w-10 h-10 text-[#8C847B] mx-auto mb-3 opacity-60" />
            <h3 className="font-serif font-semibold text-base text-[#242220]">Nenhum Sonho Cadastrado Ainda</h3>
            <p className="text-xs text-[#7B746D] max-w-sm mx-auto mt-1 mb-4">
              Defina o primeiro grande sonho que você deseja realizar para estruturar suas metas e trilha.
            </p>
            <button
              onClick={() => {
                setEditingEra(null);
                setIsEraModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#385A48] text-[#FAF8F5] text-xs font-semibold hover:bg-[#2A4536] transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Primeiro Sonho</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {eras.map((era, index) => {
            const isSelected = era.id === selectedEra?.id;
            const progress = getEraProgress(era.id);
            const eraMileCount = milestones.filter((m) => m.eraId === era.id).length;

            return (
              <div
                key={era.id}
                onClick={() => setSelectedEraId(era.id)}
                className={`relative p-5 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#2D332F] bg-[#FFFFFF] shadow-md ring-1 ring-[#2D332F]'
                    : 'border-[#E5DDD0] bg-[#FFFFFF]/80 hover:bg-[#FFFFFF] hover:border-[#D6CCC0]'
                }`}
              >
                {/* Step badge top */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span
                      className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider"
                      style={{ backgroundColor: era.accentBg, color: era.color }}
                    >
                      {era.category}
                    </span>
                    <span className="text-xs font-mono font-semibold text-[#575047]">
                      {progress}%
                    </span>
                  </div>

                  <h4 className="font-serif font-semibold text-sm sm:text-base text-[#242220] line-clamp-2">
                    {era.title}
                  </h4>

                  <p className="text-xs text-[#706961] mt-1.5 line-clamp-2 leading-relaxed">
                    {era.description}
                  </p>
                </div>

                {/* Bottom meta & progress bar */}
                <div className="mt-4 pt-3 border-t border-[#F0EBE2]">
                  <div className="w-full bg-[#EFEAE1] h-1.5 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: era.color,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#8C847B]">
                    <span>{eraMileCount} {eraMileCount === 1 ? 'galho ativo' : 'galhos ativos'}</span>
                    <span className="font-medium text-[#2E2822]">
                      {isSelected ? 'Em exploração ›' : 'Ver caminho ›'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* 3. Detailed Tree View of Selected Era: Branches (Milestones) & Action Stones (Tasks) */}
      {selectedEra && (
        <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-6">
          {/* Era Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#F0EBE2] gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedEra.color }}
                />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#7A736A]">
                  Sonho Selecionado: {selectedEra.category}
                </span>
              </div>
              <h3 className="font-serif text-xl font-semibold text-[#242220]">
                {selectedEra.title}
              </h3>
              <p className="text-xs text-[#6B655E] max-w-2xl leading-relaxed">
                {selectedEra.description}
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => handleOpenNewMilestone(selectedEra.id)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#DDD5C7] bg-[#FAF8F5] text-[#3E3832] text-xs font-medium hover:bg-[#F2ECE1] transition-all cursor-pointer"
              >
                <GitBranch className="w-3.5 h-3.5 text-[#385A48]" />
                <span>Novo Galho</span>
              </button>

              <button
                onClick={() => {
                  setEditingEra(selectedEra);
                  setIsEraModalOpen(true);
                }}
                className="p-1.5 rounded-lg text-[#8A837A] hover:text-[#242220] hover:bg-[#EFEAE1] transition-all cursor-pointer"
                title="Editar Sonho"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => deleteEra(selectedEra.id)}
                className="p-1.5 rounded-lg text-[#8A837A] hover:text-[#B84035] hover:bg-[#F9ECEB] transition-all cursor-pointer"
                title="Excluir Sonho"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Milestones (Galhos da Trilha) */}
          <div className="space-y-6">
            {eraMilestones.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-[#E5DFD4] rounded-2xl">
                <GitBranch className="w-8 h-8 text-[#A8A196] mx-auto mb-2" />
                <p className="text-sm font-medium text-[#2E2822]">
                  Nenhum galho (meta menor) cadastrado neste Sonho.
                </p>
                <p className="text-xs text-[#7A736A] mt-1 max-w-sm mx-auto leading-relaxed">
                  Decomponha este grande sonho em 2 ou 3 etapas intermediárias para torná-lo palpável.
                </p>
                <button
                  onClick={() => handleOpenNewMilestone(selectedEra.id)}
                  className="mt-3 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#2D332F] text-[#FAF8F5] text-xs font-medium hover:bg-[#1C201E] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Primeiro Galho</span>
                </button>
              </div>
            ) : (
              eraMilestones.map((milestone) => {
                const milestoneTasks = tasks.filter(
                  (t) => t.milestoneId === milestone.id && t.status !== 'respite_moved'
                );
                const progress = getMilestoneProgress(milestone.id);
                const completedCount = milestoneTasks.filter((t) => t.status === 'completed').length;

                return (
                  <div
                    key={milestone.id}
                    className="p-5 rounded-2xl border border-[#E9E3D8] bg-[#FAF8F5] space-y-4"
                  >
                    {/* Branch title & Progress */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#EDE6DC] gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EAE3D5] text-[#554E45]">
                            Galho da Trilha
                          </span>
                          <span className="text-xs text-[#7A736A] flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>Meta para: {milestone.targetDate}</span>
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm sm:text-base text-[#242220]">
                          {milestone.title}
                        </h4>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-xs font-semibold text-[#2E2822]">
                            {completedCount}/{milestoneTasks.length} concluídas ({progress}%)
                          </div>
                          <div className="w-28 bg-[#E5DFD4] h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-[#385A48] rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => handleAddTaskToMilestone(milestone.id)}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#2D332F] text-[#FAF8F5] text-xs font-medium hover:bg-[#1A1E1C] transition-all cursor-pointer shadow-xs"
                          title="Adicionar tarefa a este galho"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Nova Pedra</span>
                        </button>

                        <button
                          onClick={() => handleEditMilestone(milestone)}
                          className="p-1 rounded text-[#8A837A] hover:text-[#242220] hover:bg-[#EAE4D9] cursor-pointer"
                          title="Editar galho"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => deleteMilestone(milestone.id)}
                          className="p-1 rounded text-[#8A837A] hover:text-[#B84035] hover:bg-[#F9ECEB] cursor-pointer"
                          title="Excluir galho"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Moodboard Visual da Meta */}
                    {milestone.imageUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-[#DDD5C7] bg-[#F4EFE7] group">
                        <img
                          src={milestone.imageUrl}
                          alt={`Moodboard: ${milestone.title}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-36 sm:h-44 object-cover object-center transition-transform duration-500 group-hover:scale-101"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1F1C1A]/80 via-[#1F1C1A]/25 to-transparent flex flex-col justify-end p-3.5 text-white">
                          <div className="flex items-end justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-white/20 backdrop-blur-xs text-white">
                                Moodboard da Meta
                              </span>
                              {milestone.notes && (
                                <p className="text-xs text-white/95 mt-1 line-clamp-2 italic font-serif">
                                  "{milestone.notes}"
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-1.5 shrink-0">
                              <label
                                title="Substituir foto do moodboard"
                                className="px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white text-[#242220] text-[11px] font-medium transition-all cursor-pointer shadow-xs flex items-center space-x-1"
                              >
                                <Upload className="w-3 h-3 text-[#385A48]" />
                                <span>Trocar</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleQuickImageUpload(milestone, e)}
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-dashed border-[#DDD5C7] bg-[#FAF8F5]/80 hover:bg-[#F2ECE1] transition-all gap-2">
                        <div className="flex items-center space-x-2 text-xs text-[#7A736A]">
                          <ImageIcon className="w-4 h-4 text-[#9C9488] shrink-0" />
                          <span>Moodboard visual não cadastrado para esta meta.</span>
                        </div>
                        <label className="px-3 py-1.5 rounded-lg border border-[#DDD5C7] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-xs font-medium text-[#38332D] cursor-pointer transition-all flex items-center space-x-1.5 shadow-2xs self-start sm:self-auto">
                          <Upload className="w-3.5 h-3.5 text-[#B85D3B]" />
                          <span>Fazer Upload do Moodboard</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleQuickImageUpload(milestone, e)}
                          />
                        </label>
                      </div>
                    )}

                    {/* Action Stones (Tasks) in this Branch */}
                    <div className="space-y-2 pt-1">
                      {milestoneTasks.length === 0 ? (
                        <p className="text-xs text-[#8A837A] italic py-2">
                          Nenhuma tarefa acionável cadastrada neste galho. Clique em "+ Nova Pedra" para definir o próximo passo.
                        </p>
                      ) : (
                        milestoneTasks.map((task) => {
                          const isDone = task.status === 'completed';

                          return (
                            <div
                              key={task.id}
                              className={`p-3 rounded-xl border transition-all flex items-center justify-between text-xs ${
                                isDone
                                  ? 'border-[#EAE5DC] bg-[#FFFFFF]/60 opacity-70'
                                  : 'border-[#E6DFD4] bg-[#FFFFFF] hover:border-[#D5CCC0]'
                              }`}
                            >
                              <div className="flex items-center space-x-3 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => toggleTaskStatus(task.id)}
                                  className="text-[#385A48] hover:text-[#253D30] cursor-pointer shrink-0"
                                >
                                  {isDone ? (
                                    <CheckCircle2 className="w-4 h-4 text-[#385A48]" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-[#B3ABA0]" />
                                  )}
                                </button>
                                <span
                                  className={`truncate ${
                                    isDone ? 'line-through text-[#8A837A]' : 'text-[#242220] font-medium'
                                  }`}
                                >
                                  {task.title}
                                </span>
                              </div>

                              <div className="flex items-center space-x-2 shrink-0 ml-3">
                                <span className="text-[11px] text-[#8C847B] font-mono bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#EDE7DD]">
                                  {task.estimatedMinutes}m
                                </span>
                                <button
                                  type="button"
                                  onClick={() => moveToRespite(task.id, 'Movida a partir da Trilha')}
                                  className="p-1 rounded text-[#968E84] hover:text-[#887447] hover:bg-[#F6F1E4] cursor-pointer"
                                  title="Mover para Caixa de Descanso"
                                >
                                  <Wind className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Milestone Modal */}
      <MilestoneModal
        isOpen={isMilestoneModalOpen}
        onClose={() => {
          setIsMilestoneModalOpen(false);
          setEditingMilestone(null);
        }}
        targetEraId={selectedEra?.id}
        editingMilestone={editingMilestone}
      />
    </div>
  );
};

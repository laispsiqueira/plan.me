import React, { useState, useEffect } from 'react';
import { usePlan } from '../context/PlanContext';
import { EnergyLevel } from '../types';
import { Sparkles, Sun, Coffee, ShieldAlert, Check, X, Compass, Feather } from 'lucide-react';

export const MorningCheckinModal: React.FC = () => {
  const {
    isCheckinOpen,
    setIsCheckinOpen,
    dailyCheckin,
    setEnergyLevel,
    tasks,
    getMilestoneById,
    getEraByMilestoneId,
  } = usePlan();

  const [selectedLevel, setSelectedLevel] = useState<EnergyLevel>(dailyCheckin.energyLevel);
  const [intentionText, setIntentionText] = useState<string>(dailyCheckin.intention || '');
  const [selectedPillarIds, setSelectedPillarIds] = useState<string[]>(dailyCheckin.selectedPillars || []);

  useEffect(() => {
    if (isCheckinOpen) {
      setSelectedLevel(dailyCheckin.energyLevel);
      setIntentionText(dailyCheckin.intention || '');
      setSelectedPillarIds(dailyCheckin.selectedPillars || []);
    }
  }, [isCheckinOpen, dailyCheckin]);

  if (!isCheckinOpen) return null;

  const eligibleTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'respite_moved');

  const handleTogglePillar = (taskId: string) => {
    if (selectedPillarIds.includes(taskId)) {
      setSelectedPillarIds(selectedPillarIds.filter((id) => id !== taskId));
    } else {
      if (selectedPillarIds.length < 3) {
        setSelectedPillarIds([...selectedPillarIds, taskId]);
      }
    }
  };

  const handleConfirm = () => {
    setEnergyLevel(selectedLevel, intentionText, selectedPillarIds);
    setIsCheckinOpen(false);
  };

  const energyOptions: {
    id: EnergyLevel;
    title: string;
    subtitle: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accentBorder: string;
    accentBg: string;
    pillBg: string;
  }[] = [
    {
      id: 'high',
      title: 'Energia Alta',
      subtitle: 'Foco pleno e tração',
      description: 'Prioriza prazos das metas-mãe mais próximas e tarefas estagnadas para maximizar impacto.',
      icon: Sun,
      accentBorder: 'border-[#385A48]',
      accentBg: 'bg-[#F2F7F3]',
      pillBg: 'text-[#284835] bg-[#E1EDE4]',
    },
    {
      id: 'medium',
      title: 'Energia Equilibrada',
      subtitle: 'Ritmo sereno e focado',
      description: 'Filtra o volume sugerindo apenas até 3 tarefas não-negociáveis, eliminando dispersão.',
      icon: Coffee,
      accentBorder: 'border-[#C2813E]',
      accentBg: 'bg-[#FCF7F0]',
      pillBg: 'text-[#69431A] bg-[#F7ECD8]',
    },
    {
      id: 'low_respite',
      title: 'Focada em Resguardo',
      subtitle: 'Autocuidado e leveza',
      description: 'Oculta urgências estressantes e foca apenas em manutenção essencial. Ativa o Botão de Respiro.',
      icon: Feather,
      accentBorder: 'border-[#7E6A93]',
      accentBg: 'bg-[#F7F4F9]',
      pillBg: 'text-[#4F3C64] bg-[#ECE5F2]',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1C1A]/40 backdrop-blur-xs animate-fadeIn">
      <div
        id="morning-checkin-dialog"
        className="relative w-full max-w-2xl bg-[#FFFFFF] rounded-2xl shadow-xl border border-[#E8E2D8] overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#F0EBE2] bg-[#FAF8F5] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBE5DA] text-[#4A443D] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#B85D3B]" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#242220]">
                Check-in Matinal de Energia
              </h2>
              <p className="text-xs text-[#7B746D]">
                Como está o seu ritmo biológico e operacional para o dia de hoje?
              </p>
            </div>
          </div>
          <button
            id="close-checkin-modal"
            onClick={() => setIsCheckinOpen(false)}
            className="p-2 rounded-lg text-[#8C857D] hover:text-[#242220] hover:bg-[#EFEAE1] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Energy Cards */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7B746D] mb-3">
              1. Selecione o Nível de Energia
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {energyOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedLevel === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedLevel(opt.id)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? `${opt.accentBorder} ${opt.accentBg} shadow-xs ring-1 ring-offset-0`
                        : 'border-[#E8E2D8] hover:border-[#D6CEC2] bg-[#FFFFFF]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-[#242220]' : 'text-[#8A837A]'}`} />
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-[#242220] text-[#FAF8F5] flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <h4 className="font-semibold text-sm text-[#242220]">{opt.title}</h4>
                      <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded mt-1 mb-2 ${opt.pillBg}`}>
                        {opt.subtitle}
                      </span>
                    </div>
                    <p className="text-xs text-[#6F6961] leading-relaxed mt-1">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Intention statement */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#7B746D] mb-2">
              2. Intenção do Dia (Direção com Propósito)
            </label>
            <input
              type="text"
              value={intentionText}
              onChange={(e) => setIntentionText(e.target.value)}
              placeholder="Ex: Concluir a proposta com clareza e proteger o descanso da noite..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-sm text-[#242220] placeholder-[#9E978F] focus:outline-none focus:border-[#385A48] focus:bg-[#FFFFFF] transition-all"
            />
          </div>

          {/* 3 Pillars Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7B746D]">
                3. Até 3 Não-Negociáveis do Dia ({selectedPillarIds.length}/3)
              </label>
              <span className="text-xs text-[#8A837A]">
                {selectedLevel === 'medium'
                  ? 'Foco central da energia equilibrada'
                  : 'Prioridades protegidas'}
              </span>
            </div>

            {eligibleTasks.length === 0 ? (
              <p className="text-xs text-[#8A837A] italic py-2">
                Nenhuma tarefa ativa cadastrada para selecionar como pilar.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {eligibleTasks.map((t) => {
                  const isChecked = selectedPillarIds.includes(t.id);
                  const milestone = getMilestoneById(t.milestoneId);
                  const era = getEraByMilestoneId(t.milestoneId);

                  return (
                    <div
                      key={t.id}
                      onClick={() => handleTogglePillar(t.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                        isChecked
                          ? 'border-[#385A48] bg-[#F2F7F3]'
                          : 'border-[#EBE5DA] hover:border-[#DDD6CB] bg-[#FAF8F5]'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                            isChecked
                              ? 'bg-[#385A48] border-[#385A48] text-[#FFFFFF]'
                              : 'border-[#B3ABA0] bg-[#FFFFFF]'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <span className="font-medium text-[#242220]">{t.title}</span>
                          {era && milestone && (
                            <div className="flex items-center space-x-1.5 mt-0.5 text-[11px] text-[#78716A]">
                              <span
                                className="w-2 h-2 rounded-full inline-block"
                                style={{ backgroundColor: era.color }}
                              />
                              <span>{era.title}</span>
                              <span>›</span>
                              <span>{milestone.title}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <span className="text-[11px] text-[#8C847B] font-medium whitespace-nowrap ml-2">
                        {t.estimatedMinutes} min
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#F0EBE2] bg-[#FAF8F5] flex items-center justify-between">
          <div className="text-xs text-[#7B746D]">
            {selectedLevel === 'low_respite' && (
              <span className="text-[#8E44AD] font-medium">
                Sua saúde em primeiro lugar. O ritmo se adapta a você.
              </span>
            )}
            {selectedLevel === 'medium' && (
              <span>Foco nas 3 metas reduz ruído mental e estresse.</span>
            )}
            {selectedLevel === 'high' && (
              <span>Dia favorável para avançar em metas estratégicas.</span>
            )}
          </div>

          <button
            id="confirm-morning-checkin"
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl bg-[#2D332F] text-[#FAF8F5] text-xs font-semibold hover:bg-[#1A1E1C] transition-all cursor-pointer shadow-xs"
          >
            Confirmar e Organizar Dia
          </button>
        </div>
      </div>
    </div>
  );
};

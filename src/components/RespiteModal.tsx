import React, { useState } from 'react';
import { usePlan } from '../context/PlanContext';
import { Wind, Feather, ArrowRight, X, Calendar, RefreshCw, Sparkles, Check, HeartHandshake } from 'lucide-react';
import { getTodayDateStr, getRelativeDateStr } from '../data/initialData';

export const RespiteModal: React.FC = () => {
  const {
    isRespiteBoxOpen,
    setIsRespiteBoxOpen,
    isRespiteTriggerModalOpen,
    setIsRespiteTriggerModalOpen,
    respiteTasks,
    restoreFromRespite,
    deleteTask,
    tasks,
    moveMultipleToRespite,
    getMilestoneById,
    getEraByMilestoneId,
  } = usePlan();

  // Selected tasks for respite batch move
  const [selectedToMove, setSelectedToMove] = useState<string[]>([]);
  const [respiteNote, setRespiteNote] = useState<string>('Pausa intencional sem culpa.');

  // Active tasks eligible for respite (not completed, not in respite)
  const nonPillarTasks = tasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'respite_moved' && !t.isPillar
  );

  const toggleSelectToMove = (id: string) => {
    if (selectedToMove.includes(id)) {
      setSelectedToMove(selectedToMove.filter((item) => item !== id));
    } else {
      setSelectedToMove([...selectedToMove, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedToMove.length === nonPillarTasks.length) {
      setSelectedToMove([]);
    } else {
      setSelectedToMove(nonPillarTasks.map((t) => t.id));
    }
  };

  const handleConfirmMoveToRespite = () => {
    if (selectedToMove.length > 0) {
      moveMultipleToRespite(selectedToMove, respiteNote);
    }
    setSelectedToMove([]);
    setIsRespiteTriggerModalOpen(false);
  };

  return (
    <>
      {/* 1. Respite Trigger / Action Flow Modal */}
      {isRespiteTriggerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1C1A]/40 backdrop-blur-xs animate-fadeIn">
          <div
            id="respite-trigger-dialog"
            className="w-full max-w-xl bg-[#FFFFFF] rounded-2xl shadow-xl border border-[#E8E2D8] overflow-hidden flex flex-col"
          >
            <div className="px-6 py-5 border-b border-[#F0EBE2] bg-[#FAF8F5] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#F7F2E7] text-[#7A6436] flex items-center justify-center">
                  <Wind className="w-5 h-5 text-[#887447]" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-[#242220]">
                    Botão de Respiro: Descompressão Consciente
                  </h3>
                  <p className="text-xs text-[#7B746D]">
                    Sem culpa e sem sobrecarga no dia seguinte.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRespiteTriggerModalOpen(false)}
                className="p-2 rounded-lg text-[#8C857D] hover:text-[#242220] hover:bg-[#EFEAE1] transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-[#F8F6F0] border border-[#EBE3D3] text-xs text-[#5C5449] leading-relaxed">
                <p className="font-medium text-[#2E2820] mb-1">
                  Princípio da Flexibilidade sem Culpa
                </p>
                O sistema não empurra pendências para amanhã criando uma bola de neve tóxica.
                Ao acionar o respiro, você move tarefas secundárias para a <strong>Caixa de Descanso</strong> flutuante,
                deixando o dia leve e respeitando a sua capacidade real.
              </div>

              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-[#4A453F] uppercase tracking-wider">
                    Selecione as tarefas para descansar hoje ({selectedToMove.length}/{nonPillarTasks.length})
                  </span>
                  {nonPillarTasks.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-xs text-[#7A6436] font-medium hover:underline cursor-pointer"
                    >
                      {selectedToMove.length === nonPillarTasks.length ? 'Desmarcar todas' : 'Selecionar todas secundárias'}
                    </button>
                  )}
                </div>

                {nonPillarTasks.length === 0 ? (
                  <p className="text-xs text-[#8A837A] italic py-4 text-center">
                    Você não tem tarefas secundárias pendentes hoje. Apenas os pilares principais ou autocuidado.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {nonPillarTasks.map((task) => {
                      const isChecked = selectedToMove.includes(task.id);
                      const milestone = getMilestoneById(task.milestoneId);
                      const era = getEraByMilestoneId(task.milestoneId);

                      return (
                        <div
                          key={task.id}
                          onClick={() => toggleSelectToMove(task.id)}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                            isChecked
                              ? 'border-[#C4AD81] bg-[#F7F3E9]'
                              : 'border-[#EAE4D8] hover:border-[#DDD6CB] bg-[#FAF8F5]'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                                isChecked
                                  ? 'bg-[#887447] border-[#887447] text-[#FFFFFF]'
                                  : 'border-[#B3ABA0] bg-[#FFFFFF]'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div>
                              <span className="font-medium text-[#242220]">{task.title}</span>
                              {era && milestone && (
                                <div className="text-[11px] text-[#7E776F] mt-0.5">
                                  {era.title} › {milestone.title}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="text-[11px] text-[#8C847B]">
                            {task.estimatedMinutes} min
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#F0EBE2] bg-[#FAF8F5] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsRespiteTriggerModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#6B655F] hover:bg-[#EBE5DA] transition-all cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                id="confirm-respite-move-btn"
                disabled={selectedToMove.length === 0}
                onClick={handleConfirmMoveToRespite}
                className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-[#887447] text-[#FFFFFF] text-xs font-semibold hover:bg-[#72613B] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
              >
                <Feather className="w-4 h-4" />
                <span>Mover {selectedToMove.length} para Caixa de Descanso</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Respite Box Drawer / Modal (Caixa de Descanso / Rascunho Flutuante) */}
      {isRespiteBoxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1C1A]/40 backdrop-blur-xs animate-fadeIn">
          <div
            id="respite-box-dialog"
            className="w-full max-w-2xl bg-[#FFFFFF] rounded-2xl shadow-xl border border-[#E8E2D8] overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="px-6 py-5 border-b border-[#F0EBE2] bg-[#FAF8F5] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#F4EFE6] text-[#7A6436] flex items-center justify-center">
                  <Feather className="w-5 h-5 text-[#887447]" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-serif text-lg font-semibold text-[#242220]">
                      Caixa de Descanso & Rascunho
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#EFE9DB] text-[#695730] text-[11px] font-semibold">
                      {respiteTasks.length} {respiteTasks.length === 1 ? 'tarefa guardada' : 'tarefas guardadas'}
                    </span>
                  </div>
                  <p className="text-xs text-[#7B746D]">
                    Tarefas flutuantes preservadas com cuidado, sem prazos de cobrança ou alertas vermelhos.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRespiteBoxOpen(false)}
                className="p-2 rounded-lg text-[#8C857D] hover:text-[#242220] hover:bg-[#EFEAE1] transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {respiteTasks.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#FAF6EE] text-[#B0A288] flex items-center justify-center mx-auto mb-3">
                    <Wind className="w-6 h-6" />
                  </div>
                  <p className="font-medium text-sm text-[#3E3832]">A Caixa de Descanso está vazia</p>
                  <p className="text-xs text-[#7E776F] max-w-sm mx-auto mt-1 leading-relaxed">
                    Quando o dia estiver denso ou a energia estiver baixa, utilize o Botão de Respiro para enviar tarefas secundárias para cá com leveza.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {respiteTasks.map((task) => {
                    const milestone = getMilestoneById(task.milestoneId);
                    const era = getEraByMilestoneId(task.milestoneId);

                    return (
                      <div
                        key={task.id}
                        className="p-4 rounded-xl border border-[#E9E3D6] bg-[#FAF8F5] hover:bg-[#FFFFFF] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="font-semibold text-sm text-[#262320]">{task.title}</div>
                          {era && milestone && (
                            <div className="flex items-center space-x-1.5 text-[11px] text-[#7A736C]">
                              <span
                                className="w-2 h-2 rounded-full inline-block"
                                style={{ backgroundColor: era.color }}
                              />
                              <span className="font-medium">{era.title}</span>
                              <span>›</span>
                              <span>{milestone.title}</span>
                            </div>
                          )}
                          {task.respiteReason && (
                            <p className="text-[11px] text-[#8C7649] italic">
                              "{task.respiteReason}"
                            </p>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EFE9DD]">
                          <button
                            type="button"
                            onClick={() => restoreFromRespite(task.id, getTodayDateStr())}
                            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#EFE9DC] text-[#554627] hover:bg-[#E3DCUsers] font-medium transition-all cursor-pointer"
                            title="Trazer de volta para a lista de hoje"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Puxar para Hoje</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => restoreFromRespite(task.id, getRelativeDateStr(2))}
                            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-[#DDD5C7] text-[#5A544D] hover:bg-[#FFFFFF] transition-all cursor-pointer"
                            title="Agendar para daqui a 2 dias"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Em 2 dias</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteTask(task.id)}
                            className="p-1.5 rounded-lg text-[#99928A] hover:text-[#B84035] hover:bg-[#F9ECEB] transition-all cursor-pointer"
                            title="Descartar tarefa definitivamente"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#F0EBE2] bg-[#FAF8F5] flex items-center justify-between">
              <span className="text-xs text-[#7B746D]">
                Autocuidado e clareza: tarefas guardadas aqui não cobram nem geram estresse.
              </span>
              <button
                onClick={() => setIsRespiteBoxOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#2D332F] text-[#FAF8F5] text-xs font-semibold hover:bg-[#1A1E1C] transition-all cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

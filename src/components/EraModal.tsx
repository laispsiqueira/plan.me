import React, { useState, useEffect } from 'react';
import { usePlan } from '../context/PlanContext';
import { Era } from '../types';
import { X, Compass, Calendar } from 'lucide-react';

const CATEGORY_COLORS: Record<string, { color: string; accentBg: string }> = {
  'Trabalho & Negócio': { color: '#385A48', accentBg: '#EAF0EB' },
  'Saúde & Vitalidade': { color: '#B85D3B', accentBg: '#F9EFEA' },
  'Mente & Conhecimento': { color: '#2B5B66', accentBg: '#EBF3F5' },
  'Sonhos Pessoais': { color: '#655A75', accentBg: '#F1EFF5' },
  'Finanças & Futuro': { color: '#886E2A', accentBg: '#F8F4EA' },
  'Relacionamentos & Família': { color: '#91536E', accentBg: '#F7EDF2' },
};

export const EraModal: React.FC = () => {
  const {
    isEraModalOpen,
    setIsEraModalOpen,
    editingEra,
    setEditingEra,
    saveEra,
  } = usePlan();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Era['category']>('Trabalho & Negócio');
  const [targetDate, setTargetDate] = useState('');

  useEffect(() => {
    if (editingEra) {
      setTitle(editingEra.title);
      setDescription(editingEra.description);
      setCategory(editingEra.category);
      setTargetDate(editingEra.targetDate || '');
    } else {
      setTitle('');
      setDescription('');
      setCategory('Trabalho & Negócio');
      setTargetDate('');
    }
  }, [editingEra, isEraModalOpen]);

  if (!isEraModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const colors = CATEGORY_COLORS[category] || { color: '#385A48', accentBg: '#EAF0EB' };

    saveEra({
      id: editingEra?.id,
      title: title.trim(),
      description: description.trim(),
      category,
      status: editingEra?.status || 'active',
      targetDate: targetDate.trim() || undefined,
      color: colors.color,
      accentBg: colors.accentBg,
    });

    setIsEraModalOpen(false);
    setEditingEra(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1C1A]/40 backdrop-blur-xs animate-fadeIn">
      <div
        id="era-form-dialog"
        className="w-full max-w-md bg-[#FFFFFF] rounded-2xl shadow-xl border border-[#E8E2D8] overflow-hidden flex flex-col"
      >
        <div className="px-6 py-4.5 border-b border-[#F0EBE2] bg-[#FAF8F5] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EFE9DE] text-[#4A443E] flex items-center justify-center">
              <Compass className="w-4 h-4 text-[#B85D3B]" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#242220]">
                {editingEra ? 'Editar Sonho' : 'Novo Sonho'}
              </h3>
              <p className="text-xs text-[#7B746D]">
                A estrada principal que dá sentido a todas as suas metas e tarefas.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsEraModalOpen(false);
              setEditingEra(null);
            }}
            className="p-2 rounded-lg text-[#8C857D] hover:text-[#242220] hover:bg-[#EFEAE1] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-[#69635C] mb-1.5">
              Título do Sonho *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Transição Profissional com Estabilidade..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-sm text-[#242220] placeholder-[#9E978F] focus:outline-none focus:border-[#385A48] focus:bg-[#FFFFFF] transition-all"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-[#69635C] mb-1.5">
              Categoria Estrutural
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Era['category'])}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-xs text-[#242220] focus:outline-none focus:border-[#385A48] focus:bg-[#FFFFFF] transition-all cursor-pointer"
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
            <label className="block font-semibold uppercase tracking-wider text-[#69635C] mb-1.5">
              Prazo de Conclusão (Opcional)
            </label>
            <div className="relative">
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-xs text-[#242220] focus:outline-none focus:border-[#385A48] focus:bg-[#FFFFFF] transition-all cursor-pointer"
              />
            </div>
            <span className="text-[11px] text-[#8C847B] mt-1 block">
              Data de horizonte para a realização deste grande sonho.
            </span>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-[#69635C] mb-1.5">
              Descrição do Propósito
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Qual é a transformação real que esse objetivo traz para sua rotina e vida?"
              className="w-full px-3.5 py-2 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-xs text-[#242220] placeholder-[#9E978F] focus:outline-none focus:border-[#385A48] focus:bg-[#FFFFFF] transition-all resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setIsEraModalOpen(false);
                setEditingEra(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#6B655F] hover:bg-[#EBE5DA] transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="save-era-submit-btn"
              className="px-5 py-2 rounded-xl bg-[#2D332F] text-[#FAF8F5] text-xs font-semibold hover:bg-[#1A1E1C] transition-all cursor-pointer shadow-xs"
            >
              {editingEra ? 'Salvar Alterações' : 'Criar Sonho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

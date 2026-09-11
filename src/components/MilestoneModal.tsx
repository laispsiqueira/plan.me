import React, { useState, useEffect, useRef } from 'react';
import { usePlan } from '../context/PlanContext';
import { Milestone } from '../types';
import { getRelativeDateStr } from '../data/initialData';
import { X, GitBranch, Calendar, Image as ImageIcon, Upload, Trash2, Sparkles, Check } from 'lucide-react';

interface MilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetEraId?: string;
  editingMilestone?: Milestone | null;
}

const PRESET_MOODBOARDS = [
  {
    name: 'Estúdio & Estrutura',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Vitalidade & Sol',
    url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Caderno & Escrita',
    url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Mesa & Foco',
    url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
  },
];

export const MilestoneModal: React.FC<MilestoneModalProps> = ({
  isOpen,
  onClose,
  targetEraId,
  editingMilestone,
}) => {
  const { eras, saveMilestone } = usePlan();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [eraId, setEraId] = useState('');
  const [targetDate, setTargetDate] = useState(getRelativeDateStr(15));
  const [status, setStatus] = useState<Milestone['status']>('in_progress');
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingMilestone) {
      setTitle(editingMilestone.title);
      setEraId(editingMilestone.eraId);
      setTargetDate(editingMilestone.targetDate);
      setStatus(editingMilestone.status);
      setImageUrl(editingMilestone.imageUrl || '');
      setNotes(editingMilestone.notes || '');
    } else {
      setTitle('');
      setEraId(targetEraId || (eras[0]?.id ?? ''));
      setTargetDate(getRelativeDateStr(15));
      setStatus('in_progress');
      setImageUrl('');
      setNotes('');
    }
  }, [editingMilestone, targetEraId, isOpen, eras]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eraId) return;

    saveMilestone({
      id: editingMilestone?.id,
      eraId,
      title: title.trim(),
      targetDate,
      status,
      imageUrl: imageUrl.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1C1A]/40 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-lg bg-[#FFFFFF] rounded-2xl shadow-xl border border-[#E8E2D8] overflow-hidden flex flex-col my-8">
        <div className="px-6 py-4.5 border-b border-[#F0EBE2] bg-[#FAF8F5] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EFE9DE] text-[#4A443E] flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-[#385A48]" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#242220]">
                {editingMilestone ? 'Editar Galho da Trilha' : 'Novo Galho da Trilha (Meta)'}
              </h3>
              <p className="text-xs text-[#7B746D]">
                Decomposição do Sonho com moodboard visual e data de entrega.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#8C857D] hover:text-[#242220] hover:bg-[#EFEAE1] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-[#69635C] mb-1.5">
              Grande Sonho Vinculado *
            </label>
            <select
              value={eraId}
              onChange={(e) => setEraId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-xs text-[#242220] focus:outline-none focus:border-[#385A48] focus:bg-[#FFFFFF] transition-all cursor-pointer"
            >
              {eras.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} ({e.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-[#69635C] mb-1.5">
              Título do Galho / Etapa *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Padronizar fluxo de proposta comercial..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-sm text-[#242220] placeholder-[#9E978F] focus:outline-none focus:border-[#385A48] focus:bg-[#FFFFFF] transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-[#69635C] mb-1.5 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Data-Alvo de Conclusão</span>
              </label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-xs text-[#242220] focus:outline-none focus:border-[#385A48] focus:bg-[#FFFFFF] transition-all cursor-pointer"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-[#69635C] mb-1.5">
                Status da Etapa
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['pending', 'in_progress', 'completed'] as Milestone['status'][]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`px-2 py-2 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
                      status === st
                        ? 'border-[#385A48] bg-[#F2F7F3] text-[#2D4D3A] font-semibold'
                        : 'border-[#E2DCCE] bg-[#FFFFFF] text-[#635D55]'
                    }`}
                  >
                    {st === 'pending' ? 'Pendente' : st === 'in_progress' ? 'Em Curso' : 'Concluído'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Moodboard da Meta Section */}
          <div className="pt-2 border-t border-[#F0ECE4] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold uppercase tracking-wider text-[#69635C] flex items-center space-x-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#B85D3B]" />
                <span>Moodboard Visual da Meta</span>
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="text-xs text-[#B84035] hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remover foto</span>
                </button>
              )}
            </div>

            {/* Image Preview or Dropzone */}
            {imageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-[#DDD6CB] bg-[#F5F1EB] group">
                <img
                  src={imageUrl}
                  alt="Moodboard da meta"
                  referrerPolicy="no-referrer"
                  className="w-full h-44 object-cover object-center"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white/90 text-[#242220] font-medium text-xs shadow-sm hover:bg-white cursor-pointer"
                  >
                    Substituir Foto
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#DDD5C7] rounded-xl p-4 bg-[#FAF8F5] hover:bg-[#F4EFE6] transition-all text-center cursor-pointer space-y-1.5"
              >
                <Upload className="w-6 h-6 text-[#9E978F] mx-auto" />
                <div className="text-xs font-semibold text-[#38332D]">
                  Clique para fazer upload da imagem de moodboard
                </div>
                <p className="text-[11px] text-[#8C847B]">
                  PNG, JPG ou WEBP de até 5MB (ou escolha uma inspiração abaixo)
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Presets or URL input */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-medium text-[#7B746D] flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-[#C4883A]" />
                <span>Sugestões rápidas de atmosfera:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_MOODBOARDS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setImageUrl(preset.url)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer flex items-center space-x-1 ${
                      imageUrl === preset.url
                        ? 'border-[#385A48] bg-[#F2F7F3] text-[#2D4D3A] font-semibold'
                        : 'border-[#E2DCCE] bg-[#FFFFFF] text-[#635D55] hover:bg-[#F5F0E6]'
                    }`}
                  >
                    {imageUrl === preset.url && <Check className="w-3 h-3 text-[#385A48]" />}
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-[#7B746D] mb-1">
                Ou cole uma URL externa de imagem:
              </label>
              <input
                type="url"
                value={imageUrl.startsWith('data:') ? '' : imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://exemplo.com/foto-inspiracao.jpg"
                className="w-full px-3 py-1.5 rounded-lg border border-[#D9D1C5] bg-[#FAF8F5] text-xs text-[#242220] placeholder-[#A39C93] focus:outline-none focus:border-[#385A48] focus:bg-[#FFFFFF]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#7B746D] mb-1">
                Significado do Moodboard / Notas:
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Espaço sem desordem, processos documentados e clareza mental..."
                className="w-full px-3 py-1.5 rounded-lg border border-[#D9D1C5] bg-[#FAF8F5] text-xs text-[#242220] placeholder-[#A39C93] focus:outline-none focus:border-[#385A48] focus:bg-[#FFFFFF] resize-none"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end space-x-2 border-t border-[#F0ECE4]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#6B655F] hover:bg-[#EBE5DA] transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#2D332F] text-[#FAF8F5] text-xs font-semibold hover:bg-[#1A1E1C] transition-all cursor-pointer shadow-xs"
            >
              {editingMilestone ? 'Salvar Alterações' : 'Criar Galho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


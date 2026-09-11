import React, { useState, useRef, useEffect } from 'react';
import { usePlan } from '../context/PlanContext';
import { parseNaturalLanguageDump, ParsedDumpItem } from '../utils/naturalLanguageParser';
import { getTodayDateStr, getRelativeDateStr } from '../data/initialData';
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  Check,
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  CornerDownLeft,
  Flame,
  Plus,
  RefreshCw,
  Info,
  Image as ImageIcon,
  X,
  AlertCircle,
} from 'lucide-react';
import { FileValidator } from '../lib/validation/FileValidator';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  imageUrl?: string;
  parsedItems?: ParsedDumpItem[];
  savedItemIds?: string[];
}

export const DumpChat: React.FC = () => {
  const { saveTask, milestones, getEraById } = usePlan();

  const [inputMessage, setInputMessage] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const chatFileInputRef = useRef<HTMLInputElement | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'welcome-1',
        sender: 'assistant',
        text: 'Despeje aqui seus pensamentos, pendências ou tarefas soltas. Você pode enviar texto, fotos/anexos ou áudio. Organizamos tudo para você com inteligência prática.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  // Editable drafts for items in chat
  const [itemDrafts, setItemDrafts] = useState<Record<string, ParsedDumpItem>>({});
  const [savedItemsMap, setSavedItemsMap] = useState<Record<string, boolean>>({});
  const [itemImageMap, setItemImageMap] = useState<Record<string, string>>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const handleImageFile = (file: File) => {
    if (!file) return;
    setUploadError(null);

    const validation = FileValidator.validateImage(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Arquivo inválido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
    e.target.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          handleImageFile(file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  // Voice dictation
  const handleToggleVoice = () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

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
            setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
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
        console.warn('SpeechRecognition failed', err);
        setIsRecording(false);
      }
    } else {
      alert('Reconhecimento de voz não suportado pelo navegador atual.');
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text && !attachedImage) return;

    const userMsgId = `user-${Date.now()}`;
    const userTimestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const currentAttachedImage = attachedImage;

    const newMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: text || '(Imagem anexada)',
      imageUrl: currentAttachedImage || undefined,
      timestamp: userTimestamp,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');
    setAttachedImage(null);
    setIsProcessing(true);

    // Simulate smart parsing response
    setTimeout(() => {
      const parsed = parseNaturalLanguageDump(text || 'Pendência com imagem');

      // Register drafts
      const newDrafts: Record<string, ParsedDumpItem> = {};
      const newImageMap: Record<string, string> = {};
      parsed.forEach((item) => {
        newDrafts[item.id] = { ...item };
        if (currentAttachedImage) {
          newImageMap[item.id] = currentAttachedImage;
        }
      });
      setItemDrafts((prev) => ({ ...prev, ...newDrafts }));
      if (currentAttachedImage) {
        setItemImageMap((prev) => ({ ...prev, ...newImageMap }));
      }

      let replyText = '';
      if (parsed.length === 1) {
        const item = parsed[0];
        const dateDesc = item.dueDate ? `com data final (${item.detectedDateLabel})` : 'sem data agendada (permanece no despejo)';
        const prioDesc = item.isPillar ? 'e alta prioridade não-negociável' : 'e prioridade flexível';
        replyText = `Identifiquei 1 pendência ${dateDesc} ${prioDesc}. Confira os detalhes abaixo e confirme para salvar no seu plano:`;
      } else if (parsed.length > 1) {
        replyText = `Identifiquei ${parsed.length} pendências distintas na sua mensagem. Estruturei cada uma abaixo para você conferir e salvar:`;
      } else {
        replyText = 'Anotei sua observação. Deseja transformar em uma pendência com data ou prioridade definida?';
      }

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        parsedItems: parsed,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsProcessing(false);
    }, 400);
  };

  const handleUpdateDraft = (itemId: string, updates: Partial<ParsedDumpItem>) => {
    setItemDrafts((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      return {
        ...prev,
        [itemId]: { ...current, ...updates },
      };
    });
  };

  const handleSaveItem = (item: ParsedDumpItem) => {
    const current = itemDrafts[item.id] || item;
    const taskImage = current.imageUrl || itemImageMap[item.id];

    saveTask({
      title: current.title.trim() || 'Pendência sem título',
      milestoneId: milestones[0]?.id || '',
      dueDate: current.dueDate || '',
      priorityType: current.priorityType,
      isPillar: current.isPillar,
      estimatedMinutes: current.estimatedMinutes || 30,
      status: 'todo',
      imageUrl: taskImage,
    });

    setSavedItemsMap((prev) => ({ ...prev, [item.id]: true }));
  };

  const handleSaveAllInMessage = (items: ParsedDumpItem[]) => {
    items.forEach((it) => {
      if (!savedItemsMap[it.id]) {
        handleSaveItem(it);
      }
    });
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: 'Histórico reiniciado. Digite livremente seus pensamentos e pendências. Organizamos tudo com precisão prática.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const quickPrompts = [
    'Revisar contrato comercial amanhã urgente',
    'Cotar novos insumos para a operação sem data',
    'Alinhar entregas da semana na sexta-feira às 10h',
    'Organizar arquivos e documentos fiscais prioridade alta',
  ];

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingFile(true);
      }}
      onDragLeave={() => setIsDraggingFile(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingFile(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleImageFile(file);
      }}
      className={`bg-[#FFFFFF] rounded-2xl border border-[#E5DFD4] shadow-xs overflow-hidden flex flex-col h-[560px] relative transition-colors ${
        isDraggingFile ? 'ring-2 ring-[#385A48] bg-[#F4FAF5]' : ''
      }`}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingFile && (
        <div className="absolute inset-0 bg-[#385A48]/10 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-[#385A48] pointer-events-none">
          <ImageIcon className="w-10 h-10 text-[#385A48] mb-2 animate-bounce" />
          <p className="font-semibold text-sm text-[#253D30]">Solte a imagem aqui para anexar ao chat</p>
          <p className="text-xs text-[#526358] mt-0.5">Capturas de tela, fotos e documentos visuais</p>
        </div>
      )}

      {/* Chat Top Header */}
      <div className="px-5 py-3.5 bg-[#FAF8F5] border-b border-[#F0EBE2] flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#385A48] text-white flex items-center justify-center shadow-2xs">
            <Sparkles className="w-4 h-4 text-[#F4F1EA]" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-[#242220] flex items-center space-x-1.5">
              <span>Chat de Despejo Mental</span>
              <span className="text-[10px] font-normal px-2 py-0.2 rounded-full bg-[#EAF2EB] text-[#2C5F3E] border border-[#C5DDCB]">
                Inteligência Prática
              </span>
            </h3>
            <p className="text-[11px] text-[#7B746D]">
              Adicione pensamentos com ou sem data e prioridade em texto, imagem ou áudio
            </p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#FCFAF7]/50">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fadeIn`}
            >
              <div className="flex items-end space-x-2 max-w-[92%] sm:max-w-[80%]">
                {!isUser && (
                  <div className="w-6 h-6 rounded-md bg-[#385A48] text-white flex items-center justify-center shrink-0 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#F4F1EA]" />
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#2D332F] text-[#FAF8F5] rounded-br-xs shadow-2xs'
                      : 'bg-[#FFFFFF] text-[#2A2621] border border-[#E8E2D8] rounded-bl-xs shadow-2xs'
                  }`}
                >
                  {msg.imageUrl && (
                    <div className="mb-2">
                      <img
                        src={msg.imageUrl}
                        alt="Anexo enviado"
                        className="rounded-xl max-h-48 max-w-full object-cover border border-white/20"
                      />
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>

              <span className="text-[10px] text-[#9E978F] mt-1 px-8">
                {msg.timestamp}
              </span>

              {/* Parsed Items Card Container */}
              {msg.parsedItems && msg.parsedItems.length > 0 && (
                <div className="w-full max-w-[92%] sm:max-w-[85%] mt-2.5 ml-8 space-y-2.5">
                  {msg.parsedItems.map((item) => {
                    const current = itemDrafts[item.id] || item;
                    const isSaved = savedItemsMap[item.id];

                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isSaved
                            ? 'bg-[#F2F7F3] border-[#C5DDCB]'
                            : 'bg-[#FFFFFF] border-[#E2DAD0] shadow-xs'
                        }`}
                      >
                        {/* Title input / display */}
                        <div className="mb-3">
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#7B746D] mb-1">
                            Ação / Título
                          </label>
                          {isSaved ? (
                            <div className="font-semibold text-xs sm:text-sm text-[#242220] flex items-center space-x-1.5">
                              <CheckCircle2 className="w-4 h-4 text-[#385A48] shrink-0" />
                              <span>{current.title}</span>
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={current.title}
                              onChange={(e) => handleUpdateDraft(item.id, { title: e.target.value })}
                              className="w-full px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#242220] rounded-lg border border-[#D9D1C5] bg-[#FAF8F5] focus:outline-none focus:border-[#385A48] focus:bg-[#FFFFFF]"
                              placeholder="Título da tarefa..."
                            />
                          )}
                        </div>

                        {/* Interactive Controls: Date, Priority, Duration */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#F0EBE2] text-[11px]">
                          {/* Date Control */}
                          <div>
                            <span className="block text-[10px] font-semibold text-[#7B746D] mb-1 flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-[#385A48]" />
                              <span>Data Final</span>
                            </span>
                            {isSaved ? (
                              <span className="inline-block px-2 py-1 rounded bg-[#EAF0EB] text-[#2D543D] font-medium">
                                {current.dueDate ? current.detectedDateLabel : 'Sem data (Despejo)'}
                              </span>
                            ) : (
                              <div className="space-y-1.5">
                                <div className="flex items-center space-x-1 flex-wrap gap-y-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateDraft(item.id, {
                                        dueDate: '',
                                        detectedDateLabel: 'Sem data (Despejo)',
                                      })
                                    }
                                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                                      !current.dueDate
                                        ? 'bg-[#385A48] text-white'
                                        : 'bg-[#F2ECE4] text-[#635C54] hover:bg-[#E8E0D5]'
                                    }`}
                                  >
                                    Sem data
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateDraft(item.id, {
                                        dueDate: getTodayDateStr(),
                                        detectedDateLabel: 'Hoje',
                                      })
                                    }
                                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                                      current.dueDate === getTodayDateStr()
                                        ? 'bg-[#385A48] text-white'
                                        : 'bg-[#F2ECE4] text-[#635C54] hover:bg-[#E8E0D5]'
                                    }`}
                                  >
                                    Hoje
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateDraft(item.id, {
                                        dueDate: getRelativeDateStr(1),
                                        detectedDateLabel: 'Amanhã',
                                      })
                                    }
                                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                                      current.dueDate === getRelativeDateStr(1)
                                        ? 'bg-[#385A48] text-white'
                                        : 'bg-[#F2ECE4] text-[#635C54] hover:bg-[#E8E0D5]'
                                    }`}
                                  >
                                    Amanhã
                                  </button>
                                </div>
                                <input
                                  type="date"
                                  value={current.dueDate}
                                  onChange={(e) =>
                                    handleUpdateDraft(item.id, {
                                      dueDate: e.target.value,
                                      detectedDateLabel: e.target.value || 'Sem data (Despejo)',
                                    })
                                  }
                                  className="w-full px-2 py-1 rounded text-[10px] border border-[#D9D1C5] bg-[#FAF8F5] text-[#242220] cursor-pointer"
                                />
                              </div>
                            )}
                          </div>

                          {/* Priority Control */}
                          <div>
                            <span className="block text-[10px] font-semibold text-[#7B746D] mb-1 flex items-center space-x-1">
                              <Flame className="w-3 h-3 text-[#B85D3B]" />
                              <span>Prioridade</span>
                            </span>
                            {isSaved ? (
                              <span
                                className={`inline-block px-2 py-1 rounded font-medium ${
                                  current.isPillar
                                    ? 'bg-[#F9EFEA] text-[#9C4B2C] border border-[#EACCBE]'
                                    : 'bg-[#F2ECE4] text-[#59524A]'
                                }`}
                              >
                                {current.isPillar ? 'Alta (Pilar)' : 'Normal'}
                              </span>
                            ) : (
                              <div className="flex items-center space-x-1 mt-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateDraft(item.id, {
                                      isPillar: false,
                                      priorityType: 'deadline',
                                      detectedPriorityLabel: 'Normal',
                                    })
                                  }
                                  className={`flex-1 px-2 py-1 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                                    !current.isPillar
                                      ? 'bg-[#2D332F] text-white'
                                      : 'bg-[#F2ECE4] text-[#635C54] hover:bg-[#E8E0D5]'
                                  }`}
                                >
                                  Normal
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateDraft(item.id, {
                                      isPillar: true,
                                      priorityType: 'deadline',
                                      detectedPriorityLabel: 'Alta (Pilar)',
                                    })
                                  }
                                  className={`flex-1 px-2 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                                    current.isPillar
                                      ? 'bg-[#B85D3B] text-white'
                                      : 'bg-[#F9EFEA] text-[#9C4B2C] hover:bg-[#F2E0D5]'
                                  }`}
                                >
                                  Alta
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Duration Control */}
                          <div>
                            <span className="block text-[10px] font-semibold text-[#7B746D] mb-1 flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-[#7B746D]" />
                              <span>Duração Esperada</span>
                            </span>
                            {isSaved ? (
                              <span className="inline-block px-2 py-1 rounded bg-[#F2ECE4] text-[#59524A] font-mono">
                                {current.estimatedMinutes} min
                              </span>
                            ) : (
                              <div className="flex items-center space-x-1 mt-1">
                                {[15, 30, 45, 60].map((mins) => (
                                  <button
                                    key={mins}
                                    type="button"
                                    onClick={() => handleUpdateDraft(item.id, { estimatedMinutes: mins })}
                                    className={`px-1.5 py-1 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                                      current.estimatedMinutes === mins
                                        ? 'bg-[#2D332F] text-white font-semibold'
                                        : 'bg-[#F2ECE4] text-[#635C54] hover:bg-[#E8E0D5]'
                                    }`}
                                  >
                                    {mins}m
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Save Action Button */}
                        <div className="mt-3.5 pt-2.5 border-t border-[#F0EBE2] flex items-center justify-between">
                          <span className="text-[10px] text-[#8C847B]">
                            {current.dueDate
                              ? `Agendar para: ${current.detectedDateLabel}`
                              : 'Ficará na lista de Despejo Mental'}
                          </span>

                          {isSaved ? (
                            <span className="inline-flex items-center space-x-1 text-xs font-semibold text-[#2C5F3E]">
                              <Check className="w-4 h-4" />
                              <span>Adicionada ao Plano</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSaveItem(item)}
                              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#385A48] text-white text-xs font-semibold hover:bg-[#2A4536] transition-colors cursor-pointer shadow-2xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Confirmar e Adicionar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Bulk save button if multiple items */}
                  {msg.parsedItems.length > 1 && msg.parsedItems.some((it) => !savedItemsMap[it.id]) && (
                    <div className="text-right pt-1">
                      <button
                        type="button"
                        onClick={() => handleSaveAllInMessage(msg.parsedItems!)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-[#2D332F] text-[#FAF8F5] text-xs font-medium hover:bg-[#1E2320] transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Adicionar Todas de uma vez</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex items-center space-x-2 text-xs text-[#7B746D] animate-pulse py-2">
            <div className="w-5 h-5 rounded-md bg-[#385A48]/20 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-[#385A48]" />
            </div>
            <span>Organizando pendência e extraindo datas e prioridade...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Upload error banner */}
      {uploadError && (
        <div className="px-4 py-2 bg-[#FDF2F0] border-t border-[#F5C7C1] text-[#9E3426] text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#C93B2B]" />
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="p-1 rounded-md hover:bg-[#FBE5E1] text-[#9E3426] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Attached image preview bar */}
      {attachedImage && (
        <div className="px-4 py-2 bg-[#FAF8F5] border-t border-[#F0EBE2] flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <img
              src={attachedImage}
              alt="Prévia do anexo"
              className="w-10 h-10 rounded-lg object-cover border border-[#D9D1C5]"
            />
            <span className="text-[11px] text-[#5A534B]">Imagem pronta para envio (pode enviar com ou sem texto)</span>
          </div>
          <button
            type="button"
            onClick={() => setAttachedImage(null)}
            className="p-1 rounded-full hover:bg-[#EAE4D9] text-[#7A736A] cursor-pointer"
            title="Remover anexo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input Form Bar */}
      <div className="p-3.5 bg-[#FFFFFF] border-t border-[#EAE4D9]">
        <input
          ref={chatFileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          <button
            type="button"
            onClick={() => chatFileInputRef.current?.click()}
            className="p-2.5 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-[#69635C] hover:border-[#385A48] hover:text-[#242220] transition-all cursor-pointer"
            title="Anexar imagem (ou cole com Ctrl+V / arraste)"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleToggleVoice}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isRecording
                ? 'bg-[#B84035] text-white border-[#B84035] animate-pulse'
                : 'bg-[#FAF8F5] text-[#69635C] border-[#D9D1C5] hover:border-[#385A48]'
            }`}
            title={isRecording ? 'Parar gravação' : 'Falar por voz'}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            ref={textareaRef as any}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onPaste={handlePaste}
            placeholder={
              isRecording
                ? 'Escutando você falar... diga sua pendência'
                : 'Digite ou cole texto/imagem (Ctrl+V)...'
            }
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-xs sm:text-sm text-[#242220] placeholder-[#9E978F] focus:outline-none focus:border-[#385A48] focus:bg-[#FFFFFF] transition-all"
          />

          <button
            type="submit"
            disabled={(!inputMessage.trim() && !attachedImage) || isProcessing}
            className="p-2.5 rounded-xl bg-[#2D332F] text-white hover:bg-[#1C201E] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
            title="Enviar mensagem"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

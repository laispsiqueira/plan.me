import { PriorityCriterion } from '../types';
import { getTodayDateStr, getRelativeDateStr } from '../data/initialData';
import { RateLimiter } from '../lib/rateLimit/RateLimiter';

const parserLimiter = new RateLimiter(1000, 60000); // 1000 calls/min
const MAX_INPUT_LENGTH = 100_000; // 100KB
const MAX_LINES = 1000;

export interface ParsedDumpItem {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD or ''
  isPillar: boolean;
  priorityType: PriorityCriterion;
  estimatedMinutes: number;
  notes?: string;
  detectedDateLabel: string;
  detectedPriorityLabel: string;
  confidence: 'high' | 'medium';
}

const WEEKDAYS_MAP: Record<string, number> = {
  domingo: 0,
  segunda: 1,
  'segunda-feira': 1,
  terça: 2,
  terca: 2,
  'terça-feira': 2,
  'terca-feira': 2,
  quarta: 3,
  'quarta-feira': 3,
  quinta: 4,
  'quinta-feira': 4,
  sexta: 5,
  'sexta-feira': 5,
  sábado: 6,
  sabado: 6,
};

export const parseNaturalLanguageDump = (rawText: string): ParsedDumpItem[] => {
  if (!rawText.trim()) return [];

  if (rawText.length > MAX_INPUT_LENGTH) {
    throw new Error(
      `Entrada muito grande (${rawText.length} bytes, máximo ${MAX_INPUT_LENGTH}). Por favor divida em partes menores.`
    );
  }

  if (!parserLimiter.isAllowed()) {
    throw new Error('Limite de taxa do analisador excedido. Tente novamente em um instante.');
  }

  // Check if multiple lines or list format, limited to MAX_LINES
  const rawLines = rawText
    .split(/\n+/)
    .slice(0, MAX_LINES)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (rawLines.length >= MAX_LINES) {
    console.warn(`Entrada truncada em ${MAX_LINES} linhas`);
  }

  // If input contains multiple items (e.g. numbered list, bullet points)
  const itemsToProcess = rawLines.length > 1 && rawLines.some((l) => /^(\d+[\.\)]|[-*•])\s+/.test(l))
    ? rawLines.map((l) => l.replace(/^(\d+[\.\)]|[-*•])\s+/, '').trim()).filter((l) => l.length > 0)
    : [rawText.trim()];

  return itemsToProcess.map((text, idx) => parseSingleItem(text, `item-${Date.now()}-${idx}`));
};

const parseSingleItem = (rawText: string, id: string): ParsedDumpItem => {
  const lower = rawText.toLowerCase();

  // 1. Detect Priority
  let isPillar = false;
  let priorityType: PriorityCriterion = 'deadline';
  let detectedPriorityLabel = 'Prioridade Normal';

  const highPriorityRegex = /\b(urgente|urgent|prioridade alta|alta prioridade|prioridade máxima|maxima|crítico|critica|critico|essencial|não-negociável|nao negociavel|pilar|urgência)\b/i;
  const lowPriorityRegex = /\b(baixa prioridade|prioridade baixa|secundário|secundaria|quando der|sem pressa)\b/i;

  if (highPriorityRegex.test(lower)) {
    isPillar = true;
    priorityType = 'deadline';
    detectedPriorityLabel = 'Alta prioridade (Pilar não-negociável)';
  } else if (lowPriorityRegex.test(lower)) {
    isPillar = false;
    priorityType = 'creation_date';
    detectedPriorityLabel = 'Baixa prioridade (Prazo flexível)';
  }

  // 2. Detect Due Date
  let dueDate = '';
  let detectedDateLabel = 'Sem data definida (Permanece no Despejo)';

  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 is Sunday, 4 is Thursday

  const explicitlyNoDate = /\b(sem data|sem prazo|despejo|depois vejo|depois decido|livre|algum dia)\b/i.test(lower);

  if (!explicitlyNoDate) {
    if (/\b(hoje|pra hoje|para hoje)\b/i.test(lower)) {
      dueDate = getTodayDateStr();
      detectedDateLabel = 'Hoje';
    } else if (/\b(depois de amanhã|depois de amanha)\b/i.test(lower)) {
      dueDate = getRelativeDateStr(2);
      detectedDateLabel = `Depois de amanhã (${formatDateDisplay(dueDate)})`;
    } else if (/\b(amanhã|amanha|pra amanha|para amanhã)\b/i.test(lower)) {
      dueDate = getRelativeDateStr(1);
      detectedDateLabel = `Amanhã (${formatDateDisplay(dueDate)})`;
    } else {
      // Check for weekday names
      let foundWeekdayOffset: number | null = null;
      let matchedDayName = '';

      for (const [dayName, targetDayIndex] of Object.entries(WEEKDAYS_MAP)) {
        const regex = new RegExp(`\\b(${dayName})\\b`, 'i');
        if (regex.test(lower)) {
          let diff = targetDayIndex - currentDayOfWeek;
          if (diff <= 0) diff += 7; // next occurrence
          foundWeekdayOffset = diff;
          matchedDayName = dayName;
          break;
        }
      }

      if (foundWeekdayOffset !== null) {
        dueDate = getRelativeDateStr(foundWeekdayOffset);
        const dayLabel = matchedDayName.charAt(0).toUpperCase() + matchedDayName.slice(1);
        detectedDateLabel = `${dayLabel} (${formatDateDisplay(dueDate)})`;
      } else {
        // Check for specific date formats like "dia 15", "15/09", "15/9", "2026-09-15"
        const dayMatch = lower.match(/\bdia\s+(\d{1,2})\b/i);
        const slashDateMatch = lower.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
        const isoMatch = lower.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);

        if (isoMatch) {
          dueDate = isoMatch[0];
          detectedDateLabel = formatDateDisplay(dueDate);
        } else if (slashDateMatch) {
          const d = slashDateMatch[1].padStart(2, '0');
          const m = slashDateMatch[2].padStart(2, '0');
          const y = slashDateMatch[3]
            ? slashDateMatch[3].length === 2
              ? `20${slashDateMatch[3]}`
              : slashDateMatch[3]
            : String(today.getFullYear());
          dueDate = `${y}-${m}-${d}`;
          detectedDateLabel = `${d}/${m}/${y}`;
        } else if (dayMatch) {
          const targetDay = parseInt(dayMatch[1], 10);
          if (targetDay >= 1 && targetDay <= 31) {
            const targetDate = new Date(today.getFullYear(), today.getMonth(), targetDay);
            if (targetDate < today && targetDay < today.getDate()) {
              targetDate.setMonth(targetDate.getMonth() + 1);
            }
            const y = targetDate.getFullYear();
            const m = String(targetDate.getMonth() + 1).padStart(2, '0');
            const d = String(targetDate.getDate()).padStart(2, '0');
            dueDate = `${y}-${m}-${d}`;
            detectedDateLabel = `Dia ${d}/${m}`;
          }
        }
      }
    }
  }

  // Validate parsed date
  if (dueDate) {
    const parsedTime = Date.parse(dueDate);
    if (isNaN(parsedTime)) {
      dueDate = '';
      detectedDateLabel = 'Data inválida';
    }
  }

  // 3. Detect Duration / Estimated Minutes
  let estimatedMinutes = 30; // default
  const minuteMatch = lower.match(/\b(\d+)\s*(?:minutos|minuto|min|m)\b/i);
  const hourMatch = lower.match(/\b(\d+(?:[\.,]\d+)?)\s*(?:horas|hora|h)\b/i);

  if (minuteMatch) {
    const mins = parseInt(minuteMatch[1], 10);
    if (!isNaN(mins) && mins > 0) estimatedMinutes = mins;
  } else if (hourMatch) {
    const hrs = parseFloat(hourMatch[1].replace(',', '.'));
    if (!isNaN(hrs) && hrs > 0) estimatedMinutes = Math.round(hrs * 60);
  } else if (/\b(rápido|rapido|rapidinho|5 min)\b/i.test(lower)) {
    estimatedMinutes = 15;
  } else if (/\b(profundo|demorado|longo)\b/i.test(lower)) {
    estimatedMinutes = 60;
  }

  // 4. Clean Title by removing date/priority markers from text
  let cleanTitle = rawText
    // Remove priority phrases
    .replace(highPriorityRegex, '')
    .replace(lowPriorityRegex, '')
    // Remove date phrases
    .replace(/\b(pra hoje|para hoje|hoje|depois de amanhã|depois de amanha|amanhã|amanha|pra amanha|para amanhã)\b/gi, '')
    .replace(/\b(sem data|sem prazo|no despejo|pro despejo)\b/gi, '')
    .replace(/\b(na|no|nesta|neste|próxima|proxima)?\s*(segunda-feira|segunda|terça-feira|terça|terca-feira|terca|quarta-feira|quarta|quinta-feira|quinta|sexta-feira|sexta|sábado|sabado|domingo)\b/gi, '')
    .replace(/\bdia\s+\d{1,2}\b/gi, '')
    .replace(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g, '')
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '')
    // Remove duration phrases
    .replace(/\b\d+\s*(?:minutos|minuto|min|m)\b/gi, '')
    .replace(/\b\d+(?:[\.,]\d+)?\s*(?:horas|hora|h)\b/gi, '')
    // Remove common clutter words at start like "preciso", "lembrar de", "fazer"
    .replace(/^(preciso|lembrar de|lembrar|não esquecer de|nao esquecer de|anotar|tarefa:?|pendência:?|pendencia:?)\s+/i, '')
    // Clean excessive spaces, commas and punctuation
    .replace(/[,;:\-\s]+$/, '')
    .replace(/^[,;:\-\s]+/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // If cleaning stripped almost everything, fallback to original text
  if (cleanTitle.length < 2) {
    cleanTitle = rawText.trim();
  }

  // Capitalize first letter
  cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

  return {
    id,
    title: cleanTitle,
    dueDate,
    isPillar,
    priorityType,
    estimatedMinutes,
    detectedDateLabel,
    detectedPriorityLabel,
    confidence: 'high',
  };
};

const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}`;
};

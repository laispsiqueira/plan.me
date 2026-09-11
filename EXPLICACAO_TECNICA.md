# Arquitetura e Especificação Técnica do Sistema

Este documento apresenta a especificação técnica do aplicativo **plan.me**, detalhando a pilha tecnológica, modelagem de dados, motor de estado, componentes de interface e os padrões de engenharia adotados.

---

## 1. Visão Geral da Pilha Tecnológica

O sistema foi construído como uma aplicação web responsiva orientada a desempenho, tipagem estática e baixa latência de interação.

| Camada | Tecnologia / Biblioteca | Função Principal |
| :--- | :--- | :--- |
| **Runtime & Core** | React 19 + TypeScript | Gerenciamento de componentes declarativos e segurança de tipos em tempo de compilação. |
| **Build & Dev Server** | Vite 6 | Empacotamento veloz com suporte a módulos ES e compilação otimizada. |
| **Estilização** | Tailwind CSS v4 | Utilitários utilitários atômicos sem runtime de CSS-in-JS, garantindo alta velocidade de renderização. |
| **Ícones** | Lucide React | Conjunto consistente e semântico de ícones vetoriais. |
| **Animações** | Motion (`motion/react`) | Transições de tela, abertura de gavetas modais e interações visuais fluidas. |
| **Persistência** | LocalStorage Engine com Fallback | Armazenamento local estruturado no navegador com integridade de dados e carregamento instantâneo. |

---

## 2. Modelagem de Dados e Tipos de Domínio (`src/types.ts`)

A aplicação estrutura a vida e os negócios em camadas hierárquicas claras:

### 2.1. Eras e Marcos (`Era` e `Milestone`)
- **`Era`**: Representa horizontes de longo prazo (ex.: "Consolidação da Operação", "Expansão da Empresa").
  - Propriedades: `id`, `name`, `theme`, `icon`, `color`, `startDate`, `endDate`, `milestonesCount`.
- **`Milestone`**: Marcos intermediários que materializam as metas de uma Era.
  - Propriedades: `id`, `eraId`, `title`, `targetDate`, `completed`, `progress`, `category`.

### 2.2. Tarefas e Itens de Ação (`Task`)
Unidade básica de execução do sistema, projetada para evitar ambiguidades operacionais:
```typescript
export interface Task {
  id: string;
  milestoneId?: string;
  title: string;
  dueDate: string;          // Formato YYYY-MM-DD (identificado no app como "Data Final")
  estimatedMinutes: number; // Duração Esperada em minutos (15, 25, 45, 60, 90 min)
  isPillar: boolean;        // Indicador de "Pilar Não-Negociável" do dia
  status: 'pending' | 'completed';
  completedAt?: string;
  isHabit?: boolean;        // Vinculação a hábito recorrente
  habitId?: string;         // ID do hábito correspondente
  priorityType?: 'urgent_important' | 'important_not_urgent' | 'routine';
  imageUrl?: string;        // Anexo visual (DataURL ou link)
  audioUrl?: string;        // Áudio gravado ou nota de voz
}
```

### 2.3. Blocos de Horário da Agenda Diária (`TimeBlock`)
Representam a alocação intencional do tempo na grade de 30 minutos:
```typescript
export interface TimeBlock {
  id: string;
  date: string;             // Data YYYY-MM-DD
  startTime: string;        // Horário de início (ex.: "09:00")
  endTime: string;          // Horário de término (ex.: "10:30")
  title: string;            // Nome do bloco
  type: 'focus' | 'execution' | 'routine' | 'respite' | 'meeting';
  taskId?: string;          // Vínculo bidirecional opcional com uma tarefa ativa
}
```

### 2.4. Hábitos Estruturados (`Habit`)
Rotinas recorrentes com integração nativa às tarefas do dia a dia:
```typescript
export interface Habit {
  id: string;
  title: string;
  lifeArea: 'saude' | 'negocios' | 'financas' | 'mente' | 'relacionamentos' | 'desenvolvimento';
  frequencyType: 'daily' | 'weekdays' | 'times_per_week' | 'times_per_month';
  targetCount: number;      // Meta numérica para frequência variável
  streak: number;           // Sequência de execuções ativas
  completedDates: string[]; // Lista de datas em que o hábito foi cumprido (YYYY-MM-DD)
  taskId?: string;          // ID da tarefa sincronizada no dia
  isTask?: boolean;         // Define se gera tarefa na grade diária
}
```

### 2.5. Roda da Vida Semestral (`WheelOfLifeEntry`)
Avaliação diagnóstica de equilíbrio semestral em 8 dimensões (1 a 10):
- Dimensões avaliadas: Saúde & Disposição, Carreira & Negócios, Finanças, Equilíbrio Emocional, Família, Relacionamento, Espiritualidade/Propósito, Lazer.

### 2.6. Check-in Diário de Energia (`DailyCheckin`) & Caixa de Descanso (`RespiteTask`)
- **`DailyCheckin`**: Armazena nível de energia (`high` | `balanced` | `low`), intenção do dia e data.
- **`RespiteTask`**: Tarefas movidas para alívio de sobrecarga sem culpa, com motivo de pausa e prazo de reavaliação.

---

## 3. Arquitetura de Estado e Regras de Negócio (`src/context/PlanContext.tsx`)

O `PlanContext` atua como fonte única da verdade (*Single Source of Truth*), garantindo integridade e consistência entre módulos:

### 3.1. Sincronização Bidirecional entre Hábitos e Tarefas
- **Quando uma tarefa vinculada a um hábito é concluída (`toggleTaskStatus`)**: O sistema localiza o `habitId`, verifica a data de conclusão e inclui a data em `completedDates` do hábito, recalculando a sequência de consistência (*streak*).
- **Quando um hábito é marcado na matriz semanal de hábitos (`toggleHabitDate`)**: O sistema localiza a tarefa correspondente do dia e atualiza seu status (`completed` ou `pending`), mantendo o painel diário e a matriz de hábitos em sincronia exata.

### 3.2. Mecanismo de Alocação de Blocos de Tempo
- **Drag-and-Drop Nativo**: Utiliza a API HTML5 Drag and Drop com `draggedTaskId` no estado local. O usuário pode arrastar qualquer tarefa da lista para um horário da grade ou para um bloco existente.
- **Agendamento Rápido por Clique**: Função `handleQuickScheduleTask` que calcula o próximo horário livre a partir da grade de 30 minutos, respeitando a `Duração Esperada` da tarefa e criando o `TimeBlock` sem atrito.

### 3.3. Interpretador de Linguagem Natural (`src/utils/naturalLanguageParser.ts`)
Processador client-side de texto e comandos que extrai:
- **Datas relativas**: "hoje", "amanhã", dias da semana ("segunda", "sexta").
- **Grau de prioridade**: "urgente", "pilar", "crítico" acionam `isPillar = true`.
- **Duração esperada**: Detecta menções a "15 min", "1 hora", "30 minutos".
- **Divisão inteligente de pendências**: Divide entradas compostas (separadas por vírgulas, quebras de linha ou conjunções) em tarefas atômicas e individuais.

---

## 4. Estrutura de Componentes da Interface

```
src/
├── App.tsx                      # Orquestrador de rotas por aba e modais globais
├── main.tsx                     # Ponto de entrada React 19
├── index.css                    # Tailwind CSS v4 setup
├── types.ts                     # Definições completas de tipos TypeScript
├── context/
│   └── PlanContext.tsx          # Estado global, persistência e motor de sincronização
├── data/
│   └── initialData.ts           # Carga inicial representativa para inicialização
├── utils/
│   └── naturalLanguageParser.ts # Motor léxico de interpretação de pendências
└── components/
    ├── Navbar.tsx               # Navegação superior entre as visões temporais
    ├── DailyHybridView.tsx      # Visão Diária: Grade de 30min + Lista de Pedras do Caminho
    ├── HabitsView.tsx           # Visão de Hábitos: Matriz semanal, áreas da vida e consistência
    ├── DumpView.tsx             # Visão de Despejo: 2 colunas (Chat à esquerda, Lista à direita)
    ├── DumpChat.tsx             # Chat de Despejo: Suporte a imagem (Ctrl+V / Drop / Arquivo) e voz
    ├── WeeklyView.tsx           # Visão Semanal: Balanceamento de carga em 7 dias
    ├── MonthlyView.tsx          # Visão Mensal: Distribuição de metas por mês e marcos
    ├── SemesterView.tsx         # Visão Semestral: Metas do ciclo e Roda da Vida em radar
    ├── WheelOfLife.tsx          # Componente gráfico vetorial (SVG) da Roda da Vida
    ├── TrailView.tsx            # Trilha Estratégica: Visualização de Eras e Marcos
    ├── TaskModal.tsx            # Modal de criação/edição com Data Final, Duração e Hábitos
    ├── TimeBlockModal.tsx       # Modal de configuração de blocos na agenda
    ├── MorningCheckinModal.tsx  # Modal de avaliação de energia matinal
    ├── RespiteModal.tsx         # Modal do Botão de Respiro para amortecimento de sobrecarga
    ├── MilestoneModal.tsx       # Modal de edição de marcos
    └── EraModal.tsx             # Modal de edição de eras estratégicas
```

---

## 5. Padrões de Usabilidade e Acessibilidade

1. **Responsividade adaptativa**: Telas desenhadas com limites de largura (`max-w-7xl mx-auto`) e distribuição em colunas fluidas (`grid-cols-1 lg:grid-cols-12`).
2. **Entrada flexível de arquivos**: O chat aceita imagens por três mecanismos: clique no ícone de anexo, arrastar e soltar diretamente na tela (com indicador visual) e colar da área de transferência (`Ctrl+V`).
3. **Prevenção de ruído visual**: Cores quentes e sóbrias baseadas em escala de contraste acessível (paleta `#242220`, `#385A48`, `#FAF8F5`, `#E8E2D8`), eliminando clichês de inteligência artificial genérica.
4. **Sem dados fictícios ou simulações opacas**: Toda ação do usuário altera o estado persistido localmente e reflete imediatamente em todas as visões conectadas.

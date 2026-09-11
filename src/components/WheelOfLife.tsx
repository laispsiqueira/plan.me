import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Sparkles, 
  TrendingUp, 
  AlertCircle, 
  ChevronRight, 
  Edit3, 
  Check, 
  RotateCcw,
  Info
} from 'lucide-react';

export interface WheelDimension {
  id: string;
  name: string;
  shortName: string;
  quadrant: 'Qualidade de Vida' | 'Pessoal' | 'Profissional' | 'Relacionamentos';
  color: string;
  bgLight: string;
}

export const WHEEL_DIMENSIONS: WheelDimension[] = [
  // 1. Qualidade de Vida (Superior Esquerdo / Topo)
  { id: 'criatividade', name: 'Criatividade, Hobbies e Diversão', shortName: 'Criatividade & Lazer', quadrant: 'Qualidade de Vida', color: '#B85D3B', bgLight: '#F9EFEA' },
  { id: 'plenitude', name: 'Plenitude e Felicidade', shortName: 'Plenitude & Felicidade', quadrant: 'Qualidade de Vida', color: '#C4883A', bgLight: '#FBF5EB' },
  { id: 'espiritualidade', name: 'Espiritualidade', shortName: 'Espiritualidade', quadrant: 'Qualidade de Vida', color: '#886E2A', bgLight: '#F8F4EA' },

  // 2. Pessoal (Superior Direito)
  { id: 'saude', name: 'Saúde e Disposição', shortName: 'Saúde & Disposição', quadrant: 'Pessoal', color: '#385A48', bgLight: '#EAF0EB' },
  { id: 'intelectual', name: 'Desenvolvimento Intelectual', shortName: 'Desenv. Intelectual', quadrant: 'Pessoal', color: '#2B5B66', bgLight: '#EBF3F5' },
  { id: 'emocional', name: 'Equilíbrio Emocional', shortName: 'Equilíbrio Emocional', quadrant: 'Pessoal', color: '#3E6F5C', bgLight: '#EDF5F1' },

  // 3. Profissional (Inferior Direito)
  { id: 'realizacao', name: 'Realização e Propósito', shortName: 'Realização & Propósito', quadrant: 'Profissional', color: '#2D332F', bgLight: '#EDEFEB' },
  { id: 'financeiro', name: 'Recursos Financeiros', shortName: 'Recursos Financeiros', quadrant: 'Profissional', color: '#8C6C38', bgLight: '#F7F3EA' },
  { id: 'social_contrib', name: 'Contribuição Social', shortName: 'Contribuição Social', quadrant: 'Profissional', color: '#4F616E', bgLight: '#EFF3F5' },

  // 4. Relacionamentos (Inferior Esquerdo)
  { id: 'familia', name: 'Família', shortName: 'Família', quadrant: 'Relacionamentos', color: '#655A75', bgLight: '#F1EFF5' },
  { id: 'amoroso', name: 'Desenvolvimento Amoroso', shortName: 'Desenv. Amoroso', quadrant: 'Relacionamentos', color: '#91536E', bgLight: '#F7EDF2' },
  { id: 'vida_social', name: 'Vida Social', shortName: 'Vida Social', quadrant: 'Relacionamentos', color: '#7E6B8F', bgLight: '#F4EFF7' },
];

export interface WheelScores {
  [dimensionId: string]: number; // 1 to 10
}

const DEFAULT_SCORES: WheelScores = {
  criatividade: 6,
  plenitude: 7,
  espiritualidade: 6,
  saude: 7,
  intelectual: 8,
  emocional: 6,
  realizacao: 8,
  financeiro: 7,
  social_contrib: 6,
  familia: 8,
  amoroso: 7,
  vida_social: 6,
};

interface WheelOfLifeProps {
  year: number;
  semester: 1 | 2;
}

const STORAGE_KEY = 'planme_wheel_of_life_evaluations_v2';

export const WheelOfLife: React.FC<WheelOfLifeProps> = ({ year, semester }) => {
  const semesterKey = `${year}-S${semester}`;
  const [allEvaluations, setAllEvaluations] = useState<Record<string, WheelScores>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [scores, setScores] = useState<WheelScores>(() => {
    return allEvaluations[semesterKey] || DEFAULT_SCORES;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [activeDimension, setActiveDimension] = useState<string | null>(null);

  // Sync state when semesterKey changes
  useEffect(() => {
    if (allEvaluations[semesterKey]) {
      setScores(allEvaluations[semesterKey]);
    } else {
      setScores(DEFAULT_SCORES);
    }
    setIsEditing(false);
  }, [semesterKey, allEvaluations]);

  const handleScoreChange = (dimId: string, val: number) => {
    const updated = { ...scores, [dimId]: Math.max(1, Math.min(10, val)) };
    setScores(updated);
    const newEvaluations = { ...allEvaluations, [semesterKey]: updated };
    setAllEvaluations(newEvaluations);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEvaluations));
  };

  // Metrics
  const dimensionValues = WHEEL_DIMENSIONS.map((d) => scores[d.id] || 5);
  const averageScore = Math.round((dimensionValues.reduce((a, b) => a + b, 0) / dimensionValues.length) * 10) / 10;
  
  // Sorted highlights
  const sortedDimensions = [...WHEEL_DIMENSIONS].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  const topDimension = sortedDimensions[0];
  const lowestDimension = sortedDimensions[sortedDimensions.length - 1];

  // SVG Radar Coordinates Setup
  const svgSize = 440;
  const center = svgSize / 2;
  const maxRadius = 150;
  const totalRays = WHEEL_DIMENSIONS.length; // 12
  const angleStep = (2 * Math.PI) / totalRays;

  const getCoordinates = (index: number, value: number) => {
    // Start at -Math.PI / 2 (top: 12 o'clock)
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / 10) * maxRadius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, angle };
  };

  // Polygon points string
  const polygonPoints = WHEEL_DIMENSIONS.map((dim, i) => {
    const val = scores[dim.id] || 5;
    const { x, y } = getCoordinates(i, val);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-[#FFFFFF] p-6 sm:p-7 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F0EBE2]">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#385A48] text-white flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-[#242220]">
              Roda da Vida (Diagnóstico Semestral)
            </h3>
          </div>
          <p className="text-xs text-[#7A736A]">
            Autoavaliação das 12 áreas vitais preenchida a cada 6 meses para garantir equilíbrio entre negócio e vida.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <span className="px-3 py-1 rounded-lg bg-[#FAF8F5] border border-[#EAE3D7] text-xs font-mono font-semibold text-[#322E29]">
            {semester}º Semestre {year}
          </span>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
              isEditing
                ? 'bg-[#385A48] text-white hover:bg-[#2C493A]'
                : 'border border-[#D9D1C5] bg-white text-[#2D2A26] hover:bg-[#FAF8F5]'
            }`}
          >
            {isEditing ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Salvar Avaliação</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5 text-[#385A48]" />
                <span>Avaliar Semestre</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Radar Chart Visual (Left) + Analysis & Quadrants (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Radar SVG Visual */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative">
          <div className="w-full max-w-[440px] aspect-square relative flex items-center justify-center">
            <svg
              viewBox={`0 0 ${svgSize} ${svgSize}`}
              className="w-full h-full select-none overflow-visible"
            >
              {/* Concentric Circles (Levels 1 to 10) */}
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => {
                const r = (lvl / 10) * maxRadius;
                return (
                  <circle
                    key={lvl}
                    cx={center}
                    cy={center}
                    r={r}
                    fill="none"
                    stroke={lvl % 2 === 0 ? '#DDD5C7' : '#EDE6DC'}
                    strokeWidth={lvl === 10 ? '1.5' : lvl % 2 === 0 ? '1' : '0.75'}
                    strokeDasharray={lvl % 2 === 0 ? 'none' : '3 3'}
                  />
                );
              })}

              {/* Tick numbers on vertical ray */}
              {[2, 4, 6, 8, 10].map((lvl) => {
                const r = (lvl / 10) * maxRadius;
                return (
                  <text
                    key={lvl}
                    x={center + 4}
                    y={center - r + 3}
                    className="text-[9px] font-mono fill-[#9C9489] font-semibold"
                  >
                    {lvl}
                  </text>
                );
              })}

              {/* Radial Spokes (Axes) */}
              {WHEEL_DIMENSIONS.map((dim, i) => {
                const { x, y } = getCoordinates(i, 10);
                const isHovered = activeDimension === dim.id;
                return (
                  <g key={dim.id}>
                    <line
                      x1={center}
                      y1={center}
                      x2={x}
                      y2={y}
                      stroke={isHovered ? dim.color : '#E0D8CC'}
                      strokeWidth={isHovered ? '2' : '1'}
                      className="transition-colors"
                    />
                  </g>
                );
              })}

              {/* Radar Filled Area */}
              <polygon
                points={polygonPoints}
                fill="url(#radarGradient)"
                fillOpacity="0.38"
                stroke="#385A48"
                strokeWidth="2.5"
                strokeLinejoin="round"
                className="transition-all duration-300 drop-shadow-xs"
              />

              <defs>
                <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#385A48" stopOpacity="0.6" />
                  <stop offset="60%" stopColor="#4F7A65" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#8C7654" stopOpacity="0.2" />
                </radialGradient>
              </defs>

              {/* Interactive Nodes and Value Circles */}
              {WHEEL_DIMENSIONS.map((dim, i) => {
                const val = scores[dim.id] || 5;
                const { x, y } = getCoordinates(i, val);
                const isHovered = activeDimension === dim.id;

                return (
                  <g
                    key={`node-${dim.id}`}
                    onMouseEnter={() => setActiveDimension(dim.id)}
                    onMouseLeave={() => setActiveDimension(null)}
                    className="cursor-pointer group"
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 7 : 4.5}
                      fill={dim.color}
                      stroke="#FFFFFF"
                      strokeWidth={isHovered ? '2.5' : '2'}
                      className="transition-all duration-200"
                    />
                  </g>
                );
              })}

              {/* Dimension Labels around perimeter */}
              {WHEEL_DIMENSIONS.map((dim, i) => {
                const angle = i * angleStep - Math.PI / 2;
                const labelRadius = maxRadius + 34;
                const lx = center + labelRadius * Math.cos(angle);
                const ly = center + labelRadius * Math.sin(angle);
                const val = scores[dim.id] || 5;
                const isHovered = activeDimension === dim.id;

                // Text alignment based on position
                let textAnchor = 'middle';
                if (Math.cos(angle) > 0.25) textAnchor = 'start';
                else if (Math.cos(angle) < -0.25) textAnchor = 'end';

                return (
                  <g
                    key={`label-${dim.id}`}
                    onMouseEnter={() => setActiveDimension(dim.id)}
                    onMouseLeave={() => setActiveDimension(null)}
                    className="cursor-pointer transition-all"
                  >
                    <text
                      x={lx}
                      y={ly - 2}
                      textAnchor={textAnchor}
                      className={`text-[10px] sm:text-[11px] font-medium transition-all ${
                        isHovered ? 'fill-[#242220] font-bold' : 'fill-[#5A534B]'
                      }`}
                    >
                      {dim.shortName}
                    </text>
                    <text
                      x={lx}
                      y={ly + 10}
                      textAnchor={textAnchor}
                      className={`text-[9px] font-mono font-bold ${
                        isHovered ? 'fill-[#385A48]' : 'fill-[#8C847A]'
                      }`}
                    >
                      {val}/10
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Quick instructions indicator */}
          <div className="flex items-center space-x-1.5 text-[11px] text-[#7A736A] mt-2">
            <Info className="w-3.5 h-3.5 text-[#A39C93]" />
            <span>Passe o mouse sobre os eixos ou clique em "Avaliar Semestre" para ajustar as notas de 1 a 10.</span>
          </div>
        </div>

        {/* Right Column: Key Balance Indicators + Quadrant Breakdown */}
        <div className="lg:col-span-6 space-y-4">
          {/* Diagnostic Stat Badges */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8]">
              <span className="text-[10px] font-semibold text-[#7A736A] uppercase tracking-wider block">
                Média Geral
              </span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="font-mono text-2xl font-bold text-[#242220]">{averageScore}</span>
                <span className="text-xs text-[#8A837A] font-mono">/10</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F2F7F3] border border-[#CFE0D3]">
              <span className="text-[10px] font-semibold text-[#2F523A] uppercase tracking-wider block flex items-center space-x-1">
                <TrendingUp className="w-3 h-3 text-[#2F523A]" />
                <span>Ponto Forte</span>
              </span>
              <span className="text-xs font-semibold text-[#1F3D28] block truncate mt-1" title={topDimension.name}>
                {topDimension.shortName} ({scores[topDimension.id]}/10)
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FDF5F2] border border-[#F0D5CA]">
              <span className="text-[10px] font-semibold text-[#914227] uppercase tracking-wider block flex items-center space-x-1">
                <AlertCircle className="w-3 h-3 text-[#914227]" />
                <span>Atenção</span>
              </span>
              <span className="text-xs font-semibold text-[#732F1A] block truncate mt-1" title={lowestDimension.name}>
                {lowestDimension.shortName} ({scores[lowestDimension.id]}/10)
              </span>
            </div>
          </div>

          {/* Quadrants Rating Inputs / Sliders */}
          <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E8E2D8] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#69635C]">
                {isEditing ? 'Ajuste das Notas (1 a 10)' : 'Resumo das 4 Dimensões'}
              </span>
              <span className="text-[11px] text-[#7A736A]">
                Base do radar semestral
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(['Qualidade de Vida', 'Pessoal', 'Profissional', 'Relacionamentos'] as const).map((quadrant) => {
                const quadrantDims = WHEEL_DIMENSIONS.filter((d) => d.quadrant === quadrant);
                const quadrantAverage = Math.round(
                  (quadrantDims.reduce((acc, d) => acc + (scores[d.id] || 0), 0) / quadrantDims.length) * 10
                ) / 10;

                return (
                  <div
                    key={quadrant}
                    className="p-3 rounded-xl bg-white border border-[#E6E0D5] space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#F0EBE2]">
                      <span className="text-xs font-semibold text-[#242220]">
                        {quadrant}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#385A48] bg-[#F2F7F3] px-2 py-0.5 rounded">
                        {quadrantAverage}
                      </span>
                    </div>

                    <div className="space-y-2 pt-0.5">
                      {quadrantDims.map((dim) => {
                        const val = scores[dim.id] || 5;
                        return (
                          <div
                            key={dim.id}
                            onMouseEnter={() => setActiveDimension(dim.id)}
                            onMouseLeave={() => setActiveDimension(null)}
                            className="space-y-1"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className={`truncate ${activeDimension === dim.id ? 'font-bold text-[#242220]' : 'text-[#5C554D]'}`}>
                                {dim.shortName}
                              </span>
                              <span className="font-mono font-semibold text-[#322E29] shrink-0 ml-1">
                                {val}
                              </span>
                            </div>

                            {/* Slider or progress bar */}
                            {isEditing ? (
                              <input
                                type="range"
                                min="1"
                                max="10"
                                value={val}
                                onChange={(e) => handleScoreChange(dim.id, Number(e.target.value))}
                                className="w-full h-1.5 bg-[#EAE3D7] rounded-lg appearance-none cursor-pointer accent-[#385A48]"
                              />
                            ) : (
                              <div className="w-full bg-[#EFEAE2] h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{
                                    width: `${(val / 10) * 100}%`,
                                    backgroundColor: dim.color,
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

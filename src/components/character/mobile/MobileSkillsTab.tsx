/**
 * MobileSkillsTab - Tab de perícias extraída do MobileCharacterSheet
 * Inclui filtros, busca e ordenação otimizados para mobile
 * Usa virtualização para performance em listas longas
 */

import { useState, useMemo, memo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  Search, 
  SortAsc, 
  Filter,
  Dices,
} from '@/components/icons/ordem-icons';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { SKILLS, getSkillBonus, TRAINING_LABELS } from '@/lib/character-data';
import { getSkillTrainingLevel, normalizeSkillId } from '@/lib/skill-training';
import { 
  getSkillAttributeAbbrev, 
  getAttributeColor,
  type SkillFilter,
  type SkillSort,
} from './utils';

interface MobileSkillsTabProps {
  skills?: Record<string, number>;
  onSkillRoll: (skillName: string) => void;
}

// Altura fixa de cada item para virtualização (em pixels)
const SKILL_ITEM_HEIGHT = 64;

// Item de perícia memoizado - agora com suporte a níveis de treinamento
const SkillItem = memo(function SkillItem({
  skill,
  trainingLevel, // 0=Destreinado, 1=Treinado, 2=Veterano, 3=Expert
  bonus,
  skillAttr,
  attrColor,
  onRoll,
  style,
}: {
  skill: string;
  trainingLevel: number;
  bonus: number;
  skillAttr: string;
  attrColor: string;
  onRoll: () => void;
  style?: React.CSSProperties;
}) {
  const isTrained = trainingLevel > 0;
  const isVeteran = trainingLevel === 2;
  const isExpert = trainingLevel === 3;
  const trainingLabel = TRAINING_LABELS[trainingLevel] || 'Destreinado';
  
  return (
    <div style={style} className="px-0.5 py-0.5">
      <button
        onClick={onRoll}
        className={cn(
          "w-full flex items-center justify-between p-2.5 rounded-lg transition-colors",
          isExpert
            ? "bg-amber-500/20 active:bg-amber-500/30"
            : isVeteran
              ? "bg-purple-500/20 active:bg-purple-500/30"
              : isTrained 
                ? "bg-muted/40 active:bg-muted/60" 
                : "bg-muted/20 active:bg-muted/40 opacity-70"
        )}
      >
        <div className="flex items-center gap-2">
          <span className={cn(
            "w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold",
            attrColor
          )}>
            {skillAttr}
          </span>
          <span className={cn(
            "text-sm capitalize",
            !isTrained && "text-muted-foreground"
          )}>
            {SKILLS.find(entry => entry.id === skill)?.name ?? skill}
            {SKILLS.find(entry => entry.id === skill)?.requiresTraining && !isTrained && <span className="block text-[10px] text-destructive normal-case">Exige treinamento</span>}
          </span>
          {isTrained && (
            <span className={cn(
              "text-[9px] px-1.5 py-0.5 rounded font-medium",
              isExpert
                ? "bg-amber-500/30 text-amber-400"
                : isVeteran
                  ? "bg-purple-500/30 text-purple-400"
                  : "bg-primary/20 text-primary"
            )}>
              {trainingLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-display text-lg",
            isExpert
              ? "text-amber-400"
              : isVeteran
                ? "text-purple-400"
                : isTrained ? "text-primary" : "text-muted-foreground"
          )}>
            {bonus >= 0 ? `+${bonus}` : bonus}
          </span>
          <Dices className="w-4 h-4 text-muted-foreground" />
        </div>
      </button>
    </div>
  );
});

export const MobileSkillsTab = memo(function MobileSkillsTab({ 
  skills = {}, 
  onSkillRoll,
}: MobileSkillsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SkillFilter>('all');
  const [sortBy, setSortBy] = useState<SkillSort>('bonus');
  
  // Ref para o container da lista virtualizada
  const parentRef = useRef<HTMLDivElement>(null);

  // Lista completa de perícias com bônus padrão 0
  const allSkills: Record<string, number> = useMemo(() => Object.fromEntries(
    SKILLS.map(skill => [skill.id, getSkillTrainingLevel(skills, skill.id)])
  ), [skills]);

  // Filtrar e ordenar perícias
  const filteredSkills = useMemo(() => {
    let entries = Object.entries(allSkills);

    // Aplicar filtro de busca
    if (searchQuery.trim()) {
      entries = entries.filter(([skill]) =>
        normalizeSkillId(skill).includes(normalizeSkillId(searchQuery))
      );
    }

    // Aplicar filtro por tipo
    if (activeFilter === 'trained') {
      entries = entries.filter(([_, bonus]) => bonus > 0);
    } else if (['AGI', 'FOR', 'INT', 'PRE', 'VIG'].includes(activeFilter)) {
      entries = entries.filter(([skill]) => getSkillAttributeAbbrev(skill) === activeFilter);
    }

    // Aplicar ordenação
    entries.sort((a, b) => {
      switch (sortBy) {
        case 'bonus':
          return b[1] - a[1];
        case 'alpha':
          return a[0].localeCompare(b[0]);
        case 'attribute':
          const attrA = getSkillAttributeAbbrev(a[0]);
          const attrB = getSkillAttributeAbbrev(b[0]);
          if (attrA !== attrB) return attrA.localeCompare(attrB);
          return b[1] - a[1];
        default:
          return 0;
      }
    });

    return entries;
  }, [allSkills, searchQuery, activeFilter, sortBy]);

  // Configuração do virtualizador
  const rowVirtualizer = useVirtualizer({
    count: filteredSkills.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => SKILL_ITEM_HEIGHT,
    overscan: 5, // Renderiza 5 itens extras acima/abaixo da viewport
  });

  // Contadores
  const trainedCount = Object.values(allSkills).filter(v => v > 0).length;
  const totalCount = Object.keys(allSkills).length;

  // Filtros disponíveis
  const filters: { id: SkillFilter; label: string; color?: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'trained', label: `Treinadas (${trainedCount})` },
    { id: 'AGI', label: 'AGI', color: 'bg-blue-500/20 text-blue-400' },
    { id: 'FOR', label: 'FOR', color: 'bg-orange-500/20 text-orange-400' },
    { id: 'INT', label: 'INT', color: 'bg-purple-500/20 text-purple-400' },
    { id: 'PRE', label: 'PRE', color: 'bg-pink-500/20 text-pink-400' },
    { id: 'VIG', label: 'VIG', color: 'bg-green-500/20 text-green-400' },
  ];

  // Opções de ordenação
  const sortOptions: { id: SkillSort; label: string }[] = [
    { id: 'bonus', label: 'Bônus' },
    { id: 'alpha', label: 'A-Z' },
    { id: 'attribute', label: 'Atributo' },
  ];

  // Handler memoizado
  const handleSkillClick = useCallback((skill: string) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onSkillRoll(skill);
  }, [onSkillRoll]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-3"
    >
      {/* Header com contador */}
      <div className="ordo-panel p-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground uppercase">PERÍCIAS</p>
          <span className="text-[10px] px-2 py-0.5 bg-primary/20 text-primary rounded-full">
            {trainedCount}/{totalCount} treinadas
          </span>
        </div>

        {/* Barra de busca */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar perícia..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-sm bg-background/50"
          />
        </div>

        {/* Filtros por atributo */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                "flex-shrink-0 px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all",
                activeFilter === filter.id
                  ? filter.color || "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Ordenação */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
          <SortAsc className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">Ordenar:</span>
          <div className="flex gap-1">
            {sortOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSortBy(option.id)}
                className={cn(
                  "px-2 py-1 rounded text-[10px] transition-all",
                  sortBy === option.id
                    ? "bg-secondary/20 text-detail-accent"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de perícias virtualizada */}
      <div className="ordo-panel p-3">
        {filteredSkills.length > 0 ? (
          <div 
            ref={parentRef}
            className="h-[calc(100vh-380px)] min-h-[300px] max-h-[500px] overflow-auto overscroll-contain touch-pan-y"
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const [skill, trainingLevel] = filteredSkills[virtualRow.index];
                const skillAttr = getSkillAttributeAbbrev(skill);
                const attrColor = getAttributeColor(skillAttr);
                // Converter nível de treinamento para bônus
                const bonus = getSkillBonus(trainingLevel);
                
                return (
                  <SkillItem
                    key={skill}
                    skill={skill}
                    trainingLevel={trainingLevel}
                    bonus={bonus}
                    skillAttr={skillAttr}
                    attrColor={attrColor}
                    onRoll={() => handleSkillClick(skill)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Filter className="w-10 h-10 mx-auto text-foreground/40 mb-2" />
            <p className="text-foreground/70 text-sm">Nenhuma perícia encontrada.</p>
            <p className="text-[10px] text-foreground/60 mt-1">
              Tente ajustar os filtros
            </p>
          </div>
        )}
      </div>
      
      {/* Dica de uso */}
      <div className="px-3 py-2 bg-primary/5 rounded-lg border border-primary/20">
        <p className="text-[10px] text-muted-foreground text-center">
          💡 Toque em uma perícia para rolar o teste
        </p>
      </div>
    </motion.div>
  );
});

export default MobileSkillsTab;

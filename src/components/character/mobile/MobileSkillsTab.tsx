/**
 * MobileSkillsTab - Tab de perícias extraída do MobileCharacterSheet
 * Inclui filtros, busca e ordenação otimizados para mobile
 */

import { useState, useMemo, memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  SortAsc, 
  Filter,
  Dices,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
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

// Item de perícia memoizado
const SkillItem = memo(function SkillItem({
  skill,
  bonus,
  skillAttr,
  attrColor,
  isTrained,
  onRoll,
}: {
  skill: string;
  bonus: number;
  skillAttr: string;
  attrColor: string;
  isTrained: boolean;
  onRoll: () => void;
}) {
  return (
    <button
      onClick={onRoll}
      className={cn(
        "w-full flex items-center justify-between p-2.5 rounded-lg transition-colors",
        isTrained 
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
          {skill.replace(/_/g, ' ')}
        </span>
        {isTrained && (
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className={cn(
          "font-display text-lg",
          isTrained ? "text-primary" : "text-muted-foreground"
        )}>
          {bonus >= 0 ? `+${bonus}` : bonus}
        </span>
        <Dices className="w-4 h-4 text-muted-foreground" />
      </div>
    </button>
  );
});

export const MobileSkillsTab = memo(function MobileSkillsTab({ 
  skills = {}, 
  onSkillRoll,
}: MobileSkillsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SkillFilter>('all');
  const [sortBy, setSortBy] = useState<SkillSort>('bonus');

  // Lista completa de perícias com bônus padrão 0
  const allSkills: Record<string, number> = useMemo(() => ({
    // Agilidade
    'acrobacia': skills['acrobacia'] || 0,
    'furtividade': skills['furtividade'] || 0,
    'pilotagem': skills['pilotagem'] || 0,
    'pontaria': skills['pontaria'] || 0,
    'reflexos': skills['reflexos'] || 0,
    // Força
    'atletismo': skills['atletismo'] || 0,
    'luta': skills['luta'] || 0,
    // Intelecto
    'atualidades': skills['atualidades'] || 0,
    'ciências': skills['ciências'] || 0,
    'investigação': skills['investigação'] || 0,
    'medicina': skills['medicina'] || 0,
    'ocultismo': skills['ocultismo'] || 0,
    'profissão': skills['profissão'] || 0,
    'sobrevivência': skills['sobrevivência'] || 0,
    'tática': skills['tática'] || 0,
    'tecnologia': skills['tecnologia'] || 0,
    // Presença
    'artes': skills['artes'] || 0,
    'diplomacia': skills['diplomacia'] || 0,
    'enganação': skills['enganação'] || 0,
    'intimidação': skills['intimidação'] || 0,
    'intuição': skills['intuição'] || 0,
    'percepção': skills['percepção'] || 0,
    'vontade': skills['vontade'] || 0,
    // Vigor
    'fortitude': skills['fortitude'] || 0,
  }), [skills]);

  // Filtrar e ordenar perícias
  const filteredSkills = useMemo(() => {
    let entries = Object.entries(allSkills);

    // Aplicar filtro de busca
    if (searchQuery.trim()) {
      entries = entries.filter(([skill]) =>
        skill.toLowerCase().includes(searchQuery.toLowerCase())
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
                    ? "bg-secondary/20 text-secondary"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de perícias */}
      <div className="ordo-panel p-3">
        {filteredSkills.length > 0 ? (
          <div className="space-y-1">
            {filteredSkills.map(([skill, bonus]) => {
              const skillAttr = getSkillAttributeAbbrev(skill);
              const attrColor = getAttributeColor(skillAttr);
              const isTrained = bonus > 0;
              
              return (
                <SkillItem
                  key={skill}
                  skill={skill}
                  bonus={bonus}
                  skillAttr={skillAttr}
                  attrColor={attrColor}
                  isTrained={isTrained}
                  onRoll={() => handleSkillClick(skill)}
                />
              );
            })}
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

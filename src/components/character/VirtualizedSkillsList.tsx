/**
 * VirtualizedSkillsList - Lista virtualizada de perícias
 * 
 * Otimiza a renderização de listas longas de perícias usando
 * virtualização para melhor performance em dispositivos modestos.
 * 
 * @module components/character/VirtualizedSkillsList
 */

import React, { memo, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';
import { TRAINING_BONUS_MAP, TRAINING_LABELS } from '@/lib/character-data';
import { type SkillOriginInfo, getSkillOriginStyle } from '@/lib/skill-origins';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Altura estimada de cada item de perícia
const SKILL_ITEM_HEIGHT = 48;

// Interface para bônus de perícia consolidados
interface SkillBonusEntry {
  total: number;
  breakdown?: Array<{ source: string; value: number | string }>;
}

// Tipo para uma perícia
interface Skill {
  id: string;
  name: string;
  attribute: string;
}

interface VirtualizedSkillsListProps {
  skills: Skill[];
  skillLevels: Record<string, number>;
  attrValue: number;
  attrColor: string;
  skillBonuses: Record<string, SkillBonusEntry>;
  skillOrigins: Record<string, SkillOriginInfo>;
  globalDiceBonus: number;
  onRoll?: (total: number, skillName: string, attributeValue: number, classPowerBonus?: number, extraDice?: number) => void;
  maxHeight?: number;
}

// D20 Icon compacto
const D20Icon = memo(function D20Icon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={cn("w-4 h-4", className)}
      style={style}
    >
      <path d="M12 2L2 7L12 12L22 7L12 2Z" />
      <path d="M2 17L12 22L22 17L12 12L2 17Z" opacity="0.7" />
      <path d="M2 7V17L12 12V2L2 7Z" opacity="0.5" />
      <path d="M22 7V17L12 12V2L22 7Z" opacity="0.5" />
    </svg>
  );
});

// Componente de item de perícia memoizado
const SkillItem = memo(function SkillItem({
  skill,
  trainingLevel,
  attrValue,
  attrColor,
  classPowerBonus,
  globalDiceBonus,
  origin,
  onRoll,
  style,
}: {
  skill: Skill;
  trainingLevel: number;
  attrValue: number;
  attrColor: string;
  classPowerBonus: number;
  globalDiceBonus: number;
  origin?: SkillOriginInfo;
  onRoll?: (total: number, skillName: string, attributeValue: number, classPowerBonus?: number, extraDice?: number) => void;
  style?: React.CSSProperties;
}) {
  const isTrained = trainingLevel > 0;
  const trainingBonus = TRAINING_BONUS_MAP[trainingLevel] || 0;
  const trainingLabel = TRAINING_LABELS[trainingLevel] || 'Destreinado';
  const displayBonus = trainingBonus + classPowerBonus;
  const rollTotal = attrValue + displayBonus;
  
  const isVeteran = trainingLevel === 2;
  const isExpert = trainingLevel === 3;
  
  const originStyle = origin ? getSkillOriginStyle(origin.type) : null;
  
  const getTooltipText = () => {
    if (!origin) {
      return isTrained ? 'Origem: Desconhecida' : 'Perícia não treinada';
    }
    
    const sourceLabels: Record<string, string> = {
      origin: 'Origem',
      class_mandatory: 'Classe (obrigatória)',
      class_choice: 'Classe (escolha)',
      free: 'Perícia Livre',
      power_training: 'Poder',
      unknown: 'Desconhecida',
    };
    
    let text = `${sourceLabels[origin.type]}: ${origin.source}`;
    if (origin.upgradedBy) {
      text += `\nAprimorada por: ${origin.upgradedBy}`;
    }
    return text;
  };

  const handleClick = useCallback(() => {
    onRoll?.(rollTotal, skill.name, attrValue, classPowerBonus, globalDiceBonus);
  }, [onRoll, rollTotal, skill.name, attrValue, classPowerBonus, globalDiceBonus]);

  return (
    <div style={style} className="px-0.5 py-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "group flex items-center justify-between",
              "p-2 rounded-lg cursor-pointer",
              "transition-all duration-200",
              isExpert
                ? "bg-amber-500/20 hover:bg-amber-500/30"
                : isVeteran
                  ? "bg-purple-500/20 hover:bg-purple-500/30"
                  : isTrained 
                    ? "bg-secondary/30 hover:bg-secondary/50" 
                    : classPowerBonus > 0
                      ? "bg-primary/10 hover:bg-primary/20"
                      : "hover:bg-muted/30"
            )}
            onClick={handleClick}
          >
            <div className="flex items-center gap-2">
              {/* Ícone de origem */}
              {isTrained && originStyle && (
                <span className="text-xs" title={origin?.source}>
                  {originStyle.icon}
                </span>
              )}
              <span className={cn(
                "text-sm",
                (isTrained || classPowerBonus > 0) ? "font-medium" : "text-muted-foreground"
              )}>
                {skill.name}
              </span>
              {isTrained && (
                <span 
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-medium",
                    isExpert 
                      ? "bg-amber-500/30 text-amber-400"
                      : isVeteran
                        ? "bg-purple-500/30 text-purple-400"
                        : ""
                  )}
                  style={!isExpert && !isVeteran ? { backgroundColor: `${attrColor}20`, color: attrColor } : undefined}
                >
                  {trainingLabel}
                </span>
              )}
              {classPowerBonus > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                  +{classPowerBonus} poder
                </span>
              )}
              {globalDiceBonus > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 animate-pulse font-medium">
                  +{globalDiceBonus}d20
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span 
                className={cn(
                  "font-display text-lg",
                  isExpert
                    ? "text-amber-400"
                    : isVeteran
                      ? "text-purple-400"
                      : (isTrained || classPowerBonus > 0) ? "" : "text-muted-foreground"
                )}
                style={!isExpert && !isVeteran && (isTrained || classPowerBonus > 0) ? { color: attrColor } : undefined}
              >
                +{displayBonus}
              </span>
              
              <div className="opacity-0 group-hover:opacity-100 group-hover:rotate-12 transition-all duration-200">
                <D20Icon className="w-4 h-4 text-destructive" />
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-[200px]">
          <div className="space-y-1">
            <p className="font-medium">{skill.name}</p>
            <p className="text-xs text-muted-foreground whitespace-pre-line">
              {getTooltipText()}
            </p>
            {isTrained && (
              <p className="text-xs">
                Bônus: <span className="font-medium text-primary">+{trainingBonus}</span>
                {classPowerBonus > 0 && (
                  <span className="text-green-400"> (+{classPowerBonus} poder)</span>
                )}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
});

/**
 * Lista virtualizada de perícias
 * Renderiza apenas os itens visíveis para melhor performance
 */
export const VirtualizedSkillsList = memo(function VirtualizedSkillsList({
  skills,
  skillLevels,
  attrValue,
  attrColor,
  skillBonuses,
  skillOrigins,
  globalDiceBonus,
  onRoll,
  maxHeight = 300,
}: VirtualizedSkillsListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: skills.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => SKILL_ITEM_HEIGHT,
    overscan: 3,
  });

  // Se poucos itens, não virtualiza
  if (skills.length <= 8) {
    return (
      <TooltipProvider delayDuration={300}>
        <div className="space-y-1">
          {skills.map((skill) => {
            const trainingLevel = skillLevels[skill.id] || 0;
            const classPowerBonus = skillBonuses[skill.id]?.total || 0;
            const origin = skillOrigins[skill.id];
            
            return (
              <SkillItem
                key={skill.id}
                skill={skill}
                trainingLevel={trainingLevel}
                attrValue={attrValue}
                attrColor={attrColor}
                classPowerBonus={classPowerBonus}
                globalDiceBonus={globalDiceBonus}
                origin={origin}
                onRoll={onRoll}
              />
            );
          })}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div
        ref={parentRef}
        className="overflow-auto scrollbar-hide"
        style={{ maxHeight }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const skill = skills[virtualRow.index];
            const trainingLevel = skillLevels[skill.id] || 0;
            const classPowerBonus = skillBonuses[skill.id]?.total || 0;
            const origin = skillOrigins[skill.id];
            
            return (
              <SkillItem
                key={skill.id}
                skill={skill}
                trainingLevel={trainingLevel}
                attrValue={attrValue}
                attrColor={attrColor}
                classPowerBonus={classPowerBonus}
                globalDiceBonus={globalDiceBonus}
                origin={origin}
                onRoll={onRoll}
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
    </TooltipProvider>
  );
});

export default VirtualizedSkillsList;

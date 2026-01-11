/**
 * SkillsByAttribute - Perícias organizadas por atributo base
 * Com d20 vermelho para rolar cada perícia
 * Inclui tooltips mostrando a origem do treinamento
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Filter, Info } from 'lucide-react';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SKILLS, TRAINING_BONUS_MAP, TRAINING_LABELS } from '@/lib/character-data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { type SkillOriginInfo, getSkillOriginStyle } from '@/lib/skill-origins';

// Interface para bônus de perícia consolidados (do sistema unificado)
interface SkillBonusEntry {
  total: number;
  breakdown?: Array<{ source: string; value: number | string }>;
}

interface SkillsByAttributeProps {
  skills: Record<string, number>;
  attributes: Record<string, number>;
  onRoll?: (total: number, skillName: string, attributeValue: number, classPowerBonus?: number) => void;
  className?: string;
  // Bônus consolidados de poderes de classe (Perito, Versatilidade, etc.)
  skillBonuses?: Record<string, SkillBonusEntry>;
  // Origens das perícias (calculadas pelo CharacterSheet)
  skillOrigins?: Record<string, SkillOriginInfo>;
}

// Nomes dos atributos
const ATTRIBUTE_NAMES: Record<string, string> = {
  agility: 'Agilidade',
  strength: 'Força',
  intellect: 'Intelecto',
  presence: 'Presença',
  vigor: 'Vigor',
};

// Abreviações
const ATTRIBUTE_ABBR: Record<string, string> = {
  agility: 'AGI',
  strength: 'FOR',
  intellect: 'INT',
  presence: 'PRE',
  vigor: 'VIG',
};

// Cores dos atributos
const ATTRIBUTE_COLORS: Record<string, string> = {
  agility: 'hsl(var(--attr-agility))',
  strength: 'hsl(var(--attr-strength))',
  intellect: 'hsl(var(--attr-intellect))',
  presence: 'hsl(var(--attr-presence))',
  vigor: 'hsl(var(--attr-vigor))',
};

// D20 Icon simples
function D20Icon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={cn("w-5 h-5", className)}
      style={style}
    >
      <path d="M12 2L2 7L12 12L22 7L12 2Z" />
      <path d="M2 17L12 22L22 17L12 12L2 17Z" opacity="0.7" />
      <path d="M2 7V17L12 12V2L2 7Z" opacity="0.5" />
      <path d="M22 7V17L12 12V2L22 7Z" opacity="0.5" />
    </svg>
  );
}

function SkillsByAttributeComponent({
  skills,
  attributes,
  onRoll,
  className,
  skillBonuses = {},
  skillOrigins = {},
}: SkillsByAttributeProps) {
  // Estado de pesquisa e filtro
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyTrained, setShowOnlyTrained] = useState(false);
  
  // Estados de abertura dos grupos
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    agility: true,
    strength: false,
    intellect: true,
    presence: false,
    vigor: false,
  });

  // Agrupar perícias por atributo
  const skillsByAttr = useMemo(() => {
    const grouped: Record<string, typeof SKILLS> = {
      agility: [],
      strength: [],
      intellect: [],
      presence: [],
      vigor: [],
    };
    
    // Filtrar por pesquisa e treino
    const query = searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    SKILLS.forEach(skill => {
      // Filtrar por pesquisa
      if (query) {
        const name = skill.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (!name.includes(query)) return;
      }
      // Filtrar apenas treinadas
      if (showOnlyTrained && !(skills[skill.id] > 0)) return;
      
      if (grouped[skill.attribute]) {
        grouped[skill.attribute].push(skill);
      }
    });
    
    return grouped;
  }, [searchQuery, showOnlyTrained, skills]);

  // Toggle grupo
  const toggleGroup = (attr: string) => {
    setOpenGroups(prev => ({ ...prev, [attr]: !prev[attr] }));
  };

  return (
    <div className={cn("sheet-panel p-4 space-y-4", className)}>
      <h3 className="font-display text-sm tracking-wider text-primary uppercase">
        Perícias
      </h3>
      
      {/* Barra de pesquisa e filtro */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar perícia..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 bg-muted/30 border-border focus:border-primary h-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
        
        {/* Botão de filtro treinadas */}
        <Button
          variant={showOnlyTrained ? "default" : "outline"}
          size="sm"
          onClick={() => setShowOnlyTrained(!showOnlyTrained)}
          className="h-9 gap-1.5 shrink-0"
        >
          <Filter className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Treinadas</span>
        </Button>
      </div>

      {/* Legenda de origens com tooltips */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground px-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-1 cursor-help hover:text-foreground transition-colors">
              <span>📜</span> Origem
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[200px]">
            <p className="text-xs">Perícia concedida pela origem do personagem durante a criação.</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-1 cursor-help hover:text-foreground transition-colors">
              <span>⚔️</span> Classe
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[200px]">
            <p className="text-xs">Perícia obrigatória ou escolhida como parte da classe do personagem.</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-1 cursor-help hover:text-foreground transition-colors">
              <span>📚</span> Livre
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[200px]">
            <p className="text-xs">Perícia adquirida com pontos de perícia livres disponíveis na criação ou progressão.</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-1 cursor-help hover:text-foreground transition-colors">
              <span>✨</span> Poder
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[200px]">
            <p className="text-xs">Perícia concedida pelo poder "Treinamento em Perícia" ou similar.</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Grupos por atributo */}
      <div className="space-y-2">
        {Object.entries(skillsByAttr).map(([attr, attrSkills]) => {
          if (attrSkills.length === 0) return null;
          
          const attrValue = attributes[attr] || 0;
          const color = ATTRIBUTE_COLORS[attr];
          const isOpen = openGroups[attr] || searchQuery.length > 0;
          
          // Contar perícias treinadas
          const trainedCount = attrSkills.filter(s => skills[s.id] > 0).length;
          
          return (
            <Collapsible
              key={attr}
              open={isOpen}
              onOpenChange={() => !searchQuery && toggleGroup(attr)}
            >
              <CollapsibleTrigger asChild>
                <motion.div
                  className={cn(
                    "flex items-center justify-between",
                    "p-3 rounded-lg cursor-pointer",
                    "sheet-panel-inner hover:border-primary/30",
                    "transition-all duration-200"
                  )}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center gap-3">
                    {/* D20 com cor do atributo */}
                    <D20Icon style={{ color }} className="opacity-70" />
                    
                    {/* Nome do atributo */}
                    <span className="font-display text-sm tracking-wider" style={{ color }}>
                      {ATTRIBUTE_NAMES[attr]}
                    </span>
                    
                    {/* Valor do atributo */}
                    <span 
                      className="text-xs px-2 py-0.5 rounded font-display"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      +{attrValue}
                    </span>
                    
                    {/* Contador de treinadas */}
                    {trainedCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({trainedCount} treinada{trainedCount > 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                  
                  <ChevronDown 
                    className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                </motion.div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="pl-4 pt-2 space-y-1">
                <TooltipProvider delayDuration={300}>
                  {attrSkills.map((skill) => {
                    // Nível de treinamento: 0=Destreinado, 1=Treinado, 2=Veterano, 3=Expert
                    const trainingLevel = skills[skill.id] || 0;
                    const isTrained = trainingLevel > 0;
                    // Bônus de treinamento baseado no nível real (0, 5, 10, 15)
                    const trainingBonus = TRAINING_BONUS_MAP[trainingLevel] || 0;
                    // Label do nível de treinamento
                    const trainingLabel = TRAINING_LABELS[trainingLevel] || 'Destreinado';
                    // Bônus de poderes de classe (Perito, Versatilidade, etc.)
                    const classPowerBonus = skillBonuses[skill.id]?.total || 0;
                    // Total exibido = treinamento + poderes de classe
                    const displayBonus = trainingBonus + classPowerBonus;
                    // Total para rolagem inclui atributo
                    const rollTotal = attrValue + displayBonus;
                    
                    // Cores especiais para níveis superiores
                    const isVeteran = trainingLevel === 2;
                    const isExpert = trainingLevel === 3;
                    
                    // Origem da perícia para tooltip
                    const origin = skillOrigins[skill.id];
                    const originStyle = origin ? getSkillOriginStyle(origin.type) : null;
                    
                    // Texto do tooltip
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
                    
                    return (
                      <Tooltip key={skill.id}>
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
                            onClick={() => onRoll?.(rollTotal, skill.name, attrValue, classPowerBonus)}
                          >
                            <div className="flex items-center gap-2">
                              {/* Ícone de origem (apenas se treinada) */}
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
                                  style={!isExpert && !isVeteran ? { backgroundColor: `${color}20`, color } : undefined}
                                >
                                  {trainingLabel}
                                </span>
                              )}
                              {/* Indicador de bônus de poder de classe */}
                              {classPowerBonus > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                                  +{classPowerBonus} poder
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
                                style={!isExpert && !isVeteran && (isTrained || classPowerBonus > 0) ? { color } : undefined}
                              >
                                +{displayBonus}
                              </span>
                              
                              {/* D20 vermelho no hover */}
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
                    );
                  })}
                </TooltipProvider>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}

export const SkillsByAttribute = React.memo(SkillsByAttributeComponent);

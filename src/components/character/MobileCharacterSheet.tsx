/**
 * MobileCharacterSheet - Versão compacta da ficha para dispositivos móveis
 * Usa abas deslizantes e layout otimizado para telas pequenas
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Swords, 
  Dices, 
  Package,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Heart,
  Zap,
  Brain,
  Shield,
  Footprints,
  Moon,
  ArrowUp,
  Home,
  Scroll,
  Search,
  SortAsc,
  Filter,
  ChevronRight,
  Gamepad2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AnimatedProgress } from '@/components/ui/animated-progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ORIGINS, getTrackById } from '@/lib/character-data';
import { getPELimitByNex } from '@/lib/dice-roller';
import { PowerDetailModal, PowerDetailData, PowerType } from './PowerDetailModal';
import { ALL_RITUALS } from '@/lib/rituals-data';
import { ALL_CLASS_ABILITIES } from '@/lib/class-abilities';
import { useDefenseBonuses } from '@/hooks/useDefenseBonuses';
import { useCharacterBonusSummary } from '@/hooks/useCharacterBonusSummary';
import { useSustainedRituals } from '@/hooks/useSustainedRituals';
import { BonusSummaryCard } from './BonusSummaryCard';

// Tipos
interface MobileCharacterSheetProps {
  character: {
    id: string;
    name: string;
    class: string;
    class_track?: string | null;
    origin: string;
    nex: number;
    patent: string;
    photo_url?: string | null;
    hp_current: number;
    hp_max: number;
    pe_current: number;
    pe_max: number;
    san_current: number;
    san_max: number;
    defense: number;
    movement: number;
    agility: number;
    strength: number;
    intellect: number;
    presence: number;
    vigor: number;
    conditions: string[];
    abilities: string[];
    powers: Array<{ name: string; description: string }>;
    rituals: string[];
    skills?: Record<string, number>;
    // Novos campos para exibição completa
    paranormal_powers?: Array<{ id: string; name: string; element: string; description: string }>;
    general_powers?: Array<{ id: string; name: string; description: string; category?: string }>;
    inventory?: Array<{ id?: string; name: string; category: string; slots: number; itemType?: string; isEquipped?: boolean; equipSlot?: string; armorType?: string }>;
  };
  onOpenDiceRoller: () => void;
  onOpenRest: () => void;
  onLevelUp: () => void;
  onEditStats: () => void;
  onOpenSkills?: () => void;
  onOpenInventory?: () => void;
  onOpenSession?: () => void;
}

// Seção colapsável
interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
}

function CollapsibleSection({ 
  title, 
  icon, 
  children, 
  defaultOpen = false,
  badge 
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-3 bg-card/50",
          isOpen && "border-b border-border"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-primary">{icon}</span>
          <span className="font-display text-sm tracking-wider">{title}</span>
          {badge !== undefined && (
            <span className="px-1.5 py-0.5 text-[10px] bg-primary/20 text-primary rounded">
              {badge}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-card/30">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper: Determina o atributo de cada perícia
function getSkillAttribute(skill: string): string {
  const skillMap: Record<string, string> = {
    // Agilidade
    'acrobacia': 'AGI', 'furtividade': 'AGI', 'pilotagem': 'AGI',
    'pontaria': 'AGI', 'reflexos': 'AGI',
    // Força
    'atletismo': 'FOR', 'luta': 'FOR',
    // Intelecto
    'atualidades': 'INT', 'ciências': 'INT', 'investigação': 'INT',
    'medicina': 'INT', 'ocultismo': 'INT', 'profissão': 'INT',
    'sobrevivência': 'INT', 'tática': 'INT', 'tecnologia': 'INT',
    // Presença
    'artes': 'PRE', 'diplomacia': 'PRE', 'enganação': 'PRE',
    'intimidação': 'PRE', 'intuição': 'PRE', 'percepção': 'PRE',
    'vontade': 'PRE',
    // Vigor
    'fortitude': 'VIG',
  };
  return skillMap[skill.toLowerCase()] || 'INT';
}

// Helper: Retorna classe de cor para cada atributo
function getAttributeColor(attr: string): string {
  const colors: Record<string, string> = {
    'AGI': 'bg-blue-500/20 text-blue-400',
    'FOR': 'bg-orange-500/20 text-orange-400',
    'INT': 'bg-purple-500/20 text-purple-400',
    'PRE': 'bg-pink-500/20 text-pink-400',
    'VIG': 'bg-green-500/20 text-green-400',
  };
  return colors[attr] || 'bg-muted text-muted-foreground';
}

// Helper: Retorna ícone emoji para cada elemento paranormal
function getElementIcon(element: string): string {
  const icons: Record<string, string> = {
    'sangue': '🩸',
    'morte': '💀',
    'conhecimento': '📖',
    'energia': '⚡',
  };
  return icons[element.toLowerCase()] || '✨';
}

// Helper: Retorna classes de cor para cada elemento
function getElementColor(element: string): string {
  const colors: Record<string, string> = {
    'sangue': 'bg-red-500/10 border-red-500/30',
    'morte': 'bg-purple-500/10 border-purple-500/30',
    'conhecimento': 'bg-blue-500/10 border-blue-500/30',
    'energia': 'bg-yellow-500/10 border-yellow-500/30',
  };
  return colors[element.toLowerCase()] || 'bg-paranormal/10 border-paranormal/30';
}

// Helper: Retorna ícone JSX para tipo de item
function getItemIcon(type: string): React.ReactNode {
  const icons: Record<string, string> = {
    'weapon': '⚔️',
    'armor': '🛡️',
    'medical': '💊',
    'investigation': '🔍',
    'communication': '📡',
    'field': '🎒',
    'paranormal': '✨',
    'document': '📄',
    'survival': '⛺',
    'I': '🟢',
    'II': '🔵',
    'III': '🟣',
    'IV': '🔴',
    '0': '⚪',
  };
  return <span className="text-base">{icons[type] || '📦'}</span>;
}

// Helper: Retorna cor para categoria de item
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    '0': 'bg-muted text-muted-foreground',
    'I': 'bg-green-500/20 text-green-400',
    'II': 'bg-blue-500/20 text-blue-400',
    'III': 'bg-purple-500/20 text-purple-400',
    'IV': 'bg-red-500/20 text-red-400',
  };
  return colors[category] || 'bg-muted text-muted-foreground';
}

// Tab de navegação mobile
type MobileTab = 'overview' | 'skills' | 'powers' | 'inventory';

// Tipos de filtro e ordenação para perícias
type SkillFilter = 'all' | 'trained' | 'AGI' | 'FOR' | 'INT' | 'PRE' | 'VIG';
type SkillSort = 'bonus' | 'alpha' | 'attribute';

// Componente de conteúdo das perícias com filtros
interface SkillsTabContentProps {
  character: MobileCharacterSheetProps['character'];
  onOpenDiceRoller: () => void;
}

function SkillsTabContent({ character, onOpenDiceRoller }: SkillsTabContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SkillFilter>('all');
  const [sortBy, setSortBy] = useState<SkillSort>('bonus');

  // Lista completa de perícias com bônus padrão 0
  const allSkills: Record<string, number> = useMemo(() => ({
    // Agilidade
    'acrobacia': character.skills?.['acrobacia'] || 0,
    'furtividade': character.skills?.['furtividade'] || 0,
    'pilotagem': character.skills?.['pilotagem'] || 0,
    'pontaria': character.skills?.['pontaria'] || 0,
    'reflexos': character.skills?.['reflexos'] || 0,
    // Força
    'atletismo': character.skills?.['atletismo'] || 0,
    'luta': character.skills?.['luta'] || 0,
    // Intelecto
    'atualidades': character.skills?.['atualidades'] || 0,
    'ciências': character.skills?.['ciências'] || 0,
    'investigação': character.skills?.['investigação'] || 0,
    'medicina': character.skills?.['medicina'] || 0,
    'ocultismo': character.skills?.['ocultismo'] || 0,
    'profissão': character.skills?.['profissão'] || 0,
    'sobrevivência': character.skills?.['sobrevivência'] || 0,
    'tática': character.skills?.['tática'] || 0,
    'tecnologia': character.skills?.['tecnologia'] || 0,
    // Presença
    'artes': character.skills?.['artes'] || 0,
    'diplomacia': character.skills?.['diplomacia'] || 0,
    'enganação': character.skills?.['enganação'] || 0,
    'intimidação': character.skills?.['intimidação'] || 0,
    'intuição': character.skills?.['intuição'] || 0,
    'percepção': character.skills?.['percepção'] || 0,
    'vontade': character.skills?.['vontade'] || 0,
    // Vigor
    'fortitude': character.skills?.['fortitude'] || 0,
  }), [character.skills]);

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
      entries = entries.filter(([skill]) => getSkillAttribute(skill) === activeFilter);
    }

    // Aplicar ordenação
    entries.sort((a, b) => {
      switch (sortBy) {
        case 'bonus':
          return b[1] - a[1]; // Maior bônus primeiro
        case 'alpha':
          return a[0].localeCompare(b[0]); // Alfabética
        case 'attribute':
          const attrA = getSkillAttribute(a[0]);
          const attrB = getSkillAttribute(b[0]);
          if (attrA !== attrB) return attrA.localeCompare(attrB);
          return b[1] - a[1]; // Dentro do mesmo atributo, ordena por bônus
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

  return (
    <motion.div
      key="skills"
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
              const skillAttr = getSkillAttribute(skill);
              const attrColor = getAttributeColor(skillAttr);
              const isTrained = bonus > 0;
              
              return (
                <button
                  key={skill}
                  onClick={onOpenDiceRoller}
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
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <Filter className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground text-sm">Nenhuma perícia encontrada.</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
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
}

// Componente principal
export function MobileCharacterSheet({
  character,
  onOpenDiceRoller,
  onOpenRest,
  onLevelUp,
  onEditStats,
  onOpenSession,
}: MobileCharacterSheetProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>('overview');
  const [powerModalOpen, setPowerModalOpen] = useState(false);
  const [selectedPower, setSelectedPower] = useState<PowerDetailData | null>(null);
  
  const originData = ORIGINS.find(o => o.id === character.origin);
  const trackData = character.class_track ? getTrackById(character.class_track) : null;
  const peLimit = getPELimitByNex(character.nex);

  // Estados críticos
  const hpPercent = (character.hp_current / character.hp_max) * 100;
  const sanPercent = (character.san_current / character.san_max) * 100;
  const isHpLow = hpPercent <= 25;
  const isSanLow = sanPercent <= 30;

  // Calcular bônus de defesa de origem, habilidades de classe e poderes gerais
  const defenseBonuses = useDefenseBonuses({
    origin: character.origin,
    abilities: character.abilities,
    generalPowers: character.general_powers || [],
    inventory: character.inventory || [],
  });

  // Hook reativo de rituais sustentados (com realtime para defesa)
  const { rituals: sustainedRituals } = useSustainedRituals({
    characterId: character.id,
    enabled: true,
  });

  // Converte rituais sustentados para formato de defesa
  const activeRitualsForDefense = useMemo(() => 
    sustainedRituals.map(r => ({
      ritualId: r.ritualId,
      ritualName: r.ritualName,
      enhancements: r.selectedEnhancements,
    })),
    [sustainedRituals]
  );

  // Hook de resumo de todos os bônus do personagem (incluindo rituais ativos)
  const bonusSummary = useCharacterBonusSummary({
    origin: character.origin,
    abilities: character.abilities,
    generalPowers: character.general_powers || [],
    paranormalPowers: character.paranormal_powers || [],
    inventory: character.inventory || [],
    nex: character.nex,
    elementalAffinity: null,
    affinityActive: false,
    activeRituals: activeRitualsForDefense, // Agora passa rituais ativos!
  });

  // Defesa total com TODOS os bônus (origem, habilidades, poderes, paranormais, rituais)
  const totalDefense = character.defense + bonusSummary.defense.total;

  // Handler para abrir modal de detalhes do poder
  const handlePowerClick = (power: PowerDetailData) => {
    setSelectedPower(power);
    setPowerModalOpen(true);
  };

  // Buscar descrição de habilidade de classe pelo nome
  const getAbilityDescription = (abilityName: string): string => {
    const ability = ALL_CLASS_ABILITIES.find(a => a.name === abilityName);
    return ability?.description || '';
  };

  // Buscar dados completos do ritual pelo nome
  const getRitualData = (ritualName: string) => {
    return ALL_RITUALS.find(r => r.name === ritualName || r.id === ritualName);
  };

  return (
    <div className="pb-20">
      {/* Conteúdo baseado na tab ativa */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            {/* Header compacto com foto e stats principais */}
            <div className="ordo-panel p-3">
              <div className="flex gap-3">
                {/* Foto pequena */}
                <div className="w-16 h-16 rounded-lg bg-secondary/20 border border-border flex-shrink-0 overflow-hidden">
                  {character.photo_url ? (
                    <img 
                      src={character.photo_url} 
                      alt={character.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Info básica */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground">
                        {character.class} • {originData?.name || character.origin}
                      </p>
                      {trackData && (
                        <p className="text-[10px] text-primary flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {trackData.name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-display text-2xl text-secondary">{character.nex}%</p>
                      <span className="patent-badge text-[9px]">{character.patent}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de ação rápida */}
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenDiceRoller}
                  className="flex-1 text-xs"
                >
                  <Dices className="w-4 h-4 mr-1" />
                  Rolar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenRest}
                  className="flex-1 text-xs"
                >
                  <Moon className="w-4 h-4 mr-1" />
                  Descanso
                </Button>
                {onOpenSession && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onOpenSession}
                    className="flex-1 text-xs"
                  >
                    <Gamepad2 className="w-4 h-4 mr-1" />
                    Sessão
                  </Button>
                )}
                {character.nex < 99 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onLevelUp}
                    className="text-xs text-primary border-primary/50"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Barras de recursos */}
            <div className="ordo-panel p-3 space-y-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">RECURSOS</span>
                <Button variant="ghost" size="sm" onClick={onEditStats} className="h-6 text-[10px]">
                  Editar
                </Button>
              </div>

              {/* HP */}
              <div className="flex items-center gap-2">
                <Heart className={cn("w-4 h-4 flex-shrink-0", isHpLow ? "text-destructive" : "text-hp")} />
                <div className="flex-1">
                  <AnimatedProgress value={character.hp_current} max={character.hp_max} variant="hp" size="sm" />
                </div>
                <span className={cn("text-xs font-display w-14 text-right", isHpLow ? "text-destructive" : "text-hp")}>
                  {character.hp_current}/{character.hp_max}
                </span>
              </div>

              {/* PE */}
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-pe flex-shrink-0" />
                <div className="flex-1">
                  <AnimatedProgress value={character.pe_current} max={character.pe_max} variant="pe" size="sm" />
                </div>
                <span className="text-xs font-display text-pe w-14 text-right">
                  {character.pe_current}/{character.pe_max}
                </span>
              </div>

              {/* SAN */}
              <div className="flex items-center gap-2">
                <Brain className={cn("w-4 h-4 flex-shrink-0", isSanLow ? "text-paranormal" : "text-san")} />
                <div className="flex-1">
                  <AnimatedProgress value={character.san_current} max={character.san_max} variant="san" size="sm" />
                </div>
                <span className={cn("text-xs font-display w-14 text-right", isSanLow ? "text-paranormal" : "text-san")}>
                  {character.san_current}/{character.san_max}
                </span>
              </div>

              {/* Stats rápidos */}
              <div className="flex justify-between pt-2 mt-2 border-t border-border text-xs">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-help">
                        <Shield className="w-3 h-3 text-muted-foreground" />
                        <span>DEF </span>
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={totalDefense}
                            initial={{ y: -5, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 5, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            {totalDefense}
                          </motion.span>
                        </AnimatePresence>
                        <AnimatePresence>
                          {bonusSummary.defense.total > 0 && (
                            <motion.span 
                              initial={{ opacity: 0, x: -3 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -3 }}
                              className="text-[9px] text-success"
                            >
                              (+{bonusSummary.defense.total})
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <div className="space-y-1 text-xs">
                        <p className="font-medium">Defesa: {totalDefense}</p>
                        <p className="text-muted-foreground">Base (10 + AGI): {character.defense}</p>
                        {bonusSummary.defense.breakdown.length > 0 && (
                          <div className="pt-1 border-t border-border">
                            {bonusSummary.defense.breakdown.map((bonus, i) => (
                              <p 
                                key={i} 
                                className={cn(
                                  "flex justify-between",
                                  !bonus.active && "text-muted-foreground line-through"
                                )}
                              >
                                <span className="flex items-center gap-1">
                                  {bonus.type === 'ritual' && (
                                    <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                                  )}
                                  {bonus.source}
                                </span>
                                <span className={bonus.active ? "text-success" : ""}>+{bonus.bonus}</span>
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="flex items-center gap-1">
                  <Footprints className="w-3 h-3 text-muted-foreground" />
                  <span>{character.movement}m</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-pe" />
                  <span>{peLimit} PE/turno</span>
                </div>
              </div>
            </div>

            {/* Atributos */}
            <CollapsibleSection 
              title="ATRIBUTOS" 
              icon={<User className="w-4 h-4" />}
              defaultOpen={true}
            >
              <div className="grid grid-cols-5 gap-2 text-center">
                {[
                  { label: 'AGI', value: character.agility, color: 'text-primary' },
                  { label: 'FOR', value: character.strength, color: 'text-destructive' },
                  { label: 'INT', value: character.intellect, color: 'text-secondary' },
                  { label: 'PRE', value: character.presence, color: 'text-paranormal' },
                  { label: 'VIG', value: character.vigor, color: 'text-accent' },
                ].map(attr => (
                  <button 
                    key={attr.label} 
                    className="p-2 bg-muted/30 rounded hover:bg-muted/50 transition-colors"
                    onClick={onOpenDiceRoller}
                  >
                    <p className="text-[10px] text-muted-foreground">{attr.label}</p>
                    <p className={cn("font-display text-xl", attr.color)}>{attr.value}</p>
                  </button>
                ))}
              </div>
            </CollapsibleSection>

            {/* Combate */}
            <CollapsibleSection 
              title="COMBATE" 
              icon={<Swords className="w-4 h-4" />}
            >
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ações por turno:</span>
                  <span className="text-xs">1P + 1M + 1R</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Limite PE/turno:</span>
                  <span className="text-pe font-display">{peLimit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Crítico:</span>
                  <span className="text-primary font-display">20</span>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-[10px] text-muted-foreground mb-1">RESISTÊNCIAS</p>
                  <div className="grid grid-cols-3 gap-1 text-[10px]">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-center p-1 bg-muted/30 rounded cursor-help">
                            <p className="text-muted-foreground">Fort</p>
                            <p className="font-display">
                              {character.vigor}d
                              {defenseBonuses.resistances.fortitude > 0 && (
                                <span className="text-success ml-0.5">+{defenseBonuses.resistances.fortitude}</span>
                              )}
                            </p>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                          <p className="font-medium">Fortitude (VIG)</p>
                          <p className="text-muted-foreground">Pool: {character.vigor}d20</p>
                          {defenseBonuses.resistances.fortitude > 0 && (
                            <p className="text-success">Bônus: +{defenseBonuses.resistances.fortitude}</p>
                          )}
                          {defenseBonuses.resistances.breakdown.filter(b => b.fortitude > 0 && b.active).map((b, i) => (
                            <p key={i} className="text-[10px]">{b.source}: +{b.fortitude}</p>
                          ))}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-center p-1 bg-muted/30 rounded cursor-help">
                            <p className="text-muted-foreground">Ref</p>
                            <p className="font-display">
                              {character.agility}d
                              {defenseBonuses.resistances.reflexos > 0 && (
                                <span className="text-success ml-0.5">+{defenseBonuses.resistances.reflexos}</span>
                              )}
                            </p>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                          <p className="font-medium">Reflexos (AGI)</p>
                          <p className="text-muted-foreground">Pool: {character.agility}d20</p>
                          {defenseBonuses.resistances.reflexos > 0 && (
                            <p className="text-success">Bônus: +{defenseBonuses.resistances.reflexos}</p>
                          )}
                          {defenseBonuses.resistances.breakdown.filter(b => b.reflexos > 0 && b.active).map((b, i) => (
                            <p key={i} className="text-[10px]">{b.source}: +{b.reflexos}</p>
                          ))}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-center p-1 bg-muted/30 rounded cursor-help">
                            <p className="text-muted-foreground">Von</p>
                            <p className="font-display">
                              {character.presence}d
                              {defenseBonuses.resistances.vontade > 0 && (
                                <span className="text-success ml-0.5">+{defenseBonuses.resistances.vontade}</span>
                              )}
                            </p>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                          <p className="font-medium">Vontade (PRE)</p>
                          <p className="text-muted-foreground">Pool: {character.presence}d20</p>
                          {defenseBonuses.resistances.vontade > 0 && (
                            <p className="text-success">Bônus: +{defenseBonuses.resistances.vontade}</p>
                          )}
                          {defenseBonuses.resistances.breakdown.filter(b => b.vontade > 0 && b.active).map((b, i) => (
                            <p key={i} className="text-[10px]">{b.source}: +{b.vontade}</p>
                          ))}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            {/* Resumo de Bônus Ativos (modo compacto) */}
            <BonusSummaryCard summary={bonusSummary} compact />

            {/* Condições ativas */}
            {character.conditions.length > 0 && (
              <div className="ordo-panel p-3">
                <p className="text-[10px] text-muted-foreground uppercase mb-2">CONDIÇÕES ATIVAS</p>
                <div className="flex flex-wrap gap-1">
                  {character.conditions.map((condition, i) => (
                    <span 
                      key={i} 
                      className="px-2 py-0.5 text-[10px] bg-destructive/20 text-destructive rounded"
                    >
                      {condition}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'skills' && (
          <SkillsTabContent 
            character={character} 
            onOpenDiceRoller={onOpenDiceRoller} 
          />
        )}

        {activeTab === 'powers' && (
          <motion.div
            key="powers"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            {/* Resumo de poderes */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {character.abilities.length > 0 && (
                <div className="flex-shrink-0 px-3 py-1.5 bg-primary/10 rounded-full text-[10px] text-primary">
                  {character.abilities.length} Habilidades
                </div>
              )}
              {character.paranormal_powers && character.paranormal_powers.length > 0 && (
                <div className="flex-shrink-0 px-3 py-1.5 bg-paranormal/10 rounded-full text-[10px] text-paranormal">
                  {character.paranormal_powers.length} Paranormais
                </div>
              )}
              {character.general_powers && character.general_powers.length > 0 && (
                <div className="flex-shrink-0 px-3 py-1.5 bg-success/10 rounded-full text-[10px] text-success">
                  {character.general_powers.length} Gerais
                </div>
              )}
              {character.rituals.length > 0 && (
                <div className="flex-shrink-0 px-3 py-1.5 bg-paranormal/10 rounded-full text-[10px] text-paranormal">
                  {character.rituals.length} Rituais
                </div>
              )}
            </div>

            {/* Habilidades de Classe - Clicáveis */}
            {character.abilities.length > 0 && (
              <CollapsibleSection 
                title="HABILIDADES DE CLASSE" 
                icon={<Sparkles className="w-4 h-4 text-primary" />}
                badge={character.abilities.length}
                defaultOpen={true}
              >
                <div className="space-y-2">
                  {character.abilities.map((ability, i) => (
                    <button
                      key={i}
                      onClick={() => handlePowerClick({
                        type: 'ability',
                        name: ability,
                        description: getAbilityDescription(ability),
                      })}
                      className="w-full p-2.5 bg-primary/10 rounded-lg border border-primary/20 flex items-center justify-between active:bg-primary/20 transition-colors text-left"
                    >
                      <span className="font-medium text-sm text-primary">{ability}</span>
                      <ChevronRight className="w-4 h-4 text-primary/50" />
                    </button>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Poderes Paranormais - Clicáveis */}
            {character.paranormal_powers && character.paranormal_powers.length > 0 && (
              <CollapsibleSection 
                title="PODERES PARANORMAIS" 
                icon={<Sparkles className="w-4 h-4 text-paranormal" />}
                badge={character.paranormal_powers.length}
                defaultOpen={true}
              >
                <div className="space-y-2">
                  {character.paranormal_powers.map((power, i) => {
                    const elementIcon = getElementIcon(power.element);
                    const elementColor = getElementColor(power.element);
                    
                    return (
                      <button
                        key={i}
                        onClick={() => handlePowerClick({
                          type: 'paranormal',
                          name: power.name,
                          description: power.description,
                          element: power.element,
                        })}
                        className={cn(
                          "w-full p-3 rounded-lg border text-left active:opacity-80 transition-opacity",
                          elementColor
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg">{elementIcon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{power.name}</span>
                              <span className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded capitalize",
                                power.element === 'sangue' && "bg-red-500/30 text-red-300",
                                power.element === 'morte' && "bg-purple-500/30 text-purple-300",
                                power.element === 'conhecimento' && "bg-blue-500/30 text-blue-300",
                                power.element === 'energia' && "bg-yellow-500/30 text-yellow-300",
                              )}>
                                {power.element}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{power.description}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CollapsibleSection>
            )}

            {/* Poderes Gerais - Clicáveis */}
            {character.general_powers && character.general_powers.length > 0 && (
              <CollapsibleSection 
                title="PODERES GERAIS" 
                icon={<Zap className="w-4 h-4 text-success" />}
                badge={character.general_powers.length}
              >
                <div className="space-y-2">
                  {character.general_powers.map((power, i) => (
                    <button
                      key={i}
                      onClick={() => handlePowerClick({
                        type: 'general',
                        name: power.name,
                        description: power.description,
                        category: power.category,
                      })}
                      className="w-full p-3 bg-success/10 rounded-lg border border-success/20 text-left active:bg-success/20 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-medium text-sm text-success">{power.name}</span>
                            {power.category && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-success/30 text-success rounded capitalize">
                                {power.category}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-2">{power.description}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-success/50 flex-shrink-0 ml-2" />
                      </div>
                    </button>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Poderes de Origem - Clicáveis */}
            {character.powers.length > 0 && (
              <CollapsibleSection 
                title="PODERES DE ORIGEM" 
                icon={<User className="w-4 h-4 text-secondary" />}
                badge={character.powers.length}
              >
                <div className="space-y-2">
                  {character.powers.map((power, i) => (
                    <button
                      key={i}
                      onClick={() => handlePowerClick({
                        type: 'origin',
                        name: power.name,
                        description: power.description,
                      })}
                      className="w-full p-3 bg-secondary/10 rounded-lg border border-secondary/20 text-left active:bg-secondary/20 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm">{power.name}</span>
                          {power.description && (
                            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{power.description}</p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-secondary/50 flex-shrink-0 ml-2" />
                      </div>
                    </button>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Rituais - Clicáveis com detalhes completos */}
            {character.rituals.length > 0 && (
              <CollapsibleSection 
                title="RITUAIS" 
                icon={<Scroll className="w-4 h-4 text-paranormal" />}
                badge={character.rituals.length}
              >
                <div className="space-y-2">
                  {character.rituals.map((ritualId, i) => {
                    const ritualData = getRitualData(ritualId);
                    return (
                      <button
                        key={i}
                        onClick={() => handlePowerClick({
                          type: 'ritual',
                          name: ritualData?.name || ritualId,
                          description: ritualData?.description || '',
                          circle: ritualData?.circle,
                          element: ritualData?.element,
                          execution: ritualData?.execution,
                          range: ritualData?.range,
                          target: ritualData?.target,
                          duration: ritualData?.duration,
                          resistance: ritualData?.resistance,
                        })}
                        className="w-full p-2.5 bg-paranormal/10 rounded-lg border border-paranormal/20 flex items-center gap-3 active:bg-paranormal/20 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-paranormal/20 flex items-center justify-center flex-shrink-0">
                          {ritualData?.circle ? (
                            <span className="text-sm font-display text-paranormal">{ritualData.circle}º</span>
                          ) : (
                            <Scroll className="w-4 h-4 text-paranormal" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-paranormal font-medium">{ritualData?.name || ritualId}</span>
                          {ritualData?.element && (
                            <p className="text-[10px] text-muted-foreground capitalize">{ritualData.element}</p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-paranormal/50 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </CollapsibleSection>
            )}

            {/* Mensagem quando não há nenhum poder */}
            {character.abilities.length === 0 && 
             character.powers.length === 0 && 
             character.rituals.length === 0 &&
             (!character.paranormal_powers || character.paranormal_powers.length === 0) &&
             (!character.general_powers || character.general_powers.length === 0) && (
              <div className="ordo-panel p-3">
                <p className="text-muted-foreground text-sm text-center py-4">
                  Nenhum poder registrado.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'inventory' && (
          <motion.div
            key="inventory"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            {/* Resumo de capacidade */}
            {character.inventory && character.inventory.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <div className="flex-shrink-0 px-3 py-1.5 bg-muted/50 rounded-full text-[10px] flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  {character.inventory.length} itens
                </div>
                <div className="flex-shrink-0 px-3 py-1.5 bg-muted/50 rounded-full text-[10px]">
                  {character.inventory.reduce((acc, i) => acc + (i.slots || 1), 0)} espaços usados
                </div>
                {character.inventory.filter(i => i.isEquipped).length > 0 && (
                  <div className="flex-shrink-0 px-3 py-1.5 bg-primary/10 rounded-full text-[10px] text-primary">
                    {character.inventory.filter(i => i.isEquipped).length} equipados
                  </div>
                )}
              </div>
            )}

            {/* Itens equipados - Destaque */}
            {character.inventory && character.inventory.filter(i => i.isEquipped).length > 0 && (
              <CollapsibleSection 
                title="EQUIPAMENTO" 
                icon={<Swords className="w-4 h-4 text-primary" />}
                badge={character.inventory.filter(i => i.isEquipped).length}
                defaultOpen={true}
              >
                <div className="space-y-2">
                  {character.inventory.filter(i => i.isEquipped).map((item, i) => (
                    <div key={i} className="p-3 bg-primary/10 rounded-lg border border-primary/30 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        {getItemIcon(item.itemType || item.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium block truncate">{item.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.equipSlot && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-primary/30 rounded capitalize">
                              {item.equipSlot}
                            </span>
                          )}
                          <span className="text-[9px] text-muted-foreground">
                            Cat. {item.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Inventário completo */}
            {character.inventory && character.inventory.length > 0 ? (
              <CollapsibleSection 
                title="TODOS OS ITENS" 
                icon={<Package className="w-4 h-4" />}
                badge={character.inventory.length}
                defaultOpen={!character.inventory.some(i => i.isEquipped)}
              >
                <div className="space-y-1">
                  {character.inventory.map((item, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg transition-colors",
                        item.isEquipped 
                          ? "bg-primary/5 border border-primary/20" 
                          : "bg-muted/30 border border-transparent"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded flex items-center justify-center flex-shrink-0",
                        item.isEquipped ? "bg-primary/20" : "bg-muted/50"
                      )}>
                        {getItemIcon(item.itemType || item.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm block truncate">{item.name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded",
                            getCategoryColor(item.category)
                          )}>
                            Cat. {item.category}
                          </span>
                          <span className="text-[9px] text-muted-foreground">
                            {item.slots || 1} esp.
                          </span>
                          {item.isEquipped && (
                            <span className="text-[9px] text-primary">✓ Equip.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            ) : (
              <div className="ordo-panel p-6">
                <div className="text-center">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">Nenhum item no inventário.</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    Adicione itens através da versão desktop
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barra de navegação fixa no bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex justify-around items-center h-14">
          {[
            { id: 'overview' as const, icon: Home, label: 'Geral' },
            { id: 'skills' as const, icon: BookOpen, label: 'Perícias' },
            { id: 'powers' as const, icon: Sparkles, label: 'Poderes' },
            { id: 'inventory' as const, icon: Package, label: 'Itens' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full transition-colors",
                activeTab === tab.id 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modal de detalhes do poder */}
      <PowerDetailModal
        open={powerModalOpen}
        onOpenChange={setPowerModalOpen}
        power={selectedPower}
      />
    </div>
  );
}
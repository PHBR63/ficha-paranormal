/**
 * MobileCharacterSheet - Versão compacta da ficha para dispositivos móveis
 * Usa abas deslizantes e layout otimizado para telas pequenas
 */

import { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedProgress } from '@/components/ui/animated-progress';
import { cn } from '@/lib/utils';
import { ORIGINS, getTrackById } from '@/lib/character-data';
import { getPELimitByNex } from '@/lib/dice-roller';

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
    inventory?: Array<{ id?: string; name: string; category: string; slots: number; itemType?: string; isEquipped?: boolean; equipSlot?: string }>;
  };
  onOpenDiceRoller: () => void;
  onOpenRest: () => void;
  onLevelUp: () => void;
  onEditStats: () => void;
  onOpenSkills?: () => void;
  onOpenInventory?: () => void;
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

// Componente principal
export function MobileCharacterSheet({
  character,
  onOpenDiceRoller,
  onOpenRest,
  onLevelUp,
  onEditStats,
}: MobileCharacterSheetProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>('overview');
  const originData = ORIGINS.find(o => o.id === character.origin);
  const trackData = character.class_track ? getTrackById(character.class_track) : null;
  const peLimit = getPELimitByNex(character.nex);

  // Estados críticos
  const hpPercent = (character.hp_current / character.hp_max) * 100;
  const sanPercent = (character.san_current / character.san_max) * 100;
  const isHpLow = hpPercent <= 25;
  const isSanLow = sanPercent <= 30;

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
                <Heart className={cn("w-4 h-4 flex-shrink-0", isHpLow ? "text-destructive" : "text-destructive/70")} />
                <div className="flex-1">
                  <AnimatedProgress value={character.hp_current} max={character.hp_max} variant="hp" size="sm" />
                </div>
                <span className={cn("text-xs font-display w-14 text-right", isHpLow && "text-destructive")}>
                  {character.hp_current}/{character.hp_max}
                </span>
              </div>

              {/* PE */}
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-secondary flex-shrink-0" />
                <div className="flex-1">
                  <AnimatedProgress value={character.pe_current} max={character.pe_max} variant="pe" size="sm" />
                </div>
                <span className="text-xs font-display text-secondary w-14 text-right">
                  {character.pe_current}/{character.pe_max}
                </span>
              </div>

              {/* SAN */}
              <div className="flex items-center gap-2">
                <Brain className={cn("w-4 h-4 flex-shrink-0", isSanLow ? "text-paranormal" : "text-paranormal/70")} />
                <div className="flex-1">
                  <AnimatedProgress value={character.san_current} max={character.san_max} variant="san" size="sm" />
                </div>
                <span className={cn("text-xs font-display w-14 text-right", isSanLow && "text-paranormal")}>
                  {character.san_current}/{character.san_max}
                </span>
              </div>

              {/* Stats rápidos */}
              <div className="flex justify-between pt-2 mt-2 border-t border-border text-xs">
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-muted-foreground" />
                  <span>DEF {character.defense}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Footprints className="w-3 h-3 text-muted-foreground" />
                  <span>{character.movement}m</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-secondary" />
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
                  <span className="text-secondary font-display">{peLimit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Crítico:</span>
                  <span className="text-primary font-display">20</span>
                </div>
                <div className="pt-2 border-t border-border grid grid-cols-3 gap-1 text-[10px]">
                  <div className="text-center p-1 bg-muted/30 rounded">
                    <p className="text-muted-foreground">Fort</p>
                    <p className="font-display">{character.vigor}d</p>
                  </div>
                  <div className="text-center p-1 bg-muted/30 rounded">
                    <p className="text-muted-foreground">Ref</p>
                    <p className="font-display">{character.agility}d</p>
                  </div>
                  <div className="text-center p-1 bg-muted/30 rounded">
                    <p className="text-muted-foreground">Von</p>
                    <p className="font-display">{character.presence}d</p>
                  </div>
                </div>
              </div>
            </CollapsibleSection>

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
          <motion.div
            key="skills"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            {/* Resumo de perícias */}
            <div className="ordo-panel p-3">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground uppercase">PERÍCIAS TREINADAS</p>
                {character.skills && (
                  <span className="text-[10px] px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                    {Object.values(character.skills).filter(v => v > 0).length} treinadas
                  </span>
                )}
              </div>
              
              {/* Perícias agrupadas por atributo */}
              {character.skills && Object.entries(character.skills).filter(([_, v]) => v > 0).length > 0 ? (
                <div className="space-y-1">
                  {Object.entries(character.skills)
                    .filter(([_, value]) => value > 0)
                    .sort(([, a], [, b]) => b - a) // Ordena por bônus (maior primeiro)
                    .map(([skill, bonus]) => {
                      // Determina o atributo da perícia para colorir
                      const skillAttr = getSkillAttribute(skill);
                      const attrColor = getAttributeColor(skillAttr);
                      
                      return (
                        <button
                          key={skill}
                          onClick={onOpenDiceRoller}
                          className="w-full flex items-center justify-between p-2.5 bg-muted/30 rounded-lg active:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold",
                              attrColor
                            )}>
                              {skillAttr}
                            </span>
                            <span className="text-sm capitalize">{skill.replace(/_/g, ' ')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-primary font-display text-lg">+{bonus}</span>
                            <Dices className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </button>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-muted-foreground text-sm">Nenhuma perícia treinada.</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    Treine perícias ao subir de NEX
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

            {/* Habilidades de Classe - Expandíveis */}
            {character.abilities.length > 0 && (
              <CollapsibleSection 
                title="HABILIDADES DE CLASSE" 
                icon={<Sparkles className="w-4 h-4 text-primary" />}
                badge={character.abilities.length}
                defaultOpen={true}
              >
                <div className="space-y-2">
                  {character.abilities.map((ability, i) => (
                    <div key={i} className="p-2.5 bg-primary/10 rounded-lg border border-primary/20">
                      <span className="font-medium text-sm text-primary">{ability}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Poderes Paranormais - Com ícones por elemento */}
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
                      <div key={i} className={cn(
                        "p-3 rounded-lg border",
                        elementColor
                      )}>
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
                            <p className="text-[11px] text-muted-foreground mt-1">{power.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleSection>
            )}

            {/* Poderes Gerais */}
            {character.general_powers && character.general_powers.length > 0 && (
              <CollapsibleSection 
                title="PODERES GERAIS" 
                icon={<Zap className="w-4 h-4 text-success" />}
                badge={character.general_powers.length}
              >
                <div className="space-y-2">
                  {character.general_powers.map((power, i) => (
                    <div key={i} className="p-3 bg-success/10 rounded-lg border border-success/20">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-sm text-success">{power.name}</span>
                        {power.category && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-success/30 text-success rounded capitalize">
                            {power.category}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{power.description}</p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Poderes de Origem */}
            {character.powers.length > 0 && (
              <CollapsibleSection 
                title="PODERES DE ORIGEM" 
                icon={<User className="w-4 h-4 text-secondary" />}
                badge={character.powers.length}
              >
                <div className="space-y-2">
                  {character.powers.map((power, i) => (
                    <div key={i} className="p-3 bg-secondary/10 rounded-lg border border-secondary/20">
                      <span className="font-medium text-sm">{power.name}</span>
                      {power.description && (
                        <p className="text-[11px] text-muted-foreground mt-1">{power.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Rituais - Com círculos e detalhes */}
            {character.rituals.length > 0 && (
              <CollapsibleSection 
                title="RITUAIS" 
                icon={<Scroll className="w-4 h-4 text-paranormal" />}
                badge={character.rituals.length}
              >
                <div className="space-y-2">
                  {character.rituals.map((ritualId, i) => (
                    <div key={i} className="p-2.5 bg-paranormal/10 rounded-lg border border-paranormal/20 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-paranormal/20 flex items-center justify-center flex-shrink-0">
                        <Scroll className="w-4 h-4 text-paranormal" />
                      </div>
                      <span className="text-sm text-paranormal">{ritualId}</span>
                    </div>
                  ))}
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
    </div>
  );
}
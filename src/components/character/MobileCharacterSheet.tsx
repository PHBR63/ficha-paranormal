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
            <div className="ordo-panel p-3">
              <p className="text-xs text-muted-foreground uppercase mb-3">PERÍCIAS</p>
              {character.skills && Object.entries(character.skills)
                .filter(([_, value]) => value > 0)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([skill, bonus]) => (
                  <button
                    key={skill}
                    onClick={onOpenDiceRoller}
                    className="w-full flex items-center justify-between p-2 bg-muted/30 rounded mb-1 hover:bg-muted/50"
                  >
                    <span className="text-sm capitalize">{skill.replace(/_/g, ' ')}</span>
                    <span className="text-primary font-display">+{bonus}</span>
                  </button>
                ))}
              {(!character.skills || Object.values(character.skills).every(v => v === 0)) && (
                <p className="text-muted-foreground text-sm">Nenhuma perícia treinada.</p>
              )}
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
            {/* Habilidades de Classe */}
            {character.abilities.length > 0 && (
              <div className="ordo-panel p-3">
                <p className="text-[10px] text-primary uppercase mb-2">HABILIDADES DE CLASSE</p>
                <div className="flex flex-wrap gap-1">
                  {character.abilities.map((ability, i) => (
                    <span 
                      key={i} 
                      className="px-2 py-0.5 text-[10px] bg-primary/20 text-primary rounded"
                    >
                      {ability}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Poderes Paranormais */}
            {character.paranormal_powers && character.paranormal_powers.length > 0 && (
              <div className="ordo-panel p-3">
                <p className="text-[10px] text-paranormal uppercase mb-2">
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  PODERES PARANORMAIS ({character.paranormal_powers.length})
                </p>
                <div className="space-y-2">
                  {character.paranormal_powers.map((power, i) => (
                    <div key={i} className="p-2 bg-paranormal/10 rounded border border-paranormal/20">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-paranormal">{power.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-paranormal/30 rounded capitalize">
                          {power.element}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{power.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Poderes Gerais */}
            {character.general_powers && character.general_powers.length > 0 && (
              <div className="ordo-panel p-3">
                <p className="text-[10px] text-success uppercase mb-2">
                  PODERES GERAIS ({character.general_powers.length})
                </p>
                <div className="space-y-2">
                  {character.general_powers.map((power, i) => (
                    <div key={i} className="p-2 bg-success/10 rounded border border-success/20">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-success">{power.name}</span>
                        {power.category && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-success/30 rounded capitalize">
                            {power.category}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{power.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Poderes de Origem */}
            {character.powers.length > 0 && (
              <div className="ordo-panel p-3">
                <p className="text-[10px] text-secondary uppercase mb-2">PODERES DE ORIGEM</p>
                <div className="space-y-2">
                  {character.powers.map((power, i) => (
                    <div key={i} className="p-2 bg-secondary/10 rounded">
                      <span className="font-medium text-sm">{power.name}</span>
                      {power.description && (
                        <p className="text-[10px] text-muted-foreground mt-1">{power.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rituais */}
            {character.rituals.length > 0 && (
              <div className="ordo-panel p-3">
                <p className="text-[10px] text-paranormal uppercase mb-2">
                  <Scroll className="w-3 h-3 inline mr-1" />
                  RITUAIS ({character.rituals.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {character.rituals.map((ritualId, i) => (
                    <span 
                      key={i} 
                      className="px-2 py-0.5 text-[10px] bg-paranormal/20 text-paranormal rounded"
                    >
                      {ritualId}
                    </span>
                  ))}
                </div>
              </div>
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
            {/* Itens equipados */}
            {character.inventory && character.inventory.filter(i => i.isEquipped).length > 0 && (
              <div className="ordo-panel p-3">
                <p className="text-[10px] text-primary uppercase mb-2">
                  <Swords className="w-3 h-3 inline mr-1" />
                  EQUIPADO
                </p>
                <div className="space-y-1">
                  {character.inventory.filter(i => i.isEquipped).map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-primary/10 rounded">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary" />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      {item.equipSlot && (
                        <span className="text-[9px] text-muted-foreground capitalize">{item.equipSlot}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Todos os itens */}
            {character.inventory && character.inventory.length > 0 ? (
              <div className="ordo-panel p-3">
                <p className="text-[10px] text-muted-foreground uppercase mb-2">
                  <Package className="w-3 h-3 inline mr-1" />
                  INVENTÁRIO ({character.inventory.length} itens)
                </p>
                <div className="space-y-1">
                  {character.inventory.map((item, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "flex items-center justify-between p-2 rounded",
                        item.isEquipped ? "bg-primary/5 border border-primary/20" : "bg-muted/30"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-[9px] px-1.5 py-0.5 bg-muted rounded">
                          Cat. {item.category}
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          {item.slots}esp
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="ordo-panel p-3">
                <p className="text-muted-foreground text-sm text-center py-4">
                  Nenhum item no inventário.
                </p>
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
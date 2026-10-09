/**
 * GeneralPowersPanel - Painel de poderes gerais com suporte a rituais
 * 
 * Funcionalidades:
 * - Seleção de poderes gerais disponíveis por NEX
 * - Integração com modal de seleção de ritual para o poder "Ritual Aprendido"
 * - Exibição dos rituais aprendidos através de poderes gerais
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sword, 
  GraduationCap, 
  Sparkles, 
  Users, 
  Heart,
  Star,
  Lock,
  CheckCircle2,
  Info,
  Plus,
  Trash2,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from '@/components/icons/ordem-icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { 
  GENERAL_POWERS, 
  GeneralPower, 
  getAvailableGeneralPowers,
  getCategoryName,
  getGeneralPowerById,
} from '@/lib/general-powers';
import { NonOccultistRitualModal, RitualSource } from './NonOccultistRitualModal';
import { ALL_RITUALS } from '@/lib/rituals/legacy-exports';

// Ícones por categoria
const CATEGORY_ICONS: Record<GeneralPower['category'], typeof Sword> = {
  combate: Sword,
  pericia: GraduationCap,
  paranormal: Sparkles,
  social: Users,
  sobrevivencia: Heart,
};

// Cores por categoria
const CATEGORY_COLORS: Record<GeneralPower['category'], string> = {
  combate: 'text-red-400 border-red-500/30 bg-red-500/10',
  pericia: 'text-green-400 border-green-500/30 bg-green-500/10',
  paranormal: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  social: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  sobrevivencia: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
};

// Estrutura para rituais aprendidos por poderes gerais
export interface LearnedRitual {
  ritualId: string;
  source: 'ritual-aprendido' | 'grimorio-vivo' | 'aprender-ritual-poder';
  peMultiplier: number; // 2x para ritual-aprendido e aprender-ritual-poder, 1x para grimório
}

interface GeneralPowersPanelProps {
  nex: number;
  characterClass: string;
  selectedPowers: string[]; // IDs dos poderes selecionados
  learnedRituals: LearnedRitual[]; // Rituais aprendidos via poderes gerais
  maxPowers?: number; // Limite de poderes (se houver)
  onPowersChange: (powers: string[]) => void;
  onRitualsChange: (rituals: LearnedRitual[]) => void;
  readOnly?: boolean;
}

export function GeneralPowersPanel({
  nex,
  characterClass,
  selectedPowers,
  learnedRituals,
  maxPowers = Infinity,
  onPowersChange,
  onRitualsChange,
  readOnly = false,
}: GeneralPowersPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['combate', 'paranormal'])
  );
  const [ritualModalOpen, setRitualModalOpen] = useState(false);
  const [ritualModalSource, setRitualModalSource] = useState<RitualSource>('ritual-aprendido');

  // Poderes disponíveis por NEX
  const availablePowers = useMemo(() => getAvailableGeneralPowers(nex), [nex]);

  // Agrupar por categoria
  const powersByCategory = useMemo(() => {
    const grouped: Record<string, GeneralPower[]> = {};
    availablePowers.forEach(power => {
      if (!grouped[power.category]) {
        grouped[power.category] = [];
      }
      grouped[power.category].push(power);
    });
    return grouped;
  }, [availablePowers]);

  // Verificar se o personagem é Ocultista (não precisa do poder para ter rituais)
  const isOcultist = characterClass === 'Ocultista';

  // Rituais já conhecidos (para filtrar no modal)
  const knownRitualIds = useMemo(() => 
    learnedRituals.map(r => r.ritualId),
    [learnedRituals]
  );

  // Toggle categoria expandida
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Toggle poder
  const handleTogglePower = (powerId: string) => {
    if (readOnly) return;

    const power = getGeneralPowerById(powerId);
    const isSelected = selectedPowers.includes(powerId);

    if (isSelected) {
      // Remover poder
      onPowersChange(selectedPowers.filter(id => id !== powerId));
      
      // Se o poder concede ritual, remover rituais associados
      if (power?.grantsRitual) {
        onRitualsChange(learnedRituals.filter(r => r.source !== 'ritual-aprendido'));
      }
    } else if (selectedPowers.length < maxPowers) {
      // Adicionar poder
      onPowersChange([...selectedPowers, powerId]);
      
      // Se o poder concede ritual, abrir modal de seleção
      if (power?.grantsRitual && !isOcultist) {
        setRitualModalSource('ritual-aprendido');
        setRitualModalOpen(true);
      }
    }
  };

  // Confirmar seleção de rituais
  const handleRitualConfirm = (ritualIds: string[]) => {
    const newRituals: LearnedRitual[] = ritualIds.map(id => ({
      ritualId: id,
      source: ritualModalSource,
      peMultiplier: ritualModalSource === 'ritual-aprendido' ? 2 : 1,
    }));

    // Substituir rituais da mesma fonte
    const filteredRituals = learnedRituals.filter(r => r.source !== ritualModalSource);
    onRitualsChange([...filteredRituals, ...newRituals]);
    setRitualModalOpen(false);
  };

  // Obter nome do ritual por ID
  const getRitualName = (ritualId: string) => {
    const ritual = ALL_RITUALS.find(r => r.id === ritualId);
    return ritual?.name || ritualId;
  };

  // Verificar se pode selecionar mais poderes
  const canSelectMore = selectedPowers.length < maxPowers;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            <h3 className="font-display tracking-wider">PODERES GERAIS</h3>
          </div>
          {maxPowers !== Infinity && (
            <Badge variant={canSelectMore ? "secondary" : "default"}>
              {selectedPowers.length} / {maxPowers}
            </Badge>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          Poderes gerais podem ser adquiridos por qualquer classe. Disponíveis baseados no seu NEX.
        </p>

        {/* Rituais aprendidos (se houver) */}
        {learnedRituals.length > 0 && (
          <div className="p-3 rounded-lg bg-paranormal/10 border border-paranormal/30">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-paranormal" />
              <span className="text-sm font-medium">Rituais Aprendidos</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {learnedRituals.map(lr => (
                <Badge 
                  key={lr.ritualId} 
                  variant="secondary"
                  className="gap-1"
                >
                  {getRitualName(lr.ritualId)}
                  {lr.peMultiplier > 1 && (
                    <span className="text-xs text-yellow-400">(×{lr.peMultiplier} PE)</span>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Lista de poderes por categoria */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {Object.entries(powersByCategory).map(([category, powers]) => {
              const CategoryIcon = CATEGORY_ICONS[category as GeneralPower['category']] || Star;
              const categoryColor = CATEGORY_COLORS[category as GeneralPower['category']] || '';
              const isExpanded = expandedCategories.has(category);

              return (
                <Collapsible 
                  key={category}
                  open={isExpanded}
                  onOpenChange={() => toggleCategory(category)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-colors",
                      categoryColor,
                      "hover:opacity-80"
                    )}>
                      <div className="flex items-center gap-2">
                        <CategoryIcon className="w-4 h-4" />
                        <span className="font-medium">
                          {getCategoryName(category as GeneralPower['category'])}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {powers.length}
                        </Badge>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="mt-2 space-y-2 pl-2">
                      <AnimatePresence>
                        {powers.map((power, index) => {
                          const isSelected = selectedPowers.includes(power.id);
                          const isDisabled = !isSelected && !canSelectMore;

                          return (
                            <motion.div
                              key={power.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                              className={cn(
                                "p-3 rounded-lg border transition-all",
                                isSelected
                                  ? "border-primary bg-primary/10"
                                  : "border-border/50 bg-card/30 hover:bg-card/50",
                                isDisabled && "opacity-50",
                                !readOnly && "cursor-pointer"
                              )}
                              onClick={() => !isDisabled && handleTogglePower(power.id)}
                            >
                              <div className="flex items-start gap-3">
                                {!readOnly && (
                                  <Checkbox
                                    checked={isSelected}
                                    disabled={isDisabled}
                                    className="mt-0.5"
                                  />
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium">{power.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      NEX {power.minNex}%
                                    </Badge>
                                    {power.grantsRitual && (
                                      <Badge variant="secondary" className="text-xs gap-1 bg-paranormal/20 text-paranormal">
                                        <Sparkles className="w-3 h-3" />
                                        Concede Ritual
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {power.description}
                                  </p>
                                  {power.requirement && (
                                    <p className="text-xs text-yellow-400 mt-1">
                                      Requisito: {power.requirement}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>

        {/* Resumo de poderes selecionados */}
        {selectedPowers.length > 0 && (
          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <h4 className="text-xs font-display tracking-wider text-muted-foreground mb-2">
              PODERES SELECIONADOS
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedPowers.map(powerId => {
                const power = getGeneralPowerById(powerId);
                return power ? (
                  <Badge key={powerId} className="gap-1">
                    {power.name}
                    {!readOnly && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePower(powerId);
                        }}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    )}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Modal de seleção de ritual */}
        <NonOccultistRitualModal
          open={ritualModalOpen}
          onClose={() => setRitualModalOpen(false)}
          source={ritualModalSource}
          currentRituals={knownRitualIds}
          onConfirm={handleRitualConfirm}
        />
      </div>
    </TooltipProvider>
  );
}

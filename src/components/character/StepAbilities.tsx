import { useState, useMemo, useCallback } from 'react';
import { CharacterFormData } from '@/pages/CharacterCreate';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Sword, 
  Sparkles, 
  Brain, 
  Shield, 
  Zap, 
  Star,
  Lock,
  CheckCircle2,
  Eye,
  TrendingUp,
  Plus,
  Minus,
  AlertTriangle,
  Repeat
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getAvailableAbilities, 
  getCoreAbilities, 
  getChoosableAbilities,
  getAbilityChoiceCount,
  ClassAbility
} from '@/lib/class-abilities';
import { RuleBookTip } from './RuleBookTip';
import { getRulebookContent } from '@/lib/rulebook-content';
import { AbilityDetailModal } from './AbilityDetailModal';
import { VersatilitySection, VersatilityChoice, isVersatilityChoiceComplete } from './VersatilitySection';
import { calculateDerivedStats } from '@/lib/character-data';

// ==================== MARCOS DE PROGRESSÃO OFICIAIS (Tabelas 1.3, 1.4, 1.5) ====================
// Mapeamento de habilidades que evoluem com NEX conforme livro oficial

const EVOLVING_ABILITIES: Record<string, { nexMarkers: number[]; evolutions: string[] }> = {
  // Combatente - Ataque Especial (Tabela 1.3)
  // NEX 5%: 2 PE, +5 | NEX 25%: 3 PE, +10 | NEX 55%: 4 PE, +15 | NEX 85%: 5 PE, +20
  'ataque-especial': {
    nexMarkers: [5, 25, 55, 85],
    evolutions: [
      '2 PE para +5 (ataque ou dano)',
      '3 PE para +10 (ataque ou dano)',
      '4 PE para +15 (ataque ou dano)',
      '5 PE para +20 (ataque ou dano)'
    ]
  },
  
  // Especialista - Perito (Tabela 1.4)
  // NEX 5%: +1d6 (2 PE) | NEX 25%: +1d8 (3 PE) | NEX 55%: +1d10 (4 PE) | NEX 85%: +1d12 (5 PE)
  'perito': {
    nexMarkers: [5, 25, 55, 85],
    evolutions: [
      '+1d6 ao resultado (2 PE)',
      '+1d8 ao resultado (3 PE)',
      '+1d10 ao resultado (4 PE)',
      '+1d12 ao resultado (5 PE)'
    ]
  },
  
  // Ocultista - Escolhido pelo Outro Lado (Tabela 1.5)
  // NEX 5%: 1º círculo | NEX 25%: 2º círculo | NEX 55%: 3º círculo | NEX 85%: 4º círculo
  'escolhido-pelo-outro-lado': {
    nexMarkers: [5, 25, 55, 85],
    evolutions: [
      'Rituais de 1º círculo',
      'Rituais de 2º círculo',
      'Rituais de 3º círculo', 
      'Rituais de 4º círculo'
    ]
  },
  
  // Especialista - Engenhosidade (NEX 40% e 75%)
  'engenhosidade': {
    nexMarkers: [40, 75],
    evolutions: [
      'Veterano (+2 PE adicional)',
      'Expert (+4 PE adicional)'
    ]
  }
};

interface StepAbilitiesProps {
  formData: CharacterFormData;
  updateFormData: (updates: Partial<CharacterFormData>) => void;
}

const CLASS_ICONS: Record<string, React.ElementType> = {
  'Combatente': Sword,
  'Especialista': Brain,
  'Ocultista': Sparkles,
};

const CLASS_COLORS: Record<string, string> = {
  'Combatente': 'from-red-500/20 to-orange-500/20 border-red-500/30',
  'Especialista': 'from-green-500/20 to-emerald-500/20 border-green-500/30',
  'Ocultista': 'from-purple-500/20 to-violet-500/20 border-purple-500/30',
};

export function StepAbilities({ formData, updateFormData }: StepAbilitiesProps) {
  const { characterClass, nex, abilities, classTrack } = formData;
  
  // Estado para o modal de detalhes
  const [selectedAbilityForDetail, setSelectedAbilityForDetail] = useState<ClassAbility | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Estado para Versatilidade (NEX >= 50%)
  const [versatilityChoice, setVersatilityChoice] = useState<VersatilityChoice | null>(
    (formData as any).versatilityChoice || null
  );
  
  // Verifica se personagem está em NEX 50%+ (precisa fazer escolha de Versatilidade)
  const showVersatility = nex >= 50 && classTrack;
  
  // Calcula se a escolha de poder de classe adicional via Versatilidade foi feita
  const extraPowerFromVersatility = versatilityChoice?.type === 'class_power' ? 1 : 0;
  
  const coreAbilities = characterClass ? getCoreAbilities(characterClass, nex) : [];
  const choosableAbilities = characterClass ? getChoosableAbilities(characterClass, nex) : [];
  const baseMaxChoices = getAbilityChoiceCount(nex);
  // Se escolheu poder de classe via Versatilidade, ganha +1 escolha
  const maxChoices = baseMaxChoices + extraPowerFromVersatility;
  
  // Contar TODAS as ocorrências de abilities no array (incluindo repetições)
  const totalAbilitiesSelected = abilities.filter(a => 
    choosableAbilities.some(ca => ca.id === a)
  ).length;
  const remainingChoices = maxChoices - totalAbilitiesSelected;
  
  // Para poderes únicos selecionados (para mostrar na UI)
  const uniqueSelectedIds = [...new Set(abilities.filter(a => 
    choosableAbilities.some(ca => ca.id === a)
  ))];
  
  const ClassIcon = CLASS_ICONS[characterClass] || Star;
  const classColor = CLASS_COLORS[characterClass] || '';
  
  // Função auxiliar para contar ocorrências de um poder no array
  const getAbilityCount = useCallback((abilityId: string) => {
    return abilities.filter(a => a === abilityId).length;
  }, [abilities]);
  
  // Calcular custo de sanidade do Transcender (perda do ganho de SAN)
  const sanityGainPerNex = useMemo(() => {
    if (!characterClass) return 0;
    // Calcular ganho de SAN entre NEX 10% e 15% (representa ganho por marco de 5%)
    const stats5 = calculateDerivedStats(characterClass, 1, 1, 5);
    const stats10 = calculateDerivedStats(characterClass, 1, 1, 10);
    return stats10.san - stats5.san;
  }, [characterClass]);
  
  // Contar quantas vezes Transcender foi escolhido
  const transcenderCount = useMemo(() => {
    const transcenderIds = ['transcender', 'transcender-esp', 'transcender-ocultista'];
    return abilities.filter(a => transcenderIds.includes(a)).length;
  }, [abilities]);
  
  // Abre o modal com os detalhes da habilidade
  const openAbilityDetail = (ability: ClassAbility) => {
    setSelectedAbilityForDetail(ability);
    setIsDetailModalOpen(true);
  };

  // Handler para adicionar uma instância de um poder (usado para poderes repetíveis)
  const handleAddAbility = useCallback((abilityId: string) => {
    if (remainingChoices > 0) {
      updateFormData({
        abilities: [...abilities, abilityId]
      });
    }
  }, [abilities, remainingChoices, updateFormData]);
  
  // Handler para remover UMA instância de um poder (usado para poderes repetíveis)
  const handleRemoveOneInstance = useCallback((abilityId: string) => {
    const index = abilities.lastIndexOf(abilityId);
    if (index !== -1) {
      const newAbilities = [...abilities];
      newAbilities.splice(index, 1);
      updateFormData({ abilities: newAbilities });
    }
  }, [abilities, updateFormData]);

  // Handler antigo para poderes não-repetíveis (toggle simples)
  const handleToggleAbility = useCallback((abilityId: string) => {
    const ability = choosableAbilities.find(a => a.id === abilityId);
    const isRepeatable = ability?.isRepeatable ?? false;
    const count = getAbilityCount(abilityId);
    
    if (isRepeatable) {
      // Para repetíveis, adiciona nova instância se houver espaço
      if (remainingChoices > 0) {
        handleAddAbility(abilityId);
      }
    } else {
      // Para não-repetíveis, faz toggle normal
      if (count > 0) {
        handleRemoveOneInstance(abilityId);
      } else if (remainingChoices > 0) {
        handleAddAbility(abilityId);
      }
    }
  }, [choosableAbilities, getAbilityCount, remainingChoices, handleAddAbility, handleRemoveOneInstance]);
  
  // Handler para escolha de Versatilidade
  const handleVersatilityChange = useCallback((choice: VersatilityChoice) => {
    setVersatilityChoice(choice);
    // Atualiza o formData com a escolha (para persistir no draft e validação)
    updateFormData({
      versatilityChoice: choice,
      // Se escolheu habilidade de trilha diferente, adiciona ao trackAbilities
      secondaryTrackAbility: choice.type === 'track_ability' && choice.abilityName 
        ? choice.abilityName 
        : null,
    } as any);
  }, [updateFormData]);

  if (!characterClass) {
    return (
      <div className="text-center py-12">
        <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">
          Selecione uma classe primeiro
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          As habilidades dependem da classe escolhida.
        </p>
      </div>
    );
  }

  // Conteúdo educativo do livro
  const rulebookContent = getRulebookContent('abilities');

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <ClassIcon className="w-6 h-6 text-primary" />
            <h2 className="font-display text-2xl tracking-wider text-foreground">
              HABILIDADES DE {characterClass.toUpperCase()}
            </h2>
          </div>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Com NEX {nex}%, seu agente possui habilidades específicas da classe. 
            Habilidades fundamentais são automáticas; as demais são escolhidas.
          </p>
        </div>

        {/* Painel educativo do livro de regras */}
        {rulebookContent && (
          <RuleBookTip section={rulebookContent} defaultExpanded={false} />
        )}

        {/* Seção de Versatilidade (NEX 50%+) */}
        {showVersatility && classTrack && (
          <VersatilitySection
            classId={characterClass}
            currentTrackId={classTrack}
            onSelect={handleVersatilityChange}
            selected={versatilityChoice}
            compact
          />
        )}

        {/* Choice Counter com validação visual */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 rounded-lg border bg-gradient-to-r space-y-3",
            classColor
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sword className="w-5 h-5 text-primary" />
              <span className="font-medium">Poderes de Classe</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {totalAbilitiesSelected} / {maxChoices} escolhidos
              </span>
              <Badge variant={remainingChoices > 0 ? "secondary" : "default"}>
                {remainingChoices > 0 ? `${remainingChoices} restante${remainingChoices > 1 ? 's' : ''}` : 'Completo'}
              </Badge>
            </div>
          </div>
          
          {/* Marcos de NEX onde se ganha poderes */}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-muted-foreground mr-2">Ganhos em:</span>
            {[15, 30, 45, 60, 75, 90].map((nexMarker) => {
              const isReached = nex >= nexMarker;
              const isCurrent = nex === nexMarker;
              // Contar quantos poderes deveria ter até este NEX
              const powersAtThisNex = [15, 30, 45, 60, 75, 90].filter(n => n <= nexMarker).length;
              const hasPowerAtThisNex = powersAtThisNex <= totalAbilitiesSelected;
              
              return (
                <Badge
                  key={nexMarker}
                  variant="outline"
                  className={cn(
                    'text-xs px-2 py-0.5 transition-all',
                    isReached 
                      ? hasPowerAtThisNex
                        ? 'bg-success/20 text-success border-success/30'
                        : 'bg-warning/20 text-warning border-warning/30'
                      : 'text-muted-foreground opacity-50',
                    isCurrent && 'ring-1 ring-offset-1 ring-offset-background ring-primary'
                  )}
                >
                  {isReached && hasPowerAtThisNex ? (
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                  ) : isReached ? (
                    <Star className="w-3 h-3 mr-1" />
                  ) : (
                    <Lock className="w-3 h-3 mr-1 opacity-50" />
                  )}
                  {nexMarker}%
                </Badge>
              );
            })}
          </div>
        </motion.div>

        {/* Layout responsivo: 1 coluna em telas menores, 2 em lg+ */}
        <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* Core Abilities */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="font-display tracking-wider">HABILIDADES FUNDAMENTAIS</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Concedidas automaticamente pela classe e NEX
            </p>
            
            <ScrollArea className="h-[450px] pr-4">
              <div className="space-y-3">
                <AnimatePresence>
                  {coreAbilities.map((ability, index) => {
                    // Verificar se a habilidade evolui com NEX
                    const evolution = EVOLVING_ABILITIES[ability.id];
                    const hasEvolution = !!evolution;
                    
                    // Calcular evolução atual e próxima
                    let currentEvolutionIndex = 0;
                    let nextEvolutionNex: number | null = null;
                    
                    if (hasEvolution) {
                      for (let i = evolution.nexMarkers.length - 1; i >= 0; i--) {
                        if (nex >= evolution.nexMarkers[i]) {
                          currentEvolutionIndex = i;
                          break;
                        }
                      }
                      // Encontrar próximo marco
                      const nextIndex = currentEvolutionIndex + 1;
                      if (nextIndex < evolution.nexMarkers.length) {
                        nextEvolutionNex = evolution.nexMarkers[nextIndex];
                      }
                    }
                    
                    return (
                      <motion.div
                        key={ability.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "p-4 rounded-lg border bg-gradient-to-r cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all",
                          classColor
                        )}
                        onClick={() => openAbilityDetail(ability)}
                      >
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-medium text-foreground">{ability.name}</h4>
                                <Badge variant="outline" className="text-xs">
                                  NEX {ability.minNex}%
                                </Badge>
                                {/* Indicador de habilidade que evolui */}
                                {hasEvolution && (
                                  <Badge variant="secondary" className="text-xs gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    Evolui
                                  </Badge>
                                )}
                              </div>
                              <Eye className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors flex-shrink-0" />
                            </div>
                            
                            {/* Descrição base */}
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {ability.description}
                            </p>
                            
                            {/* Painel de evolução atual (para habilidades que evoluem) */}
                            {hasEvolution && (
                              <div className="mt-3 p-2 rounded bg-background/50 border border-border/50">
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-muted-foreground">Nível atual:</span>
                                  <Badge variant="default" className="text-xs">
                                    {evolution.evolutions[currentEvolutionIndex]}
                                  </Badge>
                                </div>
                                {nextEvolutionNex && (
                                  <div className="flex items-center gap-2 text-xs mt-1">
                                    <span className="text-muted-foreground">Próxima evolução:</span>
                                    <span className="text-primary">
                                      NEX {nextEvolutionNex}% → {evolution.evolutions[currentEvolutionIndex + 1]}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                
                {coreAbilities.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma habilidade fundamental disponível
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Choosable Abilities */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <h3 className="font-display tracking-wider">HABILIDADES OPCIONAIS</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Escolha {maxChoices} habilidade{maxChoices !== 1 ? 's' : ''} adicionai{maxChoices !== 1 ? 's' : ''}
            </p>
            
            <ScrollArea className="h-[450px] pr-4">
              <div className="space-y-3">
                <AnimatePresence>
                  {choosableAbilities.map((ability, index) => {
                    const count = getAbilityCount(ability.id);
                    const isSelected = count > 0;
                    const isRepeatable = ability.isRepeatable ?? false;
                    const isDisabled = !isSelected && remainingChoices === 0;
                    
                    // Verificar se é Transcender para mostrar aviso de SAN
                    const isTranscender = ability.id.includes('transcender');
                    
                    return (
                      <motion.div
                        key={ability.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "p-4 rounded-lg border transition-all",
                          isSelected 
                            ? cn("bg-gradient-to-r", classColor)
                            : "bg-card/50 hover:bg-card/80",
                          isDisabled && !isRepeatable && "opacity-50"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {/* Controle de seleção - diferente para repetíveis */}
                          {isRepeatable ? (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                disabled={count === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveOneInstance(ability.id);
                                }}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className={cn(
                                "w-6 text-center text-sm font-bold",
                                count > 0 ? "text-primary" : "text-muted-foreground"
                              )}>
                                {count}
                              </span>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                disabled={remainingChoices === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddAbility(ability.id);
                                }}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <Checkbox
                              checked={isSelected}
                              disabled={isDisabled}
                              className="mt-0.5 cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                              onCheckedChange={() => !isDisabled && handleToggleAbility(ability.id)}
                            />
                          )}
                          
                          {/* Área clicável para abrir modal */}
                          <div 
                            className="flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openAbilityDetail(ability)}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-medium text-foreground">{ability.name}</h4>
                                <Badge variant="outline" className="text-xs">
                                  NEX {ability.minNex}%
                                </Badge>
                                {/* Badge de repetível */}
                                {isRepeatable && (
                                  <Badge variant="secondary" className="text-xs gap-1">
                                    <Repeat className="w-3 h-3" />
                                    Repetível
                                  </Badge>
                                )}
                              </div>
                              <Eye className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors flex-shrink-0" />
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {ability.description}
                            </p>
                            
                            {/* Aviso de custo de SAN para Transcender */}
                            {isTranscender && (
                              <div className="mt-2 p-2 bg-warning/10 border border-warning/30 rounded flex items-center gap-2">
                                <AlertTriangle className="w-3 h-3 text-warning flex-shrink-0" />
                                <span className="text-xs text-warning">
                                  Custo: -{sanityGainPerNex} SAN máxima por escolha
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                
                {choosableAbilities.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma habilidade opcional disponível para NEX {nex}%</p>
                    <p className="text-xs mt-1">Aumente o NEX para desbloquear mais opções</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Summary */}
        {(coreAbilities.length > 0 || totalAbilitiesSelected > 0) && (
          <>
            <Separator />
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <h4 className="font-display text-sm tracking-wider mb-3 text-muted-foreground">
                RESUMO DE HABILIDADES
              </h4>
              <div className="flex flex-wrap gap-2">
                {coreAbilities.map(ability => (
                  <Badge key={ability.id} className="bg-primary/20 text-primary">
                    {ability.name}
                  </Badge>
                ))}
                {/* Agrupar poderes escolhidos por ID e mostrar contador para repetíveis */}
                {uniqueSelectedIds.map(abilityId => {
                  const ability = choosableAbilities.find(a => a.id === abilityId);
                  const count = getAbilityCount(abilityId);
                  return ability ? (
                    <Badge key={ability.id} variant="secondary" className="gap-1">
                      {ability.name}
                      {count > 1 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-background/50 text-xs font-bold">
                          ×{count}
                        </span>
                      )}
                    </Badge>
                  ) : null;
                })}
              </div>
              
              {/* Aviso de perda de Sanidade por Transcender */}
              {transcenderCount > 0 && (
                <div className="mt-3 p-2 rounded bg-warning/10 border border-warning/30 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
                  <span className="text-xs text-warning">
                    Transcender ×{transcenderCount}: -{transcenderCount * sanityGainPerNex} SAN máxima
                  </span>
                </div>
              )}
            </div>
          </>
        )}
        
        {/* Modal de detalhes da habilidade */}
        <AbilityDetailModal
          ability={selectedAbilityForDetail}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedAbilityForDetail(null);
          }}
          nex={nex}
          isSelected={selectedAbilityForDetail ? getAbilityCount(selectedAbilityForDetail.id) > 0 : false}
          isCore={selectedAbilityForDetail ? coreAbilities.some(ca => ca.id === selectedAbilityForDetail.id) : false}
          onToggle={selectedAbilityForDetail ? () => handleToggleAbility(selectedAbilityForDetail.id) : undefined}
          canSelect={remainingChoices > 0 || (selectedAbilityForDetail ? getAbilityCount(selectedAbilityForDetail.id) > 0 : false)}
        />
      </div>
    </TooltipProvider>
  );
}

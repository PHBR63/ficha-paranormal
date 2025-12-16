import { CharacterFormData } from '@/pages/CharacterCreate';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  Info,
  TrendingUp
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

// Mapeamento de habilidades que evoluem com NEX
// Cada entrada contém os marcos de evolução e suas descrições
// Mapeamento de habilidades que evoluem com NEX
// Cada entrada contém os marcos de evolução e suas descrições
// Progressão de círculos conforme livro: 2º em 25%, 3º em 55%, 4º em 85%
const EVOLVING_ABILITIES: Record<string, { nexMarkers: number[]; evolutions: string[] }> = {
  'escolhido-pelo-outro-lado': {
    nexMarkers: [5, 25, 55, 85],
    evolutions: [
      'Rituais de 1º círculo (3 rituais iniciais)',
      'Desbloqueia rituais de 2º círculo (sem limite nesta evolução)',
      'Desbloqueia rituais de 3º círculo (sem limite nesta evolução)', 
      'Desbloqueia rituais de 4º círculo (sem limite nesta evolução)'
    ]
  },
  'ataque-especial': {
    nexMarkers: [5, 20, 40, 60, 80, 99],
    evolutions: [
      '+5 dano ou ataque (2 PE)',
      '+10 dano ou ataque (4 PE)',
      '+15 dano ou ataque (6 PE)',
      '+20 dano ou ataque (8 PE)',
      '+25 dano ou ataque (10 PE)',
      '+30 dano ou ataque (12 PE)'
    ]
  },
  'versatil': {
    nexMarkers: [5, 20, 40, 60, 80, 99],
    evolutions: [
      '2 perícias',
      '4 perícias',
      '6 perícias',
      '8 perícias',
      '10 perícias',
      '12 perícias'
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
  const { characterClass, nex, abilities } = formData;
  
  const coreAbilities = characterClass ? getCoreAbilities(characterClass, nex) : [];
  const choosableAbilities = characterClass ? getChoosableAbilities(characterClass, nex) : [];
  const maxChoices = getAbilityChoiceCount(nex);
  const selectedChoices = abilities.filter(a => 
    choosableAbilities.some(ca => ca.id === a)
  );
  const remainingChoices = maxChoices - selectedChoices.length;
  
  const ClassIcon = CLASS_ICONS[characterClass] || Star;
  const classColor = CLASS_COLORS[characterClass] || '';

  const handleToggleAbility = (abilityId: string) => {
    const isSelected = abilities.includes(abilityId);
    
    if (isSelected) {
      updateFormData({
        abilities: abilities.filter(a => a !== abilityId)
      });
    } else if (remainingChoices > 0) {
      updateFormData({
        abilities: [...abilities, abilityId]
      });
    }
  };

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

        {/* Choice Counter */}
        {maxChoices > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r",
              classColor
            )}
          >
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-primary" />
              <span className="font-medium">Escolhas de Habilidades</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedChoices.length} / {maxChoices} escolhidas
              </span>
              <Badge variant={remainingChoices > 0 ? "secondary" : "default"}>
                {remainingChoices > 0 ? `${remainingChoices} restantes` : 'Completo'}
              </Badge>
            </div>
          </motion.div>
        )}

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
                          "p-4 rounded-lg border bg-gradient-to-r",
                          classColor
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium text-foreground">{ability.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                NEX {ability.minNex}%
                              </Badge>
                              {/* Indicador de habilidade que evolui */}
                              {hasEvolution && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="secondary" className="text-xs gap-1 cursor-help">
                                      <TrendingUp className="w-3 h-3" />
                                      Evolui
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-xs p-3">
                                    <p className="font-semibold mb-2">Progressão por NEX:</p>
                                    <ul className="space-y-1 text-xs">
                                      {evolution.nexMarkers.map((nexMark, i) => (
                                        <li 
                                          key={nexMark}
                                          className={cn(
                                            "flex items-center gap-2",
                                            nex >= nexMark ? "text-primary" : "text-muted-foreground"
                                          )}
                                        >
                                          <span className={cn(
                                            "w-4 h-4 rounded-full flex items-center justify-center text-[10px] border",
                                            nex >= nexMark 
                                              ? "bg-primary/20 border-primary text-primary" 
                                              : "bg-muted border-muted-foreground"
                                          )}>
                                            {nex >= nexMark ? '✓' : i + 1}
                                          </span>
                                          <span className="font-medium">NEX {nexMark}%:</span>
                                          <span>{evolution.evolutions[i]}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            
                            {/* Descrição base */}
                            <p className="text-sm text-muted-foreground mt-1">
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
                    const isSelected = abilities.includes(ability.id);
                    const isDisabled = !isSelected && remainingChoices === 0;
                    
                    return (
                      <motion.div
                        key={ability.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "p-4 rounded-lg border transition-all cursor-pointer",
                          isSelected 
                            ? cn("bg-gradient-to-r", classColor)
                            : "bg-card/50 hover:bg-card/80",
                          isDisabled && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => !isDisabled && handleToggleAbility(ability.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            disabled={isDisabled}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-foreground">{ability.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                NEX {ability.minNex}%
                              </Badge>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-4 h-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  {ability.description}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {ability.description}
                            </p>
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
        {(coreAbilities.length > 0 || selectedChoices.length > 0) && (
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
                {selectedChoices.map(abilityId => {
                  const ability = choosableAbilities.find(a => a.id === abilityId);
                  return ability ? (
                    <Badge key={ability.id} variant="secondary">
                      {ability.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}

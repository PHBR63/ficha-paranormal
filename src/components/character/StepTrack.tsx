import { useState, useMemo } from 'react';
import { CLASS_TRACKS, type ClassTrack, type TrackAbility } from '@/lib/character-data';
import { cn } from '@/lib/utils';
import { 
  Sword, Target, Shield, Skull, Building, 
  Crosshair, Ghost, Heart, MessagesSquare, Wrench,
  Flame, Droplets, GraduationCap, Brain, Zap,
  Lock, Unlock, ChevronDown, ChevronUp, Sparkles, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RuleBookTip } from './RuleBookTip';
import { getRulebookContent } from '@/lib/rulebook-content';
import { isValidTrackForClass } from '@/lib/constants/game-ids';
import type { CharacterFormData } from '@/pages/CharacterCreate';

interface StepTrackProps {
  formData: CharacterFormData;
  updateFormData: (updates: Partial<CharacterFormData>) => void;
}

// Nota: Usamos isValidTrackForClass de game-ids.ts (fonte da verdade)
// Isso garante consistência entre UI, validação e dados

// Ícones das trilhas (incluindo novas trilhas do suplemento)
const TRACK_ICONS: Record<string, React.ReactNode> = {
  // Combatente
  'aniquilador': <Skull className="w-5 h-5" />,
  'comandante-campo': <Building className="w-5 h-5" />,
  'guerreiro': <Sword className="w-5 h-5" />,
  'operacoes-especiais': <Target className="w-5 h-5" />,
  'tropa-choque': <Shield className="w-5 h-5" />,
  'cacador-monstros': <Crosshair className="w-5 h-5" />, // Suplemento
  'protetor': <Shield className="w-5 h-5" />, // Suplemento
  // Especialista
  'atirador-elite': <Crosshair className="w-5 h-5" />,
  'infiltrador': <Ghost className="w-5 h-5" />,
  'medico-campo': <Heart className="w-5 h-5" />,
  'negociador': <MessagesSquare className="w-5 h-5" />,
  'tecnico': <Wrench className="w-5 h-5" />,
  'analista-cena': <Brain className="w-5 h-5" />, // Suplemento
  'perito-criminal': <Target className="w-5 h-5" />, // Suplemento
  // Ocultista
  'condutor': <Zap className="w-5 h-5" />,
  'flagelador': <Droplets className="w-5 h-5" />,
  'graduado': <GraduationCap className="w-5 h-5" />,
  'intuitivo': <Brain className="w-5 h-5" />,
  'lamina-paranormal': <Flame className="w-5 h-5" />,
  'ritualista-campo': <Sparkles className="w-5 h-5" />, // Suplemento
  'canalista': <Zap className="w-5 h-5" />, // Suplemento
  // Sobrevivente (nova classe do suplemento)
  'andarilho': <Flame className="w-5 h-5" />,
  'marcado': <Skull className="w-5 h-5" />,
  'sortudo': <Sparkles className="w-5 h-5" />,
};

const NEX_MILESTONES = [5, 25, 50, 75, 99];

export function StepTrack({ formData, updateFormData }: StepTrackProps) {
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);
  
  const availableTracks = CLASS_TRACKS.filter(
    track => track.classId === formData.characterClass
  );

  // Detecta se a trilha atual é inválida para a classe
  const currentTrackInvalid = useMemo(() => {
    if (!formData.classTrack || !formData.characterClass) return false;
    return !isValidTrackForClass(formData.classTrack, formData.characterClass);
  }, [formData.classTrack, formData.characterClass]);

  const handleSelectTrack = (trackId: string) => {
    // Valida antes de atualizar
    if (!formData.characterClass || !isValidTrackForClass(trackId, formData.characterClass)) {
      console.warn(`Trilha inválida: ${trackId} para classe ${formData.characterClass}`);
      return;
    }
    
    updateFormData({ 
      classTrack: trackId,
      trackAbilities: [] 
    });
    setExpandedTrack(trackId);
  };

  const toggleExpand = (trackId: string) => {
    setExpandedTrack(prev => prev === trackId ? null : trackId);
  };

  const isAbilityUnlocked = (minNex: number) => formData.nex >= minNex;
  
  const getUnlockedCount = (track: ClassTrack) => {
    return track.abilities.filter(a => isAbilityUnlocked(a.minNex)).length;
  };

  if (!formData.characterClass) {
    return (
      <div className="text-center py-12">
        <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          Selecione uma classe primeiro para escolher sua trilha.
        </p>
      </div>
    );
  }

  // Conteúdo educativo do livro
  const rulebookContent = getRulebookContent('track');

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl tracking-wider mb-2">TRILHA DE CLASSE</h2>
          <p className="text-muted-foreground text-sm">
            Escolha uma especialização para seu {formData.characterClass}. 
            A primeira habilidade é desbloqueada no <span className="text-primary font-semibold">NEX 5%</span>.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-sm text-xs">
            <span className="text-muted-foreground">Seu NEX atual:</span>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              {formData.nex}%
            </Badge>
          </div>
        </div>

        {/* Alerta de trilha inválida (dados legados) */}
        <AnimatePresence>
          {currentTrackInvalid && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="ordo-panel p-4 bg-destructive/10 border-destructive/30"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Trilha inválida detectada</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    A trilha "<strong>{formData.classTrack}</strong>" não é válida para a classe {formData.characterClass}. 
                    Por favor, selecione uma trilha válida abaixo.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Painel educativo do livro de regras */}
        {rulebookContent && (
          <RuleBookTip section={rulebookContent} defaultExpanded={false} />
        )}

        {/* NEX Timeline Legend */}
        <div className="flex items-center justify-center gap-1 mb-6 overflow-x-auto pb-2">
          {NEX_MILESTONES.map((nex, idx) => (
            <div key={nex} className="flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-full text-xs font-display transition-all cursor-help',
                      formData.nex >= nex 
                        ? 'bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.4)]' 
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {nex}%
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{formData.nex >= nex ? 'Desbloqueado' : `Requer NEX ${nex}%`}</p>
                </TooltipContent>
              </Tooltip>
              {idx < NEX_MILESTONES.length - 1 && (
                <div 
                  className={cn(
                    'w-8 h-0.5 transition-all',
                    formData.nex >= NEX_MILESTONES[idx + 1] 
                      ? 'bg-primary' 
                      : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Tracks Grid */}
        <div className="grid gap-4">
          {availableTracks.map((track, index) => {
            const isSelected = formData.classTrack === track.id;
            const isExpanded = expandedTrack === track.id;
            const unlockedCount = getUnlockedCount(track);
            const totalCount = track.abilities.length;

            return (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'ordo-panel overflow-hidden transition-all',
                  isSelected && 'border-primary/50 bg-primary/5 shadow-[0_0_20px_hsl(var(--primary)/0.15)]'
                )}
              >
                {/* Track Header */}
                <button
                  onClick={() => handleSelectTrack(track.id)}
                  className="w-full p-4 text-left flex items-start gap-4 hover:bg-muted/30 transition-colors"
                >
                  <div 
                    className={cn(
                      'w-12 h-12 rounded-sm flex items-center justify-center shrink-0 transition-all',
                      isSelected 
                        ? 'bg-primary/20 text-primary' 
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {TRACK_ICONS[track.id] || <Sparkles className="w-5 h-5" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={cn(
                        'font-display text-lg tracking-wider',
                        isSelected && 'text-primary'
                      )}>
                        {track.name}
                      </h3>
                      {isSelected && (
                        <Badge className="bg-primary/20 text-primary border-0 text-xs">
                          Selecionada
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {track.description}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        Habilidades: <span className="text-primary font-semibold">{unlockedCount}</span>/{totalCount}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleExpand(track.id); }}
                        className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3 h-3" />
                            Ocultar
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" />
                            Ver habilidades
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </button>

                {/* Abilities Timeline */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-2 border-t border-border/50">
                        <div className="relative">
                          {/* Vertical Timeline Line */}
                          <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 via-muted to-muted/30" />
                          
                          <div className="space-y-4">
                            {track.abilities.map((ability, abilityIndex) => {
                              const unlocked = isAbilityUnlocked(ability.minNex);
                              
                              return (
                                <motion.div
                                  key={ability.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: abilityIndex * 0.1 }}
                                  className="flex items-start gap-4 relative"
                                >
                                  {/* NEX Milestone Node */}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div 
                                        className={cn(
                                          'w-12 h-12 rounded-full flex flex-col items-center justify-center shrink-0 z-10 transition-all cursor-help',
                                          unlocked 
                                            ? 'bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.5)]' 
                                            : 'bg-muted/80 text-muted-foreground border-2 border-dashed border-muted-foreground/30'
                                        )}
                                      >
                                        {unlocked ? (
                                          <Unlock className="w-4 h-4" />
                                        ) : (
                                          <Lock className="w-4 h-4" />
                                        )}
                                        <span className="text-[10px] font-display">{ability.minNex}%</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{unlocked ? 'Desbloqueado!' : `Requer NEX ${ability.minNex}%`}</p>
                                    </TooltipContent>
                                  </Tooltip>

                                  {/* Ability Card */}
                                  <div 
                                    className={cn(
                                      'flex-1 p-3 rounded-sm transition-all',
                                      unlocked 
                                        ? 'bg-primary/10 border border-primary/20' 
                                        : 'bg-muted/30 border border-dashed border-muted-foreground/20 opacity-60'
                                    )}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className={cn(
                                        'font-display text-sm tracking-wider',
                                        unlocked ? 'text-primary' : 'text-muted-foreground'
                                      )}>
                                        {ability.name}
                                      </h4>
                                      {ability.isInitial && (
                                        <Badge variant="outline" className="text-[10px] py-0 h-4">
                                          Inicial
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      {ability.description}
                                    </p>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Selected Track Summary */}
        {formData.classTrack && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="ordo-panel p-4 bg-primary/5 border-primary/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-display text-sm text-primary tracking-wider">
                TRILHA SELECIONADA
              </span>
            </div>
            <p className="text-sm">
              {availableTracks.find(t => t.id === formData.classTrack)?.name} —{' '}
              <span className="text-muted-foreground">
                {getUnlockedCount(availableTracks.find(t => t.id === formData.classTrack)!)} habilidades desbloqueadas no NEX {formData.nex}%
              </span>
            </p>
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  );
}

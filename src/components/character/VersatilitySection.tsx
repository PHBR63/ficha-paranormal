/**
 * VersatilitySection - Seção de escolha da Versatilidade (NEX 50%)
 * 
 * No NEX 50%, o jogador pode escolher entre:
 * 1. Receber um poder de classe adicional
 * 2. Receber o primeiro poder de uma trilha diferente da sua
 * 
 * Este componente é reutilizado tanto na criação (StepAbilities)
 * quanto na progressão (NexProgressionModal).
 * 
 * @module VersatilitySection
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sword,
  Brain,
  Sparkles,
  Route,
  Plus,
  ChevronRight,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAvailableTracks, getInitialAbility } from '@/lib/class-powers/track-registry';
import type { UnifiedTrack, UnifiedTrackAbility } from '@/lib/class-powers/track-types';
import type { ClassId } from '@/lib/class-powers/types';

// ========== TIPOS ==========

export interface VersatilityChoice {
  type: 'class_power' | 'track_ability';
  trackId?: string;
  trackName?: string;
  abilityId?: string;
  abilityName?: string;
}

interface VersatilitySectionProps {
  /** ID da classe do personagem */
  classId: string;
  /** ID da trilha atual do personagem */
  currentTrackId: string;
  /** Callback quando uma escolha é feita */
  onSelect: (choice: VersatilityChoice) => void;
  /** Escolha atualmente selecionada */
  selected: VersatilityChoice | null;
  /** Se está em contexto de criação (mais compacto) ou progressão */
  compact?: boolean;
}

// ========== CONSTANTES ==========

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

// ========== COMPONENTE ==========

export function VersatilitySection({
  classId,
  currentTrackId,
  onSelect,
  selected,
  compact = false,
}: VersatilitySectionProps) {
  // Estado para controlar se mostra lista de trilhas
  const [showTracks, setShowTracks] = useState(selected?.type === 'track_ability');
  
  // Obtém trilhas alternativas (exclui a atual)
  const availableTracks = useMemo(() => {
    return getAvailableTracks(classId as ClassId, currentTrackId);
  }, [classId, currentTrackId]);
  
  // Mapeia trilhas com suas primeiras habilidades
  const tracksWithAbilities = useMemo(() => {
    return availableTracks.map(track => ({
      track,
      firstAbility: getInitialAbility(track.id),
    })).filter(item => item.firstAbility !== undefined);
  }, [availableTracks]);
  
  const ClassIcon = CLASS_ICONS[classId] || Sword;
  const classColor = CLASS_COLORS[classId] || CLASS_COLORS['Combatente'];
  
  // Handler para selecionar tipo de escolha
  const handleTypeChange = (value: string) => {
    if (value === 'class_power') {
      setShowTracks(false);
      onSelect({ type: 'class_power' });
    } else if (value === 'track_ability') {
      setShowTracks(true);
      // Não seleciona nada ainda - precisa escolher a trilha
      if (selected?.type !== 'track_ability') {
        onSelect({ type: 'track_ability' });
      }
    }
  };
  
  // Handler para selecionar trilha específica
  const handleTrackSelect = (track: UnifiedTrack, ability: UnifiedTrackAbility) => {
    onSelect({
      type: 'track_ability',
      trackId: track.id,
      trackName: track.name,
      abilityId: ability.id,
      abilityName: ability.name,
    });
  };
  
  return (
    <Card className={cn(
      "border-2 border-dashed transition-all",
      selected ? "border-primary/50 bg-primary/5" : "border-muted-foreground/30"
    )}>
      <CardHeader className={compact ? "pb-2" : "pb-4"}>
        <div className="flex items-center gap-2">
          <Route className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Versatilidade</CardTitle>
          <Badge variant="secondary" className="ml-auto">NEX 50%</Badge>
        </div>
        <CardDescription className="text-sm">
          Escolha entre receber um poder de {classId.toLowerCase()} adicional ou 
          o primeiro poder de uma trilha diferente da sua.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Opções principais */}
        <RadioGroup
          value={selected?.type || ''}
          onValueChange={handleTypeChange}
          className="space-y-3"
        >
          {/* Opção 1: Poder de Classe */}
          <div
            className={cn(
              "flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-all",
              selected?.type === 'class_power'
                ? cn("bg-gradient-to-r", classColor, "ring-2 ring-primary/50")
                : "hover:bg-muted/50 border-border"
            )}
            onClick={() => handleTypeChange('class_power')}
          >
            <RadioGroupItem value="class_power" id="class_power" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="class_power" className="flex items-center gap-2 cursor-pointer">
                <Plus className="w-4 h-4 text-primary" />
                <span className="font-medium">Poder de Classe Adicional</span>
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                +1 escolha de poder de {classId.toLowerCase()} (você escolherá depois).
              </p>
            </div>
            {selected?.type === 'class_power' && (
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
            )}
          </div>
          
          {/* Opção 2: Trilha Diferente */}
          <div
            className={cn(
              "flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-all",
              selected?.type === 'track_ability'
                ? cn("bg-gradient-to-r", classColor, "ring-2 ring-primary/50")
                : "hover:bg-muted/50 border-border"
            )}
            onClick={() => handleTypeChange('track_ability')}
          >
            <RadioGroupItem value="track_ability" id="track_ability" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="track_ability" className="flex items-center gap-2 cursor-pointer">
                <Route className="w-4 h-4 text-primary" />
                <span className="font-medium">Trilha Diferente</span>
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Receba o primeiro poder (NEX 10%) de outra trilha de {classId.toLowerCase()}.
              </p>
            </div>
            {selected?.type === 'track_ability' && selected?.trackId && (
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
            )}
          </div>
        </RadioGroup>
        
        {/* Lista de trilhas (se opção 2 selecionada) */}
        <AnimatePresence>
          {showTracks && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-2 border-t border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Selecione a trilha:
                  </span>
                </div>
                
                <ScrollArea className={compact ? "max-h-[200px]" : "max-h-[300px]"}>
                  <div className="space-y-2 pr-4">
                    {tracksWithAbilities.map(({ track, firstAbility }) => {
                      const isSelected = selected?.trackId === track.id;
                      
                      return (
                        <motion.div
                          key={track.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={cn(
                            "p-3 rounded-lg border cursor-pointer transition-all",
                            isSelected
                              ? cn("bg-gradient-to-r", classColor, "ring-2 ring-primary")
                              : "hover:bg-muted/50 border-border"
                          )}
                          onClick={() => handleTrackSelect(track, firstAbility!)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                              isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                            )}>
                              <ClassIcon className="w-4 h-4" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-foreground">{track.name}</h4>
                                {isSelected && (
                                  <CheckCircle2 className="w-4 h-4 text-primary" />
                                )}
                              </div>
                              
                              {/* Preview da primeira habilidade */}
                              <div className="mt-2 p-2 rounded bg-background/50 border border-border/50">
                                <div className="flex items-center gap-2 text-xs">
                                  <Badge variant="outline" className="text-xs">NEX 10%</Badge>
                                  <span className="font-medium text-primary">
                                    {firstAbility?.name}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {firstAbility?.description}
                                </p>
                              </div>
                            </div>
                            
                            <ChevronRight className={cn(
                              "w-5 h-5 flex-shrink-0 transition-transform",
                              isSelected ? "text-primary rotate-90" : "text-muted-foreground"
                            )} />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Resumo da escolha */}
        {selected && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-muted-foreground">Escolha:</span>
              <span className="font-medium text-foreground">
                {selected.type === 'class_power' 
                  ? `+1 poder de ${classId.toLowerCase()}`
                  : selected.trackName 
                    ? `${selected.abilityName} (${selected.trackName})`
                    : 'Selecione uma trilha acima'
                }
              </span>
            </div>
          </div>
        )}
        
        {/* Aviso se não selecionou trilha */}
        {selected?.type === 'track_ability' && !selected?.trackId && (
          <div className="flex items-center gap-2 text-sm text-warning">
            <Info className="w-4 h-4" />
            <span>Selecione uma trilha para continuar.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Verifica se a escolha de Versatilidade está completa
 */
export function isVersatilityChoiceComplete(choice: VersatilityChoice | null): boolean {
  if (!choice) return false;
  
  if (choice.type === 'class_power') return true;
  if (choice.type === 'track_ability') return !!choice.trackId && !!choice.abilityId;
  
  return false;
}

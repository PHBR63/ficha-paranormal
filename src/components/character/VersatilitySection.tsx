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
 * ATUALIZADO: Agora valida pré-requisitos de poderes de trilha alternativa
 * e mostra indicadores visuais para poderes bloqueados.
 * 
 * @module VersatilitySection
 */

import { useState, useMemo, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Sword,
  Brain,
  Sparkles,
  Route,
  Plus,
  ChevronRight,
  CheckCircle2,
  Info,
  Lock,
  AlertTriangle,
  Search,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getAvailableTracks, getInitialAbility } from '@/lib/class-powers/track-registry';
import { checkPowerPrerequisites, formatPrerequisitesText, CharacterDataForPrerequisites } from '@/lib/class-abilities-prerequisites';
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
  /** Dados do personagem para validar pré-requisitos (opcional) */
  characterData?: CharacterDataForPrerequisites;
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
  characterData,
}: VersatilitySectionProps) {
  // IDs únicos para acessibilidade (evita colisões no DOM)
  const classPowerId = useId();
  const trackAbilityId = useId();
  
  // Estado para controlar se mostra lista de trilhas
  const [showTracks, setShowTracks] = useState(selected?.type === 'track_ability');
  // Estado para filtro de busca
  const [searchTerm, setSearchTerm] = useState('');
  
  // Obtém trilhas alternativas (exclui a atual)
  const availableTracks = useMemo(() => {
    return getAvailableTracks(classId as ClassId, currentTrackId);
  }, [classId, currentTrackId]);
  
  // Mapeia trilhas com suas primeiras habilidades e valida pré-requisitos
  const tracksWithAbilities = useMemo(() => {
    return availableTracks.map(track => {
      const firstAbility = getInitialAbility(track.id);
      
      // Verifica pré-requisitos se characterData foi fornecido
      let prerequisiteCheck = { meets: true, missing: [] as string[], details: [] as any[] };
      let prerequisiteText: string | null = null;
      
      if (firstAbility && characterData) {
        prerequisiteCheck = checkPowerPrerequisites(firstAbility.id, characterData);
        prerequisiteText = formatPrerequisitesText(firstAbility.id);
      }
      
      return {
        track,
        firstAbility,
        meetsPrerequisites: prerequisiteCheck.meets,
        missingPrerequisites: prerequisiteCheck.missing,
        prerequisiteText,
      };
    }).filter(item => item.firstAbility !== undefined);
  }, [availableTracks, characterData]);
  
  // Filtra trilhas pelo termo de busca
  const filteredTracks = useMemo(() => {
    if (!searchTerm.trim()) return tracksWithAbilities;
    
    const term = searchTerm.toLowerCase();
    return tracksWithAbilities.filter(({ track, firstAbility }) => 
      track.name.toLowerCase().includes(term) ||
      firstAbility?.name.toLowerCase().includes(term) ||
      firstAbility?.description.toLowerCase().includes(term)
    );
  }, [tracksWithAbilities, searchTerm]);
  
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
  
  // Handler para selecionar trilha específica (bloqueia se não atende pré-requisitos)
  const handleTrackSelect = (track: UnifiedTrack, ability: UnifiedTrackAbility, meetsPrereqs: boolean) => {
    // Bloqueia seleção se não atende pré-requisitos
    if (!meetsPrereqs && characterData) {
      return;
    }
    
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
            <RadioGroupItem value="class_power" id={classPowerId} className="mt-1" />
            <div className="flex-1">
              <Label htmlFor={classPowerId} className="flex items-center gap-2 cursor-pointer">
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
            <RadioGroupItem value="track_ability" id={trackAbilityId} className="mt-1" />
            <div className="flex-1">
              <Label htmlFor={trackAbilityId} className="flex items-center gap-2 cursor-pointer">
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
              initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
              animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
              transition={{ duration: 0.2 }}
            >
              <div className="pt-2 border-t border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Selecione a trilha:
                  </span>
                </div>
                
                {/* Campo de busca */}
                {tracksWithAbilities.length > 3 && (
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Buscar trilha ou habilidade..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-8 h-9 text-sm"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
                
                <ScrollArea className={cn(
                  compact 
                    ? filteredTracks.length > 2 ? "h-[200px]" : "max-h-[200px]"
                    : filteredTracks.length > 3 ? "h-[300px]" : "max-h-[300px]"
                )}>
                <TooltipProvider>
                  <div className="space-y-2 pr-3">
                    {filteredTracks.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhuma trilha encontrada para "{searchTerm}"</p>
                      </div>
                    ) : filteredTracks.map(({ track, firstAbility, meetsPrerequisites, missingPrerequisites, prerequisiteText }) => {
                      const isSelected = selected?.trackId === track.id;
                      const isBlocked = !meetsPrerequisites && characterData;
                      
                      const trackCard = (
                        <motion.div
                          key={track.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={cn(
                            "p-3 rounded-lg border transition-all",
                            isBlocked
                              ? "opacity-60 cursor-not-allowed border-destructive/30 bg-destructive/5"
                              : isSelected
                                ? cn("bg-gradient-to-r cursor-pointer", classColor, "ring-2 ring-primary")
                                : "hover:bg-muted/50 border-border cursor-pointer"
                          )}
                          onClick={() => handleTrackSelect(track, firstAbility!, meetsPrerequisites)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                              isBlocked
                                ? "bg-destructive/20 text-destructive"
                                : isSelected 
                                  ? "bg-primary text-primary-foreground" 
                                  : "bg-muted"
                            )}>
                              {isBlocked ? (
                                <Lock className="w-4 h-4" />
                              ) : (
                                <ClassIcon className="w-4 h-4" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className={cn(
                                  "font-medium",
                                  isBlocked ? "text-muted-foreground" : "text-foreground"
                                )}>
                                  {track.name}
                                </h4>
                                {isBlocked && (
                                  <Badge variant="destructive" className="text-xs">
                                    <Lock className="w-3 h-3 mr-1" />
                                    Bloqueado
                                  </Badge>
                                )}
                                {isSelected && !isBlocked && (
                                  <CheckCircle2 className="w-4 h-4 text-primary" />
                                )}
                              </div>
                              
                              {/* Preview da primeira habilidade */}
                              <div className={cn(
                                "mt-2 p-2 rounded border",
                                isBlocked
                                  ? "bg-destructive/5 border-destructive/20"
                                  : "bg-background/50 border-border/50"
                              )}>
                                <div className="flex items-center gap-2 text-xs flex-wrap">
                                  <Badge variant="outline" className="text-xs">NEX 10%</Badge>
                                  <span className={cn(
                                    "font-medium",
                                    isBlocked ? "text-muted-foreground" : "text-primary"
                                  )}>
                                    {firstAbility?.name}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {firstAbility?.description}
                                </p>
                                
                                {/* Mostra pré-requisitos não atendidos */}
                                {isBlocked && missingPrerequisites.length > 0 && (
                                  <div className="mt-2 flex items-start gap-1.5 text-xs text-destructive">
                                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    <span>Falta: {missingPrerequisites.join(', ')}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <ChevronRight className={cn(
                              "w-5 h-5 flex-shrink-0 transition-transform",
                              isBlocked
                                ? "text-muted-foreground/50"
                                : isSelected 
                                  ? "text-primary rotate-90" 
                                  : "text-muted-foreground"
                            )} />
                          </div>
                        </motion.div>
                      );
                      
                      // Envolve em Tooltip se bloqueado
                      if (isBlocked && prerequisiteText) {
                        return (
                          <Tooltip key={track.id}>
                            <TooltipTrigger asChild>
                              {trackCard}
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-xs">
                              <p className="text-sm">{prerequisiteText}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      }
                      
                      return trackCard;
                    })}
                  </div>
                </TooltipProvider>
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

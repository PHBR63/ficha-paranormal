/**
 * Painel de Histórico de Transcender
 * Mostra as escolhas de Transcender feitas pelo personagem com opção de reverter
 */

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Sparkles, 
  Undo2, 
  Lock, 
  Brain, 
  Calendar,
  Loader2,
  History,
  AlertTriangle,
  ChevronDown,
  Info,
} from 'lucide-react';
import { 
  getTranscenderHistory, 
  revertTranscenderChoice,
  getPowerChoiceMilestones,
} from '@/lib/transcender-system';
import { PARANORMAL_POWERS, ParanormalElement, ELEMENT_LABELS } from '@/lib/paranormal-powers';
import { toast } from '@/components/ui/sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import confetti from 'canvas-confetti';

interface TranscenderHistoryPanelProps {
  characterId: string;
  currentNex: number;
  onRevert?: (revertedPowerId: string) => void;
}

interface HistoryChoice {
  id: string;
  nex: number;
  powerId: string;
  powerName: string;
  sanityCost: number;
  resolvedAt: string;
  canRevert: boolean;
  revertBlockedReason?: string;
}

export function TranscenderHistoryPanel({
  characterId,
  currentNex,
  onRevert,
}: TranscenderHistoryPanelProps) {
  const [choices, setChoices] = useState<HistoryChoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPowers, setExpandedPowers] = useState<Set<string>>(new Set());
  const [reverting, setReverting] = useState<string | null>(null);
  const [confirmRevert, setConfirmRevert] = useState<HistoryChoice | null>(null);
  
  // Marcos de poder para referência
  const milestones = getPowerChoiceMilestones();
  
  // Carregar histórico
  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      try {
        const history = await getTranscenderHistory(characterId, currentNex);
        setChoices(history.choices);
      } catch (error) {
        console.error('Erro ao carregar histórico de Transcender:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadHistory();
  }, [characterId, currentNex]);
  
  // Dispara confete para celebrar restauração de SAN
  const triggerConfetti = () => {
    // Confete verde para representar SAN restaurada
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22c55e', '#4ade80', '#86efac', '#bbf7d0'],
    });
    
    // Segunda explosão com delay
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0.3, y: 0.6 },
        colors: ['#22c55e', '#4ade80', '#a855f7', '#c084fc'],
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 0.7, y: 0.6 },
        colors: ['#22c55e', '#4ade80', '#a855f7', '#c084fc'],
      });
    }, 150);
  };

  // Handler para reverter escolha
  const handleRevert = async (choice: HistoryChoice) => {
    setReverting(choice.id);
    
    try {
      const result = await revertTranscenderChoice(
        choice.id,
        characterId,
        currentNex
      );
      
      if (result.success) {
        // Dispara confete para celebrar!
        triggerConfetti();
        
        toast.success('Transcender revertido!', {
          description: `${choice.powerName} foi removido. +${result.sanityCostRestored} SAN restaurado!`,
        });
        
        // Atualizar lista local
        setChoices(prev => prev.filter(c => c.id !== choice.id));
        
        // Notificar componente pai
        if (onRevert && result.revertedPowerId) {
          onRevert(result.revertedPowerId);
        }
      } else {
        toast.error('Erro ao reverter', { description: result.error });
      }
    } catch (error) {
      console.error('Erro ao reverter Transcender:', error);
      toast.error('Erro ao reverter Transcender');
    } finally {
      setReverting(null);
      setConfirmRevert(null);
    }
  };

  // Toggle para expandir/colapsar descrição do poder
  const togglePowerExpand = (choiceId: string) => {
    setExpandedPowers(prev => {
      const next = new Set(prev);
      if (next.has(choiceId)) {
        next.delete(choiceId);
      } else {
        next.add(choiceId);
      }
      return next;
    });
  };

  // Busca detalhes completos do poder
  const getPowerDetails = (powerId: string) => {
    return PARANORMAL_POWERS.find(p => p.id === powerId);
  };
  
  // Obter elemento do poder
  const getPowerElement = (powerId: string): ParanormalElement | 'generic' => {
    const power = PARANORMAL_POWERS.find(p => p.id === powerId);
    return power?.element || 'generic';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (choices.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Nenhum Transcender utilizado ainda.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <History className="w-4 h-4 text-paranormal" />
          <span className="text-sm font-medium">Histórico de Transcender</span>
          <Badge variant="outline" className="text-xs">
            {choices.length} uso{choices.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        {choices.map((choice) => {
          const element = getPowerElement(choice.powerId);
          const isReverting = reverting === choice.id;
          const isExpanded = expandedPowers.has(choice.id);
          const powerDetails = getPowerDetails(choice.powerId);
          
          return (
            <Card 
              key={choice.id} 
              className={`
                border transition-colors
                ${choice.canRevert 
                  ? 'border-paranormal/30 bg-paranormal/5' 
                  : 'border-border bg-muted/30'
                }
              `}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Cabeçalho com NEX e poder */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        variant="outline" 
                        className="text-xs bg-paranormal/10 border-paranormal/30"
                      >
                        NEX {choice.nex}%
                      </Badge>
                      <span className="font-medium text-sm truncate">
                        {choice.powerName}
                      </span>
                    </div>
                    
                    {/* Detalhes */}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Brain className="w-3 h-3" />
                        -{choice.sanityCost} SAN
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDistanceToNow(new Date(choice.resolvedAt), { 
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                      {element !== 'generic' && (
                        <Badge variant="secondary" className="text-[10px] h-4">
                          {ELEMENT_LABELS[element as ParanormalElement]}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Prévia expandível do poder */}
                    {powerDetails && (
                      <Collapsible open={isExpanded} onOpenChange={() => togglePowerExpand(choice.id)}>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 mt-2 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <Info className="w-3 h-3 mr-1" />
                            Ver descrição
                            <ChevronDown 
                              className={`w-3 h-3 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                            />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2">
                          <div className="p-2.5 rounded-md bg-muted/50 border border-border/50 text-xs space-y-2">
                            <p className="text-foreground/90 leading-relaxed">
                              {powerDetails.description}
                            </p>
                            {powerDetails.affinityEffect && (
                              <p className="text-paranormal/80 italic">
                                <Sparkles className="w-3 h-3 inline mr-1" />
                                {powerDetails.affinityEffect}
                              </p>
                            )}
                            {powerDetails.prerequisite && (
                              <p className="text-muted-foreground">
                                <strong>Pré-requisito:</strong> {powerDetails.prerequisite.element} {powerDetails.prerequisite.count}
                              </p>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>
                  
                  {/* Botão de reverter */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          {choice.canRevert ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-warning hover:text-warning hover:bg-warning/10"
                              onClick={() => setConfirmRevert(choice)}
                              disabled={isReverting}
                            >
                              {isReverting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Undo2 className="w-4 h-4" />
                              )}
                            </Button>
                          ) : (
                            <div className="h-8 w-8 flex items-center justify-center">
                              <Lock className="w-4 h-4 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        {choice.canRevert 
                          ? 'Reverter esta escolha' 
                          : choice.revertBlockedReason
                        }
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Dialog de confirmação */}
      <AlertDialog open={!!confirmRevert} onOpenChange={() => setConfirmRevert(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Reverter Transcender?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <span className="block">
                  Você está prestes a reverter a escolha de <strong>{confirmRevert?.powerName}</strong> 
                  {' '}feita no NEX {confirmRevert?.nex}%.
                </span>
                <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-destructive" />
                    <span>O poder será removido da sua ficha</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-success" />
                    <span>+{confirmRevert?.sanityCost} SAN será restaurado</span>
                  </span>
                </div>
                <span className="block text-warning text-sm">
                  Esta ação não pode ser desfeita.
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-warning text-warning-foreground hover:bg-warning/90"
              onClick={() => confirmRevert && handleRevert(confirmRevert)}
            >
              Reverter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

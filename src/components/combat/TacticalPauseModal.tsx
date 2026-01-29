/**
 * TacticalPauseModal - Modal de Pausa Tática
 * Permite planejar ações, ver status detalhado e consultar regras durante o combate
 */
import { useState, useEffect } from 'react';
import { 
  Pause, 
  Play, 
  Target, 
  Shield, 
  Swords, 
  Move, 
  Hand, 
  Zap,
  Clock,
  AlertTriangle,
  BookOpen,
  Users,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// ScrollArea removido - usando overflow nativo para evitar bug #185 com React 19
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { type CombatantState, type TurnState } from '@/lib/game-engine';
import { CONDITIONS } from '@/lib/conditions';

interface TacticalPauseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCombatant: CombatantState | null;
  allCombatants: CombatantState[];
  round: number;
  onDelayTurn: () => void;
  onPrepareAction: (trigger: string, action: string) => void;
  onResume: () => void;
}

// Tipos de ações disponíveis no turno
const ACTION_TYPES = [
  {
    id: 'padrao',
    name: 'Ação Padrão',
    icon: <Swords className="w-4 h-4" />,
    description: 'Atacar, usar habilidade, conjurar ritual',
    examples: ['Ataque corpo a corpo', 'Ataque à distância', 'Conjurar ritual', 'Usar poder'],
    color: 'text-primary',
  },
  {
    id: 'movimento',
    name: 'Ação de Movimento',
    icon: <Move className="w-4 h-4" />,
    description: 'Mover-se, levantar, sacar arma',
    examples: ['Mover até seu deslocamento', 'Levantar-se', 'Sacar/guardar item', 'Montar/desmontar'],
    color: 'text-accent',
  },
  {
    id: 'livre',
    name: 'Ação Livre',
    icon: <Hand className="w-4 h-4" />,
    description: 'Falar, largar objeto, olhar ao redor',
    examples: ['Falar uma frase curta', 'Largar item', 'Soltar ritual sustentado'],
    color: 'text-green-400',
  },
  {
    id: 'reacao',
    name: 'Reação',
    icon: <Shield className="w-4 h-4" />,
    description: 'Usada fora do seu turno em resposta a gatilhos',
    examples: ['Ataque de oportunidade', 'Ritual de reação', 'Poder defensivo'],
    color: 'text-yellow-400',
  },
  {
    id: 'completa',
    name: 'Ação Completa',
    icon: <Target className="w-4 h-4" />,
    description: 'Consome padrão + movimento',
    examples: ['Investida', 'Corrida', 'Golpe Descuidado', 'Ataque Total'],
    color: 'text-purple-400',
  },
];

// Regras rápidas de combate
const COMBAT_RULES = [
  {
    title: 'Ordem do Turno',
    content: '1. Início do turno (efeitos automáticos)\n2. Ações (padrão + movimento + livres)\n3. Fim do turno',
  },
  {
    title: 'Limite de PE',
    content: 'Você pode gastar no máximo seu NEX ÷ 5 (mínimo 1) PE por rodada.',
  },
  {
    title: 'Ataque de Oportunidade',
    content: 'Quando um inimigo sai de sua área de ameaça, você pode usar sua reação para fazer um ataque.',
  },
  {
    title: 'Flanquear',
    content: 'Atacar um inimigo que está sendo ameaçado por um aliado do lado oposto concede +2 no teste.',
  },
  {
    title: 'Cobertura',
    content: 'Leve: +2 Defesa. Pesada: +5 Defesa. Total: não pode ser atacado diretamente.',
  },
];

// Componente de card de combatente resumido
function CombatantSummaryCard({ combatant, isCurrent }: { combatant: CombatantState; isCurrent: boolean }) {
  const hpPercent = (combatant.hp / combatant.hpMax) * 100;
  
  return (
    <div className={cn(
      "p-3 rounded-lg border",
      isCurrent 
        ? "bg-primary/10 border-primary/30" 
        : "bg-card border-border"
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isCurrent && <ChevronRight className="w-3 h-3 text-primary animate-pulse" />}
          <span className="font-medium text-sm">{combatant.name}</span>
          {combatant.isNPC && (
            <Badge variant="outline" className="text-[10px] px-1 py-0">NPC</Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">Init: {combatant.initiative}</span>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className={cn(
          "text-center p-1 rounded",
          hpPercent <= 25 ? "bg-destructive/20 text-destructive" : "bg-muted"
        )}>
          <span className="font-bold">{combatant.hp}</span>/{combatant.hpMax} PV
        </div>
        <div className="text-center p-1 rounded bg-muted">
          <span className="font-bold">{combatant.pe}</span>/{combatant.peMax} PE
        </div>
        <div className="text-center p-1 rounded bg-muted">
          DEF <span className="font-bold">{combatant.defense}</span>
        </div>
      </div>
      
      {combatant.conditions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {combatant.conditions.map(cond => (
            <Badge key={cond} variant="destructive" className="text-[10px] px-1 py-0">
              {CONDITIONS[cond]?.name || cond}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// Componente de tracker de ações do turno
function TurnActionsTracker({ turnState }: { turnState: TurnState }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" />
        Recursos do Turno
      </h4>
      
      <div className="grid grid-cols-2 gap-2">
        <div className={cn(
          "p-2 rounded-lg border text-center",
          turnState.hasActed ? "bg-muted/50 border-muted" : "bg-primary/10 border-primary/30"
        )}>
          <Swords className={cn("w-4 h-4 mx-auto mb-1", turnState.hasActed ? "text-muted-foreground" : "text-primary")} />
          <span className={cn("text-xs", turnState.hasActed && "line-through text-muted-foreground")}>
            Ação Padrão
          </span>
        </div>
        
        <div className={cn(
          "p-2 rounded-lg border text-center",
          turnState.hasMoved ? "bg-muted/50 border-muted" : "bg-accent/10 border-accent/30"
        )}>
          <Move className={cn("w-4 h-4 mx-auto mb-1", turnState.hasMoved ? "text-muted-foreground" : "text-accent")} />
          <span className={cn("text-xs", turnState.hasMoved && "line-through text-muted-foreground")}>
            Movimento
          </span>
        </div>
        
        <div className={cn(
          "p-2 rounded-lg border text-center",
          turnState.hasReacted ? "bg-muted/50 border-muted" : "bg-yellow-500/10 border-yellow-500/30"
        )}>
          <Shield className={cn("w-4 h-4 mx-auto mb-1", turnState.hasReacted ? "text-muted-foreground" : "text-yellow-400")} />
          <span className={cn("text-xs", turnState.hasReacted && "line-through text-muted-foreground")}>
            Reação
          </span>
        </div>
        
        <div className="p-2 rounded-lg border text-center bg-purple-500/10 border-purple-500/30">
          <Zap className="w-4 h-4 mx-auto mb-1 text-purple-400" />
          <span className="text-xs">
            PE: {turnState.peSpentThisTurn}/{turnState.peLimit}
          </span>
        </div>
      </div>
      
      {turnState.actionsRemaining < 2 && (
        <div className="p-2 bg-destructive/10 border border-destructive/30 rounded-lg text-center">
          <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-destructive" />
          <span className="text-xs text-destructive">
            Condição Lento: apenas {turnState.actionsRemaining} ação
          </span>
        </div>
      )}
    </div>
  );
}

export function TacticalPauseModal({
  open,
  onOpenChange,
  currentCombatant,
  allCombatants,
  round,
  onDelayTurn,
  onPrepareAction,
  onResume,
}: TacticalPauseModalProps) {
  const [selectedTab, setSelectedTab] = useState('acoes');
  const [prepareActionTrigger, setPrepareActionTrigger] = useState('');
  const [prepareActionDescription, setPrepareActionDescription] = useState('');

  // Reseta ao abrir
  useEffect(() => {
    if (open) {
      setPrepareActionTrigger('');
      setPrepareActionDescription('');
    }
  }, [open]);

  const handlePrepareAction = () => {
    if (prepareActionTrigger && prepareActionDescription) {
      onPrepareAction(prepareActionTrigger, prepareActionDescription);
      onOpenChange(false);
    }
  };

  if (!currentCombatant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <Pause className="w-5 h-5 text-yellow-400" />
            <span className="font-display tracking-wider">PAUSA TÁTICA</span>
            <Badge variant="outline" className="ml-auto">
              Rodada {round}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full flex flex-col">
            <TabsList className="grid grid-cols-4 flex-shrink-0">
              <TabsTrigger value="acoes" className="text-xs">
                <Swords className="w-3 h-3 mr-1" />
                Ações
              </TabsTrigger>
              <TabsTrigger value="combatentes" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                Combatentes
              </TabsTrigger>
              <TabsTrigger value="taticas" className="text-xs">
                <Target className="w-3 h-3 mr-1" />
                Táticas
              </TabsTrigger>
              <TabsTrigger value="regras" className="text-xs">
                <BookOpen className="w-3 h-3 mr-1" />
                Regras
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden mt-4">
              {/* Aba de Ações */}
              <TabsContent value="acoes" className="h-full m-0">
                <div className="h-[400px] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                  <div className="grid grid-cols-2 gap-4 pr-4">
                    {/* Turno atual */}
                    <div className="space-y-4">
                      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <h4 className="font-display text-sm tracking-wider text-primary mb-2">
                          TURNO DE {currentCombatant.name.toUpperCase()}
                        </h4>
                        <TurnActionsTracker turnState={currentCombatant.turnState} />
                      </div>
                    </div>

                    {/* Tipos de ações */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium mb-3">Tipos de Ações</h4>
                      {ACTION_TYPES.map(action => (
                        <div key={action.id} className="p-3 bg-card rounded-lg border border-border">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={action.color}>{action.icon}</span>
                            <span className="font-medium text-sm">{action.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{action.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {action.examples.map((ex, i) => (
                              <Badge key={i} variant="secondary" className="text-[10px]">
                                {ex}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Aba de Combatentes */}
              <TabsContent value="combatentes" className="h-full m-0">
                <div className="h-[400px] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                  <div className="grid grid-cols-2 gap-3 pr-4">
                    {allCombatants.map((combatant, index) => (
                      <CombatantSummaryCard 
                        key={combatant.id} 
                        combatant={combatant}
                        isCurrent={combatant.id === currentCombatant.id}
                      />
                  ))}
                </div>
              </div>
              </TabsContent>

              {/* Aba de Táticas */}
              <TabsContent value="taticas" className="h-full m-0">
                <div className="h-[400px] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                  <div className="space-y-4 pr-4">
                    {/* Adiar Turno */}
                    <div className="p-4 bg-card rounded-lg border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-accent" />
                        <span className="font-medium">Adiar Turno (Delay)</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Você pode adiar seu turno para agir depois na ordem de iniciativa. 
                        Sua nova posição será logo antes do combatente que você escolher.
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          onDelayTurn();
                          onOpenChange(false);
                        }}
                        className="w-full"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Adiar Meu Turno
                      </Button>
                    </div>

                    {/* Preparar Ação */}
                    <div className="p-4 bg-card rounded-lg border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-primary" />
                        <span className="font-medium">Preparar Ação</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Você pode preparar uma ação para ser executada quando um gatilho específico ocorrer.
                        Consome sua ação padrão e usa sua reação quando ativada.
                      </p>
                      
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Gatilho</label>
                          <input
                            type="text"
                            value={prepareActionTrigger}
                            onChange={(e) => setPrepareActionTrigger(e.target.value)}
                            placeholder="Ex: Quando um inimigo entrar no meu alcance..."
                            className="w-full mt-1 px-3 py-2 text-sm bg-background border border-border rounded-md"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Ação</label>
                          <input
                            type="text"
                            value={prepareActionDescription}
                            onChange={(e) => setPrepareActionDescription(e.target.value)}
                            placeholder="Ex: Faço um ataque corpo a corpo"
                            className="w-full mt-1 px-3 py-2 text-sm bg-background border border-border rounded-md"
                          />
                        </div>
                        <Button 
                          onClick={handlePrepareAction}
                          disabled={!prepareActionTrigger || !prepareActionDescription}
                          className="w-full"
                        >
                          <Target className="w-4 h-4 mr-2" />
                          Preparar Ação
                        </Button>
                      </div>
                    </div>

                    {/* Dicas táticas */}
                    <div className="p-4 bg-muted/30 rounded-lg border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">Dicas Táticas</span>
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Use cobertura para aumentar sua Defesa</li>
                        <li>• Flanqueie inimigos para +2 no ataque</li>
                        <li>• Ataques de oportunidade são gratuitos</li>
                        <li>• Rituais sustentados custam PE todo turno</li>
                        <li>• Morrendo: você tem 3 rodadas para ser estabilizado</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Aba de Regras */}
              <TabsContent value="regras" className="h-full m-0">
                <div className="h-[400px] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                  <div className="space-y-3 pr-4">
                    {COMBAT_RULES.map((rule, index) => (
                      <div key={index} className="p-3 bg-card rounded-lg border border-border">
                        <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                          <BookOpen className="w-3 h-3 text-primary" />
                          {rule.title}
                        </h4>
                        <p className="text-xs text-muted-foreground whitespace-pre-line">
                          {rule.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <Separator className="my-4" />

        <div className="flex justify-end gap-2 flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Continuar Planejando
          </Button>
          <Button onClick={() => { onResume(); onOpenChange(false); }}>
            <Play className="w-4 h-4 mr-2" />
            Retomar Combate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

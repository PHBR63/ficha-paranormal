/**
 * Painel de Poderes Paranormais
 * Exibe os poderes paranormais do personagem com indicadores de afinidade elemental
 * e cálculos automáticos de bônus
 */

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles, Droplet, Skull, BookOpen, Zap, Star, TrendingUp, Shield, GraduationCap, AlertTriangle, Trash2 } from 'lucide-react';
import {
  ParanormalPower,
  ParanormalElement,
  SavedParanormalPower,
  PARANORMAL_POWERS,
  getPowerById,
  getPowerEffect,
  calculatePowerModifiers,
  getActivePowerEffects,
  ELEMENT_LABELS,
  ELEMENT_COLORS,
  ELEMENT_BG_COLORS,
} from '@/lib/paranormal-powers';
import { ALL_RITUALS } from '@/lib/rituals/legacy-exports';
import { SKILLS } from '@/lib/character-data';
import { ExcessPowersRemovalModal } from './ExcessPowersRemovalModal';

// Ícones por elemento
const ELEMENT_ICONS: Record<ParanormalElement | 'generic', React.ComponentType<{ className?: string }>> = {
  sangue: Droplet,
  morte: Skull,
  conhecimento: BookOpen,
  energia: Zap,
  generic: Star,
};

// Helper para obter nome de perícia pelo ID
const getSkillName = (skillId: string): string => {
  const skill = SKILLS.find(s => s.id === skillId);
  return skill?.name || skillId;
};

// Helper para obter nome de ritual pelo ID
const getRitualName = (ritualId: string): string => {
  const ritual = ALL_RITUALS.find(r => r.id === ritualId);
  return ritual?.name || ritualId;
};

interface ParanormalPowersPanelProps {
  powers: (ParanormalPower | SavedParanormalPower)[];
  elementalAffinity?: ParanormalElement | null;
  affinityActive?: boolean;
  nex: number;
  transcenderTotal?: number;
  transcenderUsed?: number;
  originId?: string; // Origem do personagem para calcular poderes de origem
  characterId?: string; // ID do personagem para histórico
  onRemovePowers?: (powerIds: string[], powersToArchive: SavedParanormalPower[]) => Promise<void>; // Callback para remover poderes
}

export function ParanormalPowersPanel({
  powers,
  elementalAffinity,
  affinityActive = false,
  nex,
  transcenderTotal = 0,
  transcenderUsed = 0,
  originId,
  characterId,
  onRemovePowers,
}: ParanormalPowersPanelProps) {
  const [removalModalOpen, setRemovalModalOpen] = useState(false);
  const transcenderRemaining = transcenderTotal - transcenderUsed;
  
  // Calcula limite de poderes (Transcender + origem)
  const powersFromOrigin = originId === 'cultista-arrependido' ? 1 : 0;
  const maxPowers = transcenderTotal + powersFromOrigin;
  const excessPowers = Math.max(0, powers.length - maxPowers);
  const hasExcessPowers = excessPowers > 0;
  // Calcula bônus ativos dos poderes
  const powerModifiers = useMemo(() => {
    const powerIds = powers.map(p => p.id);
    return calculatePowerModifiers(powerIds, nex, affinityActive, elementalAffinity || undefined);
  }, [powers, nex, affinityActive, elementalAffinity]);

  // Lista de efeitos ativos formatados
  const activeEffects = useMemo(() => {
    const powerIds = powers.map(p => p.id);
    return getActivePowerEffects(powerIds, affinityActive, elementalAffinity || undefined);
  }, [powers, affinityActive, elementalAffinity]);

  // Agrupa poderes por elemento
  const powersByElement = useMemo(() => {
    const grouped: Record<string, (ParanormalPower | SavedParanormalPower)[]> = {};
    powers.forEach(power => {
      const element = power.element;
      if (!grouped[element]) {
        grouped[element] = [];
      }
      grouped[element].push(power);
    });
    return grouped;
  }, [powers]);

  if (powers.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Nenhum poder paranormal adquirido.</p>
        <p className="text-xs mt-1">
          Use a habilidade "Transcender" para obter poderes.
        </p>
      </div>
    );
  }

  // Marcos oficiais de Transcender
  const TRANSCENDER_MILESTONES = [15, 30, 45, 60, 75, 90];
  
  return (
    <div className="space-y-4">
      {/* Modal de Remoção de Poderes Excedentes */}
      {onRemovePowers && characterId && (
        <ExcessPowersRemovalModal
          open={removalModalOpen}
          onOpenChange={setRemovalModalOpen}
          powers={powers as SavedParanormalPower[]}
          maxPowers={maxPowers}
          characterId={characterId}
          onRemovePowers={onRemovePowers}
        />
      )}

      {/* Alerta de Poderes Excedentes com botão de ação */}
      {hasExcessPowers && (
        <div className="flex items-center justify-between gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/10">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-destructive">Poderes excedentes!</span>
              <span className="text-muted-foreground ml-1">
                {powers.length}/{maxPowers} poderes ({excessPowers} além do limite)
              </span>
            </div>
          </div>
          {onRemovePowers && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setRemovalModalOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Remover
            </Button>
          )}
        </div>
      )}
      
      {/* Contador de Transcender com Tooltip */}
      {transcenderTotal > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`
                flex items-center justify-between p-3 rounded-lg border cursor-help
                ${transcenderRemaining > 0 
                  ? 'bg-paranormal/10 border-paranormal/30' 
                  : 'bg-muted/50 border-muted'
                }
              `}>
                <div className="flex items-center gap-2">
                  <Sparkles className={`w-4 h-4 ${transcenderRemaining > 0 ? 'text-paranormal' : 'text-muted-foreground'}`} />
                  <span className="text-sm font-medium">Slots de Transcender</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Indicador visual de slots com NEX */}
                  <div className="flex gap-1.5">
                    {Array.from({ length: transcenderTotal }).map((_, i) => {
                      const milestoneNex = TRANSCENDER_MILESTONES[i];
                      const isUsed = i < transcenderUsed;
                      return (
                        <TooltipProvider key={i}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={`
                                  w-6 h-6 rounded flex items-center justify-center text-[10px] font-medium
                                  transition-colors cursor-help
                                  ${isUsed 
                                    ? 'bg-paranormal text-paranormal-foreground shadow-sm shadow-paranormal/50' 
                                    : 'bg-muted-foreground/20 text-muted-foreground border border-muted-foreground/20'
                                  }
                                `}
                              >
                                {milestoneNex}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                              NEX {milestoneNex}% — {isUsed ? 'Usado' : 'Disponível'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </div>
                  <Badge 
                    variant={transcenderRemaining > 0 ? 'default' : 'secondary'}
                    className={transcenderRemaining > 0 ? 'bg-paranormal hover:bg-paranormal/90' : ''}
                  >
                    {transcenderUsed}/{transcenderTotal}
                  </Badge>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="font-medium mb-1">Transcender</p>
              <p className="text-xs text-muted-foreground">
                Transcender permite trocar uma escolha de poder de classe por um Poder Paranormal.
                O custo é não receber o aumento de Sanidade daquele NEX.
              </p>
              <p className="text-xs mt-1">
                <span className="text-paranormal font-medium">{transcenderUsed}</span> usado{transcenderUsed !== 1 ? 's' : ''} · 
                <span className="text-muted-foreground"> {transcenderRemaining}</span> disponível{transcenderRemaining !== 1 ? 'is' : ''}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {/* Indicador de Afinidade Elemental */}
      {elementalAffinity && (
        <div className={`
          p-3 rounded-lg border
          ${affinityActive 
            ? 'bg-primary/10 border-primary/30' 
            : 'bg-muted/50 border-muted'
          }
        `}>
          <div className="flex items-center gap-2">
            {(() => {
              const Icon = ELEMENT_ICONS[elementalAffinity];
              return <Icon className={`w-5 h-5 ${ELEMENT_COLORS[elementalAffinity]}`} />;
            })()}
            <span className="font-medium">
              Afinidade: {ELEMENT_LABELS[elementalAffinity]}
            </span>
            <Badge variant={affinityActive ? 'default' : 'secondary'} className="ml-auto">
              {affinityActive ? 'Ativa' : 'Inativa'}
            </Badge>
          </div>
          {affinityActive && (
            <p className="text-xs text-muted-foreground mt-2">
              Poderes de {ELEMENT_LABELS[elementalAffinity]} têm efeitos aprimorados.
            </p>
          )}
        </div>
      )}

      {/* Bônus Ativos (resumo) */}
      {Object.keys(powerModifiers).length > 0 && (
        <Card className="bg-success/5 border-success/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-success">
              <TrendingUp className="w-4 h-4" />
              Bônus Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(powerModifiers).map(([stat, value]) => (
                <div key={stat} className="flex justify-between">
                  <span className="text-muted-foreground capitalize">{stat}:</span>
                  <span className="font-medium text-success">+{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Poderes por Elemento */}
      <TooltipProvider>
        <div className="space-y-3">
          {Object.entries(powersByElement).map(([element, elementPowers]) => {
            const Icon = ELEMENT_ICONS[element as ParanormalElement | 'generic'];
            const colorClass = ELEMENT_COLORS[element as ParanormalElement | 'generic'];
            const bgClass = ELEMENT_BG_COLORS[element as ParanormalElement | 'generic'];
            const isAffinityElement = element === elementalAffinity;

            return (
              <div key={element} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${bgClass}`}>
                    <Icon className={`w-4 h-4 ${colorClass}`} />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {ELEMENT_LABELS[element as ParanormalElement | 'generic']}
                  </span>
                  {isAffinityElement && affinityActive && (
                    <Sparkles className="w-3 h-3 text-primary ml-auto" />
                  )}
                </div>

                {elementPowers.map((power) => {
                  const fullPower = getPowerById(power.id);
                  const showAffinity = isAffinityElement && affinityActive && fullPower?.affinityEffect;
                  const effectText = fullPower 
                    ? getPowerEffect(fullPower, affinityActive, elementalAffinity || undefined)
                    : power.description;
                  
                  // Extrai escolhas salvas se existirem
                  const savedPower = power as SavedParanormalPower;
                  const choices = savedPower.choices;
                  const hasChoices = choices && (choices.skills?.length || choices.ritualId || choices.resistElement);

                  return (
                    <Tooltip key={power.id}>
                      <TooltipTrigger asChild>
                        <div className={`
                          p-3 rounded-lg border transition-colors cursor-help
                          ${showAffinity 
                            ? 'bg-primary/10 border-primary/30' 
                            : 'bg-muted/30 border-muted hover:border-muted-foreground/30'
                          }
                        `}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{power.name}</span>
                                {showAffinity && (
                                  <Badge variant="default" className="text-xs">
                                    Aprimorado
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {effectText}
                              </p>
                              
                              {/* Exibe escolhas salvas */}
                              {hasChoices && (
                                <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                                  {/* Perícias escolhidas (Expansão de Conhecimento) */}
                                  {choices.skills && choices.skills.length > 0 && (
                                    <div className="flex items-center gap-1.5 text-xs">
                                      <GraduationCap className="w-3 h-3 text-blue-400" />
                                      <span className="text-blue-400 font-medium">+5:</span>
                                      <span className="text-muted-foreground">
                                        {choices.skills.map(getSkillName).join(', ')}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Ritual escolhido (Aprender Ritual) */}
                                  {choices.ritualId && (
                                    <div className="flex items-center gap-1.5 text-xs">
                                      <BookOpen className="w-3 h-3 text-purple-400" />
                                      <span className="text-purple-400 font-medium">Ritual:</span>
                                      <span className="text-muted-foreground">
                                        {getRitualName(choices.ritualId)}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Elemento de resistência (Resistir a Elemento) */}
                                  {choices.resistElement && (
                                    <div className="flex items-center gap-1.5 text-xs">
                                      <Shield className="w-3 h-3 text-green-400" />
                                      <span className="text-green-400 font-medium">Resistência 5:</span>
                                      <span className="text-muted-foreground">
                                        {ELEMENT_LABELS[choices.resistElement]}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-sm">
                        <div className="space-y-2">
                          <p className="font-medium">{power.name}</p>
                          <div>
                            <p className="text-xs text-muted-foreground">Efeito Base:</p>
                            <p className="text-sm">{fullPower?.description || power.description}</p>
                          </div>
                          {fullPower?.affinityEffect && (
                            <div className={showAffinity ? 'text-primary' : ''}>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Com Afinidade:
                              </p>
                              <p className="text-sm">{fullPower.affinityEffect}</p>
                            </div>
                          )}
                          {hasChoices && (
                            <div className="border-t border-border/50 pt-2">
                              <p className="text-xs text-muted-foreground mb-1">Escolhas:</p>
                              {choices.skills && choices.skills.length > 0 && (
                                <p className="text-sm text-blue-400">
                                  Perícias: {choices.skills.map(getSkillName).join(', ')}
                                </p>
                              )}
                              {choices.ritualId && (
                                <p className="text-sm text-purple-400">
                                  Ritual: {getRitualName(choices.ritualId)}
                                </p>
                              )}
                              {choices.resistElement && (
                                <p className="text-sm text-green-400">
                                  Resistência: {ELEMENT_LABELS[choices.resistElement]}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}

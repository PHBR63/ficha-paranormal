import { ConhecimentoSymbol, EnergiaSymbol, MorteSymbol, SangueSymbol } from '@/components/icons/element-symbols';
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
import { Sparkles, BookOpen, Star, TrendingUp, Shield, GraduationCap, AlertTriangle, Trash2 } from '@/components/icons/ordem-icons';
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
  sangue: SangueSymbol,
  morte: MorteSymbol,
  conhecimento: ConhecimentoSymbol,
  energia: EnergiaSymbol,
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
  totalSlotsUsed?: number; // Total de slots usados (Transcender + Poder de Classe)
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
  totalSlotsUsed = 0,
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
      
      {/* Indicador visual de slots de NEX: Transcender vs Poder de Classe */}
      {transcenderTotal > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-3 rounded-lg border bg-muted/30 border-border cursor-help space-y-3">
                {/* Título */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-paranormal" />
                    <span className="text-sm font-medium">Slots de NEX</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {totalSlotsUsed}/{transcenderTotal} usados
                  </Badge>
                </div>
                
                {/* Indicadores visuais por slot */}
                <div className="flex gap-1.5 flex-wrap">
                  {Array.from({ length: transcenderTotal }).map((_, i) => {
                    const milestoneNex = TRANSCENDER_MILESTONES[i];
                    // Determina o tipo de uso do slot
                    const isTranscender = i < transcenderUsed;
                    const isClassPower = i >= transcenderUsed && i < totalSlotsUsed;
                    const isAvailable = i >= totalSlotsUsed;
                    
                    // Estilo baseado no tipo
                    let slotClass = '';
                    let slotLabel = '';
                    if (isTranscender) {
                      slotClass = 'bg-paranormal text-paranormal-foreground shadow-sm shadow-paranormal/50';
                      slotLabel = 'Transcender';
                    } else if (isClassPower) {
                      slotClass = 'bg-primary text-primary-foreground shadow-sm shadow-primary/50';
                      slotLabel = 'Poder de Classe';
                    } else {
                      slotClass = 'bg-muted-foreground/20 text-muted-foreground border border-muted-foreground/20';
                      slotLabel = 'Disponível';
                    }
                    
                    return (
                      <TooltipProvider key={i}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`
                                w-8 h-8 rounded flex items-center justify-center text-[11px] font-semibold
                                transition-colors cursor-help
                                ${slotClass}
                              `}
                            >
                              {milestoneNex}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">
                            <p className="font-medium">NEX {milestoneNex}%</p>
                            <p className={`
                              ${isTranscender ? 'text-paranormal' : ''}
                              ${isClassPower ? 'text-primary' : ''}
                              ${isAvailable ? 'text-muted-foreground' : ''}
                            `}>
                              {slotLabel}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
                
                {/* Legenda */}
                <div className="flex items-center gap-4 text-[10px] border-t border-border pt-2 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-paranormal" />
                    <span className="text-muted-foreground">Transcender ({transcenderUsed})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-primary" />
                    <span className="text-muted-foreground">Poder de Classe ({totalSlotsUsed - transcenderUsed})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-muted-foreground/20 border border-muted-foreground/20" />
                    <span className="text-muted-foreground">Disponível ({transcenderTotal - totalSlotsUsed})</span>
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="font-medium mb-1">Slots de NEX</p>
              <p className="text-xs text-muted-foreground">
                Nos NEX 15%, 30%, 45%, 60%, 75% e 90%, você pode escolher Transcender no lugar de um poder de classe.
              </p>
              <p className="text-xs mt-1 text-destructive/80">
                Transcender: Não recebe o aumento de Sanidade daquele NEX.
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
              Aprimorar um poder de {ELEMENT_LABELS[elementalAffinity]} exige escolhê-lo uma segunda vez e conferir seus requisitos.
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
                  const showAffinity = isAffinityElement && affinityActive && powers.filter(entry => entry.id === power.id).length >= 2 && fullPower?.affinityEffect;
                  const effectText = fullPower 
                    ? getPowerEffect(fullPower, affinityActive && powers.filter(entry => entry.id === power.id).length >= 2, elementalAffinity || undefined)
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

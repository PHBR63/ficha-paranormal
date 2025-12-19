/**
 * Modal de Progressão de NEX
 * Permite subir de nível, recalcular stats, desbloquear habilidades/rituais,
 * escolher poderes paranormais via Transcender e selecionar Afinidade Elemental no NEX 50%
 * 
 * REGRA TRANSCENDER: Ao usar Transcender para escolher um poder paranormal,
 * o personagem NÃO recebe o aumento de Sanidade daquele NEX.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowUp,
  Sparkles,
  Heart,
  Zap,
  Brain,
  Shield,
  ChevronRight,
  Lock,
  Unlock,
  BookOpen,
  Route,
  Check,
  Loader2,
  Droplet,
  Skull,
  Star,
  AlertTriangle,
} from 'lucide-react';
import { 
  CLASSES, 
  getPatentByNex, 
  calculateDerivedStats, 
  getTrackById,
  getAvailableTrackAbilities,
} from '@/lib/character-data';
import { getMaxRitualCircle, getRitualCount } from '@/lib/rituals/legacy-exports';
import {
  ParanormalPower,
  ParanormalElement,
  ELEMENT_LABELS,
  ELEMENT_COLORS,
  ELEMENT_BG_COLORS,
  AFFINITY_DESCRIPTIONS,
} from '@/lib/paranormal-powers';
import { ParanormalPowerSelectModal } from './ParanormalPowerSelectModal';
import { NonOccultistRitualModal, RitualSource } from './NonOccultistRitualModal';
import confetti from 'canvas-confetti';

// NEX válidos (incremento de 5%)
const NEX_VALUES = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 99];

// Ícones por elemento para seleção de afinidade
const AFFINITY_ICONS: Record<ParanormalElement, React.ComponentType<{ className?: string }>> = {
  sangue: Droplet,
  morte: Skull,
  conhecimento: BookOpen,
  energia: Zap,
};

/**
 * Calcula o ganho de sanidade para um específico aumento de NEX
 */
function getSanityGainForNex(characterClass: string, currentNex: number, nextNex: number): number {
  const currentStats = calculateDerivedStats(characterClass, 1, 1, currentNex);
  const nextStats = calculateDerivedStats(characterClass, 1, 1, nextNex);
  // A diferença de sanidade entre os dois NEX (considerando apenas a progressão de classe, não vigor/presença)
  return nextStats.san - currentStats.san;
}

interface NexProgressionModalProps {
  open: boolean;
  onClose: () => void;
  character: {
    id: string;
    name: string;
    class: string;
    class_track: string | null;
    nex: number;
    vigor: number;
    presence: number;
    origin: string;
    hp_max: number;
    pe_max: number;
    san_max: number;
    rituals: string[];
    abilities: string[];
    paranormal_powers?: ParanormalPower[];
    elemental_affinity?: ParanormalElement | null;
    affinity_active?: boolean;
  };
  onLevelUp: (newNex: number, newStats: {
    hp_max: number;
    pe_max: number;
    san_max: number;
    patent: string;
    newAbilities: string[];
    elemental_affinity?: ParanormalElement | null;
    affinity_active?: boolean;
    paranormal_powers?: ParanormalPower[];
  }) => Promise<void>;
}

export function NexProgressionModal({ 
  open, 
  onClose, 
  character, 
  onLevelUp 
}: NexProgressionModalProps) {
  const [selectedNex, setSelectedNex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Estado para seleção de Afinidade Elemental
  const [selectedAffinity, setSelectedAffinity] = useState<ParanormalElement | null>(null);
  
  // Estado para modal de seleção de poderes paranormais
  const [powerSelectOpen, setPowerSelectOpen] = useState(false);
  const [pendingPowers, setPendingPowers] = useState<ParanormalPower[]>(
    character.paranormal_powers || []
  );
  
  // Estado para rastrear se Transcender foi usado nesta progressão
  // REGRA: Usar Transcender faz perder a Sanidade daquele NEX
  const [usedTranscender, setUsedTranscender] = useState(false);
  
  // Estado para modal de seleção de ritual (poder "Aprender Ritual")
  const [ritualSelectOpen, setRitualSelectOpen] = useState(false);
  const [pendingRituals, setPendingRituals] = useState<string[]>([]);
  
  // Verificar se está subindo para NEX 50% (escolhe afinidade)
  const currentNexIndex = NEX_VALUES.indexOf(character.nex);
  const nextNex = currentNexIndex < NEX_VALUES.length - 1 ? NEX_VALUES[currentNexIndex + 1] : null;
  const isReachingNex50 = nextNex === 50 && !character.elemental_affinity;
  
  // Verificar se terá habilidade Transcender disponível
  const hasTranscender = useMemo(() => {
    // Verifica se o personagem tem a habilidade Transcender (Ocultista ou trilha específica)
    const abilities = character.abilities || [];
    return abilities.some(a => 
      typeof a === 'string' 
        ? a.toLowerCase().includes('transcender')
        : (a as any)?.name?.toLowerCase().includes('transcender')
    );
  }, [character.abilities]);
  
  // Calcula a sanidade que seria ganha neste NEX
  const sanityGainThisNex = useMemo(() => {
    if (!nextNex) return 0;
    return getSanityGainForNex(character.class, character.nex, nextNex);
  }, [character.class, character.nex, nextNex]);

  // Calcula stats para NEX atual e próximo
  const currentStats = useMemo(() => {
    return calculateDerivedStats(
      character.class,
      character.vigor,
      character.presence,
      character.nex,
      character.origin,
      character.abilities as string[]
    );
  }, [character]);

  const nextStats = useMemo(() => {
    if (!nextNex) return null;
    return calculateDerivedStats(
      character.class,
      character.vigor,
      character.presence,
      nextNex,
      character.origin,
      character.abilities as string[]
    );
  }, [character, nextNex]);

  // Habilidades da trilha atual vs próximo NEX
  const track = character.class_track ? getTrackById(character.class_track) : null;
  
  const currentTrackAbilities = useMemo(() => {
    if (!track) return [];
    return getAvailableTrackAbilities(track.id, character.nex);
  }, [track, character.nex]);

  const nextTrackAbilities = useMemo(() => {
    if (!track || !nextNex) return [];
    return getAvailableTrackAbilities(track.id, nextNex);
  }, [track, nextNex]);

  const newTrackAbilities = nextTrackAbilities.filter(
    a => !currentTrackAbilities.some(c => c.id === a.id)
  );
  
  // Verifica se alguma nova habilidade é Transcender
  const newTranscenderAbility = newTrackAbilities.find(a => 
    a.name.toLowerCase().includes('transcender')
  );

  // Rituais disponíveis (para Ocultistas)
  const isOcultist = character.class === 'Ocultista';
  const ocultistClass = CLASSES.find(c => c.id === 'Ocultista') as any;
  const ritualsPerNex = ocultistClass?.ritualsPerNex || {};
  
  const currentRitualInfo = ritualsPerNex[character.nex] || { count: 0, maxCircle: 1 };
  const nextRitualInfo = nextNex ? (ritualsPerNex[nextNex] || { count: 0, maxCircle: 1 }) : null;
  
  const newRitualSlots = nextRitualInfo ? nextRitualInfo.count - currentRitualInfo.count : 0;
  const newMaxCircle = nextRitualInfo && nextRitualInfo.maxCircle > currentRitualInfo.maxCircle;

  // Patent
  const currentPatent = getPatentByNex(character.nex);
  const nextPatent = nextNex ? getPatentByNex(nextNex) : null;
  const patentChanged = nextPatent && nextPatent !== currentPatent;

  // Handler para selecionar poder paranormal
  const handleSelectPower = (power: ParanormalPower) => {
    setPendingPowers(prev => [...prev, power]);
    setUsedTranscender(true); // Marca que Transcender foi usado - perde sanidade
    setPowerSelectOpen(false);
    
    // Se o poder é "Aprender Ritual", abre modal para escolher o ritual
    if (power.id === 'aprender-ritual') {
      setRitualSelectOpen(true);
    }
  };
  
  // Handler para selecionar ritual (do poder "Aprender Ritual")
  const handleRitualSelect = (ritualId: string) => {
    setPendingRituals(prev => [...prev, ritualId]);
    setRitualSelectOpen(false);
  };

  const handleLevelUp = async () => {
    if (!nextNex || !nextStats) return;
    
    // Validação: se está chegando no NEX 50%, precisa escolher afinidade
    if (isReachingNex50 && !selectedAffinity) {
      return; // Não permite subir sem escolher afinidade
    }
    
    setSaving(true);
    
    try {
      // Calcula novas habilidades (adiciona as da trilha)
      const newAbilities = newTrackAbilities.map(a => a.name);
      
      // Determina afinidade e se está ativa
      let newAffinity = character.elemental_affinity || null;
      let newAffinityActive = character.affinity_active || false;
      
      if (isReachingNex50 && selectedAffinity) {
        newAffinity = selectedAffinity;
      }
      
      // Se já tem afinidade e está subindo de NEX (primeira vez após escolher),
      // ativa a afinidade
      if (newAffinity && !newAffinityActive && nextNex > 50) {
        newAffinityActive = true;
      }
      
      // REGRA TRANSCENDER: Se usou Transcender, NÃO ganha sanidade deste NEX
      // A sanidade final = sanidade atual (mantém a mesma, não adiciona o ganho do NEX)
      const finalSanMax = usedTranscender 
        ? character.san_max  // Mantém a sanidade atual
        : nextStats.san;     // Recebe a sanidade normal do novo NEX
      
      await onLevelUp(nextNex, {
        hp_max: nextStats.hp,
        pe_max: nextStats.pe,
        san_max: finalSanMax,
        patent: nextPatent || currentPatent,
        newAbilities,
        elemental_affinity: newAffinity,
        affinity_active: newAffinityActive,
        paranormal_powers: pendingPowers,
      });

      // Efeito de celebração
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#a855f7', '#ec4899', '#6366f1', '#22c55e'],
      });

      onClose();
    } catch (error) {
      console.error('Erro ao subir de NEX:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!nextNex) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider text-center">
              NEX MÁXIMO ALCANÇADO
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <p className="text-4xl font-display text-primary mb-2">{character.nex}%</p>
            <p className="text-muted-foreground">
              {character.name} alcançou o nível máximo de experiência!
            </p>
          </div>
          <DialogFooter>
            <Button onClick={onClose} className="w-full">Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider text-center flex items-center justify-center gap-2">
              <ArrowUp className="w-5 h-5 text-primary" />
              PROGRESSÃO DE NEX
            </DialogTitle>
            <DialogDescription className="text-center">
              {character.name} está pronto para evoluir!
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0 pr-4">
            <div className="space-y-6 py-4">
              {/* Comparação de NEX */}
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">ATUAL</p>
                  <div className="w-24 h-24 rounded-lg bg-muted/50 border border-border flex flex-col items-center justify-center">
                    <span className="font-display text-3xl">{character.nex}%</span>
                    <span className="text-xs text-muted-foreground">{currentPatent}</span>
                  </div>
                </div>
                
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <ChevronRight className="w-8 h-8 text-primary" />
                </motion.div>
                
                <div className="text-center">
                  <p className="text-xs text-primary mb-1">NOVO</p>
                  <div className="w-24 h-24 rounded-lg bg-primary/20 border border-primary flex flex-col items-center justify-center">
                    <span className="font-display text-3xl text-primary">{nextNex}%</span>
                    <span className="text-xs text-primary/70">{nextPatent}</span>
                  </div>
                </div>
              </div>

              {/* Mudança de Patente */}
              {patentChanged && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-success/10 border border-success/30 rounded-lg text-center"
                >
                  <Badge variant="secondary" className="bg-success/20 text-success mb-2">
                    <Unlock className="w-3 h-3 mr-1" />
                    PROMOÇÃO!
                  </Badge>
                  <p className="text-success font-display text-lg">
                    {currentPatent} → {nextPatent}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Novos itens e recursos disponíveis!
                  </p>
                </motion.div>
              )}

              {/* Seleção de Afinidade Elemental (NEX 50%) */}
              {isReachingNex50 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-paranormal" />
                    <h4 className="font-display text-sm tracking-wider text-paranormal">
                      ESCOLHER AFINIDADE ELEMENTAL
                    </h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ao atingir NEX 50%, você desenvolve uma afinidade com um dos elementos paranormais.
                    Poderes desse elemento terão efeitos aprimorados.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {(['sangue', 'morte', 'conhecimento', 'energia'] as ParanormalElement[]).map((element) => {
                      const Icon = AFFINITY_ICONS[element];
                      const isSelected = selectedAffinity === element;
                      const colorClass = ELEMENT_COLORS[element];
                      const bgClass = ELEMENT_BG_COLORS[element];
                      
                      return (
                        <Card
                          key={element}
                          className={`
                            cursor-pointer transition-all duration-200
                            ${isSelected 
                              ? 'ring-2 ring-primary border-primary bg-primary/10' 
                              : 'hover:border-primary/50 hover:bg-muted/50'
                            }
                          `}
                          onClick={() => setSelectedAffinity(element)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`p-2 rounded ${bgClass}`}>
                                  <Icon className={`h-4 w-4 ${colorClass}`} />
                                </div>
                                <CardTitle className="text-sm">{ELEMENT_LABELS[element]}</CardTitle>
                              </div>
                              {isSelected && (
                                <Check className="h-5 w-5 text-primary" />
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <CardDescription className="text-xs">
                              {AFFINITY_DESCRIPTIONS[element]}
                            </CardDescription>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  
                  {!selectedAffinity && (
                    <p className="text-xs text-warning text-center">
                      ⚠️ Você precisa escolher uma afinidade elemental para continuar
                    </p>
                  )}
                </motion.div>
              )}

              {/* Stats Changes */}
              {nextStats && (
                <div className="space-y-2">
                  <h4 className="font-display text-sm tracking-wider text-muted-foreground">
                    AUMENTO DE STATS
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {/* HP */}
                    <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-center">
                      <Heart className="w-5 h-5 text-destructive mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">PV MÁX</p>
                      <p className="font-display text-lg">
                        {character.hp_max} → <span className="text-destructive">{nextStats.hp}</span>
                      </p>
                      <Badge className="text-xs font-bold bg-destructive text-destructive-foreground shadow-sm">
                        +{nextStats.hp - character.hp_max}
                      </Badge>
                    </div>
                    
                    {/* PE */}
                    <div className="p-3 bg-pe/10 border border-pe/30 rounded-lg text-center">
                      <Zap className="w-5 h-5 text-pe mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">PE MÁX</p>
                      <p className="font-display text-lg">
                        {character.pe_max} → <span className="text-pe">{nextStats.pe}</span>
                      </p>
                      <Badge className="text-xs font-bold bg-pe text-pe-foreground shadow-sm">
                        +{nextStats.pe - character.pe_max}
                      </Badge>
                    </div>
                    
                    {/* SAN - Mostra perda se Transcender foi usado */}
                    <div className={`p-3 rounded-lg text-center ${
                      usedTranscender 
                        ? 'bg-warning/10 border border-warning/30' 
                        : 'bg-san/10 border border-san/30'
                    }`}>
                      <Brain className={`w-5 h-5 mx-auto mb-1 ${usedTranscender ? 'text-warning' : 'text-san'}`} />
                      <p className="text-xs text-muted-foreground">SAN MÁX</p>
                      <p className="font-display text-lg">
                        {character.san_max} → <span className={usedTranscender ? 'text-warning' : 'text-san'}>
                          {usedTranscender ? character.san_max : nextStats.san}
                        </span>
                      </p>
                      {usedTranscender ? (
                        <Badge className="text-xs font-bold bg-warning text-warning-foreground shadow-sm">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          +0 (Transcender)
                        </Badge>
                      ) : (
                        <Badge className="text-xs font-bold bg-san text-san-foreground shadow-sm">
                          +{nextStats.san - character.san_max}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Novas Habilidades da Trilha */}
              {newTrackAbilities.length > 0 && track && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Route className="w-4 h-4 text-primary" />
                    <h4 className="font-display text-sm tracking-wider text-primary">
                      NOVAS HABILIDADES DA TRILHA
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {newTrackAbilities.map((ability) => (
                      <div 
                        key={ability.id}
                        className="p-3 bg-primary/10 border border-primary/30 rounded-lg"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Unlock className="w-4 h-4 text-primary" />
                          <span className="font-medium text-primary">{ability.name}</span>
                          <Badge variant="outline" className="text-xs">NEX {ability.minNex}%</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{ability.description}</p>
                        
                        {/* Botão para escolher poder paranormal se for Transcender */}
                        {ability.name.toLowerCase().includes('transcender') && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => setPowerSelectOpen(true)}
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Escolher Poder Paranormal
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Seção de Poderes Paranormais Pendentes */}
              {pendingPowers.length > (character.paranormal_powers?.length || 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-paranormal" />
                    <h4 className="font-display text-sm tracking-wider text-paranormal">
                      NOVOS PODERES PARANORMAIS
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {pendingPowers
                      .filter(p => !character.paranormal_powers?.some(cp => cp.id === p.id))
                      .map((power) => (
                        <div
                          key={power.id}
                          className="p-3 bg-paranormal/10 border border-paranormal/30 rounded-lg"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Check className="w-4 h-4 text-paranormal" />
                            <span className="font-medium text-paranormal">{power.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {ELEMENT_LABELS[power.element]}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{power.description}</p>
                        </div>
                      ))}
                  </div>
                </motion.div>
              )}

              {/* Novos Rituais (Ocultistas) */}
              {isOcultist && (newRitualSlots > 0 || newMaxCircle) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-paranormal" />
                    <h4 className="font-display text-sm tracking-wider text-paranormal">
                      PROGRESSÃO DE RITUAIS
                    </h4>
                  </div>
                  <div className="p-4 bg-paranormal/10 border border-paranormal/30 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      {newRitualSlots > 0 && (
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">RITUAIS CONHECIDOS</p>
                          <p className="font-display text-xl">
                            {currentRitualInfo.count} → <span className="text-paranormal">{nextRitualInfo?.count}</span>
                          </p>
                          <Badge variant="outline" className="text-xs text-paranormal border-paranormal/50">
                            +{newRitualSlots} novo{newRitualSlots > 1 ? 's' : ''}
                          </Badge>
                        </div>
                      )}
                      {newMaxCircle && (
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">CÍRCULO MÁXIMO</p>
                          <p className="font-display text-xl">
                            {currentRitualInfo.maxCircle}º → <span className="text-paranormal">{nextRitualInfo?.maxCircle}º</span>
                          </p>
                          <Badge variant="outline" className="text-xs text-paranormal border-paranormal/50">
                            <Unlock className="w-3 h-3 mr-1" />
                            Desbloqueado!
                          </Badge>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      Você poderá escolher novos rituais após subir de NEX.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button 
              onClick={handleLevelUp} 
              disabled={saving || (isReachingNex50 && !selectedAffinity)}
              className="bg-primary hover:bg-primary/90"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ArrowUp className="w-4 h-4 mr-2" />
              )}
              SUBIR PARA NEX {nextNex}%
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Seleção de Poderes Paranormais */}
      <ParanormalPowerSelectModal
        open={powerSelectOpen}
        onOpenChange={setPowerSelectOpen}
        onSelectPower={handleSelectPower}
        characterPowers={pendingPowers}
        elementalAffinity={selectedAffinity || character.elemental_affinity}
        affinityActive={character.affinity_active}
      />
      
      {/* Modal de Seleção de Ritual (do poder "Aprender Ritual") */}
      <NonOccultistRitualModal
        open={ritualSelectOpen}
        onClose={() => setRitualSelectOpen(false)}
        source="ritual-aprendido"
        currentRituals={[...character.rituals, ...pendingRituals]}
        onConfirm={(selectedRituals) => {
          setPendingRituals(prev => [...prev, ...selectedRituals]);
          setRitualSelectOpen(false);
        }}
      />
    </>
  );
}

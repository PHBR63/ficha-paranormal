// Componente de revisão final do personagem antes de salvar
// Mostra todos os dados: conceito, atributos, origem, classe, trilha, rituais, perícias, etc.

import { ORIGINS, CLASSES, SKILLS, getPatentByNex, getTrackById } from '@/lib/character-data';
import { CLASS_PROFICIENCIES, CLASS_INITIAL_ABILITIES } from '@/lib/character-builder-engine';
import { ALL_RITUALS } from '@/lib/rituals-data';
import { 
  Shield, Footprints, Swords, Edit2, Route, Sparkles, 
  Droplets, Skull, BookOpen, Zap, Ghost 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import type { CharacterFormData } from '@/pages/CharacterCreate';
import type { RebuildResult } from '@/lib/character-builder-engine';

interface StepReviewProps {
  formData: CharacterFormData;
  buildResult: RebuildResult;
  updateFormData?: (updates: Partial<CharacterFormData>) => void;
  onStepClick?: (step: number) => void;
}

// Mapeamento de atributos para labels
const ATTRIBUTE_LABELS: Record<string, string> = {
  agility: 'AGI',
  strength: 'FOR',
  intellect: 'INT',
  presence: 'PRE',
  vigor: 'VIG',
};

// Configuração visual para elementos de rituais
const ELEMENT_CONFIG: Record<string, { icon: typeof Droplets; color: string; bg: string }> = {
  sangue: { icon: Droplets, color: 'text-red-400', bg: 'bg-red-500/20' },
  morte: { icon: Skull, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  conhecimento: { icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  energia: { icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  medo: { icon: Ghost, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
};

export function StepReview({ formData, buildResult, onStepClick }: StepReviewProps) {
  const origin = ORIGINS.find(o => o.id === formData.origin);
  const characterClass = CLASSES.find(c => c.id === formData.characterClass);
  const patent = getPatentByNex(formData.nex);
  const track = formData.classTrack ? getTrackById(formData.classTrack) : null;

  const { derivedStats, defense, movement, allTrainedSkills, proficiencies, abilities, powers, canFinalize } = buildResult;

  // Separar habilidades de classe e de trilha
  const trackAbilities = formData.trackAbilities || [];
  const classAbilities = abilities.filter(a => !trackAbilities.includes(a));

  // Obter rituais selecionados com detalhes
  const selectedRituals = (formData.rituals || []).map(id => ALL_RITUALS.find(r => r.id === id)).filter(Boolean);

  const trainedSkillNames = allTrainedSkills.map(id => {
    const skill = SKILLS.find(s => s.id === id);
    return skill?.name || id;
  });

  // Função para calcular step index baseado no id (considerando steps dinâmicos)
  const getStepIndex = (stepId: string): number => {
    const isOcultist = formData.characterClass === 'Ocultista';
    const baseSteps = ['concept', 'nex', 'attributes', 'origin', 'class', 'track'];
    const afterTrack = isOcultist ? ['rituals', 'skills', 'abilities', 'review'] : ['skills', 'abilities', 'review'];
    const allSteps = [...baseSteps, ...afterTrack];
    return allSteps.indexOf(stepId);
  };

  const EditButton = ({ stepId }: { stepId: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onStepClick?.(getStepIndex(stepId))}
      className="opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <Edit2 className="w-3 h-3" />
    </Button>
  );

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl tracking-wider mb-2">REVISÃO DO DOSSIÊ</h2>
        <p className="text-muted-foreground text-sm">
          Confira as informações do seu agente antes de finalizar o cadastro.
        </p>
      </div>

      {/* Header card com informações básicas */}
      <motion.div 
        className="ordo-panel p-6 group"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-display text-3xl tracking-wider text-primary">{formData.name || 'Sem nome'}</h3>
            {formData.concept && (
              <p className="text-sm text-muted-foreground italic mt-1">"{formData.concept}"</p>
            )}
            {formData.playerName && (
              <p className="text-sm text-muted-foreground">Jogador: {formData.playerName}</p>
            )}
            <div className="flex gap-2 text-xs text-muted-foreground mt-1">
              {formData.age && <span>{formData.age} anos</span>}
              {formData.age && formData.gender && <span>•</span>}
              {formData.gender && <span>{formData.gender}</span>}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <EditButton stepId="concept" />
            <div className="text-right">
              <span className="font-display text-4xl text-secondary">{formData.nex}%</span>
              <p className="text-xs text-muted-foreground">NEX</p>
            </div>
          </div>
        </div>

        {/* Tags de classe, origem, patente e trilha */}
        <div className="flex gap-3 flex-wrap">
          <div className="ordo-panel px-3 py-1.5 bg-muted/50">
            <span className="text-xs text-muted-foreground">Origem:</span>{' '}
            <span className="text-sm">{origin?.name || '-'}</span>
          </div>
          <div className="ordo-panel px-3 py-1.5 bg-muted/50">
            <span className="text-xs text-muted-foreground">Classe:</span>{' '}
            <span className="text-sm">{characterClass?.name || '-'}</span>
          </div>
          <div className="ordo-panel px-3 py-1.5 bg-muted/50">
            <span className="text-xs text-muted-foreground">Patente:</span>{' '}
            <span className="text-sm">{patent}</span>
          </div>
          {track && (
            <div className="ordo-panel px-3 py-1.5 bg-primary/10 border-primary/30">
              <span className="text-xs text-primary/70">Trilha:</span>{' '}
              <span className="text-sm text-primary">{track.name}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats principais */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="ordo-panel p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">DEFESA</p>
          <p className="font-display text-3xl">{defense}</p>
        </div>
        <div className="ordo-panel p-4 text-center border-destructive/30">
          <p className="text-xs text-muted-foreground mb-1">PV</p>
          <p className="font-display text-3xl text-destructive">{derivedStats.hp}</p>
        </div>
        <div className="ordo-panel p-4 text-center border-secondary/30">
          <p className="text-xs text-muted-foreground mb-1">PE</p>
          <p className="font-display text-3xl text-secondary">{derivedStats.pe}</p>
        </div>
        <div className="ordo-panel p-4 text-center border-paranormal/30">
          <p className="text-xs text-muted-foreground mb-1">SAN</p>
          <p className="font-display text-3xl text-paranormal">{derivedStats.san}</p>
        </div>
        <div className="ordo-panel p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Footprints className="w-3 h-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">DESLOC.</p>
          </div>
          <p className="font-display text-3xl">{movement}m</p>
        </div>
        <div className="ordo-panel p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Swords className="w-3 h-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">ATAQUE</p>
          </div>
          <p className="font-display text-xl">
            {allTrainedSkills.includes('luta') ? `+${formData.attributes.strength + 5}` : `+${formData.attributes.strength}`} / 
            {allTrainedSkills.includes('pontaria') ? `+${formData.attributes.agility + 5}` : `+${formData.attributes.agility}`}
          </p>
          <p className="text-xs text-muted-foreground">Luta / Pont.</p>
        </div>
      </div>

      {/* Atributos */}
      <div className="ordo-panel p-4 group">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-display text-lg tracking-wider text-primary">ATRIBUTOS</h4>
          <EditButton stepId="attributes" />
        </div>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(formData.attributes).map(([key, value]) => (
            <div key={key} className="text-center p-2 bg-muted/50 rounded-sm">
              <p className="text-xs text-muted-foreground">{ATTRIBUTE_LABELS[key]}</p>
              <p className="font-display text-2xl">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Proficiências */}
      {proficiencies.length > 0 && (
        <div className="ordo-panel p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-primary" />
            <h4 className="font-display text-lg tracking-wider text-primary">PROFICIÊNCIAS</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {proficiencies.map((prof) => (
              <span key={prof} className="px-3 py-1 bg-muted text-sm rounded-sm">
                {prof}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Perícias */}
      <div className="ordo-panel p-4 group">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-display text-lg tracking-wider text-primary">
            PERÍCIAS TREINADAS ({trainedSkillNames.length})
          </h4>
          <EditButton stepId="skills" />
        </div>
        {trainedSkillNames.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {trainedSkillNames.map(name => (
              <span key={name} className="px-3 py-1 bg-secondary/20 text-secondary text-sm rounded-sm">
                {name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma perícia treinada.</p>
        )}
      </div>

      {/* Habilidades de Classe */}
      {classAbilities.length > 0 && (
        <div className="ordo-panel p-4 group">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-display text-lg tracking-wider text-primary">
              HABILIDADES DE CLASSE
            </h4>
            <EditButton stepId="abilities" />
          </div>
          <div className="flex flex-wrap gap-2">
            {classAbilities.map((ability) => (
              <span key={ability} className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-sm">
                {ability}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Trilha e Habilidades da Trilha */}
      {track && (
        <div className="ordo-panel p-4 group border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Route className="w-5 h-5 text-primary" />
              <h4 className="font-display text-lg tracking-wider text-primary">
                TRILHA: {track.name.toUpperCase()}
              </h4>
            </div>
            <EditButton stepId="track" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">{track.description}</p>
          
          {trackAbilities.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-primary/70 uppercase tracking-wider">
                Habilidades Desbloqueadas (NEX {formData.nex}%)
              </p>
              <div className="flex flex-wrap gap-2">
                {trackAbilities.map((ability) => {
                  const trackAbility = track.abilities.find(a => a.name === ability);
                  return (
                    <Badge
                      key={ability}
                      variant="secondary"
                      className="bg-primary/20 text-primary hover:bg-primary/30"
                    >
                      {ability}
                      {trackAbility && (
                        <span className="ml-1 text-xs opacity-60">NEX {trackAbility.minNex}%</span>
                      )}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rituais (apenas para Ocultistas) */}
      {selectedRituals.length > 0 && (
        <div className="ordo-panel p-4 group border-paranormal/30 bg-gradient-to-br from-paranormal/5 to-transparent">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-paranormal" />
              <h4 className="font-display text-lg tracking-wider text-paranormal">
                RITUAIS ({selectedRituals.length})
              </h4>
            </div>
            <EditButton stepId="rituals" />
          </div>
          <div className="grid md:grid-cols-2 gap-2">
            {selectedRituals.map((ritual) => {
              if (!ritual) return null;
              const config = ELEMENT_CONFIG[ritual.element];
              const Icon = config?.icon || Sparkles;
              return (
                <div 
                  key={ritual.id}
                  className={`p-3 rounded-lg border border-paranormal/20 ${config?.bg || 'bg-paranormal/10'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{ritual.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Icon className={`w-3 h-3 mr-1 ${config?.color}`} />
                        {ritual.element}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{ritual.circle}º</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {ritual.execution} • {ritual.range} • {ritual.cost} PE
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Poderes de Origem */}
      {powers.length > 0 && (
        <div className="ordo-panel p-4">
          <h4 className="font-display text-lg tracking-wider mb-3 text-primary">PODERES DE ORIGEM</h4>
          <div className="space-y-2">
            {powers.map((power, i) => (
              <div key={i} className="p-3 bg-paranormal/10 rounded-sm">
                <p className="font-medium text-paranormal">{power.name}</p>
                {power.description && (
                  <p className="text-xs text-muted-foreground mt-1">{power.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aparência & Personalidade */}
      {(formData.appearance || formData.personality) && (
        <div className="grid md:grid-cols-2 gap-4">
          {formData.appearance && (
            <div className="ordo-panel p-4">
              <h4 className="font-display text-sm tracking-wider mb-2 text-primary">APARÊNCIA</h4>
              <p className="text-sm text-muted-foreground">{formData.appearance}</p>
            </div>
          )}
          {formData.personality && (
            <div className="ordo-panel p-4">
              <h4 className="font-display text-sm tracking-wider mb-2 text-primary">PERSONALIDADE</h4>
              <p className="text-sm text-muted-foreground">{formData.personality}</p>
            </div>
          )}
        </div>
      )}

      {/* Background */}
      {formData.background && (
        <div className="ordo-panel p-4">
          <h4 className="font-display text-lg tracking-wider mb-3 text-primary">HISTÓRICO</h4>
          <p className="text-sm text-muted-foreground font-ritual italic whitespace-pre-wrap">
            {formData.background}
          </p>
        </div>
      )}

      {/* Status de finalização */}
      <motion.div 
        className={`ordo-panel p-4 ${canFinalize ? 'bg-success/5 border-success/20' : 'bg-warning/5 border-warning/20'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-sm text-center">
          {canFinalize ? (
            <span className="text-success font-medium">✓ DOSSIÊ PRONTO PARA REGISTRO</span>
          ) : (
            <span className="text-warning font-medium">⚠ Complete todas as escolhas pendentes</span>
          )}
        </p>
      </motion.div>
    </div>
  );
}

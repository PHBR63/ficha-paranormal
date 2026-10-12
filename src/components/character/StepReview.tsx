import { ConhecimentoSymbol, EnergiaSymbol, MedoSymbol, MorteSymbol, SangueSymbol } from '@/components/icons/element-symbols';
// Componente de revisão final do personagem antes de salvar
// Mostra todos os dados: conceito, atributos, origem, classe, trilha, rituais, perícias, etc.
// Inclui painel educativo do livro de regras e validação final Zod

import { useMemo } from 'react';
import { ORIGINS, CLASSES, SKILLS,  getTrackById, TRAINING_LABELS } from '@/lib/character-data';
import { creationSteps, inspectCharacterCreation, creationInventory, creationRitualSlots } from '@/lib/character-creation-rules';
import { getPowerById } from '@/lib/class-powers/power-registry';
import { ALL_ITEMS } from '@/lib/catalogs/items-catalog';
import { ALL_RITUALS } from '@/lib/rituals/legacy-exports';
import { Shield, Footprints, Swords, Edit2, Route, Sparkles, Droplets, AlertCircle } from '@/components/icons/ordem-icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { RuleBookTip } from './RuleBookTip';
import { getRulebookContent } from '@/lib/rulebook-content';
import { ATTRIBUTE_ABBR, type AttributeKey } from '@/lib/constants/attributes';
import type { CharacterFormData } from '@/pages/CharacterCreate';
import type { RebuildResult } from '@/lib/character-builder-engine';

interface StepReviewProps {
  formData: CharacterFormData;
  buildResult: RebuildResult;
  updateFormData?: (updates: Partial<CharacterFormData>) => void;
  onStepClick?: (step: number) => void;
}

// Configuração visual para elementos de rituais
const ELEMENT_CONFIG: Record<string, {
  icon: typeof Droplets;
  color: string;
  bg: string;
}> = {
  sangue: {
    icon: SangueSymbol,
    color: 'text-red-400',
    bg: 'bg-red-500/20'
  },
  morte: {
    icon: MorteSymbol,
    color: 'text-zinc-300',
    bg: 'bg-zinc-500/20'
  },
  conhecimento: {
    icon: ConhecimentoSymbol,
    color: 'text-amber-400',
    bg: 'bg-amber-500/20'
  },
  energia: {
    icon: EnergiaSymbol,
    color: 'text-purple-400',
    bg: 'bg-purple-500/20'
  },
  medo: {
    icon: MedoSymbol,
    color: 'text-zinc-400',
    bg: 'bg-zinc-500/20'
  }
};
export function StepReview({
  formData,
  buildResult,
  onStepClick
}: StepReviewProps) {
  const origin = ORIGINS.find(o => o.id === formData.origin);
  const characterClass = CLASSES.find(c => c.id === formData.characterClass);
  const patent = formData.patent;
  const inspection = useMemo(() => inspectCharacterCreation(formData), [formData]);
  const track = formData.classTrack ? getTrackById(formData.classTrack) : null;
  const {
    movement,
    allTrainedSkills,
    proficiencies,
    abilities,
    powers,
    canFinalize
  } = buildResult;
  const derivedStats=inspection.displayStats;
  const defense=inspection.displayDefense;

  // Separar habilidades de classe e de trilha
  const trackAbilities = track?.abilities.filter(a => a.minNex <= formData.nex).map(a => a.name) || [];
  const classAbilities = abilities.filter(a => !trackAbilities.includes(a));

  // Obter rituais selecionados com detalhes
  const selectedRituals = inspection.rituals.map(id => ALL_RITUALS.find(r => r.id === id)).filter(Boolean);
  const trainedSkillNames = allTrainedSkills.map(id => {
    const skill = SKILLS.find(s => s.id === id);
    return `${skill?.name || id} (${TRAINING_LABELS[inspection.skills[id] || 1]})`;
  });

  // Coletar todas as perícias treinadas via poder "Treinamento em Perícia"
  const skillTrainingFromPowers = useMemo(() => {
    const choices = formData.skillTrainingChoices || {};
    const result: Array<{ skillName: string; fromLevel: number; toLevel: number; instanceKey: string }> = [];

    Object.entries(choices).forEach(([instanceKey, skillChoices]) => {
      skillChoices.forEach(choice => {
        const skill = SKILLS.find(s => s.id === choice.skillId);
        if (skill) {
          result.push({
            skillName: skill.name,
            fromLevel: choice.fromLevel,
            toLevel: choice.toLevel,
            instanceKey
          });
        }
      });
    });

    return result;
  }, [formData.skillTrainingChoices]);

  const getStepIndex = (id:string) => creationSteps(formData.characterClass).findIndex(step => step.id === id);
  // Conteúdo educativo do livro
  const rulebookContent = getRulebookContent('review');

  const EditButton = ({
    stepId
  }: {
    stepId: string;
  }) => <Button variant="ghost" size="sm" onClick={() => onStepClick?.(getStepIndex(stepId))} aria-label={`Editar ${creationSteps(formData.characterClass).find(s=>s.id===stepId)?.title.toLocaleLowerCase('pt-BR') || stepId}`} className="min-h-11 min-w-11 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity">
      <Edit2 className="w-3 h-3" />
    </Button>;

  return <div className="space-y-6">
      {/* Título */}
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl tracking-wider mb-2">REVISÃO DO DOSSIÊ</h2>
        <p className="text-muted-foreground text-sm">
          Confira as informações do seu agente antes de finalizar o cadastro.
        </p>
      </div>

      {/* Painel educativo do livro de regras */}
      {rulebookContent && (
        <RuleBookTip section={rulebookContent} defaultExpanded={false} />
      )}

      {/* Header card com informações básicas */}
      <motion.div className="ordo-panel p-6 group" initial={{
      opacity: 0,
      y: 10
    }} animate={{
      opacity: 1,
      y: 0
    }}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-display text-3xl tracking-wider text-primary">{formData.name || 'Sem nome'}</h3>
            {formData.concept && <p className="text-sm text-muted-foreground italic mt-1">"{formData.concept}"</p>}
            {formData.playerName && <p className="text-sm text-muted-foreground">Jogador: {formData.playerName}</p>}
            <div className="flex gap-2 text-xs text-muted-foreground mt-1">
              {formData.age && <span>{formData.age} anos</span>}
              {formData.age && formData.gender && <span>•</span>}
              {formData.gender && <span>{formData.gender}</span>}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <EditButton stepId="concept" />
            <div className="text-right">
              <span className="font-display text-4xl text-detail-accent">{formData.nex}%</span>
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
          {track && <div className="ordo-panel px-3 py-1.5 bg-primary/10 border-primary/30">
              <span className="text-xs text-primary/70">Trilha:</span>{' '}
              <span className="text-sm text-primary">{track.name}</span>
            </div>}
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
        <div className="ordo-panel p-4 text-center border-secondary/50 bg-secondary/10">
          <p className="text-sm font-bold text-foreground mb-1">PE</p>
          <p className="font-display text-3xl text-foreground">{derivedStats.pe}</p>
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
            {`+${(inspection.skills.luta || 0)*5}`} /
            {`+${(inspection.skills.pontaria || 0)*5}`}
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
          {Object.entries(formData.attributes).map(([key, value]) => <div key={key} className="text-center p-2 bg-muted/50 rounded-sm">
              <p className="text-xs text-muted-foreground">{ATTRIBUTE_ABBR[key as AttributeKey]}</p>
              <p className="font-display text-2xl">{value}</p>
            </div>)}
        </div>
      </div>

      {/* Proficiências */}
      {proficiencies.length > 0 && <div className="ordo-panel p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-primary" />
            <h4 className="font-display text-lg tracking-wider text-primary">PROFICIÊNCIAS</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {proficiencies.map(prof => <span key={prof} className="px-3 py-1 bg-muted text-sm rounded-sm">
                {prof}
              </span>)}
          </div>
        </div>}

      {/* Perícias */}
      <div className="ordo-panel p-4 group">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-display text-lg tracking-wider text-primary">
            PERÍCIAS TREINADAS ({trainedSkillNames.length})
          </h4>
          <EditButton stepId="skills" />
        </div>
        {trainedSkillNames.length > 0 ? <div className="flex flex-wrap gap-2">
            {trainedSkillNames.map(name => <span key={name} className="px-3 py-1.5 bg-secondary text-secondary-foreground font-semibold text-sm rounded-sm shadow-sm">
                {name}
              </span>)}
          </div> : <p className="text-sm text-muted-foreground">Nenhuma perícia treinada.</p>}
      </div>

      {/* Perícias Treinadas via Poder "Treinamento em Perícia" */}
      {skillTrainingFromPowers.length > 0 && (
        <div className="ordo-panel p-4 group border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-transparent">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h4 className="font-display text-lg tracking-wider text-purple-400">
                TREINAMENTO EM PERÍCIA
              </h4>
            </div>
            <EditButton stepId="abilities" />
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Perícias aprimoradas via poder de classe
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {skillTrainingFromPowers.map((training, idx) => {
              const fromLabel = TRAINING_LABELS[training.fromLevel];
              const toLabel = TRAINING_LABELS[training.toLevel];
              const isExpert = training.toLevel === 3;
              const isVeteran = training.toLevel === 2;

              return (
                <div
                  key={`${training.instanceKey}-${training.skillName}-${idx}`}
                  className={`flex items-center justify-between p-2 rounded-md ${
                    isExpert
                      ? 'bg-amber-500/20 border border-amber-500/30'
                      : isVeteran
                        ? 'bg-purple-500/20 border border-purple-500/30'
                        : 'bg-primary/10 border border-primary/20'
                  }`}
                >
                  <span className={`font-medium text-sm ${
                    isExpert ? 'text-amber-400' : isVeteran ? 'text-purple-400' : 'text-primary'
                  }`}>
                    {training.skillName}
                  </span>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-muted-foreground">{fromLabel}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className={`font-bold ${
                      isExpert ? 'text-amber-400' : isVeteran ? 'text-purple-400' : 'text-primary'
                    }`}>
                      {toLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Habilidades de Classe */}
      {classAbilities.length > 0 && <div className="ordo-panel p-4 group">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-display text-lg tracking-wider text-primary">
              HABILIDADES DE CLASSE
            </h4>
            <EditButton stepId="abilities" />
          </div>
          <div className="flex flex-wrap gap-2">
            {classAbilities.map((ability,index) => <span key={`${ability}-${index}`} className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-sm">
                {ability}
              </span>)}
          </div>
        </div>}

      {/* Trilha e Habilidades da Trilha */}
      {track && <div className="ordo-panel p-4 group border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
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

          {trackAbilities.length > 0 && <div className="space-y-2">
              <p className="text-xs text-primary/70 uppercase tracking-wider">
                Habilidades Desbloqueadas (NEX {formData.nex}%)
              </p>
              <div className="flex flex-wrap gap-2">
                {trackAbilities.map(ability => {
            const trackAbility = track.abilities.find(a => a.name === ability);
            return <Badge key={ability} variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30">
                      {ability}
                      {trackAbility && <span className="ml-1 text-xs opacity-60">NEX {trackAbility.minNex}%</span>}
                    </Badge>;
          })}
              </div>
            </div>}
        </div>}

      {/* Rituais (apenas para Ocultistas) */}
      {selectedRituals.length > 0 && <div className="ordo-panel p-4 group border-paranormal/30 bg-gradient-to-br from-paranormal/5 to-transparent">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-paranormal" />
              <h4 className="font-display text-lg tracking-wider text-paranormal">
                RITUAIS ({selectedRituals.length})
              </h4>
            </div>
            <EditButton stepId={formData.characterClass==='Ocultista'?'rituals':'abilities'} />
          </div>
          <div className="grid md:grid-cols-2 gap-2">
            {selectedRituals.map(ritual => {
          if (!ritual) return null;
          const config = ELEMENT_CONFIG[ritual.element];
          const Icon = config?.icon || Sparkles;
          return <div key={ritual.id} className={`p-3 rounded-lg border border-paranormal/20 ${config?.bg || 'bg-paranormal/10'}`}>
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
                </div>;
        })}
          </div>
        </div>}

      {/* Poderes de Origem */}
      {powers.length > 0 && <div className="ordo-panel p-4">
          <h4 className="font-display text-lg tracking-wider mb-3 text-primary">PODERES DE ORIGEM</h4>
          <div className="space-y-2">
            {powers.map((power, i) => <div key={i} className="p-3 bg-paranormal/10 rounded-sm">
                <p className="font-medium text-paranormal">{power.name}</p>
                {power.description && <p className="text-xs text-muted-foreground mt-1">{power.description}</p>}
              </div>)}
          </div>
        </div>}

      <section className="ordo-panel p-4 space-y-3" aria-label="Escolhas e associações">
        <div className="flex items-center justify-between"><h4 className="font-display text-lg">ESCOLHAS E ASSOCIAÇÕES</h4><EditButton stepId="abilities" /></div>
        {Object.entries(formData.classPowerChoices).map(([key,choice])=><p key={key} className="text-sm"><strong>{getPowerById(choice.powerId)?.name || choice.powerId}:</strong>{' '}{choice.chosenValues.map(id=>SKILLS.find(s=>s.id===id)?.name || ALL_ITEMS.find(i=>i.id===id)?.name || ALL_RITUALS.find(r=>r.id===id)?.name || id).join(', ')}</p>)}
        {creationRitualSlots(formData).length > 0 && <div className="space-y-2">
          <div className="flex items-center justify-between gap-2"><h5 className="font-display">FONTES DOS RITUAIS ADICIONAIS</h5><EditButton stepId="rituals" /></div>
          {creationRitualSlots(formData).map(slot => <p key={slot.source} className="text-sm"><strong>{slot.label}:</strong>{' '}{(formData.extraRituals?.[slot.source] || []).map(id => {
            const ritual = ALL_RITUALS.find(item => item.id === id);
            return ritual ? `${ritual.name} (${ritual.element})` : id;
          }).join(', ') || 'Escolha pendente'}</p>)}
        </div>}
        {inspection.paranormalPowers.map((power,index)=><div key={`${power.id}-${index}`} className="text-sm space-y-1"><p><strong>{power.name}</strong> — {power.element}</p><p className="text-muted-foreground">{power.description}</p>{power.choices?.ritualId && <p>Ritual: {ALL_RITUALS.find(r=>r.id===power.choices?.ritualId)?.name}</p>}{power.choices?.classPowerIds?.map(id=><p key={id}>Poder concedido: {getPowerById(id)?.name}</p>)}</div>)}
        {creationInventory(formData).map(item=><p key={item.id} className="text-sm"><strong>{item.name}</strong> — categoria {item.category}{item.effectiveCategory!==item.category?` → ${item.effectiveCategory}`:''}; {Math.max(0,item.slots-item.spaceReduction)} espaço(s). Benefício: {item.creationSource==='grimorio'?'Criar Grimório':item.creationSource==='a-favorita'?'A Favorita':item.creationSource==='ferramenta-de-trabalho'?'Ferramenta de Trabalho':item.creationSource==='ferramenta-favorita'?'Ferramenta Favorita':'Mochila de Utilidades'}.</p>)}
        {formData.classTrack==='graduado' && formData.nex>=40 && <p className="text-sm text-muted-foreground">Rituais do grimório exigem segurá-lo e uma ação completa para folhear. O item ocupa 1 espaço.</p>}
        {formData.elementalAffinity && <p className="text-sm">Afinidade escolhida: {formData.elementalAffinity}. A ativação exige Transcender a partir de NEX 50%.</p>}
      </section>

      {/* Aparência & Personalidade */}
      {(formData.appearance || formData.personality) && <div className="grid md:grid-cols-2 gap-4">
          {formData.appearance && <div className="ordo-panel p-4">
              <h4 className="font-display text-sm tracking-wider mb-2 text-primary">APARÊNCIA</h4>
              <p className="text-sm text-muted-foreground">{formData.appearance}</p>
            </div>}
          {formData.personality && <div className="ordo-panel p-4">
              <h4 className="font-display text-sm tracking-wider mb-2 text-primary">PERSONALIDADE</h4>
              <p className="text-sm text-muted-foreground">{formData.personality}</p>
            </div>}
        </div>}

      {/* Background */}
      {formData.background && <div className="ordo-panel p-4">
          <h4 className="font-display text-lg tracking-wider mb-3 text-primary">HISTÓRICO</h4>
          <p className="text-sm text-muted-foreground italic whitespace-pre-wrap font-sans">
            {formData.background}
          </p>
        </div>}

      {/* Status de finalização */}
      <motion.div className={`ordo-panel p-4 ${canFinalize ? 'bg-success/5 border-success/20' : 'bg-warning/5 border-warning/20'}`} initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      delay: 0.3
    }}>
        {canFinalize ? (
          <p className="text-sm text-center">
            <span className="text-success font-medium">✓ DOSSIÊ PRONTO PARA REGISTRO</span>
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-center">
              <span className="text-warning font-medium">⚠ Complete todas as escolhas pendentes</span>
            </p>
            <ul className="space-y-2">
              {inspection.issues.map((issue,index) => <li key={`${issue.step}-${index}`}>
                <Button variant="ghost" className="h-auto min-h-11 w-full justify-start whitespace-normal text-left text-warning" onClick={() => onStepClick?.(getStepIndex(issue.step))}>
                  <AlertCircle className="mr-2 h-4 w-4 shrink-0" />{issue.message}
                </Button>
              </li>)}
            </ul>
          </div>
        )}
      </motion.div>
    </div>;
}

import { ORIGINS, CLASSES, SKILLS, getPatentByNex } from '@/lib/character-data';
import { CLASS_PROFICIENCIES, CLASS_INITIAL_ABILITIES } from '@/lib/character-builder-engine';
import { Shield, Footprints, Swords } from 'lucide-react';
import type { CharacterFormData } from '@/pages/CharacterCreate';
import type { RebuildResult } from '@/lib/character-builder-engine';

interface StepReviewProps {
  formData: CharacterFormData;
  buildResult: RebuildResult;
}

const ATTRIBUTE_LABELS: Record<string, string> = {
  agility: 'AGI',
  strength: 'FOR',
  intellect: 'INT',
  presence: 'PRE',
  vigor: 'VIG',
};

export function StepReview({ formData, buildResult }: StepReviewProps) {
  const origin = ORIGINS.find(o => o.id === formData.origin);
  const characterClass = CLASSES.find(c => c.id === formData.characterClass);
  const patent = getPatentByNex(formData.nex);

  const { derivedStats, defense, movement, allTrainedSkills, proficiencies, abilities, powers, canFinalize } = buildResult;

  const trainedSkillNames = allTrainedSkills.map(id => {
    const skill = SKILLS.find(s => s.id === id);
    return skill?.name || id;
  });

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl tracking-wider mb-2">REVISÃO DO DOSSIÊ</h2>
        <p className="text-muted-foreground text-sm">
          Confira as informações do seu agente antes de finalizar o cadastro.
        </p>
      </div>

      {/* Header card */}
      <div className="ordo-panel p-6">
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
          <div className="text-right">
            <span className="font-display text-4xl text-secondary">{formData.nex}%</span>
            <p className="text-xs text-muted-foreground">NEX</p>
          </div>
        </div>

        <div className="flex gap-4 flex-wrap">
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
        </div>
      </div>

      {/* Stats */}
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

      {/* Attributes */}
      <div className="ordo-panel p-4">
        <h4 className="font-display text-lg tracking-wider mb-3 text-primary">ATRIBUTOS</h4>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(formData.attributes).map(([key, value]) => (
            <div key={key} className="text-center p-2 bg-muted/50 rounded-sm">
              <p className="text-xs text-muted-foreground">{ATTRIBUTE_LABELS[key]}</p>
              <p className="font-display text-2xl">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Proficiencies */}
      {proficiencies.length > 0 && (
        <div className="ordo-panel p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-primary" />
            <h4 className="font-display text-lg tracking-wider text-primary">PROFICIÊNCIAS</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {proficiencies.map((prof) => (
              <span 
                key={prof}
                className="px-3 py-1 bg-muted text-sm rounded-sm"
              >
                {prof}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      <div className="ordo-panel p-4">
        <h4 className="font-display text-lg tracking-wider mb-3 text-primary">
          PERÍCIAS TREINADAS ({trainedSkillNames.length})
        </h4>
        {trainedSkillNames.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {trainedSkillNames.map(name => (
              <span 
                key={name}
                className="px-3 py-1 bg-secondary/20 text-secondary text-sm rounded-sm"
              >
                {name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma perícia treinada.</p>
        )}
      </div>

      {/* Abilities */}
      {abilities.length > 0 && (
        <div className="ordo-panel p-4">
          <h4 className="font-display text-lg tracking-wider mb-3 text-primary">HABILIDADES DE CLASSE</h4>
          <div className="flex flex-wrap gap-2">
            {abilities.map((ability) => (
              <span 
                key={ability}
                className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-sm"
              >
                {ability}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Powers */}
      {powers.length > 0 && (
        <div className="ordo-panel p-4">
          <h4 className="font-display text-lg tracking-wider mb-3 text-primary">PODERES</h4>
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

      {/* Appearance & Personality */}
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

      {/* Status */}
      <div className={`ordo-panel p-4 ${canFinalize ? 'bg-success/5 border-success/20' : 'bg-warning/5 border-warning/20'}`}>
        <p className="text-sm text-center">
          {canFinalize ? (
            <span className="text-success font-medium">✓ DOSSIÊ PRONTO PARA REGISTRO</span>
          ) : (
            <span className="text-warning font-medium">⚠ Complete todas as escolhas pendentes</span>
          )}
        </p>
      </div>
    </div>
  );
}

import { ORIGINS, CLASSES, SKILLS, calculateDerivedStats, getPatentByNex } from '@/lib/character-data';
import type { CharacterFormData } from '@/pages/CharacterCreate';

interface StepReviewProps {
  formData: CharacterFormData;
}

const ATTRIBUTE_LABELS: Record<string, string> = {
  agility: 'AGI',
  strength: 'FOR',
  intellect: 'INT',
  presence: 'PRE',
  vigor: 'VIG',
};

export function StepReview({ formData }: StepReviewProps) {
  const origin = ORIGINS.find(o => o.id === formData.origin);
  const characterClass = CLASSES.find(c => c.id === formData.characterClass);
  const stats = calculateDerivedStats(
    formData.characterClass,
    formData.attributes.vigor,
    formData.attributes.presence,
    formData.nex
  );
  const patent = getPatentByNex(formData.nex);
  const defense = 10 + formData.attributes.agility;

  const trainedSkills = SKILLS.filter(s => formData.skills[s.id] > 0);

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
            {formData.playerName && (
              <p className="text-sm text-muted-foreground">Jogador: {formData.playerName}</p>
            )}
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
      <div className="grid grid-cols-4 gap-4">
        <div className="ordo-panel p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">DEFESA</p>
          <p className="font-display text-3xl">{defense}</p>
        </div>
        <div className="ordo-panel p-4 text-center border-destructive/30">
          <p className="text-xs text-muted-foreground mb-1">PV</p>
          <p className="font-display text-3xl text-destructive">{stats.hp}</p>
        </div>
        <div className="ordo-panel p-4 text-center border-secondary/30">
          <p className="text-xs text-muted-foreground mb-1">PE</p>
          <p className="font-display text-3xl text-secondary">{stats.pe}</p>
        </div>
        <div className="ordo-panel p-4 text-center border-paranormal/30">
          <p className="text-xs text-muted-foreground mb-1">SAN</p>
          <p className="font-display text-3xl text-paranormal">{stats.san}</p>
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

      {/* Skills */}
      <div className="ordo-panel p-4">
        <h4 className="font-display text-lg tracking-wider mb-3 text-primary">PERÍCIAS TREINADAS</h4>
        {trainedSkills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {trainedSkills.map(skill => (
              <span 
                key={skill.id}
                className="px-3 py-1 bg-secondary/20 text-secondary text-sm rounded-sm"
              >
                {skill.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma perícia treinada.</p>
        )}
      </div>

      {/* Origin powers */}
      {origin && (
        <div className="ordo-panel p-4">
          <h4 className="font-display text-lg tracking-wider mb-3 text-primary">PODERES (ORIGEM)</h4>
          <div className="flex flex-wrap gap-2">
            {origin.powers.map((power, i) => (
              <span 
                key={i}
                className="px-3 py-1 bg-paranormal/20 text-paranormal text-sm rounded-sm"
              >
                {power}
              </span>
            ))}
          </div>
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

      <div className="ordo-panel p-4 bg-success/5 border-success/20">
        <p className="text-sm text-center">
          <span className="text-success font-medium">✓ DOSSIÊ PRONTO PARA REGISTRO</span>
        </p>
      </div>
    </div>
  );
}

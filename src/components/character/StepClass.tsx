import { CLASSES, calculateDerivedStats } from '@/lib/character-data';
import { cn } from '@/lib/utils';
import { Sword, Wrench, Sparkles, Shield, BookOpen } from 'lucide-react';
import { CLASS_PROFICIENCIES, CLASS_INITIAL_ABILITIES, getClassSkillRules } from '@/lib/character-builder-engine';
import type { CharacterFormData } from '@/pages/CharacterCreate';

interface StepClassProps {
  formData: CharacterFormData;
  updateFormData: (updates: Partial<CharacterFormData>) => void;
}

const CLASS_ICONS = {
  Combatente: Sword,
  Especialista: Wrench,
  Ocultista: Sparkles,
};

export function StepClass({ formData, updateFormData }: StepClassProps) {
  const stats = formData.characterClass 
    ? calculateDerivedStats(
        formData.characterClass,
        formData.attributes.vigor,
        formData.attributes.presence,
        formData.nex,
        formData.origin
      )
    : null;

  const handleSelectClass = (classId: string) => {
    // Reset class skill choices when changing class
    updateFormData({ 
      characterClass: classId,
      classSkillChoices: {},
      freeSkills: [],
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl tracking-wider mb-2">CLASSE</h2>
        <p className="text-muted-foreground text-sm">
          Escolha a classe do seu personagem. Isso afeta seus pontos de vida, esforço, sanidade e perícias.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {CLASSES.map((cls) => {
          const Icon = CLASS_ICONS[cls.id as keyof typeof CLASS_ICONS];
          const isSelected = formData.characterClass === cls.id;
          const previewStats = calculateDerivedStats(
            cls.id,
            formData.attributes.vigor,
            formData.attributes.presence,
            formData.nex,
            formData.origin
          );
          const proficiencies = CLASS_PROFICIENCIES[cls.id] || [];
          const skillRules = getClassSkillRules(cls.id, formData.attributes.intellect);

          return (
            <button
              key={cls.id}
              onClick={() => handleSelectClass(cls.id)}
              className={cn(
                'ordo-panel p-5 text-left transition-all hover:border-primary/50 flex flex-col',
                isSelected && 'border-primary bg-primary/5'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  'w-12 h-12 rounded-sm flex items-center justify-center',
                  cls.id === 'Combatente' && 'bg-destructive/20 text-destructive',
                  cls.id === 'Especialista' && 'bg-secondary/20 text-secondary',
                  cls.id === 'Ocultista' && 'bg-paranormal/20 text-paranormal',
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl tracking-wider">{cls.name}</h3>
              </div>

              <p className="text-xs text-muted-foreground mb-4 flex-1">
                {cls.description}
              </p>

              {/* Stats preview */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-2 bg-muted/50 rounded-sm">
                  <p className="text-xs text-muted-foreground">PV</p>
                  <p className="font-display text-lg text-destructive">{previewStats.hp}</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded-sm">
                  <p className="text-xs text-muted-foreground">PE</p>
                  <p className="font-display text-lg text-secondary">{previewStats.pe}</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded-sm">
                  <p className="text-xs text-muted-foreground">SAN</p>
                  <p className="font-display text-lg text-paranormal">{previewStats.san}</p>
                </div>
              </div>

              {/* Skills info */}
              <div className="text-xs text-muted-foreground mb-2">
                <span className="text-secondary font-medium">{skillRules.freePoints}</span> perícias à escolha
                {skillRules.mandatory.length > 0 && (
                  <span> + {skillRules.mandatory.length} obrigatórias</span>
                )}
                {skillRules.choices.length > 0 && (
                  <span> + {skillRules.choices.length} escolhas</span>
                )}
              </div>

              {isSelected && (
                <div className="mt-3 text-xs text-primary font-medium">
                  ✓ Selecionado
                </div>
              )}
            </button>
          );
        })}
      </div>

      {formData.characterClass && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Proficiencies */}
          <div className="ordo-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-primary" />
              <h4 className="font-display text-sm tracking-wider text-primary">PROFICIÊNCIAS</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {CLASS_PROFICIENCIES[formData.characterClass]?.map((prof) => (
                <span 
                  key={prof}
                  className="px-2 py-1 bg-muted text-xs rounded-sm"
                >
                  {prof}
                </span>
              ))}
            </div>
          </div>

          {/* Initial Abilities */}
          <div className="ordo-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-primary" />
              <h4 className="font-display text-sm tracking-wider text-primary">HABILIDADE NEX 5%</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {CLASS_INITIAL_ABILITIES[formData.characterClass]?.map((ability) => (
                <span 
                  key={ability}
                  className="px-2 py-1 bg-paranormal/20 text-paranormal text-xs rounded-sm"
                >
                  {ability}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {stats && (
        <div className="ordo-panel p-4 bg-primary/5 border-primary/20">
          <p className="text-sm mb-2">
            <span className="text-primary font-display">ESTATÍSTICAS CALCULADAS (NEX {formData.nex}%):</span>
          </p>
          <div className="flex gap-6">
            <span className="text-sm">
              <span className="text-destructive">PV:</span> {stats.hp}
            </span>
            <span className="text-sm">
              <span className="text-secondary">PE:</span> {stats.pe}
            </span>
            <span className="text-sm">
              <span className="text-paranormal">SAN:</span> {stats.san}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

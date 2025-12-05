import { ORIGINS } from '@/lib/character-data';
import { cn } from '@/lib/utils';
import type { CharacterFormData } from '@/pages/CharacterCreate';

interface StepOriginProps {
  formData: CharacterFormData;
  updateFormData: (updates: Partial<CharacterFormData>) => void;
}

export function StepOrigin({ formData, updateFormData }: StepOriginProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl tracking-wider mb-2">ORIGEM</h2>
        <p className="text-muted-foreground text-sm">
          Escolha a origem do seu personagem. Isso define suas perícias iniciais e um poder especial.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
        {ORIGINS.map((origin) => (
          <button
            key={origin.id}
            onClick={() => updateFormData({ origin: origin.id })}
            className={cn(
              'ordo-panel p-4 text-left transition-all hover:border-primary/50',
              formData.origin === origin.id && 'border-primary bg-primary/5'
            )}
          >
            <h3 className="font-display text-lg tracking-wider mb-1">
              {origin.name}
            </h3>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
              {origin.description}
            </p>
            
            <div className="space-y-2">
              <div>
                <p className="text-xs text-secondary mb-1">Perícias:</p>
                <p className="text-xs text-foreground">
                  {origin.skills.join(', ')}
                </p>
              </div>
              <div>
                <p className="text-xs text-paranormal mb-1">Poder:</p>
                <p className="text-xs text-foreground">
                  {origin.powers.join(', ')}
                </p>
              </div>
            </div>

            {formData.origin === origin.id && (
              <div className="mt-3 text-xs text-primary font-medium">
                ✓ Selecionado
              </div>
            )}
          </button>
        ))}
      </div>

      {formData.origin && (
        <div className="ordo-panel p-4 bg-primary/5 border-primary/20">
          <p className="text-sm">
            <span className="text-primary font-display">ORIGEM SELECIONADA: </span>
            <span className="text-foreground font-medium">
              {ORIGINS.find(o => o.id === formData.origin)?.name}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

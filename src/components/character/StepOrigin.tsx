import { useState } from 'react';
import { ORIGINS, SKILLS } from '@/lib/character-data';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dices, AlertCircle } from 'lucide-react';
import { rollOrigin, getOriginSkills } from '@/lib/character-builder-engine';
import type { CharacterFormData } from '@/pages/CharacterCreate';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StepOriginProps {
  formData: CharacterFormData;
  updateFormData: (updates: Partial<CharacterFormData>) => void;
}

export function StepOrigin({ formData, updateFormData }: StepOriginProps) {
  const [lastRoll, setLastRoll] = useState<{ dice: number[]; total: number } | null>(null);

  const handleSelectOrigin = (originId: string) => {
    const skills = getOriginSkills(originId);
    updateFormData({ 
      origin: originId,
      originSkills: skills,
    });
  };

  const handleRollOrigin = () => {
    const result = rollOrigin();
    setLastRoll({ dice: result.dice, total: result.total });
    handleSelectOrigin(result.originId);
  };

  const selectedOrigin = ORIGINS.find(o => o.id === formData.origin);
  const originSkillNames = formData.originSkills.map(id => 
    SKILLS.find(s => s.id === id)?.name || id
  );

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl tracking-wider mb-2">ORIGEM</h2>
        <p className="text-muted-foreground text-sm">
          Escolha a origem do seu personagem. Isso define suas perícias iniciais e um poder especial.
        </p>
      </div>

      {/* Roll Button */}
      <div className="flex justify-center mb-4">
        <Button
          variant="outline"
          onClick={handleRollOrigin}
          className="font-display"
        >
          <Dices className="w-4 h-4 mr-2" />
          ROLAR ORIGEM (2d20)
        </Button>
      </div>

      {lastRoll && (
        <div className="text-center text-sm text-muted-foreground mb-4">
          Resultado: [{lastRoll.dice[0]}] + [{lastRoll.dice[1]}] = {lastRoll.total}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
        {ORIGINS.map((origin) => {
          const isAmnésico = origin.id === 'amnésico';
          const hasSanityPenalty = origin.sanityModifier !== undefined;
          
          return (
            <button
              key={origin.id}
              onClick={() => handleSelectOrigin(origin.id)}
              className={cn(
                'ordo-panel p-4 text-left transition-all hover:border-primary/50',
                formData.origin === origin.id && 'border-primary bg-primary/5'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display text-lg tracking-wider">
                  {origin.name}
                </h3>
                {hasSanityPenalty && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertCircle className="w-4 h-4 text-warning" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Sanidade inicial reduzida pela metade</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {origin.description}
              </p>
              
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-secondary mb-1">Perícias:</p>
                  <p className="text-xs text-foreground">
                    {isAmnésico ? (
                      <span className="text-warning">Escolha duas perícias</span>
                    ) : (
                      origin.skills.join(', ')
                    )}
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
          );
        })}
      </div>

      {selectedOrigin && (
        <div className="ordo-panel p-4 bg-primary/5 border-primary/20 space-y-3">
          <div>
            <p className="text-sm">
              <span className="text-primary font-display">ORIGEM SELECIONADA: </span>
              <span className="text-foreground font-medium">{selectedOrigin.name}</span>
            </p>
          </div>
          
          {originSkillNames.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">PERÍCIAS TREINADAS (automático):</p>
              <div className="flex gap-2 flex-wrap">
                {originSkillNames.map(name => (
                  <span 
                    key={name}
                    className="px-2 py-0.5 bg-secondary/20 text-secondary text-xs rounded-sm"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <p className="text-xs text-muted-foreground mb-1">PODER:</p>
            <p className="text-xs text-paranormal">{selectedOrigin.powerDescription}</p>
          </div>
        </div>
      )}
    </div>
  );
}

import { CharacterFormData } from '@/pages/CharacterCreate';
import { NexSelector } from './NexSelector';

interface StepNexProps {
  formData: CharacterFormData;
  updateFormData: (updates: Partial<CharacterFormData>) => void;
}

export function StepNex({ formData, updateFormData }: StepNexProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl tracking-wider text-foreground">
          NÍVEL DE EXPERIÊNCIA
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          O NEX representa a experiência do seu agente na Ordo Realitas. 
          Agentes iniciantes começam com 5%, mas o mestre pode permitir níveis mais altos.
        </p>
      </div>

      <NexSelector
        value={formData.nex}
        onChange={(nex) => updateFormData({ nex })}
      />
    </div>
  );
}

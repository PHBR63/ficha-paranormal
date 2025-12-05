import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import type { CharacterFormData } from '@/pages/CharacterCreate';

interface StepAttributesProps {
  formData: CharacterFormData;
  updateFormData: (updates: Partial<CharacterFormData>) => void;
}

const ATTRIBUTES = [
  { id: 'agility', name: 'Agilidade', abbr: 'AGI', description: 'Reflexos, equilíbrio e coordenação motora.' },
  { id: 'strength', name: 'Força', abbr: 'FOR', description: 'Poder físico e capacidade muscular.' },
  { id: 'intellect', name: 'Intelecto', abbr: 'INT', description: 'Raciocínio, memória e conhecimento.' },
  { id: 'presence', name: 'Presença', abbr: 'PRE', description: 'Carisma, força de vontade e percepção.' },
  { id: 'vigor', name: 'Vigor', abbr: 'VIG', description: 'Resistência física e saúde.' },
];

export function StepAttributes({ formData, updateFormData }: StepAttributesProps) {
  const totalPoints = Object.values(formData.attributes).reduce((a, b) => a + b, 0);
  const basePoints = 5; // 1 em cada atributo
  const maxPoints = 9; // 4 pontos para distribuir
  const remainingPoints = maxPoints - totalPoints;

  const updateAttribute = (attr: keyof typeof formData.attributes, delta: number) => {
    const currentValue = formData.attributes[attr];
    const newValue = currentValue + delta;
    
    // Check bounds (min 1, max 3 at creation)
    if (newValue < 1 || newValue > 3) return;
    
    // Check if we have points to spend
    if (delta > 0 && remainingPoints <= 0) return;

    updateFormData({
      attributes: {
        ...formData.attributes,
        [attr]: newValue,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl tracking-wider mb-2">ATRIBUTOS BASE</h2>
        <p className="text-muted-foreground text-sm">
          Distribua 4 pontos entre os atributos. Cada atributo começa em 1 e pode chegar a 3 na criação.
        </p>
      </div>

      {/* Points counter */}
      <div className="ordo-panel p-4 text-center mb-6">
        <p className="text-sm text-muted-foreground mb-1">PONTOS RESTANTES</p>
        <p className={`font-display text-4xl ${remainingPoints === 0 ? 'text-success' : 'text-secondary'}`}>
          {remainingPoints}
        </p>
        {remainingPoints === 0 && (
          <p className="text-xs text-success mt-1">✓ Todos os pontos distribuídos</p>
        )}
      </div>

      {/* Attributes */}
      <div className="space-y-4">
        {ATTRIBUTES.map((attr) => {
          const value = formData.attributes[attr.id as keyof typeof formData.attributes];
          return (
            <div 
              key={attr.id}
              className="ordo-panel p-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-display text-lg tracking-wider">{attr.name}</span>
                  <span className="text-xs text-secondary bg-secondary/20 px-2 py-0.5 rounded">
                    {attr.abbr}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{attr.description}</p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8 border-border"
                  onClick={() => updateAttribute(attr.id as keyof typeof formData.attributes, -1)}
                  disabled={value <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>

                <div className="w-12 text-center">
                  <span className="font-display text-2xl text-primary">{value}</span>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8 border-border"
                  onClick={() => updateAttribute(attr.id as keyof typeof formData.attributes, 1)}
                  disabled={value >= 3 || remainingPoints <= 0}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="ordo-panel p-4 bg-primary/5 border-primary/20">
        <p className="text-sm text-muted-foreground">
          <span className="text-primary font-medium">NOTA:</span> Atributos podem ser aumentados 
          conforme seu NEX sobe. Na criação, o máximo é 3 em cada atributo.
        </p>
      </div>
    </div>
  );
}

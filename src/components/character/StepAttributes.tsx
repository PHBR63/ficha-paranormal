import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CharacterFormData } from '@/pages/CharacterCreate';

interface StepAttributesProps {
  formData: CharacterFormData;
  updateFormData: (updates: Partial<CharacterFormData>) => void;
}

const ATTRIBUTES = [
  { id: 'agility', name: 'Agilidade', abbr: 'AGI', description: 'Reflexos, equilíbrio e coordenação motora. Afeta Defesa.' },
  { id: 'strength', name: 'Força', abbr: 'FOR', description: 'Poder físico e capacidade muscular. Afeta dano corpo a corpo.' },
  { id: 'intellect', name: 'Intelecto', abbr: 'INT', description: 'Raciocínio, memória e conhecimento. Usado em rituais.' },
  { id: 'presence', name: 'Presença', abbr: 'PRE', description: 'Carisma, força de vontade e percepção. Afeta PE.' },
  { id: 'vigor', name: 'Vigor', abbr: 'VIG', description: 'Resistência física e saúde. Afeta PV.' },
];

export function StepAttributes({ formData, updateFormData }: StepAttributesProps) {
  // Track if user has used the "reduce to 0" option
  const [hasReducedToZero, setHasReducedToZero] = useState(false);
  const [reducedAttribute, setReducedAttribute] = useState<string | null>(null);

  const totalPoints = Object.values(formData.attributes).reduce((a, b) => a + b, 0);
  const basePoints = 5; // 1 em cada atributo
  const distributedPoints = 4; // pontos para distribuir
  const bonusFromZero = hasReducedToZero ? 1 : 0;
  const maxPoints = basePoints + distributedPoints + bonusFromZero;
  const remainingPoints = maxPoints - totalPoints;

  const updateAttribute = (attr: keyof typeof formData.attributes, delta: number) => {
    const currentValue = formData.attributes[attr];
    const newValue = currentValue + delta;
    
    // Lógica especial para reduzir a 0
    if (delta < 0 && newValue === 0) {
      // Só pode reduzir um atributo para 0
      if (hasReducedToZero && reducedAttribute !== attr) {
        return; // Já usou essa opção em outro atributo
      }
      
      if (!hasReducedToZero) {
        setHasReducedToZero(true);
        setReducedAttribute(attr);
      }
    }
    
    // Se está restaurando de 0
    if (delta > 0 && currentValue === 0 && reducedAttribute === attr) {
      setHasReducedToZero(false);
      setReducedAttribute(null);
    }
    
    // Check bounds
    if (newValue < 0 || newValue > 3) return;
    
    // Check if we have points to spend (exceto ao reduzir)
    if (delta > 0 && remainingPoints <= 0) return;

    updateFormData({
      attributes: {
        ...formData.attributes,
        [attr]: newValue,
      },
    });
  };

  const isValid = totalPoints === maxPoints;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl tracking-wider mb-2">ATRIBUTOS BASE</h2>
        <p className="text-muted-foreground text-sm">
          Distribua {distributedPoints} pontos entre os atributos. Cada atributo começa em 1 e pode chegar a 3.
        </p>
      </div>

      {/* Points counter */}
      <div className="ordo-panel p-4 text-center mb-6">
        <p className="text-sm text-muted-foreground mb-1">PONTOS RESTANTES</p>
        <p className={cn(
          'font-display text-4xl',
          isValid ? 'text-success' : 'text-accent'
        )}>
          {remainingPoints}
        </p>
        {isValid && (
          <p className="text-xs text-success mt-1">✓ Todos os pontos distribuídos</p>
        )}
      </div>

      {/* Zero warning */}
      {!hasReducedToZero && (
        <div className="ordo-panel p-4 bg-paranormal/5 border-paranormal/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-paranormal shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-paranormal">Regra do Zero</p>
              <p className="text-xs text-muted-foreground mt-1">
                Você pode reduzir <strong>um</strong> atributo para 0 e ganhar +1 ponto extra para distribuir. 
                Porém, testes com atributo 0 rolam 2d20 e pegam o <strong>menor</strong> resultado.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Attributes */}
      <div className="space-y-3">
        {ATTRIBUTES.map((attr) => {
          const value = formData.attributes[attr.id as keyof typeof formData.attributes];
          const isZero = value === 0;
          const isThisReduced = reducedAttribute === attr.id;
          const canReduceToZero = !hasReducedToZero || isThisReduced;
          const minValue = canReduceToZero ? 0 : 1;
          
          return (
            <div 
              key={attr.id}
              className={cn(
                'ordo-panel p-4 flex items-center justify-between transition-all',
                isZero && 'border-paranormal/50 bg-paranormal/5'
              )}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-display text-lg tracking-wider">{attr.name}</span>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded',
                    isZero 
                      ? 'bg-paranormal/20 text-paranormal' 
                      : 'bg-accent/20 text-accent'
                  )}>
                    {attr.abbr}
                  </span>
                  {isZero && (
                    <span className="text-xs text-paranormal animate-pulse">
                      ⚠ DESVANTAGEM
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{attr.description}</p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    'w-8 h-8 border-border',
                    value === 1 && canReduceToZero && 'border-paranormal/50 hover:border-paranormal'
                  )}
                  onClick={() => updateAttribute(attr.id as keyof typeof formData.attributes, -1)}
                  disabled={value <= minValue}
                >
                  <Minus className="w-4 h-4" />
                </Button>

                <div className="w-12 text-center">
                  <span className={cn(
                    'font-display text-3xl',
                    isZero ? 'text-paranormal' : 'text-primary'
                  )}>
                    {value}
                  </span>
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

      {hasReducedToZero && reducedAttribute && (
        <div className="ordo-panel p-4 bg-paranormal/10 border-paranormal/30">
          <p className="text-sm text-paranormal">
            <strong>Atributo Nulo ativado:</strong> {ATTRIBUTES.find(a => a.id === reducedAttribute)?.name}. 
            Você ganhou +1 ponto extra. Lembre-se: testes com este atributo usarão a regra de desvantagem.
          </p>
        </div>
      )}
    </div>
  );
}

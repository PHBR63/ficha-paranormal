import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus, AlertTriangle, Info, Heart, Zap, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateDerivedStats, calculateDefense, getExtraAttributePoints } from '@/lib/character-data';
import { getMaxAttributeByNex } from '@/lib/character-builder-engine';
import type { CharacterFormData } from '@/pages/CharacterCreate';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RuleBookTip } from './RuleBookTip';
import { getRulebookContent } from '@/lib/rulebook-content';

interface StepAttributesProps {
  formData: CharacterFormData;
  updateFormData: (updates: Partial<CharacterFormData>) => void;
}

// Configuração dos atributos com cores do design system
const ATTRIBUTES = [
  { 
    id: 'agility', 
    name: 'Agilidade', 
    abbr: 'AGI', 
    description: 'Reflexos, equilíbrio e coordenação motora.',
    effects: ['Afeta Defesa (+1 por ponto)', 'Usado em Acrobacia, Furtividade, Pontaria', 'Determina Reflexos em combate'],
    colorVar: '--attr-agility'
  },
  { 
    id: 'strength', 
    name: 'Força', 
    abbr: 'FOR', 
    description: 'Poder físico e capacidade muscular.',
    effects: ['Afeta dano corpo a corpo', 'Usado em Atletismo, Luta', 'Determina capacidade de carga'],
    colorVar: '--attr-strength'
  },
  { 
    id: 'intellect', 
    name: 'Intelecto', 
    abbr: 'INT', 
    description: 'Raciocínio, memória e conhecimento.',
    effects: ['Determina perícias livres extras', 'Usado em Ciências, Investigação, Medicina', 'Essencial para rituais'],
    colorVar: '--attr-intellect'
  },
  { 
    id: 'presence', 
    name: 'Presença', 
    abbr: 'PRE', 
    description: 'Carisma, força de vontade e percepção.',
    effects: ['Afeta PE (Pontos de Esforço)', 'Usado em Diplomacia, Intimidação, Vontade', 'Resistência mental'],
    colorVar: '--attr-presence'
  },
  { 
    id: 'vigor', 
    name: 'Vigor', 
    abbr: 'VIG', 
    description: 'Resistência física e saúde.',
    effects: ['Afeta PV (Pontos de Vida)', 'Usado em Fortitude', 'Resistência a venenos e doenças'],
    colorVar: '--attr-vigor'
  },
];

export function StepAttributes({ formData, updateFormData }: StepAttributesProps) {
  // Estado para controle da regra de reduzir atributo a 0
  const [hasReducedToZero, setHasReducedToZero] = useState(() => {
    return Object.values(formData.attributes).some(v => v === 0);
  });
  const [reducedAttribute, setReducedAttribute] = useState<string | null>(() => {
    const entry = Object.entries(formData.attributes).find(([, v]) => v === 0);
    return entry ? entry[0] : null;
  });

  // Limite máximo de atributo baseado no NEX (3 para NEX 5-15%, 4 para 20-35%, 5 para 40%+)
  const maxAttribute = getMaxAttributeByNex(formData.nex);

  // Cálculo de pontos disponíveis incluindo bônus por NEX
  const totalPoints = Object.values(formData.attributes).reduce((a, b) => a + b, 0);
  const basePoints = 5; // Pontos base (1 em cada atributo)
  const distributedPoints = 4; // Pontos para distribuir
  const bonusFromZero = hasReducedToZero ? 1 : 0; // Bônus por reduzir atributo a 0
  const nexBonus = getExtraAttributePoints(formData.nex); // Pontos extras por NEX
  const maxPoints = basePoints + distributedPoints + bonusFromZero + nexBonus;
  const remainingPoints = maxPoints - totalPoints;

  // Detecta atributos que excedem o limite do NEX atual (pode acontecer se mudar NEX)
  const attributesExceedingLimit = useMemo(() => {
    return Object.entries(formData.attributes)
      .filter(([, value]) => value > maxAttribute)
      .map(([key]) => key);
  }, [formData.attributes, maxAttribute]);

  const hasExceedingAttributes = attributesExceedingLimit.length > 0;

  // Preview stats based on current attributes
  const previewStats = useMemo(() => {
    if (!formData.characterClass) {
      return null;
    }
    return calculateDerivedStats(
      formData.characterClass,
      formData.attributes.vigor,
      formData.attributes.presence,
      formData.nex,
      formData.origin
    );
  }, [formData.characterClass, formData.attributes, formData.nex, formData.origin]);

  const defense = calculateDefense(formData.attributes.agility);

  const updateAttribute = (attr: keyof typeof formData.attributes, delta: number) => {
    const currentValue = formData.attributes[attr];
    const newValue = currentValue + delta;
    
    if (delta < 0 && newValue === 0) {
      if (hasReducedToZero && reducedAttribute !== attr) {
        return;
      }
      
      if (!hasReducedToZero) {
        setHasReducedToZero(true);
        setReducedAttribute(attr);
      }
    }
    
    if (delta > 0 && currentValue === 0 && reducedAttribute === attr) {
      setHasReducedToZero(false);
      setReducedAttribute(null);
    }
    
    // Usa limite dinâmico baseado no NEX
    if (newValue < 0 || newValue > maxAttribute) return;
    if (delta > 0 && remainingPoints <= 0) return;

    updateFormData({
      attributes: {
        ...formData.attributes,
        [attr]: newValue,
      },
    });
  };

  // Validação: atributos dentro do limite E pontos distribuídos corretamente
  const isValid = totalPoints === maxPoints && !hasExceedingAttributes;

  // Conteúdo educativo do livro
  const rulebookContent = getRulebookContent('attributes');

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl tracking-wider mb-2">ATRIBUTOS BASE</h2>
          <p className="text-muted-foreground text-sm">
            Distribua seus pontos entre os atributos. Cada atributo começa em 1 e pode chegar a {maxAttribute}.
            {formData.nex > 15 && (
              <span className="text-primary ml-1">(limite aumentado por NEX {formData.nex}%)</span>
            )}
          </p>
          {/* Mostra breakdown dos pontos disponíveis */}
          <div className="flex flex-wrap justify-center gap-2 mt-3 text-xs">
            <span className="px-2 py-1 rounded bg-muted/50 border border-border">
              Base: {distributedPoints}
            </span>
            {bonusFromZero > 0 && (
              <span className="px-2 py-1 rounded bg-paranormal/20 border border-paranormal/30 text-paranormal">
                Atributo Zero: +{bonusFromZero}
              </span>
            )}
            {nexBonus > 0 && (
              <span className="px-2 py-1 rounded bg-primary/20 border border-primary/30 text-primary">
                NEX {formData.nex}%: +{nexBonus}
              </span>
            )}
            {maxAttribute > 3 && (
              <span className="px-2 py-1 rounded bg-accent/20 border border-accent/30 text-accent">
                Máx/Atrib: {maxAttribute}
              </span>
            )}
          </div>
        </div>

        {/* Painel educativo do livro de regras */}
        {rulebookContent && (
          <RuleBookTip section={rulebookContent} defaultExpanded={false} />
        )}

        {/* Points counter with progress bar */}
        <motion.div 
          className="ordo-panel p-4 text-center mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm text-muted-foreground mb-2">PONTOS RESTANTES</p>
          <motion.p 
            key={remainingPoints}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className={cn(
              'font-display text-4xl',
              isValid ? 'text-success' : 'text-accent'
            )}
          >
            {remainingPoints}
          </motion.p>
          
          {/* Progress bar */}
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={cn(
                'h-full rounded-full',
                isValid ? 'bg-success' : 'bg-primary'
              )}
              initial={{ width: '0%' }}
              animate={{ width: `${((maxPoints - remainingPoints) / maxPoints) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          {isValid && (
            <motion.p 
              className="text-xs text-success mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              ✓ Todos os pontos distribuídos
            </motion.p>
          )}
        </motion.div>

        {/* Preview Stats (if class is selected) */}
        <AnimatePresence>
          {previewStats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="ordo-panel p-4 bg-primary/5 border-primary/20"
            >
              <p className="text-xs text-muted-foreground text-center mb-3">PREVIEW DE ESTATÍSTICAS</p>
              <div className="flex justify-center gap-6">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-muted-foreground">PV:</span>
                  <motion.span 
                    key={previewStats.hp}
                    initial={{ scale: 1.2, color: 'hsl(var(--primary))' }}
                    animate={{ scale: 1, color: 'hsl(var(--destructive))' }}
                    className="font-display text-lg text-destructive"
                  >
                    {previewStats.hp}
                  </motion.span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-success" />
                  <span className="text-sm text-muted-foreground">PE:</span>
                  <motion.span 
                    key={previewStats.pe}
                    initial={{ scale: 1.2, color: 'hsl(var(--primary))' }}
                    animate={{ scale: 1, color: 'hsl(var(--success))' }}
                    className="font-display text-lg text-success"
                  >
                    {previewStats.pe}
                  </motion.span>
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-paranormal" />
                  <span className="text-sm text-muted-foreground">SAN:</span>
                  <motion.span 
                    key={previewStats.san}
                    initial={{ scale: 1.2, color: 'hsl(var(--primary))' }}
                    animate={{ scale: 1, color: 'hsl(var(--paranormal))' }}
                    className="font-display text-lg text-paranormal"
                  >
                    {previewStats.san}
                  </motion.span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">DEF:</span>
                  <motion.span 
                    key={defense}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="font-display text-lg"
                  >
                    {defense}
                  </motion.span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alerta de atributos excedendo limite do NEX */}
        <AnimatePresence>
          {hasExceedingAttributes && (
            <motion.div 
              className="ordo-panel p-4 bg-destructive/10 border-destructive/30"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Atributos acima do limite</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Com NEX {formData.nex}%, o máximo por atributo é <strong>{maxAttribute}</strong>. 
                    Reduza os seguintes atributos: {' '}
                    <span className="text-destructive font-medium">
                      {attributesExceedingLimit.map(id => 
                        ATTRIBUTES.find(a => a.id === id)?.name
                      ).join(', ')}
                    </span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zero warning */}
        {!hasReducedToZero && !hasExceedingAttributes && (
          <motion.div 
            className="ordo-panel p-4 bg-paranormal/5 border-paranormal/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
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
          </motion.div>
        )}

        {/* Attributes */}
        <div className="space-y-3">
          {ATTRIBUTES.map((attr, index) => {
            const value = formData.attributes[attr.id as keyof typeof formData.attributes];
            const isZero = value === 0;
            const isThisReduced = reducedAttribute === attr.id;
            const canReduceToZero = !hasReducedToZero || isThisReduced;
            const minValue = canReduceToZero ? 0 : 1;
            const exceedsLimit = value > maxAttribute; // Verifica se excede o limite do NEX
            
            return (
              <motion.div 
                key={attr.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'ordo-panel p-4 flex items-center justify-between transition-all',
                  isZero && 'border-paranormal/50 bg-paranormal/5',
                  exceedsLimit && 'border-destructive/50 bg-destructive/5 animate-pulse'
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display text-lg tracking-wider">{attr.name}</span>
                    <span 
                      className="text-sm font-display font-bold px-2.5 py-1 rounded tracking-wider"
                      style={{
                        backgroundColor: isZero ? 'hsl(var(--paranormal) / 0.2)' : `hsl(var(${attr.colorVar}) / 0.2)`,
                        color: isZero ? 'hsl(var(--paranormal))' : `hsl(var(${attr.colorVar}))`
                      }}
                    >
                      {attr.abbr}
                    </span>
                    
                    {/* Info tooltip */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p className="font-medium mb-2">{attr.name}</p>
                        <p className="text-xs text-muted-foreground mb-2">{attr.description}</p>
                        <ul className="text-xs space-y-1">
                          {attr.effects.map((effect, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-primary">•</span>
                              <span>{effect}</span>
                            </li>
                          ))}
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                    
                    {isZero && (
                      <span className="text-xs text-paranormal animate-pulse">
                        ⚠ DESVANTAGEM
                      </span>
                    )}
                    {exceedsLimit && (
                      <span className="text-xs text-destructive animate-pulse font-medium">
                        ⚠ EXCEDE LIMITE (máx {maxAttribute})
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

                  <div className="w-12 text-center relative">
                    <motion.span 
                      key={value}
                      initial={{ scale: 1.3 }}
                      animate={{ scale: 1 }}
                      className="font-display text-3xl"
                      style={{ 
                        color: exceedsLimit 
                          ? 'hsl(var(--destructive))' 
                          : isZero 
                            ? 'hsl(var(--paranormal))' 
                            : `hsl(var(${attr.colorVar}))`
                      }}
                    >
                      {value}
                    </motion.span>
                    {exceedsLimit && (
                      <span className="absolute -top-1 -right-1 text-[10px] bg-destructive text-destructive-foreground px-1 rounded">
                        -{value - maxAttribute}
                      </span>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 border-border"
                    onClick={() => updateAttribute(attr.id as keyof typeof formData.attributes, 1)}
                    disabled={value >= maxAttribute || remainingPoints <= 0}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence>
          {hasReducedToZero && reducedAttribute && (
            <motion.div 
              className="ordo-panel p-4 bg-paranormal/10 border-paranormal/30"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <p className="text-sm text-paranormal">
                <strong>Atributo Nulo ativado:</strong> {ATTRIBUTES.find(a => a.id === reducedAttribute)?.name}. 
                Você ganhou +1 ponto extra. Lembre-se: testes com este atributo usarão a regra de desvantagem.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}

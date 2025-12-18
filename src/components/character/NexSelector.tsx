/**
 * NexSelector - Seletor de NEX (Nível de Experiência)
 * 
 * Componente focado APENAS no NEX, sem lógica de patente.
 * A patente agora é selecionada em um step separado (StepPatent).
 */

import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface NexSelectorProps {
  value: number;
  onChange: (nex: number) => void;
}

// Valores de NEX disponíveis
const NEX_VALUES = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 99];

export function NexSelector({ value, onChange }: NexSelectorProps) {
  const handleSliderChange = (values: number[]) => {
    const index = values[0];
    onChange(NEX_VALUES[index]);
  };
  
  const currentIndex = NEX_VALUES.indexOf(value);

  return (
    <div className="space-y-6">
      {/* Header com valor do NEX */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg tracking-wider text-foreground">
          NÍVEL DE EXPERIÊNCIA (NEX)
        </h3>
        <motion.div
          key={value}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-2"
        >
          <span className="font-mono text-3xl font-bold text-primary">{value}%</span>
        </motion.div>
      </div>

      {/* Slider */}
      <div className="px-2">
        <Slider
          value={[currentIndex]}
          onValueChange={handleSliderChange}
          max={NEX_VALUES.length - 1}
          min={0}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between mt-2 text-xs text-foreground/60">
          <span>5%</span>
          <span>50%</span>
          <span>99%</span>
        </div>
      </div>

      {/* Quick Select Buttons */}
      <div className="grid grid-cols-5 gap-2">
        {[5, 20, 50, 75, 99].map((nex) => {
          const isSelected = value === nex;
          
          return (
            <motion.button
              key={nex}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(nex)}
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-lg border transition-all",
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card/50 text-muted-foreground hover:border-primary/50"
              )}
            >
              <span className="text-lg font-mono font-bold">{nex}%</span>
            </motion.button>
          );
        })}
      </div>

      {/* Info Panel simplificado */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-3">
        <h4 className="font-display text-sm tracking-wider text-foreground/70">
          SOBRE O NEX {value}%
        </h4>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-foreground/60">Nível de Treinamento:</span>
            <span className="ml-2 text-foreground font-medium">
              {value >= 70 ? 'Expert' : value >= 35 ? 'Veterano' : 'Treinado'}
            </span>
          </div>
          <div>
            <span className="text-foreground/60">Experiência:</span>
            <span className="ml-2 text-foreground font-medium">
              {value === 5 ? 'Iniciante' : value <= 25 ? 'Novato' : value <= 50 ? 'Experiente' : value <= 75 ? 'Veterano' : 'Lendário'}
            </span>
          </div>
        </div>
        
        <p className="text-xs text-foreground/60 italic">
          O NEX representa sua exposição ao paranormal e determina seus pontos de atributo, 
          perícias extras, habilidades de classe e acesso a rituais (para Ocultistas).
        </p>
      </div>
    </div>
  );
}

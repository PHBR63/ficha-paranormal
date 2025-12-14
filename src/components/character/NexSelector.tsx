import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Shield, Star, Award, Crown, Gem } from 'lucide-react';
import { getPatentByNex, PATENTS } from '@/lib/character-data';
import { cn } from '@/lib/utils';

interface NexSelectorProps {
  value: number;
  onChange: (nex: number) => void;
}

const NEX_VALUES = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 99];

const PATENT_ICONS: Record<string, React.ElementType> = {
  'Recruta': Shield,
  'Operador': Star,
  'Agente Especial': Award,
  'Oficial de Operações': Crown,
  'Agente de Elite': Gem,
};

const PATENT_COLORS: Record<string, string> = {
  'Recruta': 'from-slate-500 to-slate-600',
  'Operador': 'from-blue-500 to-blue-600',
  'Agente Especial': 'from-purple-500 to-purple-600',
  'Oficial de Operações': 'from-amber-500 to-amber-600',
  'Agente de Elite': 'from-red-500 to-red-600',
};

export function NexSelector({ value, onChange }: NexSelectorProps) {
  const patent = getPatentByNex(value);
  const PatentIcon = PATENT_ICONS[patent] || Shield;
  const patentColor = PATENT_COLORS[patent] || 'from-slate-500 to-slate-600';
  
  const patentData = PATENTS.find(p => p.nex === value);
  
  const handleSliderChange = (values: number[]) => {
    const index = values[0];
    onChange(NEX_VALUES[index]);
  };
  
  const currentIndex = NEX_VALUES.indexOf(value);

  return (
    <div className="space-y-6">
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

      {/* Patent Badge */}
      <motion.div
        key={patent}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-center"
      >
        <div className={cn(
          "flex items-center gap-3 px-6 py-3 rounded-lg bg-gradient-to-r",
          patentColor
        )}>
          <PatentIcon className="w-6 h-6 text-white" />
          <span className="font-display text-xl tracking-wider text-white">
            {patent}
          </span>
        </div>
      </motion.div>

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
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>5%</span>
          <span>50%</span>
          <span>99%</span>
        </div>
      </div>

      {/* Quick Select Buttons */}
      <div className="grid grid-cols-5 gap-2">
        {[5, 20, 50, 75, 99].map((nex) => {
          const p = getPatentByNex(nex);
          const Icon = PATENT_ICONS[p];
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
              <Icon className="w-4 h-4" />
              <span className="text-xs font-mono">{nex}%</span>
            </motion.button>
          );
        })}
      </div>

      {/* Info Panel */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-3">
        <h4 className="font-display text-sm tracking-wider text-muted-foreground">
          BENEFÍCIOS DO NEX {value}%
        </h4>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Patente:</span>
            <span className="ml-2 text-foreground font-medium">{patent}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Nível de Treinamento:</span>
            <span className="ml-2 text-foreground font-medium">
              {value >= 70 ? 'Expert' : value >= 35 ? 'Veterano' : 'Treinado'}
            </span>
          </div>
        </div>

        {patentData && (
          <div className="pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">Limite de itens por categoria:</span>
            <div className="flex gap-2 mt-1">
              {Object.entries(patentData.itemLimit).map(([cat, limit]) => (
                <Badge key={cat} variant="outline" className="text-xs">
                  {cat.replace('cat', 'Cat ')}: {limit}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground italic">
          Agentes com NEX mais alto possuem mais PV, PE, SAN e perícias. 
          Consulte o mestre antes de criar um personagem acima de 5%.
        </p>
      </div>
    </div>
  );
}

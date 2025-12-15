import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Shield, Star, Award, Crown, Gem, AlertTriangle, ChevronDown } from 'lucide-react';
import { getPatentByNex, PATENTS } from '@/lib/character-data';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface NexSelectorProps {
  value: number;
  onChange: (nex: number) => void;
  // Nova prop para patente manual (opcional)
  patentOverride?: string | null;
  onPatentChange?: (patent: string | null) => void;
}

const NEX_VALUES = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 99];

// Lista de patentes disponíveis para seleção manual
const ALL_PATENTS = [
  'Recruta',
  'Operador', 
  'Agente Especial',
  'Oficial de Operações',
  'Agente de Elite',
];

const PATENT_ICONS: Record<string, React.ElementType> = {
  'Recruta': Shield,
  'Operador': Star,
  'Agente Especial': Award,
  'Oficial de Operações': Crown,
  'Agente de Elite': Gem,
};

// Cores de patente com text color para garantir contraste
const PATENT_STYLES: Record<string, { gradient: string; text: string }> = {
  'Recruta': { gradient: 'from-slate-500 to-slate-600', text: 'text-slate-50' },
  'Operador': { gradient: 'from-blue-500 to-blue-600', text: 'text-blue-50' },
  'Agente Especial': { gradient: 'from-purple-500 to-purple-600', text: 'text-purple-50' },
  'Oficial de Operações': { gradient: 'from-amber-500 to-amber-600', text: 'text-amber-950' },
  'Agente de Elite': { gradient: 'from-red-500 to-red-600', text: 'text-red-50' },
};

export function NexSelector({ value, onChange, patentOverride, onPatentChange }: NexSelectorProps) {
  // Patente sugerida baseada no NEX
  const suggestedPatent = getPatentByNex(value);
  // Patente atual (override ou sugerida)
  const currentPatent = patentOverride || suggestedPatent;
  const PatentIcon = PATENT_ICONS[currentPatent] || Shield;
  const patentStyle = PATENT_STYLES[currentPatent] || { gradient: 'from-slate-500 to-slate-600', text: 'text-slate-50' };
  
  const patentData = PATENTS.find(p => p.nex === value);
  
  // Verifica se a patente foi modificada manualmente
  const isPatentOverridden = patentOverride && patentOverride !== suggestedPatent;
  
  const handleSliderChange = (values: number[]) => {
    const index = values[0];
    onChange(NEX_VALUES[index]);
  };

  const handlePatentSelect = (patent: string) => {
    if (onPatentChange) {
      // Se selecionar "auto" ou a patente sugerida, limpa o override
      if (patent === 'auto' || patent === suggestedPatent) {
        onPatentChange(null);
      } else {
        onPatentChange(patent);
      }
    }
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

      {/* Patent Badge com Select para seleção manual */}
      <motion.div
        key={currentPatent}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col items-center gap-2"
      >
        <div className={cn(
          "flex items-center gap-3 px-6 py-3 rounded-lg bg-gradient-to-r",
          patentStyle.gradient
        )}>
          <PatentIcon className={cn("w-6 h-6", patentStyle.text)} />
          <span className={cn("font-display text-xl tracking-wider", patentStyle.text)}>
            {currentPatent}
          </span>
        </div>
        
        {/* Seletor de patente manual */}
        {onPatentChange && (
          <div className="flex flex-col items-center gap-1 w-full max-w-xs">
            <span className="text-xs text-muted-foreground">
              Sugerido: {suggestedPatent} • Selecione outra se necessário:
            </span>
            <Select
              value={patentOverride || 'auto'}
              onValueChange={handlePatentSelect}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Automático (baseado no NEX)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">
                  <span className="flex items-center gap-2">
                    Automático ({suggestedPatent})
                  </span>
                </SelectItem>
                {ALL_PATENTS.map((patent) => {
                  const Icon = PATENT_ICONS[patent];
                  return (
                    <SelectItem key={patent} value={patent}>
                      <span className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {patent}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            
            {/* Aviso quando patente é diferente da sugerida */}
            {isPatentOverridden && (
              <div className="flex items-center gap-1 text-xs text-amber-500 mt-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Patente diferente da sugerida para NEX {value}%</span>
              </div>
            )}
          </div>
        )}
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
            <span className="ml-2 text-foreground font-medium">{currentPatent}</span>
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
          A patente é baseada em pontos de prestígio adquiridos nas missões. 
          Você pode selecionar manualmente se sua patente for diferente da sugerida.
        </p>
      </div>
    </div>
  );
}

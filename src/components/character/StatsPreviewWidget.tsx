import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Zap, Brain, Shield, Footprints } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsPreviewWidgetProps {
  hp: number;
  pe: number;
  san: number;
  defense: number;
  movement: number;
  characterClass?: string;
  show?: boolean;
}

export function StatsPreviewWidget({
  hp,
  pe,
  san,
  defense,
  movement,
  characterClass,
  show = true,
}: StatsPreviewWidgetProps) {
  const classColors = {
    Combatente: 'from-destructive/20 to-destructive/5 border-destructive/30',
    Especialista: 'from-secondary/20 to-secondary/5 border-secondary/30',
    Ocultista: 'from-paranormal/20 to-paranormal/5 border-paranormal/30',
  };

  const bgClass = characterClass 
    ? classColors[characterClass as keyof typeof classColors] 
    : 'from-primary/20 to-primary/5 border-primary/30';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className={cn(
            'fixed right-4 top-1/2 -translate-y-1/2 z-40',
            'hidden lg:block'
          )}
        >
          <div className={cn(
            'ordo-panel p-4 bg-gradient-to-b border-2',
            bgClass
          )}>
            <p className="text-xs text-muted-foreground text-center mb-3 font-display tracking-wider">
              PREVIEW
            </p>
            
            <div className="space-y-3">
              <StatItem 
                icon={Heart} 
                label="PV" 
                value={hp} 
                color="text-destructive" 
              />
              <StatItem 
                icon={Zap} 
                label="PE" 
                value={pe} 
                color="text-success" 
              />
              <StatItem 
                icon={Brain} 
                label="SAN" 
                value={san} 
                color="text-paranormal" 
              />
              
              <div className="h-px bg-border my-2" />
              
              <StatItem 
                icon={Shield} 
                label="DEF" 
                value={defense} 
                color="text-primary" 
              />
              <StatItem 
                icon={Footprints} 
                label="MOV" 
                value={`${movement}m`} 
                color="text-muted-foreground" 
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface StatItemProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
}

function StatItem({ icon: Icon, label, value, color }: StatItemProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn('w-4 h-4', color)} />
      <span className="text-xs text-muted-foreground w-8">{label}</span>
      <motion.span
        key={value}
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn('font-display text-lg', color)}
      >
        {value}
      </motion.span>
    </div>
  );
}

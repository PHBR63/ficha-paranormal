/**
 * StatsPreviewWidget - Widget flutuante de preview de stats
 * 
 * Exibe os stats derivados do personagem com breakdown detalhado
 * mostrando a origem de cada valor (base + atributo + NEX)
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Zap, Brain, Shield, Footprints, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { CLASSES } from '@/lib/character-data';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StatsPreviewWidgetProps {
  hp: number | null;
  pe: number | null;
  san: number | null;
  defense: number;
  movement: number;
  characterClass?: string;
  show?: boolean;
  // Props opcionais para breakdown detalhado
  vigor?: number;
  presence?: number;
  agility?: number;
  nex?: number;
  originId?: string;
}

// Calcular breakdown de PV
function getHpBreakdown(classId: string, vigor: number, nex: number) {
  const classData = CLASSES.find(c => c.id === classId);
  if (!classData) return null;
  
  const nexMultiplier = Math.max(0, Math.floor(nex / 5) - 1);
  const baseHp = classData.pvBase;
  const fromVigor = vigor;
  const fromNex = nexMultiplier * (classData.pvPerNex + vigor);
  
  return { base: baseHp, fromVigor, fromNex, formula: `${baseHp} + ${vigor} + ${nexMultiplier}×(${classData.pvPerNex}+${vigor})` };
}

// Calcular breakdown de PE
function getPeBreakdown(classId: string, presence: number, nex: number) {
  const classData = CLASSES.find(c => c.id === classId);
  if (!classData) return null;
  
  const nexMultiplier = Math.max(0, Math.floor(nex / 5) - 1);
  const basePe = classData.peBase;
  const fromPresence = presence;
  const fromNex = nexMultiplier * (classData.pePerNex + presence);
  
  return { base: basePe, fromPresence, fromNex, formula: `${basePe} + ${presence} + ${nexMultiplier}×(${classData.pePerNex}+${presence})` };
}

// Calcular breakdown de SAN
function getSanBreakdown(classId: string, nex: number, originId?: string) {
  const classData = CLASSES.find(c => c.id === classId);
  if (!classData) return null;
  
  const nexMultiplier = Math.max(0, Math.floor(nex / 5) - 1);
  const baseSan = classData.sanBase;
  const fromNex = nexMultiplier * classData.sanPerNex;
  const originMod = originId === 'cultista-arrependido' ? -5 : 0;
  
  return { base: baseSan, fromNex, originMod, formula: `${baseSan} + ${nexMultiplier}×${classData.sanPerNex}${originMod ? ` ${originMod}` : ''}` };
}

export function StatsPreviewWidget({
  hp,
  pe,
  san,
  defense,
  movement,
  characterClass,
  show = true,
  vigor = 1,
  presence = 1,
  agility = 1,
  nex = 5,
  originId,
}: StatsPreviewWidgetProps) {
  const [expanded, setExpanded] = useState(false);
  
  const classColors = {
    Combatente: 'from-destructive/20 to-destructive/5 border-destructive/30',
    Especialista: 'from-secondary/20 to-secondary/5 border-secondary/30',
    Ocultista: 'from-paranormal/20 to-paranormal/5 border-paranormal/30',
  };

  const bgClass = characterClass 
    ? classColors[characterClass as keyof typeof classColors] 
    : 'from-primary/20 to-primary/5 border-primary/30';

  // Calcular breakdowns
  const hpBreakdown = characterClass ? getHpBreakdown(characterClass, vigor, nex) : null;
  const peBreakdown = characterClass ? getPeBreakdown(characterClass, presence, nex) : null;
  const sanBreakdown = characterClass ? getSanBreakdown(characterClass, nex, originId) : null;

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
          <TooltipProvider>
            <div className={cn(
              'ordo-panel p-4 bg-gradient-to-b border-2 transition-all duration-300',
              bgClass,
              expanded ? 'w-64' : 'w-auto'
            )}>
              {/* Header com toggle */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground font-display tracking-wider">
                  PREVIEW
                </p>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="p-1 rounded hover:bg-muted/50 transition-colors"
                >
                  {expanded ? (
                    <ChevronUp className="w-3 h-3 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  )}
                </button>
              </div>
              
              <div className="space-y-3">
                {/* PV - só mostra se tem classe com animação de entrada */}
                <AnimatePresence>
                  {hp !== null && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: 20 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30, delay: 0 }}
                    >
                      <StatItemWithBreakdown 
                        icon={Heart} 
                        label="PV" 
                        value={hp} 
                        color="text-destructive"
                        expanded={expanded}
                        isNew={true}
                        breakdown={hpBreakdown ? [
                          { label: 'Base Classe', value: hpBreakdown.base },
                          { label: 'Vigor', value: hpBreakdown.fromVigor, prefix: '+' },
                          { label: 'Progressão NEX', value: hpBreakdown.fromNex, prefix: '+' },
                        ] : undefined}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* PE - só mostra se tem classe com animação de entrada */}
                <AnimatePresence>
                  {pe !== null && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: 20 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30, delay: 0.1 }}
                    >
                      <StatItemWithBreakdown 
                        icon={Zap} 
                        label="PE" 
                        value={pe} 
                        color="text-pe"
                        expanded={expanded}
                        isNew={true}
                        breakdown={peBreakdown ? [
                          { label: 'Base Classe', value: peBreakdown.base },
                          { label: 'Presença', value: peBreakdown.fromPresence, prefix: '+' },
                          { label: 'Progressão NEX', value: peBreakdown.fromNex, prefix: '+' },
                        ] : undefined}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* SAN - só mostra se tem classe com animação de entrada */}
                <AnimatePresence>
                  {san !== null && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: 20 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30, delay: 0.2 }}
                    >
                      <StatItemWithBreakdown 
                        icon={Brain} 
                        label="SAN" 
                        value={san} 
                        color="text-paranormal"
                        expanded={expanded}
                        isNew={true}
                        breakdown={sanBreakdown ? [
                          { label: 'Base Classe', value: sanBreakdown.base },
                          { label: 'Progressão NEX', value: sanBreakdown.fromNex, prefix: '+' },
                          ...(sanBreakdown.originMod !== 0 ? [{ label: 'Origem', value: sanBreakdown.originMod }] : []),
                        ] : undefined}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Separador só aparece se tem stats de classe */}
                <AnimatePresence>
                  {hp !== null && (
                    <motion.div 
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      transition={{ delay: 0.3 }}
                      className="h-px bg-border my-2 origin-left"
                    />
                  )}
                </AnimatePresence>
                
                {/* DEF */}
                <StatItemWithBreakdown 
                  icon={Shield} 
                  label="DEF" 
                  value={defense} 
                  color="text-primary"
                  expanded={expanded}
                  breakdown={[
                    { label: 'Base', value: 10 },
                    { label: 'Agilidade', value: agility, prefix: '+' },
                  ]}
                />
                
                {/* MOV */}
                <StatItemWithBreakdown 
                  icon={Footprints} 
                  label="MOV" 
                  value={`${movement}m`} 
                  color="text-muted-foreground"
                  expanded={expanded}
                  breakdown={[
                    { label: 'Base', value: 9 },
                    ...(originId === 'atleta' ? [{ label: 'Atleta', value: 3, prefix: '+' }] : []),
                  ]}
                />
              </div>
              
              {/* Legenda quando expandido */}
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-border"
                  >
                    <p className="text-xs text-muted-foreground text-center italic">
                      Clique para ver o detalhamento
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </TooltipProvider>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Componente de item de stat com breakdown
interface BreakdownItem {
  label: string;
  value: number | string;
  prefix?: string;
}

interface StatItemWithBreakdownProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  expanded: boolean;
  breakdown?: BreakdownItem[];
  isNew?: boolean; // Indica se o stat acabou de aparecer (para efeito pulse)
}

function StatItemWithBreakdown({ 
  icon: Icon, 
  label, 
  value, 
  color, 
  expanded,
  breakdown,
  isNew = false
}: StatItemWithBreakdownProps) {
  if (!expanded) {
    // Modo compacto - apenas valor com tooltip
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-2 cursor-help rounded-md px-1 -mx-1 transition-colors",
            isNew && "animate-pulse"
          )}>
            <Icon className={cn('w-4 h-4', color, isNew && 'drop-shadow-[0_0_6px_currentColor]')} />
            <span className="text-xs text-muted-foreground w-8">{label}</span>
            <motion.span
              key={String(value)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className={cn('font-display text-lg', color, isNew && 'drop-shadow-[0_0_8px_currentColor]')}
            >
              {value}
            </motion.span>
          </div>
        </TooltipTrigger>
        {breakdown && breakdown.length > 0 && (
          <TooltipContent side="left" className="p-3">
            <div className="space-y-1">
              <p className="font-medium text-sm mb-2">{label} = {value}</p>
              {breakdown.map((item, idx) => (
                <div key={idx} className="flex justify-between gap-4 text-xs">
                  <span className="text-muted-foreground">{item.label}:</span>
                  <span className={color}>
                    {item.prefix || ''}{item.value}
                  </span>
                </div>
              ))}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    );
  }

  // Modo expandido - mostra breakdown inline
  return (
    <div className={cn("space-y-1", isNew && "animate-pulse")}>
      <div className="flex items-center gap-2">
        <Icon className={cn('w-4 h-4', color, isNew && 'drop-shadow-[0_0_6px_currentColor]')} />
        <span className="text-xs text-muted-foreground w-8">{label}</span>
        <motion.span
          key={String(value)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={cn('font-display text-lg', color, isNew && 'drop-shadow-[0_0_8px_currentColor]')}
        >
          {value}
        </motion.span>
      </div>
      
      {breakdown && breakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="ml-6 pl-2 border-l border-border/50 space-y-0.5"
        >
          {breakdown.map((item, idx) => (
            <div key={idx} className="flex justify-between text-xs">
              <span className="text-muted-foreground/70">{item.label}</span>
              <span className={cn('font-mono', color, 'opacity-80')}>
                {item.prefix || ''}{item.value}
              </span>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

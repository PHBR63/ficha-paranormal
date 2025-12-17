/**
 * RitualCard - Card de ritual para exibição na ficha de personagem
 * Mostra elemento, círculo, custo PE, descrição e aprimoramentos
 */

import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  Sparkles, 
  Clock, 
  Target, 
  Users, 
  Timer, 
  Shield,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Ritual } from '@/lib/rituals-data';
import { ELEMENT_CONFIG, getElementConfig } from '@/lib/element-config';

interface RitualCardProps {
  ritual: Ritual;
  isNonOccultist?: boolean;
  onCast: (ritual: Ritual) => void;
  peCurrent?: number;
}

export const RitualCard = memo(function RitualCard({ ritual, isNonOccultist = false, onCast, peCurrent }: RitualCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Obtém configuração visual do elemento
  const elementConfig = getElementConfig(ritual.element);
  const ElementIcon = elementConfig?.icon || Sparkles;
  
  // Calcula custo real (×2 para não-ocultistas)
  const baseCost = ritual.cost;
  const actualCost = isNonOccultist ? baseCost * 2 : baseCost;
  const canAfford = peCurrent === undefined || peCurrent >= actualCost;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "rounded-lg border transition-all duration-200",
          elementConfig?.border || "border-border",
          elementConfig?.bg || "bg-card/50",
          isOpen && "shadow-lg",
          elementConfig && isOpen && elementConfig.glow
        )}
      >
        {/* Header clicável */}
        <CollapsibleTrigger asChild>
          <button className="w-full p-3 flex items-center gap-3 text-left hover:bg-accent/5 transition-colors rounded-t-lg">
            {/* Ícone do elemento */}
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
              elementConfig?.bg || "bg-muted",
              elementConfig?.border || "border-border",
              "border"
            )}>
              <ElementIcon className={cn("w-5 h-5", elementConfig?.text || "text-muted-foreground")} />
            </div>
            
            {/* Nome e info básica */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className={cn(
                  "font-display text-sm tracking-wide truncate",
                  elementConfig?.text || "text-foreground"
                )}>
                  {ritual.name}
                </h4>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[10px] px-1.5 py-0",
                    elementConfig?.badgeBg || "bg-muted text-muted-foreground"
                  )}
                >
                  {ritual.circle}º Círculo
                </Badge>
              </div>
              
              {/* Info compacta */}
              <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {ritual.execution}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {ritual.range}
                </span>
              </div>
            </div>
            
            {/* Custo PE */}
            <div className="flex items-center gap-2">
              <div className={cn(
                "px-2 py-1 rounded-md text-center",
                canAfford ? "bg-pe/20 text-pe" : "bg-destructive/20 text-destructive"
              )}>
                <span className="text-xs font-bold">{actualCost}</span>
                <span className="text-[10px] ml-0.5">PE</span>
                {isNonOccultist && (
                  <span className="text-[8px] block text-yellow-400">×2</span>
                )}
              </div>
              
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180"
              )} />
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Conteúdo expandido */}
        <CollapsibleContent>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-3 pb-3 space-y-3"
              >
                {/* Divisor */}
                <div className={cn("h-px", elementConfig?.bg || "bg-border")} />
                
                {/* Descrição */}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {ritual.description}
                </p>
                
                {/* Detalhes técnicos */}
                <div className="grid grid-cols-2 gap-2">
                  {ritual.target && (
                    <DetailItem 
                      icon={Users} 
                      label="Alvo" 
                      value={ritual.target} 
                      elementConfig={elementConfig}
                    />
                  )}
                  {ritual.area && (
                    <DetailItem 
                      icon={Target} 
                      label="Área" 
                      value={ritual.area}
                      elementConfig={elementConfig}
                    />
                  )}
                  {ritual.duration && (
                    <DetailItem 
                      icon={Timer} 
                      label="Duração" 
                      value={ritual.duration}
                      elementConfig={elementConfig}
                    />
                  )}
                  {ritual.resistance && (
                    <DetailItem 
                      icon={Shield} 
                      label="Resistência" 
                      value={ritual.resistance}
                      elementConfig={elementConfig}
                    />
                  )}
                </div>

                {/* Aprimoramentos */}
                {ritual.enhancements && ritual.enhancements.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                      Aprimoramentos
                    </p>
                    {ritual.enhancements.map((enh, i) => {
                      const enhCost = isNonOccultist ? enh.cost * 2 : enh.cost;
                      const totalCost = actualCost + enhCost;
                      const canAffordEnh = peCurrent === undefined || peCurrent >= totalCost;
                      
                      return (
                        <div 
                          key={i} 
                          className={cn(
                            "p-2 rounded-lg border text-xs",
                            "bg-card/30 border-border/50"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className={cn("font-medium", elementConfig?.text)}>
                              {enh.name}
                            </span>
                            <span className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded",
                              canAffordEnh ? "bg-pe/20 text-pe" : "bg-destructive/20 text-destructive"
                            )}>
                              +{enhCost} PE
                            </span>
                          </div>
                          <p className="text-muted-foreground mt-1">{enh.description}</p>
                          {enh.requirements && (
                            <p className="text-[10px] text-yellow-400/80 mt-1">
                              ⚠️ {enh.requirements}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Botão de conjurar */}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canAfford}
                  onClick={() => onCast(ritual)}
                  className={cn(
                    "w-full mt-2",
                    elementConfig?.border,
                    elementConfig?.text,
                    "hover:bg-accent/10"
                  )}
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Conjurar ({actualCost} PE)
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CollapsibleContent>
      </motion.div>
    </Collapsible>
  );
});

// Componente auxiliar para itens de detalhe
interface DetailItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  elementConfig: ReturnType<typeof getElementConfig>;
}

function DetailItem({ icon: Icon, label, value, elementConfig }: DetailItemProps) {
  return (
    <div className="p-2 rounded-lg bg-card/30 border border-border/50">
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-0.5">
        <Icon className={cn("w-3 h-3", elementConfig?.text)} />
        {label}
      </div>
      <p className="text-xs font-medium truncate">{value}</p>
    </div>
  );
}

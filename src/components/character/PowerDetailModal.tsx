/**
 * PowerDetailModal - Modal para exibir detalhes de poderes e habilidades
 * Usada na versão mobile para mostrar descrições completas
 */

import {
  MobileModal,
  MobileModalContent,
  MobileModalBody,
  MobileModalFooter,
} from '@/components/ui/mobile-modal';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Zap, User, Scroll, BookOpen, Info, Play } from '@/components/icons/ordem-icons';
import { cn } from '@/lib/utils';
import { getBasePowerReference } from '@/lib/class-powers/base-power-reference';

// Tipos de poderes suportados
export type PowerType = 'ability' | 'paranormal' | 'general' | 'origin' | 'ritual';

// Interface para os dados do poder
export interface PowerDetailData {
  type: PowerType;
  name: string;
  description?: string;
  element?: string;
  category?: string;
  circle?: number;
  execution?: string;
  range?: string;
  target?: string;
  duration?: string;
  resistance?: string;
  cost?: string;
}

interface PowerDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  power: PowerDetailData | null;
  // Callback opcional para conjurar ritual
  onCastRitual?: (ritualId: string) => void;
}

// Configurações visuais por tipo de poder
const powerTypeConfig: Record<PowerType, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}> = {
  ability: {
    icon: Sparkles,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
    label: 'Habilidade de Classe',
  },
  paranormal: {
    icon: Zap,
    color: 'text-paranormal',
    bgColor: 'bg-paranormal/10',
    borderColor: 'border-paranormal/30',
    label: 'Poder Paranormal',
  },
  general: {
    icon: BookOpen,
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
    label: 'Poder Geral',
  },
  origin: {
    icon: User,
    color: 'text-detail-accent',
    bgColor: 'bg-secondary/10',
    borderColor: 'border-secondary/30',
    label: 'Poder de Origem',
  },
  ritual: {
    icon: Scroll,
    color: 'text-paranormal',
    bgColor: 'bg-paranormal/10',
    borderColor: 'border-paranormal/30',
    label: 'Ritual',
  },
};

// Usa config centralizado de elementos em src/lib/element-config.ts
import { getElementConfig } from '@/lib/element-config';

export function PowerDetailModal({ open, onOpenChange, power, onCastRitual }: PowerDetailModalProps) {
  if (!power) return null;

  const config = powerTypeConfig[power.type];
  const Icon = config.icon;
  
  // Obtém configuração do elemento via função centralizada
  const elementConfig = power.element ? getElementConfig(power.element) : null;

  // Handler para conjurar o ritual
  const handleCast = () => {
    if (power.type === 'ritual' && onCastRitual) {
      onCastRitual(power.name);
      onOpenChange(false);
    }
  };

  return (
    <MobileModal open={open} onOpenChange={onOpenChange}>
      <MobileModalContent size="sm" className="p-0 overflow-hidden">
        {/* Header colorido customizado */}
        <div className={cn(
          "p-4 border-b",
          config.bgColor,
          config.borderColor
        )}>
          <DialogHeader>
            <div className="flex items-start gap-3">
              {/* Ícone principal */}
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                config.bgColor,
                "border",
                config.borderColor
              )}>
                {(power.type === 'paranormal' || power.type === 'ritual') && elementConfig ? (
                  <elementConfig.icon className="h-8 w-8" aria-label={elementConfig.label} />
                ) : (
                  <Icon className={cn("w-6 h-6", config.color)} />
                )}
              </div>
              
              {/* Título e badges */}
              <div className="flex-1 min-w-0">
                <DialogTitle className={cn("text-lg font-display tracking-wider", config.color)}>
                  {power.name}
                </DialogTitle>
                {power.type === 'ability' && <p className="text-xs text-muted-foreground">{getBasePowerReference(power.name)}</p>}
                
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className={cn("text-[10px]", config.color, config.borderColor)}>
                    {config.label}
                  </Badge>
                  
                  {power.element && (
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px] capitalize",
                        elementConfig?.text,
                        elementConfig?.bg
                      )}
                    >
                      {power.element}
                    </Badge>
                  )}
                  
                  {power.category && (
                    <Badge variant="outline" className="text-[10px] bg-muted/50">
                      {power.category}
                    </Badge>
                  )}
                  
                  {power.circle && (
                    <Badge variant="outline" className="text-[10px] text-paranormal border-paranormal/50">
                      {power.circle}º Círculo
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Conteúdo scrollável - Padrão do projeto: calc() ao invés de vh puro */}
        <MobileModalBody maxHeight="calc(85vh - 200px)">
          <div className="space-y-4">
            {/* Descrição principal */}
            {power.description && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Descrição
                </h4>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {power.description}
                </p>
              </div>
            )}

            {/* Detalhes de rituais */}
            {power.type === 'ritual' && (
              <div className="grid grid-cols-2 gap-3">
                {power.execution && (
                  <DetailItem label="Execução" value={power.execution} />
                )}
                {power.range && (
                  <DetailItem label="Alcance" value={power.range} />
                )}
                {power.target && (
                  <DetailItem label="Alvo" value={power.target} />
                )}
                {power.duration && (
                  <DetailItem label="Duração" value={power.duration} />
                )}
                {power.resistance && (
                  <DetailItem label="Resistência" value={power.resistance} />
                )}
                {power.cost && (
                  <DetailItem label="Custo" value={power.cost} />
                )}
              </div>
            )}

            {/* Dica de uso */}
            {!power.description && (
              <div className="text-center py-6 text-muted-foreground">
                <Info className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sem descrição detalhada disponível.</p>
              </div>
            )}
          </div>
        </MobileModalBody>
            
        {/* Footer só aparece se for ritual com onCastRitual */}
        {power.type === 'ritual' && onCastRitual && (
          <MobileModalFooter bordered>
            <Button 
              onClick={handleCast}
              className="w-full bg-paranormal hover:bg-paranormal/90 text-white"
            >
              <Play className="w-4 h-4 mr-2" />
              Conjurar Ritual
            </Button>
          </MobileModalFooter>
        )}
      </MobileModalContent>
    </MobileModal>
  );
}

// Componente auxiliar para itens de detalhes
function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded-lg bg-muted/30 border border-border">
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

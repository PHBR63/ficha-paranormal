/**
 * Modal para selecionar elemento de resistência
 * Usado pelo poder paranormal "Resistir a Elemento"
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Check, Droplet, Skull, BookOpen, Zap } from 'lucide-react';
import { ParanormalElement, ELEMENT_LABELS, ELEMENT_COLORS, ELEMENT_BG_COLORS } from '@/lib/paranormal-powers';

// Ícones por elemento
const ELEMENT_ICONS: Record<ParanormalElement, React.ComponentType<{ className?: string }>> = {
  sangue: Droplet,
  morte: Skull,
  conhecimento: BookOpen,
  energia: Zap,
};

// Descrições dos tipos de dano por elemento
const ELEMENT_DAMAGE_DESCRIPTIONS: Record<ParanormalElement, string> = {
  sangue: 'Reduz dano de rituais e criaturas de Sangue (dano físico paranormal, hemorragias).',
  morte: 'Reduz dano de rituais e criaturas de Morte (necrose, frio sobrenatural, dreno vital).',
  conhecimento: 'Reduz dano de rituais e criaturas de Conhecimento (psíquico, ilusões que causam dano).',
  energia: 'Reduz dano de rituais e criaturas de Energia (elétrico, fogo paranormal, entropia).',
};

interface ElementResistanceSelectModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (element: ParanormalElement) => void;
  alreadyResistant?: ParanormalElement[]; // Elementos já com resistência
}

export function ElementResistanceSelectModal({
  open,
  onClose,
  onConfirm,
  alreadyResistant = [],
}: ElementResistanceSelectModalProps) {
  const [selectedElement, setSelectedElement] = useState<ParanormalElement | null>(null);
  
  const availableElements = (['sangue', 'morte', 'conhecimento', 'energia'] as ParanormalElement[])
    .filter(el => !alreadyResistant.includes(el));
  
  const handleConfirm = () => {
    if (selectedElement) {
      onConfirm(selectedElement);
      setSelectedElement(null);
    }
  };
  
  const handleClose = () => {
    setSelectedElement(null);
    onClose();
  };
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg tracking-wider flex items-center gap-2">
            <Shield className="w-5 h-5 text-paranormal" />
            RESISTIR A ELEMENTO
          </DialogTitle>
          <DialogDescription>
            Escolha um elemento paranormal para ganhar Resistência 5.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-3 py-4">
          {availableElements.map(element => {
            const Icon = ELEMENT_ICONS[element];
            const isSelected = selectedElement === element;
            const colorClass = ELEMENT_COLORS[element];
            const bgClass = ELEMENT_BG_COLORS[element];
            
            return (
              <Card
                key={element}
                onClick={() => setSelectedElement(element)}
                className={`
                  cursor-pointer transition-all duration-200
                  ${isSelected 
                    ? 'ring-2 ring-primary border-primary bg-primary/10' 
                    : 'hover:border-primary/50 hover:bg-muted/50'
                  }
                `}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded ${bgClass}`}>
                        <Icon className={`h-4 w-4 ${colorClass}`} />
                      </div>
                      <CardTitle className="text-sm">{ELEMENT_LABELS[element]}</CardTitle>
                    </div>
                    {isSelected && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs">
                    {ELEMENT_DAMAGE_DESCRIPTIONS[element]}
                  </CardDescription>
                  <Badge variant="outline" className={`mt-2 text-xs ${colorClass}`}>
                    Resistência 5
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {alreadyResistant.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Já resistente a: {alreadyResistant.map(el => ELEMENT_LABELS[el]).join(', ')}
          </div>
        )}
        
        {availableElements.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            Você já possui resistência a todos os elementos.
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedElement}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Seletor de Afinidade Elemental
 * Exibido para personagens NEX 50%+ que ainda não escolheram afinidade
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Droplet, Skull, BookOpen, Zap, Check, Loader2 } from 'lucide-react';
import {
  ParanormalElement,
  ELEMENT_LABELS,
  ELEMENT_COLORS,
  ELEMENT_BG_COLORS,
  AFFINITY_DESCRIPTIONS,
} from '@/lib/paranormal-powers';

// Ícones por elemento
const AFFINITY_ICONS: Record<ParanormalElement, React.ComponentType<{ className?: string }>> = {
  sangue: Droplet,
  morte: Skull,
  conhecimento: BookOpen,
  energia: Zap,
};

interface AffinitySelectorCardProps {
  nex: number;
  onSelectAffinity: (element: ParanormalElement) => Promise<void>;
}

export function AffinitySelectorCard({ nex, onSelectAffinity }: AffinitySelectorCardProps) {
  const [selectedElement, setSelectedElement] = useState<ParanormalElement | null>(null);
  const [saving, setSaving] = useState(false);

  // Só exibe se NEX >= 50
  if (nex < 50) return null;

  const handleConfirm = async () => {
    if (!selectedElement) return;
    
    setSaving(true);
    try {
      await onSelectAffinity(selectedElement);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sheet-panel p-4 border-2 border-paranormal/50 bg-paranormal/5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-paranormal" />
        <h3 className="font-display text-lg tracking-wider text-paranormal">
          AFINIDADE ELEMENTAL
        </h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Ao atingir NEX 50%, você desenvolve uma conexão profunda com um dos elementos paranormais.
        Escolha sua afinidade — poderes desse elemento terão efeitos aprimorados!
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {(['sangue', 'morte', 'conhecimento', 'energia'] as ParanormalElement[]).map((element) => {
          const Icon = AFFINITY_ICONS[element];
          const isSelected = selectedElement === element;
          const colorClass = ELEMENT_COLORS[element];
          const bgClass = ELEMENT_BG_COLORS[element];

          return (
            <Card
              key={element}
              className={`
                cursor-pointer transition-all duration-200
                ${isSelected 
                  ? 'ring-2 ring-paranormal border-paranormal bg-paranormal/10' 
                  : 'hover:border-paranormal/50 hover:bg-muted/50'
                }
              `}
              onClick={() => setSelectedElement(element)}
            >
              <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${bgClass}`}>
                      <Icon className={`h-4 w-4 ${colorClass}`} />
                    </div>
                    <CardTitle className="text-sm">{ELEMENT_LABELS[element]}</CardTitle>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-paranormal" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <CardDescription className="text-xs line-clamp-2">
                  {AFFINITY_DESCRIPTIONS[element]}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {selectedElement 
            ? `Você escolheu: ${ELEMENT_LABELS[selectedElement]}`
            : 'Selecione um elemento acima'
          }
        </p>
        <Button
          onClick={handleConfirm}
          disabled={!selectedElement || saving}
          className="bg-paranormal hover:bg-paranormal/90"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          Confirmar Afinidade
        </Button>
      </div>
    </motion.div>
  );
}

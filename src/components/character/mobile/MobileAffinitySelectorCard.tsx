/**
 * MobileAffinitySelectorCard - Seletor de afinidade elemental para mobile
 * Exibido para personagens NEX 50%+ que ainda não escolheram afinidade
 */

import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, 
  Droplet, 
  Skull, 
  BookOpen, 
  Zap, 
  Check, 
  Loader2, 
  Info,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  ParanormalElement,
  ELEMENT_LABELS,
  ELEMENT_COLORS,
  ELEMENT_BG_COLORS,
  AFFINITY_DESCRIPTIONS,
  getPowersByElement,
} from '@/lib/paranormal-powers';

// Ícones por elemento
const AFFINITY_ICONS: Record<ParanormalElement, React.ComponentType<{ className?: string }>> = {
  sangue: Droplet,
  morte: Skull,
  conhecimento: BookOpen,
  energia: Zap,
};

// Descrições detalhadas
const AFFINITY_DETAILED: Record<ParanormalElement, string> = {
  sangue: 'Conecta você às forças vitais. Seus poderes de Sangue se tornam mais potentes, amplificando resistência e regeneração.',
  morte: 'Permite conexão com energias de entropia. Seus poderes de Morte são mais devastadores e duradouros.',
  conhecimento: 'Expande sua percepção além do véu. Seus poderes revelam verdades ocultas com maior clareza.',
  energia: 'Sincroniza você com forças do caos. Seus poderes manipulam o acaso com maior precisão.',
};

interface MobileAffinitySelectorCardProps {
  nex: number;
  onSelectAffinity: (element: ParanormalElement) => Promise<void>;
  className?: string;
}

export const MobileAffinitySelectorCard = memo(function MobileAffinitySelectorCard({
  nex,
  onSelectAffinity,
  className,
}: MobileAffinitySelectorCardProps) {
  const [selectedElement, setSelectedElement] = useState<ParanormalElement | null>(null);
  const [detailElement, setDetailElement] = useState<ParanormalElement | null>(null);
  const [saving, setSaving] = useState(false);

  // Só exibe se NEX >= 50
  if (nex < 50) return null;

  const handleConfirm = async () => {
    if (!selectedElement) return;
    
    setSaving(true);
    try {
      // Feedback háptico
      if ('vibrate' in navigator) navigator.vibrate(30);
      
      await onSelectAffinity(selectedElement);
      
      // Toast de sucesso após confirmação
      toast({
        title: "Afinidade Confirmada!",
        description: `Você agora possui afinidade com ${ELEMENT_LABELS[selectedElement]}. Seus poderes deste elemento estão aprimorados!`,
      });
    } catch (error) {
      console.error('Erro ao selecionar afinidade:', error);
      
      // Toast de erro com detalhes
      toast({
        title: "Erro ao Confirmar Afinidade",
        description: error instanceof Error ? error.message : "Não foi possível salvar sua escolha. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const elements: ParanormalElement[] = ['sangue', 'morte', 'conhecimento', 'energia'];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "ordo-panel p-4 border-2 border-paranormal/50 bg-paranormal/5",
          className
        )}
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-paranormal" />
          <h3 className="font-display text-base tracking-wider text-paranormal">
            AFINIDADE ELEMENTAL
          </h3>
        </div>
        
        <p className="text-xs text-muted-foreground mb-4">
          Ao atingir NEX 50%, escolha sua afinidade — poderes desse elemento terão efeitos aprimorados!
        </p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {elements.map((element) => {
            const Icon = AFFINITY_ICONS[element];
            const isSelected = selectedElement === element;
            const colorClass = ELEMENT_COLORS[element];
            const bgClass = ELEMENT_BG_COLORS[element];
            const powers = getPowersByElement(element);

            return (
              <button
                key={element}
                className={cn(
                  "p-3 rounded-lg border text-left transition-all active:scale-[0.98]",
                  isSelected 
                    ? "ring-2 ring-paranormal border-paranormal bg-paranormal/10" 
                    : "border-border hover:border-paranormal/50 bg-muted/30"
                )}
                onClick={() => setSelectedElement(element)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={cn("p-1.5 rounded", bgClass)}>
                    <Icon className={cn("h-4 w-4", colorClass)} />
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-paranormal" />
                  )}
                </div>
                
                <h4 className="font-medium text-sm">{ELEMENT_LABELS[element]}</h4>
                <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">
                  {AFFINITY_DESCRIPTIONS[element]}
                </p>
                
                <div className="flex items-center justify-between mt-2">
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                    {powers.length} poderes
                  </Badge>
                  <button
                    className="text-[9px] text-paranormal flex items-center gap-0.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailElement(element);
                    }}
                  >
                    <Info className="w-3 h-3" />
                    Ver
                  </button>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {selectedElement 
              ? `${ELEMENT_LABELS[selectedElement]} selecionado`
              : 'Selecione um elemento'
            }
          </p>
          <Button
            onClick={handleConfirm}
            disabled={!selectedElement || saving}
            className="bg-paranormal hover:bg-paranormal/90"
            size="sm"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <Sparkles className="w-4 h-4 mr-1" />
            )}
            Confirmar
          </Button>
        </div>
      </motion.div>

      {/* Sheet de detalhes */}
      <Sheet open={!!detailElement} onOpenChange={(open) => !open && setDetailElement(null)}>
        <SheetContent side="bottom" className="h-[75vh]">
          {detailElement && (
            <>
              <SheetHeader className="pb-4">
                <SheetTitle className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', ELEMENT_BG_COLORS[detailElement])}>
                    {(() => {
                      const Icon = AFFINITY_ICONS[detailElement];
                      return <Icon className={cn('h-5 w-5', ELEMENT_COLORS[detailElement])} />;
                    })()}
                  </div>
                  Afinidade: {ELEMENT_LABELS[detailElement]}
                </SheetTitle>
              </SheetHeader>

              <ScrollArea className="h-[calc(75vh-180px)]">
                <div className="space-y-4 pr-4">
                  {/* Descrição */}
                  <div className="p-3 rounded-lg bg-paranormal/10 border border-paranormal/30">
                    <p className="text-sm">{AFFINITY_DETAILED[detailElement]}</p>
                  </div>

                  {/* Lista de Poderes */}
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-paranormal" />
                      Poderes Beneficiados
                    </h4>
                    
                    <div className="space-y-2">
                      {getPowersByElement(detailElement).map((power) => (
                        <div
                          key={power.id}
                          className="p-3 rounded-lg bg-secondary/50 border border-border"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium text-sm">{power.name}</h5>
                            {power.prerequisite && (
                              <Badge variant="outline" className="text-[9px]">
                                Requer {power.prerequisite.count}
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground">{power.description}</p>
                          {power.affinityEffect && (
                            <div className="flex items-start gap-2 p-2 mt-2 rounded bg-paranormal/10 border border-paranormal/30">
                              <Sparkles className="w-3 h-3 text-paranormal shrink-0 mt-0.5" />
                              <p className="text-[10px] text-paranormal font-medium">{power.affinityEffect}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="pt-4 flex gap-2">
                <Button variant="outline" className="flex-1 h-10" onClick={() => setDetailElement(null)}>
                  <span className="text-sm">Fechar</span>
                </Button>
                <Button
                  className="flex-1 h-10 bg-paranormal hover:bg-paranormal/90"
                  onClick={() => {
                    setSelectedElement(detailElement);
                    setDetailElement(null);
                  }}
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  <span className="text-sm">Escolher</span>
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
});

export default MobileAffinitySelectorCard;

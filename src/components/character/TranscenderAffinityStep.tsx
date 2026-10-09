import { ConhecimentoSymbol, EnergiaSymbol, MorteSymbol, SangueSymbol } from '@/components/icons/element-symbols';
/**
 * TranscenderAffinityStep - Passo de seleção de afinidade elemental no fluxo de Transcender
 * 
 * Exibido quando:
 * 1. O personagem está usando Transcender
 * 2. NEX atual ou alvo >= 50%
 * 3. Ainda não possui afinidade elemental
 * 
 * Após a seleção, a afinidade é passada para o ParanormalPowerSelectModal
 * para que o jogador já receba os benefícios de afinidade na escolha do poder.
 */

import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import {
  MobileModal,
  MobileModalContent,
  MobileModalHeader,
  MobileModalBody,
  MobileModalFooter,
  MobileModalTitle,
  MobileModalDescription,
} from '@/components/ui/mobile-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CustomScroll } from '@/components/ui/custom-scroll';
import { Sparkles, Check, ChevronRight, Info } from '@/components/icons/ordem-icons';
import { cn } from '@/lib/utils';
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
  sangue: SangueSymbol,
  morte: MorteSymbol,
  conhecimento: ConhecimentoSymbol,
  energia: EnergiaSymbol,
};

// Descrições detalhadas dos benefícios de afinidade
const AFFINITY_BENEFITS: Record<ParanormalElement, string[]> = {
  sangue: [
    'Poderes de Sangue têm efeitos aprimorados',
    'Pode escolher o mesmo poder de Sangue uma segunda vez',
    'Resistência e vitalidade amplificadas',
  ],
  morte: [
    'Poderes de Morte têm efeitos aprimorados',
    'Pode escolher o mesmo poder de Morte uma segunda vez',
    'Controle sobre energias entrópicas',
  ],
  conhecimento: [
    'Poderes de Conhecimento têm efeitos aprimorados',
    'Pode escolher o mesmo poder de Conhecimento uma segunda vez',
    'Percepção expandida além do véu',
  ],
  energia: [
    'Poderes de Energia têm efeitos aprimorados',
    'Pode escolher o mesmo poder de Energia uma segunda vez',
    'Manipulação precisa do acaso',
  ],
};

interface TranscenderAffinityStepProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAffinity: (element: ParanormalElement) => void;
  onSkip?: () => void;
  targetNex: number;
  /** Indica se está em transição para o próximo modal */
  isTransitioning?: boolean;
}

export const TranscenderAffinityStep = memo(function TranscenderAffinityStep({
  open,
  onOpenChange,
  onSelectAffinity,
  onSkip,
  targetNex,
  isTransitioning = false,
}: TranscenderAffinityStepProps) {
  const [selectedElement, setSelectedElement] = useState<ParanormalElement | null>(null);
  const [showDetails, setShowDetails] = useState<ParanormalElement | null>(null);

  const elements: ParanormalElement[] = ['sangue', 'morte', 'conhecimento', 'energia'];

  // Handler para confirmar seleção
  const handleConfirm = () => {
    if (selectedElement) {
      onSelectAffinity(selectedElement);
    }
  };

  return (
    <MobileModal open={open} onOpenChange={onOpenChange}>
      <MobileModalContent className="max-w-lg">
        <motion.div
          initial={{ opacity: 1, scale: 1 }}
          animate={{ 
            opacity: isTransitioning ? 0 : 1, 
            scale: isTransitioning ? 0.95 : 1,
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
        <MobileModalHeader>
          <MobileModalTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-paranormal" />
            Afinidade Elemental
          </MobileModalTitle>
          <MobileModalDescription>
            Ao atingir NEX {targetNex}% e usar Transcender, você deve escolher sua afinidade elemental.
            Esta escolha é permanente e aprimora seus poderes do elemento escolhido.
          </MobileModalDescription>
        </MobileModalHeader>

        <MobileModalBody className="py-4">
          <CustomScroll maxHeight="calc(60vh - 180px)">
            <div className="space-y-3 pr-2">
              {/* Cards de seleção de elemento */}
              {elements.map((element) => {
                const Icon = AFFINITY_ICONS[element];
                const isSelected = selectedElement === element;
                const isShowingDetails = showDetails === element;
                const colorClass = ELEMENT_COLORS[element];
                const bgClass = ELEMENT_BG_COLORS[element];
                const powers = getPowersByElement(element);
                const benefits = AFFINITY_BENEFITS[element];

                return (
                  <motion.div
                    key={element}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: elements.indexOf(element) * 0.05 }}
                  >
                    <button
                      type="button"
                      className={cn(
                        "w-full p-4 rounded-lg border text-left transition-all",
                        "hover:border-paranormal/50 active:scale-[0.99]",
                        isSelected 
                          ? "ring-2 ring-paranormal border-paranormal bg-paranormal/10" 
                          : "border-border bg-card"
                      )}
                      onClick={() => setSelectedElement(element)}
                    >
                      {/* Cabeçalho do card */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", bgClass)}>
                            <Icon className={cn("h-5 w-5", colorClass)} />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">
                              {ELEMENT_LABELS[element]}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {powers.length} poderes disponíveis
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-5 w-5 text-paranormal" />
                        )}
                      </div>

                      {/* Descrição curta */}
                      <p className="text-sm text-muted-foreground mb-3">
                        {AFFINITY_DESCRIPTIONS[element]}
                      </p>

                      {/* Botão para ver benefícios */}
                      <button
                        type="button"
                        className="flex items-center gap-1 text-xs text-paranormal hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDetails(isShowingDetails ? null : element);
                        }}
                      >
                        <Info className="w-3 h-3" />
                        {isShowingDetails ? 'Ocultar benefícios' : 'Ver benefícios'}
                        <ChevronRight className={cn(
                          "w-3 h-3 transition-transform",
                          isShowingDetails && "rotate-90"
                        )} />
                      </button>

                      {/* Lista de benefícios (expandível) */}
                      {isShowingDetails && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 pt-3 border-t border-border"
                        >
                          <ul className="space-y-1.5">
                            {benefits.map((benefit, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs">
                                <Sparkles className="w-3 h-3 text-paranormal shrink-0 mt-0.5" />
                                <span className="text-foreground">{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </CustomScroll>

          {/* Aviso de permanência */}
          <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/30">
            <p className="text-xs text-warning flex items-start gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>
                <strong>Atenção:</strong> Esta escolha é permanente e não pode ser alterada posteriormente.
                Escolha com sabedoria!
              </span>
            </p>
          </div>
        </MobileModalBody>

        <MobileModalFooter className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-paranormal hover:bg-paranormal/90"
            disabled={!selectedElement}
            onClick={handleConfirm}
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            Confirmar Afinidade
          </Button>
        </MobileModalFooter>
        </motion.div>
      </MobileModalContent>
    </MobileModal>
  );
});

export default TranscenderAffinityStep;

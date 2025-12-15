/**
 * StepNex - Passo de seleção do NEX (Nível de Experiência)
 * 
 * Integrado com:
 * - NexSelector: Seleção visual do NEX
 * - NexBenefitsPanel: Painel de benefícios completo
 * - Comparação visual quando muda o NEX
 */

import { useState, useEffect } from 'react';
import { CharacterFormData } from '@/pages/CharacterCreate';
import { NexSelector } from './NexSelector';
import { NexBenefitsPanel } from './NexBenefitsPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface StepNexProps {
  formData: CharacterFormData;
  updateFormData: (updates: Partial<CharacterFormData>) => void;
}

export function StepNex({ formData, updateFormData }: StepNexProps) {
  // Estado para rastrear o NEX anterior (para comparação visual)
  const [previousNex, setPreviousNex] = useState<number | undefined>(undefined);
  
  // Handler para mudança de NEX com rastreamento do anterior
  const handleNexChange = (newNex: number) => {
    setPreviousNex(formData.nex);
    updateFormData({ nex: newNex });
  };

  // Limpar o previousNex após 3 segundos (animação de comparação)
  useEffect(() => {
    if (previousNex !== undefined) {
      const timeout = setTimeout(() => setPreviousNex(undefined), 3000);
      return () => clearTimeout(timeout);
    }
  }, [previousNex]);

  return (
    <div className="space-y-6">
      {/* Título e descrição */}
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl tracking-wider text-foreground">
          NÍVEL DE EXPERIÊNCIA
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          O NEX representa a experiência do seu agente na Ordo Realitas. 
          Agentes iniciantes começam com 5%, mas o mestre pode permitir níveis mais altos.
        </p>
      </div>

      {/* Seletor de NEX */}
      <NexSelector
        value={formData.nex}
        onChange={handleNexChange}
      />

      {/* Aviso para NEX alto */}
      <AnimatePresence>
        {formData.nex > 5 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/30"
          >
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-warning mb-1">
                NEX acima do inicial
              </p>
              <p className="text-muted-foreground">
                Personagens com NEX acima de 5% são mais experientes e poderosos.
                Certifique-se de que o Mestre autorizou a criação neste nível.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Painel de Benefícios */}
      <NexBenefitsPanel
        nex={formData.nex}
        characterClass={formData.characterClass}
        vigor={formData.attributes.vigor}
        presence={formData.attributes.presence}
        intellect={formData.attributes.intellect}
        originId={formData.origin}
        previousNex={previousNex}
      />
    </div>
  );
}

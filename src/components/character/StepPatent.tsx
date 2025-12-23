/**
 * StepPatent - Passo de seleção da Patente
 * 
 * Permite ao jogador selecionar manualmente a patente do personagem,
 * independente do NEX escolhido.
 * 
 * IDs centralizados em: src/lib/constants/game-ids.ts
 */

import { CharacterFormData } from '@/pages/CharacterCreate';
import { PatentSelector } from './PatentSelector';
import { RuleBookTip } from './RuleBookTip';
import { getRulebookContent } from '@/lib/rulebook-content';
import { PATENT_IDS, isValidPatentId, getPatentIdByName, type PatentId } from '@/lib/constants/game-ids';

interface StepPatentProps {
  formData: CharacterFormData;
  updateFormData: (updates: Partial<CharacterFormData>) => void;
}

export function StepPatent({ formData, updateFormData }: StepPatentProps) {
  // Obtém conteúdo educativo centralizado
  const rulebookContent = getRulebookContent('patent');

  // Handler para mudança de patente com validação
  const handlePatentChange = (patent: string) => {
    // Normaliza e valida a patente antes de atualizar
    const validPatent = getPatentIdByName(patent) || PATENT_IDS.RECRUTA;
    updateFormData({ patent: validPatent });
  };

  return (
    <div className="space-y-6">
      {/* Título e descrição */}
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl tracking-wider text-foreground">
          PATENTE NA ORDEM
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Selecione a patente do seu agente baseada nos Pontos de Prestígio (PP)
          que ele acumulou. Converse com o Mestre sobre qual patente é apropriada.
        </p>
      </div>

      {/* Painel educativo */}
      {rulebookContent && (
        <RuleBookTip section={rulebookContent} defaultExpanded={false} />
      )}

      {/* Seletor de Patente - usa PATENT_IDS.RECRUTA como default */}
      <PatentSelector
        value={formData.patent || PATENT_IDS.RECRUTA}
        onChange={handlePatentChange}
      />
    </div>
  );
}

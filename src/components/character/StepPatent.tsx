/**
 * StepPatent - Passo de seleção da Patente
 * 
 * Permite ao jogador selecionar manualmente a patente do personagem,
 * independente do NEX escolhido.
 */

import { CharacterFormData } from '@/pages/CharacterCreate';
import { PatentSelector } from './PatentSelector';
import { RuleBookTip } from './RuleBookTip';

// Conteúdo educativo sobre patentes
const patentRulebookContent = {
  main: {
    title: 'Patente e Pontos de Prestígio',
    content: `A patente representa sua posição hierárquica na Ordo Realitas e é determinada pelos **Pontos de Prestígio (PP)** acumulados em missões.

**Patentes disponíveis:**
- **Recruta** (0 PP): Agente novato sem experiência comprovada
- **Operador** (20 PP): Experiência em algumas missões
- **Agente Especial** (50 PP): Veterano comprovado
- **Oficial de Operações** (100 PP): Líder experiente
- **Agente de Elite** (200 PP): Elite da Ordem

A patente determina:
• **Limite de Crédito** para requisição de equipamentos
• **Categorias de itens** disponíveis (I a IV)
• **Quantidade máxima** de itens por categoria

⚠️ **Importante:** A patente é independente do NEX. Um agente pode ter NEX alto mas patente baixa (recém-transferido de outra divisão) ou NEX baixo com patente alta (veterano administrativo).`,
    source: 'Ordem Paranormal RPG - Cap. 2: Patentes',
  },
};

interface StepPatentProps {
  formData: CharacterFormData;
  updateFormData: (updates: Partial<CharacterFormData>) => void;
}

export function StepPatent({ formData, updateFormData }: StepPatentProps) {
  // Handler para mudança de patente
  const handlePatentChange = (patent: string) => {
    updateFormData({ patent });
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
      <RuleBookTip section={patentRulebookContent} defaultExpanded={false} />

      {/* Seletor de Patente */}
      <PatentSelector
        value={formData.patent || 'Recruta'}
        onChange={handlePatentChange}
      />
    </div>
  );
}

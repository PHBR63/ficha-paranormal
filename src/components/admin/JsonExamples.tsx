/**
 * Componente que exibe exemplos de JSON para cada tipo de importação
 * Inclui botões para copiar exemplo individual ou em lote
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, CheckCheck, FileJson, Package } from 'lucide-react';
import { toast } from 'sonner';

// Tipo de dado para importação
export type ImportType = 'weapons' | 'armor' | 'items' | 'rituals';

// Exemplos de JSON para cada tipo
const EXAMPLES: Record<ImportType, { single: object; batch: object[] }> = {
  weapons: {
    single: {
      id: "espada_longa",
      name: "Espada Longa",
      category: "I",
      type: "melee",
      damage: "1d8",
      damageType: "Corte",
      critical: 19,
      criticalMultiplier: 2,
      spaces: 1,
      proficiency: "tatica",
      properties: ["Versátil"],
      description: "Uma espada de lâmina longa e reta, ideal para combate corpo a corpo."
    },
    batch: [
      {
        id: "faca_combate",
        name: "Faca de Combate",
        category: "0",
        type: "melee",
        damage: "1d4",
        damageType: "Perfuração",
        critical: 19,
        criticalMultiplier: 2,
        spaces: 1,
        proficiency: "simples",
        properties: ["Leve", "Arremessável"],
        description: "Faca tática para combate próximo."
      },
      {
        id: "pistola_glock",
        name: "Pistola Glock",
        category: "I",
        type: "firearm",
        damage: "1d12",
        damageType: "Balístico",
        critical: 19,
        criticalMultiplier: 2,
        range: "Curto",
        spaces: 1,
        proficiency: "simples",
        properties: [],
        description: "Pistola semi-automática confiável."
      }
    ]
  },
  armor: {
    single: {
      id: "colete_tatico",
      name: "Colete Tático",
      category: "I",
      defenseBonus: 5,
      damageReduction: 0,
      spaces: 2,
      skillPenalty: 0,
      description: "Colete balístico leve para operações táticas.",
      properties: []
    },
    batch: [
      {
        id: "jaqueta_couro",
        name: "Jaqueta de Couro",
        category: "0",
        defenseBonus: 2,
        damageReduction: 0,
        spaces: 1,
        skillPenalty: 0,
        description: "Jaqueta reforçada que oferece proteção básica."
      },
      {
        id: "armadura_tatica",
        name: "Armadura Tática Completa",
        category: "II",
        defenseBonus: 8,
        damageReduction: 2,
        spaces: 4,
        skillPenalty: -2,
        description: "Armadura pesada para situações de alto risco.",
        properties: ["Pesada"]
      }
    ]
  },
  items: {
    single: {
      id: "kit_primeiros_socorros",
      name: "Kit de Primeiros Socorros",
      type: "operacional",
      category: "0",
      spaces: 1,
      description: "Contém bandagens, antissépticos e medicamentos básicos.",
      effect: "Permite testes de Medicina para estabilizar aliados.",
      consumable: false
    },
    batch: [
      {
        id: "lanterna_tatica",
        name: "Lanterna Tática",
        type: "operacional",
        category: "0",
        spaces: 1,
        description: "Lanterna LED de alta potência.",
        effect: "Ilumina área de 9m em cone.",
        consumable: false
      },
      {
        id: "granada_fragmentacao",
        name: "Granada de Fragmentação",
        type: "explosivo",
        category: "II",
        spaces: 1,
        description: "Explosivo antipessoal de área.",
        effect: "6d6 de dano em área de 6m, Reflexos reduz pela metade.",
        consumable: true
      }
    ]
  },
  rituals: {
    single: {
      id: "bola_de_fogo",
      name: "Bola de Fogo",
      circle: 2,
      element: "energia",
      execution: "Padrão",
      range: "Médio",
      area: "Explosão 6m",
      duration: "Instantânea",
      resistance: "Reflexos parcial",
      description: "Você conjura uma esfera de chamas que explode no ponto designado, causando 6d6 pontos de dano de fogo em todas as criaturas na área.",
      cost: 2,
      enhancements: [
        {
          name: "Discente",
          cost: 3,
          description: "Aumenta o dano para 8d6."
        },
        {
          name: "Verdadeiro",
          cost: 5,
          description: "Aumenta o dano para 10d6 e a área para 9m."
        }
      ]
    },
    batch: [
      {
        id: "curar_ferimentos",
        name: "Curar Ferimentos",
        circle: 1,
        element: "sangue",
        execution: "Padrão",
        range: "Toque",
        duration: "Instantânea",
        description: "Você canaliza energia vital para curar ferimentos. O alvo recupera 2d8+2 PV.",
        cost: 1,
        enhancements: [
          {
            name: "Discente",
            cost: 2,
            description: "Recupera 4d8+4 PV."
          }
        ]
      },
      {
        id: "medo",
        name: "Medo",
        circle: 1,
        element: "medo",
        execution: "Padrão",
        range: "Curto",
        target: "1 criatura",
        duration: "Cena",
        resistance: "Vontade anula",
        description: "O alvo fica apavorado e deve fugir de você por 1 rodada.",
        cost: 1
      }
    ]
  }
};

// Labels para cada tipo
const TYPE_LABELS: Record<ImportType, string> = {
  weapons: 'Armas',
  armor: 'Armaduras',
  items: 'Itens',
  rituals: 'Rituais'
};

interface JsonExamplesProps {
  type: ImportType;
}

export function JsonExamples({ type }: JsonExamplesProps) {
  const [copiedSingle, setCopiedSingle] = useState(false);
  const [copiedBatch, setCopiedBatch] = useState(false);

  const example = EXAMPLES[type];

  // Função para copiar JSON para clipboard
  const copyToClipboard = async (data: object | object[], isBatch: boolean) => {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      await navigator.clipboard.writeText(jsonString);
      
      if (isBatch) {
        setCopiedBatch(true);
        setTimeout(() => setCopiedBatch(false), 2000);
      } else {
        setCopiedSingle(true);
        setTimeout(() => setCopiedSingle(false), 2000);
      }
      
      toast.success('JSON copiado para a área de transferência!');
    } catch (err) {
      toast.error('Erro ao copiar JSON');
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileJson className="h-4 w-4 text-primary" />
          Exemplo de Formato JSON - {TYPE_LABELS[type]}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Exemplo Individual */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Importação Individual:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(example.single, false)}
              className="h-7 text-xs"
            >
              {copiedSingle ? (
                <>
                  <CheckCheck className="h-3 w-3 mr-1 text-green-500" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  Copiar
                </>
              )}
            </Button>
          </div>
          <pre className="bg-muted/50 p-3 rounded-md text-xs overflow-x-auto max-h-48 overflow-y-auto">
            {JSON.stringify(example.single, null, 2)}
          </pre>
        </div>

        {/* Exemplo em Lote */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Package className="h-3 w-3" />
              Importação em Lote (array):
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(example.batch, true)}
              className="h-7 text-xs"
            >
              {copiedBatch ? (
                <>
                  <CheckCheck className="h-3 w-3 mr-1 text-green-500" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  Copiar
                </>
              )}
            </Button>
          </div>
          <pre className="bg-muted/50 p-3 rounded-md text-xs overflow-x-auto max-h-48 overflow-y-auto">
            {JSON.stringify(example.batch, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

export { EXAMPLES, TYPE_LABELS };

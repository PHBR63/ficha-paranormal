/**
 * Seção de Aumento de Atributo para NEX Progression Modal
 * 
 * Permite ao jogador escolher qual atributo aumentar em +1 nos NEX:
 * 20%, 50%, 80%, 95%
 * 
 * Regras oficiais:
 * - Limite máximo de 5 por atributo
 * - Total de 4 aumentos ao longo da progressão
 * - Escolha do jogador a cada marco
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Lock, ArrowUp } from '@/components/icons/ordem-icons';
import { motion } from 'framer-motion';
import {
  AttributeKey,
  ATTRIBUTE_ORDER,
  ATTRIBUTE_DISPLAY,
  ATTRIBUTE_CARD_CLASSES,
  ATTRIBUTE_TEXT_COLORS,
} from '@/lib/constants/attributes';

// NEX que concedem aumento de atributo
export const ATTRIBUTE_INCREASE_NEX = [20, 50, 80, 95];

interface AttributeIncreaseSectionProps {
  /** Atributos atuais do personagem */
  currentAttributes: {
    agility: number;
    strength: number;
    intellect: number;
    presence: number;
    vigor: number;
  };
  /** Atributo selecionado pelo jogador */
  selectedAttribute: AttributeKey | null;
  /** Handler para seleção de atributo */
  onSelect: (attribute: AttributeKey) => void;
  /** NEX alvo (para exibição informativa) */
  targetNex: number;
}

/**
 * Verifica se um NEX específico é um marco de aumento de atributo
 */
export function isAttributeIncreaseNex(nex: number): boolean {
  return ATTRIBUTE_INCREASE_NEX.includes(nex);
}

export function AttributeIncreaseSection({
  currentAttributes,
  selectedAttribute,
  onSelect,
  targetNex,
}: AttributeIncreaseSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Cabeçalho */}
      <div className="flex items-center gap-2">
        <ArrowUp className="w-4 h-4 text-primary" />
        <h4 className="font-display text-sm tracking-wider text-primary">
          AUMENTO DE ATRIBUTO
        </h4>
        <Badge variant="outline" className="text-xs">
          NEX {targetNex}%
        </Badge>
      </div>
      
      {/* Descrição */}
      <p className="text-sm text-muted-foreground">
        Você pode aumentar um atributo em <strong>+1</strong>. 
        Atributos não podem ultrapassar <strong>5</strong>.
      </p>
      
      {/* Cards de Atributos */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ATTRIBUTE_ORDER.map((attrKey) => {
          const display = ATTRIBUTE_DISPLAY[attrKey];
          const currentValue = currentAttributes[attrKey];
          const isAtMax = currentValue >= 5;
          const isSelected = selectedAttribute === attrKey;
          
          return (
            <Card
              key={attrKey}
              className={`
                relative cursor-pointer transition-all duration-200
                ${isAtMax 
                  ? 'opacity-50 cursor-not-allowed bg-muted/30' 
                  : isSelected
                    ? `ring-2 ring-primary ${ATTRIBUTE_CARD_CLASSES[attrKey]}`
                    : `hover:ring-1 hover:ring-primary/50 ${ATTRIBUTE_CARD_CLASSES[attrKey]}`
                }
              `}
              onClick={() => !isAtMax && onSelect(attrKey)}
            >
              <CardHeader className="p-3 pb-1">
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-sm ${ATTRIBUTE_TEXT_COLORS[attrKey]}`}>
                    {display.name}
                  </CardTitle>
                  {isSelected && !isAtMax && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                  {isAtMax && (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="p-3 pt-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {display.abbr}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-display">{currentValue}</span>
                    {!isAtMax && (
                      <>
                        <span className="text-muted-foreground">→</span>
                        <span className={`text-lg font-display ${ATTRIBUTE_TEXT_COLORS[attrKey]}`}>
                          {currentValue + 1}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                {isAtMax && (
                  <Badge variant="outline" className="mt-2 text-xs w-full justify-center">
                    Limite atingido
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Aviso se nenhum selecionado */}
      {!selectedAttribute && (
        <p className="text-xs text-warning text-center">
          ⚠️ Você precisa escolher um atributo para aumentar
        </p>
      )}
    </motion.div>
  );
}

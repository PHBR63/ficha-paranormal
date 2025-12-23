/**
 * PatentSelector - Seletor de patente manual independente do NEX
 * 
 * Permite ao jogador escolher a patente do personagem baseado nos
 * Pontos de Prestígio (PP) que ele possui, sem interferência do NEX.
 * 
 * Patentes (conforme livro):
 * - Recruta (0 PP)
 * - Operador (20 PP)
 * - Agente Especial (50 PP)
 * - Oficial de Operações (100 PP)
 * - Agente de Elite (200 PP)
 * 
 * IDs centralizados em: src/lib/constants/game-ids.ts
 */

import { motion } from 'framer-motion';
import { Shield, Star, Award, Crown, Gem, Check, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PATENT_IDS, VALID_PATENT_IDS, isValidPatentId, getPatentIdByName, type PatentId } from '@/lib/constants/game-ids';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Dados das patentes conforme o livro base (valores corrigidos)
export const PATENT_DATA = [
  {
    id: 'recruta',
    name: 'Recruta',
    requiredPP: 0,
    icon: Shield,
    creditLimit: 'Baixo',
    itemLimits: { I: 2, II: 0, III: 0, IV: 0 },
    description: 'Agente novato, ainda sem experiência em missões paranormais.',
    gradient: 'from-slate-500 to-slate-600',
    textColor: 'text-slate-50',
    borderColor: 'border-slate-500',
  },
  {
    id: 'operador',
    name: 'Operador',
    requiredPP: 20,
    icon: Star,
    creditLimit: 'Médio',
    itemLimits: { I: 3, II: 1, III: 0, IV: 0 },
    description: 'Já possui alguma experiência e resolveu alguns casos paranormais.',
    gradient: 'from-blue-500 to-blue-600',
    textColor: 'text-blue-50',
    borderColor: 'border-blue-500',
  },
  {
    id: 'agente-especial',
    name: 'Agente Especial',
    requiredPP: 50,
    icon: Award,
    creditLimit: 'Alto',
    itemLimits: { I: 3, II: 2, III: 1, IV: 0 },
    description: 'Veterano com experiência comprovada em múltiplas missões.',
    gradient: 'from-purple-500 to-purple-600',
    textColor: 'text-purple-50',
    borderColor: 'border-purple-500',
  },
  {
    id: 'oficial-de-operacoes',
    name: 'Oficial de Operações',
    requiredPP: 100,
    icon: Crown,
    creditLimit: 'Ilimitado',
    itemLimits: { I: 3, II: 3, III: 2, IV: 1 },
    description: 'Líder experiente com acesso a recursos de alto nível.',
    gradient: 'from-amber-500 to-amber-600',
    textColor: 'text-amber-950',
    borderColor: 'border-amber-500',
  },
  {
    id: 'agente-de-elite',
    name: 'Agente de Elite',
    requiredPP: 200,
    icon: Gem,
    creditLimit: 'Ilimitado',
    itemLimits: { I: 3, II: 3, III: 3, IV: 2 },
    description: 'Elite da Ordem. Acesso irrestrito a equipamentos e recursos.',
    gradient: 'from-red-500 to-red-600',
    textColor: 'text-red-50',
    borderColor: 'border-red-500',
  },
];

interface PatentSelectorProps {
  value: string;
  onChange: (patent: string) => void;
}

export function PatentSelector({ value, onChange }: PatentSelectorProps) {
  // Encontra a patente selecionada, validando contra game-ids.ts
  const selectedPatent = PATENT_DATA.find(p => p.name === value) || PATENT_DATA[0];
  
  /**
   * Seleciona uma patente validando contra game-ids.ts
   * @param patentName - Nome da patente (usado para display)
   */
  const handleSelectPatent = (patentName: string) => {
    // Busca o ID da patente pelo nome
    const patentId = getPatentIdByName(patentName);
    
    // Valida se é uma patente válida antes de atualizar
    if (!patentId || !isValidPatentId(patentId)) {
      console.warn(`[PatentSelector] Tentativa de selecionar patente inválida: ${patentName}`);
      return;
    }
    
    onChange(patentName);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg tracking-wider text-foreground">
            PATENTE NA ORDEM
          </h3>
          <motion.div
            key={value}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r",
              selectedPatent.gradient
            )}
          >
            <selectedPatent.icon className={cn("w-5 h-5", selectedPatent.textColor)} />
            <span className={cn("font-display text-lg tracking-wider", selectedPatent.textColor)}>
              {selectedPatent.name}
            </span>
          </motion.div>
        </div>

        {/* Cards de seleção */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PATENT_DATA.map((patent, index) => {
            const Icon = patent.icon;
            const isSelected = value === patent.name;

            return (
              <motion.button
                key={patent.id}
                onClick={() => handleSelectPatent(patent.name)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "relative flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all text-left",
                  isSelected
                    ? `${patent.borderColor} bg-gradient-to-br ${patent.gradient} shadow-lg`
                    : "border-border bg-card/50 hover:border-primary/50"
                )}
              >
                {/* Ícone de seleção */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2"
                  >
                    <Check className="w-5 h-5 text-success" />
                  </motion.div>
                )}

                {/* Ícone da patente */}
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  isSelected
                    ? "bg-white/20"
                    : `bg-gradient-to-br ${patent.gradient}`
                )}>
                  <Icon className={cn(
                    "w-6 h-6",
                    isSelected ? patent.textColor : "text-white"
                  )} />
                </div>

                {/* Nome */}
                <span className={cn(
                  "font-display text-sm tracking-wider text-center",
                  isSelected ? patent.textColor : "text-foreground"
                )}>
                  {patent.name}
                </span>

                {/* Tooltip com detalhes */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "absolute bottom-2 right-2 p-1 rounded-full",
                        isSelected ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <div className="space-y-2">
                      <p className="font-medium">{patent.name}</p>
                      <p className="text-sm text-muted-foreground">{patent.description}</p>
                      <div className="text-xs space-y-1 pt-2 border-t border-border">
                        <p><strong>Limite de Crédito:</strong> {patent.creditLimit}</p>
                        <p>
                          <strong>Itens:</strong> Cat I: {patent.itemLimits.I === Infinity ? '∞' : patent.itemLimits.I}, 
                          Cat II: {patent.itemLimits.II === Infinity ? '∞' : patent.itemLimits.II}, 
                          Cat III: {patent.itemLimits.III === Infinity ? '∞' : patent.itemLimits.III}, 
                          Cat IV: {patent.itemLimits.IV === Infinity ? '∞' : patent.itemLimits.IV}
                        </p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </motion.button>
            );
          })}
        </div>

        {/* Info Panel da patente selecionada */}
        <motion.div
          key={selectedPatent.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-lg bg-muted/30 border border-border space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br",
              selectedPatent.gradient
            )}>
              <selectedPatent.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-display text-sm tracking-wider">
                {selectedPatent.name}
              </h4>
              <p className="text-xs text-muted-foreground">
                {selectedPatent.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t border-border">
            <div>
              <span className="text-muted-foreground">Limite de Crédito:</span>
              <span className="ml-2 text-foreground font-medium">{selectedPatent.creditLimit}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Categoria Max:</span>
              <span className="ml-2 text-foreground font-medium">
                {selectedPatent.itemLimits.IV > 0 ? 'IV' : 
                 selectedPatent.itemLimits.III > 0 ? 'III' : 
                 selectedPatent.itemLimits.II > 0 ? 'II' : 'I'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">Limite de itens por categoria:</span>
            <div className="flex gap-2 mt-1 flex-wrap">
              {Object.entries(selectedPatent.itemLimits).map(([cat, limit]) => (
                <span
                  key={cat}
                  className={cn(
                    "px-2 py-1 rounded text-xs font-medium",
                    limit === 0 ? "bg-muted text-muted-foreground" : "bg-primary/20 text-primary"
                  )}
                >
                  Cat {cat}: {limit === Infinity ? '∞' : limit}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        <p className="text-xs text-muted-foreground italic text-center">
          A patente representa sua posição hierárquica na Ordem, baseada em Pontos de Prestígio acumulados nas missões.
        </p>
      </div>
    </TooltipProvider>
  );
}

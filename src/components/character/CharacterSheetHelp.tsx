/**
 * CharacterSheetHelp - Painel de ajuda e instruções para a ficha de personagem
 * Mostra dicas de uso, referência rápida e instruções contextuais
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  X, 
  Dices, 
  Heart, 
  Zap, 
  Brain,
  Swords,
  Package,
  Moon,
  Sparkles,
  Target,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface CharacterSheetHelpProps {
  characterClass?: string;
  nex?: number;
}

// Seção de ajuda individual
interface HelpSection {
  id: string;
  icon: React.ReactNode;
  title: string;
  tips: string[];
}

// Seções de ajuda disponíveis
const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'dice',
    icon: <Dices className="w-4 h-4" />,
    title: 'Rolagem de Dados',
    tips: [
      'Clique nos atributos para rolar dados',
      'Clique nas perícias para rolar com bônus',
      'Crítico = 20 natural no dado',
      'Atributo 0 = desvantagem (2d20, menor)',
    ],
  },
  {
    id: 'combat',
    icon: <Swords className="w-4 h-4" />,
    title: 'Combate',
    tips: [
      'Use o Combat Tracker durante batalhas',
      'Armas equipadas aparecem no Sistema de Ataque',
      'Defesa = 10 + AGI + equipamentos',
      'Condições afetam seus testes automaticamente',
    ],
  },
  {
    id: 'resources',
    icon: <Heart className="w-4 h-4" />,
    title: 'Recursos',
    tips: [
      'HP = Pontos de Vida (zerou = morrendo)',
      'PE = Pontos de Esforço (poderes/habilidades)',
      'SAN = Sanidade (baixa = efeitos de loucura)',
      'Use o botão STATUS para editar valores',
    ],
  },
  {
    id: 'pe',
    icon: <Zap className="w-4 h-4" />,
    title: 'Pontos de Esforço',
    tips: [
      'Limite de PE por turno baseado no NEX',
      'Use o PE Tracker para controlar gastos',
      'Descanso recupera PE (curto ou longo)',
      'Rituais e habilidades consomem PE',
    ],
  },
  {
    id: 'inventory',
    icon: <Package className="w-4 h-4" />,
    title: 'Inventário',
    tips: [
      'Equipar itens clicando no ícone de equipar',
      'Capacidade baseada na Força e Patente',
      'Armaduras dão RD mas podem ter penalidade',
      'Categorias: 0, I, II, III, IV',
    ],
  },
  {
    id: 'rest',
    icon: <Moon className="w-4 h-4" />,
    title: 'Descanso',
    tips: [
      'Descanso curto (30min): recupera PE',
      'Descanso longo (8h): recupera tudo',
      'Algumas condições são removidas ao descansar',
      'Clique em DESCANSAR para escolher o tipo',
    ],
  },
];

export function CharacterSheetHelp({ characterClass, nex }: CharacterSheetHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Dicas específicas por classe
  const classTips: Record<string, string[]> = {
    'Combatente': [
      'Foco em combate corpo-a-corpo e armas de fogo',
      'Use habilidades de trilha para especialização',
      'Proficiências em armas táticas e pesadas',
    ],
    'Especialista': [
      'Mais perícias que outras classes',
      'Versátil em situações fora de combate',
      'Use seus conhecimentos para investigar',
    ],
    'Ocultista': [
      'Rituais são seu forte - use-os!',
      'Cuidado com o custo de PE dos rituais',
      'Novos círculos desbloqueiam com o NEX',
    ],
  };

  const currentClassTips = characterClass ? classTips[characterClass] : null;

  return (
    <>
      {/* Botão flutuante de ajuda */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full shadow-lg bg-card border-primary/50 hover:bg-primary/10"
        aria-label="Ajuda"
      >
        <HelpCircle className="w-5 h-5 text-primary" />
      </Button>

      {/* Painel de ajuda */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            />

            {/* Painel lateral */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border z-50 shadow-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  <h2 className="font-display text-lg tracking-wider">GUIA RÁPIDO</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <ScrollArea className="h-[calc(100vh-65px)]">
                <div className="p-4 space-y-4">
                  {/* Dicas da classe */}
                  {currentClassTips && (
                    <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg space-y-2">
                      <div className="flex items-center gap-2 text-primary">
                        <Sparkles className="w-4 h-4" />
                        <span className="font-display text-sm tracking-wider">
                          DICAS: {characterClass?.toUpperCase()}
                        </span>
                      </div>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {currentClassTips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ChevronRight className="w-3 h-3 mt-1 text-primary flex-shrink-0" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Referência rápida de regras */}
                  <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <span className="font-display text-sm tracking-wider text-muted-foreground">
                        REFERÊNCIA RÁPIDA
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-card rounded border border-border">
                        <p className="text-muted-foreground">Crítico</p>
                        <p className="font-display text-lg text-primary">20</p>
                      </div>
                      <div className="p-2 bg-card rounded border border-border">
                        <p className="text-muted-foreground">PE/turno (NEX {nex || 5}%)</p>
                        <p className="font-display text-lg text-secondary">
                          {nex ? (nex <= 5 ? 1 : nex <= 15 ? 2 : nex <= 25 ? 3 : nex <= 35 ? 4 : 5) : 1}
                        </p>
                      </div>
                    </div>

                    {/* Ações de combate */}
                    <div className="space-y-1 text-xs">
                      <p className="text-muted-foreground font-medium">Ações por turno:</p>
                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 bg-primary/20 text-primary rounded">Padrão</span>
                        <span className="px-2 py-0.5 bg-secondary/20 text-secondary rounded">Movimento</span>
                        <span className="px-2 py-0.5 bg-accent/20 text-accent-foreground rounded">Reação</span>
                        <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded">Livre</span>
                      </div>
                    </div>
                  </div>

                  {/* Seções de ajuda expansíveis */}
                  <div className="space-y-2">
                    {HELP_SECTIONS.map((section) => (
                      <div
                        key={section.id}
                        className="border border-border rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => setExpandedSection(
                            expandedSection === section.id ? null : section.id
                          )}
                          className={cn(
                            "w-full flex items-center justify-between p-3 text-left transition-colors",
                            expandedSection === section.id
                              ? "bg-primary/10"
                              : "bg-card hover:bg-muted/30"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "transition-colors",
                              expandedSection === section.id ? "text-primary" : "text-muted-foreground"
                            )}>
                              {section.icon}
                            </span>
                            <span className="font-display text-sm tracking-wider">
                              {section.title}
                            </span>
                          </div>
                          <ChevronRight
                            className={cn(
                              "w-4 h-4 transition-transform",
                              expandedSection === section.id && "rotate-90"
                            )}
                          />
                        </button>
                        
                        <AnimatePresence>
                          {expandedSection === section.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <ul className="p-3 space-y-2 bg-muted/10 text-sm">
                                {section.tips.map((tip, i) => (
                                  <li key={i} className="flex items-start gap-2 text-muted-foreground">
                                    <span className="text-primary mt-0.5">•</span>
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>

                  {/* Aviso */}
                  <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Lembre-se: o Mestre define a DT (dificuldade) de cada teste. 
                      Comunique suas ações claramente!
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
/**
 * CharacterSheetHelp - Painel de ajuda e instruções para a ficha de personagem
 * Mostra dicas de uso, referência rápida e instruções contextuais
 * Versão responsiva: no mobile fica no header, no desktop é botão flutuante
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
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
  ChevronRight,
  GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

// Chaves do localStorage para persistência
const STORAGE_KEYS = {
  POSITION: 'character-help-position',
  DISMISSED: 'character-help-dismissed',
};

/**
 * Restaura o botão de ajuda que foi dispensado
 */
export function restoreHelpButton() {
  localStorage.removeItem(STORAGE_KEYS.DISMISSED);
  // Dispara evento customizado para notificar componentes
  window.dispatchEvent(new CustomEvent('help-button-restored'));
}

/**
 * Verifica se o botão de ajuda está dispensado
 */
export function isHelpButtonDismissed(): boolean {
  return localStorage.getItem(STORAGE_KEYS.DISMISSED) === 'true';
}

interface CharacterSheetHelpProps {
  characterClass?: string;
  nex?: number;
  /** 
   * Modo de exibição: 
   * - 'floating': botão flutuante (padrão desktop)
   * - 'inline': botão inline para header (mobile)
   */
  mode?: 'floating' | 'inline';
  /** Callback quando o painel é fechado */
  onClose?: () => void;
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

/**
 * Botão de ajuda para uso inline no header mobile
 */
export function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="w-8 h-8 rounded-full"
      aria-label="Ajuda"
    >
      <HelpCircle className="w-4 h-4 text-primary" />
    </Button>
  );
}

export function CharacterSheetHelp({ characterClass, nex, mode = 'floating', onClose }: CharacterSheetHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(() => {
    // Carrega estado de dismissed do localStorage
    return localStorage.getItem(STORAGE_KEYS.DISMISSED) === 'true';
  });
  const isMobile = useIsMobile();
  
  // Para arrastar o botão flutuante
  const constraintsRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const [dragPosition, setDragPosition] = useState(() => {
    // Carrega posição salva do localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.POSITION);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Erro ao carregar posição do botão de ajuda:', e);
    }
    return { x: 0, y: 0 };
  });

  // Listener para restaurar o botão de ajuda
  useEffect(() => {
    const handleRestore = () => {
      setIsDismissed(false);
      setDragPosition({ x: 0, y: 0 });
    };
    
    window.addEventListener('help-button-restored', handleRestore);
    return () => window.removeEventListener('help-button-restored', handleRestore);
  }, []);

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

  // Handler para fechar o painel
  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  // Handler para dispensar o botão flutuante (mobile)
  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(STORAGE_KEYS.DISMISSED, 'true');
  };

  // Handler para quando o drag termina - salva posição no localStorage
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const newPosition = { x: info.offset.x, y: info.offset.y };
    setDragPosition(newPosition);
    localStorage.setItem(STORAGE_KEYS.POSITION, JSON.stringify(newPosition));
  };

  // No modo inline (mobile header), retorna apenas o painel (sem botão flutuante)
  // O botão será renderizado separadamente pelo componente pai
  if (mode === 'inline') {
    return (
      <HelpPanel
        isOpen={isOpen}
        onClose={handleClose}
        expandedSection={expandedSection}
        setExpandedSection={setExpandedSection}
        currentClassTips={currentClassTips}
        characterClass={characterClass}
        nex={nex}
      />
    );
  }

  // No mobile com modo floating, não mostra se foi dismisssado
  // E ajusta a posição para não sobrepor a barra de navegação
  if (isMobile && isDismissed) {
    return null;
  }

  return (
    <>
      {/* Container de constraints para o drag */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-40" />
      
      {/* Botão flutuante de ajuda - arrastável no mobile */}
      {isMobile ? (
        <motion.div
          drag
          dragControls={dragControls}
          dragConstraints={constraintsRef}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          initial={{ x: 0, y: 0 }}
          animate={{ x: dragPosition.x, y: dragPosition.y }}
          className="fixed bottom-36 right-4 z-40 pointer-events-auto"
        >
          <div className="relative group">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsOpen(true)}
              className="w-10 h-10 rounded-full shadow-lg bg-card border-primary/50 hover:bg-primary/10 touch-none"
              aria-label="Ajuda"
            >
              <HelpCircle className="w-4 h-4 text-primary" />
            </Button>
            
            {/* Indicador de arrastar */}
            <div className="absolute -top-1 -left-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="w-3 h-3 text-muted-foreground" />
            </div>
            
            {/* Botão de fechar/dispensar */}
            <button
              onClick={handleDismiss}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
              aria-label="Fechar ajuda"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      ) : (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full shadow-lg bg-card border-primary/50 hover:bg-primary/10"
          aria-label="Ajuda"
        >
          <HelpCircle className="w-5 h-5 text-primary" />
        </Button>
      )}

      {/* Painel de ajuda */}
      <HelpPanel
        isOpen={isOpen}
        onClose={handleClose}
        expandedSection={expandedSection}
        setExpandedSection={setExpandedSection}
        currentClassTips={currentClassTips}
        characterClass={characterClass}
        nex={nex}
      />
    </>
  );
}

/**
 * Componente separado do painel de ajuda para reutilização
 */
interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
  expandedSection: string | null;
  setExpandedSection: (id: string | null) => void;
  currentClassTips: string[] | null;
  characterClass?: string;
  nex?: number;
}

function HelpPanel({
  isOpen,
  onClose,
  expandedSection,
  setExpandedSection,
  currentClassTips,
  characterClass,
  nex,
}: HelpPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
                onClick={onClose}
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
                      <p className="font-display text-lg text-pe">
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
  );
}

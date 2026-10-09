/**
 * CampaignLayout - Layout principal com painéis redimensionáveis
 * 
 * Utiliza react-resizable-panels para criar uma estrutura flexível:
 * - Painel principal (conteúdo das abas)
 * - Painel secundário opcional (ferramentas do mestre)
 * - Sidebar colapsável (lista de jogadores)
 * 
 * @module components/campaign/layout/CampaignLayout
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { PanelRightOpen, PanelRightClose, Users } from '@/components/icons/ordem-icons';
import { cn } from '@/lib/utils';

interface CampaignLayoutProps {
  /** Conteúdo principal (abas e conteúdo) */
  children: React.ReactNode;
  /** Componente da sidebar de jogadores */
  sidebar: React.ReactNode;
  /** Painel secundário opcional (ferramentas do mestre) */
  secondaryPanel?: React.ReactNode;
  /** Mostrar painel secundário */
  showSecondary?: boolean;
  /** Estado inicial da sidebar */
  defaultSidebarCollapsed?: boolean;
  /** Callback ao alternar sidebar */
  onSidebarToggle?: (collapsed: boolean) => void;
  /** Callback ao redimensionar painéis */
  onPanelResize?: (sizes: number[]) => void;
  /** Classe CSS adicional */
  className?: string;
}

export function CampaignLayout({ 
  children, 
  sidebar, 
  secondaryPanel,
  showSecondary = false,
  defaultSidebarCollapsed = false,
  onSidebarToggle,
  onPanelResize,
  className,
}: CampaignLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(defaultSidebarCollapsed);

  // Handler para colapsar/expandir sidebar
  const handleSidebarToggle = useCallback(() => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    onSidebarToggle?.(newState);
  }, [sidebarCollapsed, onSidebarToggle]);

  // Handler para redimensionamento de painéis
  const handleLayoutChange = useCallback((sizes: number[]) => {
    onPanelResize?.(sizes);
  }, [onPanelResize]);

  return (
    <div className={cn('flex-1 flex overflow-hidden', className)}>
      <ResizablePanelGroup 
        direction="horizontal" 
        className="flex-1"
        onLayout={handleLayoutChange}
      >
        {/* Painel Principal - Sempre visível */}
        <ResizablePanel 
          defaultSize={showSecondary ? 55 : 75} 
          minSize={35}
          className="flex flex-col min-h-0"
        >
          {children}
        </ResizablePanel>
        
        {/* Painel Secundário - Ferramentas do Mestre (opcional) */}
        {showSecondary && secondaryPanel && (
          <>
            <ResizableHandle 
              withHandle 
              className="bg-border/50 hover:bg-primary/20 transition-colors"
            />
            <ResizablePanel 
              defaultSize={20} 
              minSize={15} 
              maxSize={40}
              className="flex flex-col min-h-0"
            >
              <div className="flex-1 overflow-hidden bg-card/30 backdrop-blur-sm border-l border-border/30">
                {secondaryPanel}
              </div>
            </ResizablePanel>
          </>
        )}
        
        {/* Sidebar de Jogadores - Colapsável */}
        <ResizableHandle 
          className={cn(
            'bg-border/50 hover:bg-primary/20 transition-colors',
            sidebarCollapsed && 'hidden'
          )}
        />
        <ResizablePanel 
          defaultSize={sidebarCollapsed ? 0 : 25} 
          minSize={sidebarCollapsed ? 0 : 15} 
          maxSize={35}
          collapsible
          collapsedSize={0}
          onCollapse={() => setSidebarCollapsed(true)}
          onExpand={() => setSidebarCollapsed(false)}
          className={cn(
            'transition-all duration-300 hidden md:flex',
            sidebarCollapsed && 'min-w-0'
          )}
        >
          <AnimatePresence mode="wait">
            {!sidebarCollapsed ? (
              <motion.div
                key="sidebar-expanded"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: '100%' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col min-h-0 overflow-hidden"
              >
                {sidebar}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Botão flutuante para reabrir sidebar quando colapsada - Desktop */}
      <AnimatePresence>
        {sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30"
          >
            <Button
              variant="outline"
              size="icon"
              onClick={handleSidebarToggle}
              className="h-12 w-12 rounded-full shadow-lg bg-card/80 backdrop-blur-sm border-primary/30 hover:bg-primary/10 hover:border-primary/50"
              title="Expandir painel de jogadores"
            >
              <Users className="w-5 h-5 text-primary" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

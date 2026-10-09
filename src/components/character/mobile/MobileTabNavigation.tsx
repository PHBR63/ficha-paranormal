/**
 * MobileTabNavigation - Barra de navegação fixa no bottom para mobile
 * Componente extraído e memoizado para melhor performance
 */

import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  BookOpen, 
  Sparkles, 
  Package,
  Swords,
} from '@/components/icons/ordem-icons';
import { cn } from '@/lib/utils';

// Tipos de tabs disponíveis (compatível com MobileCharacterSheet original)
export type MobileTab = 'overview' | 'skills' | 'powers' | 'inventory';

// Tipo estendido para incluir combat (uso futuro)
export type ExtendedMobileTab = MobileTab | 'combat';

interface TabConfig {
  id: ExtendedMobileTab;
  icon: React.ElementType;
  label: string;
}

// Configuração das 4 tabs principais (sem combat por padrão)
const DEFAULT_TABS: TabConfig[] = [
  { id: 'overview', icon: Home, label: 'Geral' },
  { id: 'skills', icon: BookOpen, label: 'Perícias' },
  { id: 'powers', icon: Sparkles, label: 'Poderes' },
  { id: 'inventory', icon: Package, label: 'Itens' },
];

// Configuração estendida com combat (uso futuro)
const EXTENDED_TABS: TabConfig[] = [
  { id: 'overview', icon: Home, label: 'Geral' },
  { id: 'skills', icon: BookOpen, label: 'Perícias' },
  { id: 'powers', icon: Sparkles, label: 'Poderes' },
  { id: 'combat', icon: Swords, label: 'Combate' },
  { id: 'inventory', icon: Package, label: 'Itens' },
];

interface MobileTabNavigationProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  /** Badges para cada tab (ex: contagem de itens) */
  badges?: Partial<Record<MobileTab, number | string>>;
  /** Usar tabs estendidas com combat */
  showCombatTab?: boolean;
  className?: string;
}

// Item de tab memoizado
const TabItem = memo(function TabItem({
  tab,
  isActive,
  badge,
  onClick,
}: {
  tab: TabConfig;
  isActive: boolean;
  badge?: number | string;
  onClick: () => void;
}) {
  const Icon = tab.icon;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center w-full h-full transition-colors relative",
        isActive 
          ? "text-primary" 
          : "text-muted-foreground active:text-foreground"
      )}
    >
      {/* Indicador de tab ativa */}
      {isActive && (
        <motion.div
          layoutId="activeTabIndicator"
          className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full"
          transition={{ type: 'spring', damping: 30, stiffness: 500 }}
        />
      )}
      
      <div className="relative">
        <Icon className="w-5 h-5" />
        
        {/* Badge */}
        {badge !== undefined && badge !== 0 && (
          <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] px-0.5 bg-destructive text-[9px] text-white font-bold rounded-full flex items-center justify-center">
            {typeof badge === 'number' && badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      
      <span className="text-[10px] mt-0.5">{tab.label}</span>
    </button>
  );
});

export const MobileTabNavigation = memo(function MobileTabNavigation({
  activeTab,
  onTabChange,
  badges = {},
  showCombatTab = false,
  className,
}: MobileTabNavigationProps) {
  // Handler com feedback háptico
  const handleTabChange = useCallback((tabId: MobileTab) => {
    if (tabId === activeTab) return;
    
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
    
    onTabChange(tabId);
  }, [activeTab, onTabChange]);

  // Seleciona tabs baseado na configuração
  const visibleTabs = showCombatTab ? EXTENDED_TABS : DEFAULT_TABS;

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50",
      "safe-area-inset-bottom",
      className
    )}>
      <div 
        className="flex justify-around items-center h-14"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {visibleTabs.map(tab => (
          <TabItem
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            badge={badges[tab.id as MobileTab]}
            onClick={() => handleTabChange(tab.id as MobileTab)}
          />
        ))}
      </div>
    </div>
  );
});

export default MobileTabNavigation;

/**
 * CampaignNavigation - Navegação consolidada em 4-5 abas
 * 
 * Reduz complexidade de 10+ abas para grupos lógicos:
 * - Painel: Status dos agentes
 * - Chat: Mensagens e dados
 * - Mapa: Tabuleiro tático
 * - Recursos: Notas, handouts, diário
 * - Mestre: Ferramentas do GM (condicional)
 * 
 * @module components/campaign/v3/CampaignNavigation
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Map, 
  FolderOpen, 
  Crown 
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Tipos de abas disponíveis
export type CampaignTab = 'panel' | 'chat' | 'map' | 'resources' | 'master';

interface CampaignNavigationProps {
  /** Aba atualmente ativa */
  activeTab: CampaignTab;
  /** Callback quando aba muda */
  onTabChange: (tab: CampaignTab) => void;
  /** Se o usuário é mestre (mostra aba Mestre) */
  isMaster?: boolean;
  /** Contagem de mensagens não lidas */
  unreadCount?: number;
  /** Classe CSS adicional */
  className?: string;
}

// Configuração das abas
const TAB_CONFIG = {
  panel: {
    icon: LayoutDashboard,
    label: 'Painel',
    description: 'Status dos agentes',
  },
  chat: {
    icon: MessageSquare,
    label: 'Chat',
    description: 'Mensagens e dados',
  },
  map: {
    icon: Map,
    label: 'Mapa',
    description: 'Tabuleiro tático',
  },
  resources: {
    icon: FolderOpen,
    label: 'Recursos',
    description: 'Notas e handouts',
  },
  master: {
    icon: Crown,
    label: 'Mestre',
    description: 'Ferramentas do GM',
  },
} as const;

export const CampaignNavigation = memo(function CampaignNavigation({
  activeTab,
  onTabChange,
  isMaster = false,
  unreadCount = 0,
  className,
}: CampaignNavigationProps) {
  // Abas visíveis (mestre vê todas, jogador vê 4)
  const visibleTabs: CampaignTab[] = isMaster 
    ? ['panel', 'chat', 'map', 'resources', 'master']
    : ['panel', 'chat', 'map', 'resources'];

  return (
    <div className={cn('shrink-0 border-b border-border/50 bg-background/50', className)}>
      <Tabs 
        value={activeTab} 
        onValueChange={(v) => onTabChange(v as CampaignTab)}
        className="w-full"
      >
        <TabsList className="w-full justify-center bg-transparent h-11 gap-1 px-2">
          {visibleTabs.map((tabKey) => {
            const config = TAB_CONFIG[tabKey];
            const Icon = config.icon;
            const isActive = activeTab === tabKey;
            const showBadge = tabKey === 'chat' && unreadCount > 0;

            return (
              <TabsTrigger
                key={tabKey}
                value={tabKey}
                aria-label={config.label}
                title={config.description}
                className={cn(
                  'relative flex-col sm:flex-row gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 text-sm font-medium transition-colors',
                  'data-[state=active]:bg-primary/10 data-[state=active]:text-primary',
                  'data-[state=active]:shadow-none',
                  tabKey === 'master' && 'text-primary/80'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[10px] sm:text-sm">{config.label}</span>

                {/* Badge de não lidos */}
                {showBadge && (
                  <Badge 
                    variant="destructive" 
                    className="h-5 min-w-5 px-1.5 text-[10px] font-bold"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}

                {/* Indicador ativo animado */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
});

export default CampaignNavigation;

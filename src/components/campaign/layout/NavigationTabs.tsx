/**
 * NavigationTabs - Tabs de navegação otimizadas com ícones e badges
 * 
 * Componente de navegação principal da campanha com:
 * - Ícones representativos por aba
 * - Badges de notificação (mensagens não lidas, etc.)
 * - Responsividade para mobile (apenas ícones)
 * - Animações de transição suaves
 * 
 * @module components/campaign/layout/NavigationTabs
 */

import { motion } from 'framer-motion';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  MessageSquare,
  Swords,
  Map,
  Activity,
  Scroll,
  FileText,
  CalendarDays,
  BookOpen,
  Crown,
} from '@/components/icons/ordem-icons';
import { cn } from '@/lib/utils';

// Configuração das abas
export interface TabConfig {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  masterOnly?: boolean;
  variant?: 'default' | 'master';
}

// Configuração padrão das abas
export const DEFAULT_TABS: TabConfig[] = [
  { value: 'status', label: 'AGENTES', icon: Users },
  { value: 'chat', label: 'CHAT', icon: MessageSquare },
  { value: 'combat', label: 'COMBATE', icon: Swords },
  { value: 'tactical', label: 'TABULEIRO', icon: Map },
  { value: 'conditions', label: 'CONDIÇÕES', icon: Activity },
  { value: 'notes', label: 'NOTAS', icon: Scroll },
  { value: 'handouts', label: 'HANDOUTS', icon: FileText },
  { value: 'sessions', label: 'SESSÕES', icon: CalendarDays },
  { value: 'diary', label: 'DIÁRIO', icon: BookOpen },
  { value: 'master', label: 'MESTRE', icon: Crown, masterOnly: true, variant: 'master' },
];

interface NavigationTabsProps {
  /** Configuração customizada de abas (opcional) */
  tabs?: TabConfig[];
  /** Se o usuário é mestre */
  isMaster?: boolean;
  /** Badges por aba (ex: { chat: 3 } = 3 msgs não lidas) */
  badges?: Record<string, number>;
  /** Classe CSS adicional */
  className?: string;
}

export function NavigationTabs({ 
  tabs = DEFAULT_TABS, 
  isMaster = false,
  badges = {},
  className,
}: NavigationTabsProps) {
  // Filtra abas baseado no papel do usuário
  const visibleTabs = tabs.filter(tab => !tab.masterOnly || isMaster);

  return (
    <div className={cn(
      'shrink-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur-md overflow-x-auto shadow-lg',
      className
    )}>
      <TabsList className="bg-transparent px-4 sm:px-6 lg:px-8 min-w-max h-12 sm:h-14">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const badgeCount = badges[tab.value] || tab.badge || 0;
          const isMasterTab = tab.variant === 'master';

          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              aria-label={tab.label}
              title={tab.label}
              className={cn(
                'relative font-display tracking-wider text-xs sm:text-sm px-3 sm:px-5 h-10 sm:h-12',
                'text-white/70 hover:text-white transition-all',
                'data-[state=active]:text-white',
                isMasterTab 
                  ? 'data-[state=active]:bg-primary/20' 
                  : 'data-[state=active]:bg-primary/15'
              )}
            >
              <span className="flex items-center gap-1.5 sm:gap-2">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </span>
              
              {/* Badge de notificação */}
              {badgeCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 sm:top-0 sm:right-0"
                >
                  <Badge 
                    variant="destructive" 
                    className="h-5 min-w-5 px-1.5 text-[10px] font-bold rounded-full"
                  >
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </Badge>
                </motion.span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </div>
  );
}

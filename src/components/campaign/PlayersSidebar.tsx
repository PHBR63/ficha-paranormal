/**
 * PlayersSidebar - Barra lateral expandida de jogadores da campanha
 * 
 * Exibe lista de membros com avatares, status online, barras de recursos (PV, PE, SAN),
 * informações de classe/NEX e indicadores visuais de condições
 * Inclui MobileActionSheet para ações em cada membro
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, User, Circle, X, Eye, UserMinus, Shield, Zap, Brain, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MobileActionSheet } from '@/components/ui/mobile-action-sheet';
import { cn } from '@/lib/utils';

// Interface expandida para incluir mais dados do personagem
interface Member {
  id: string;
  user_id: string;
  character_id: string | null;
  role: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  characters?: {
    id: string;
    name: string;
    class: string;
    nex: number;
    patent?: string;
    hp_current: number;
    hp_max: number;
    pe_current: number;
    pe_max: number;
    san_current: number;
    san_max: number;
    photo_url?: string | null;
    conditions?: unknown;
  } | null;
}

interface PlayersSidebarProps {
  members: Member[];
  masterId: string;
  isMaster: boolean;
  onRemoveMember?: (memberId: string) => void;
  onViewCharacter?: (characterId: string) => void;
}

// Configuração de cores por classe
const CLASS_COLORS: Record<string, string> = {
  'Combatente': 'from-red-500/20 to-red-600/10 border-red-500/30',
  'Especialista': 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
  'Ocultista': 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
};

// Helper para calcular porcentagem de recurso
const getResourcePercentage = (current: number, max: number) => {
  if (max <= 0) return 0;
  return Math.min(100, Math.max(0, (current / max) * 100));
};

// Helper para cor da barra baseado na porcentagem
const getResourceColor = (percentage: number, type: 'hp' | 'pe' | 'san') => {
  const colors = {
    hp: percentage > 50 ? 'bg-emerald-500' : percentage > 25 ? 'bg-amber-500' : 'bg-red-500',
    pe: 'bg-blue-500',
    san: percentage > 50 ? 'bg-violet-500' : percentage > 25 ? 'bg-orange-500' : 'bg-red-500',
  };
  return colors[type];
};

export function PlayersSidebar({ 
  members, 
  masterId, 
  isMaster, 
  onRemoveMember,
  onViewCharacter,
}: PlayersSidebarProps) {
  // Estado do ActionSheet para membros
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);

  // Handler para abrir ações do membro
  const handleMemberClick = (member: Member) => {
    const isMasterMember = member.role === 'master';
    // Só abre o ActionSheet se houver ações disponíveis
    if (member.characters?.id || (isMaster && !isMasterMember)) {
      setSelectedMember(member);
      setActionSheetOpen(true);
    }
  };

  // Monta ações para o membro selecionado
  const getMemberActions = () => {
    if (!selectedMember) return [];
    
    const isMasterMember = selectedMember.role === 'master';
    const actions = [];

    // Ver personagem (se tiver personagem vinculado)
    if (selectedMember.characters?.id && onViewCharacter) {
      actions.push({
        id: 'view-character',
        label: 'Ver Personagem',
        icon: Eye,
        description: `${selectedMember.characters.name} • ${selectedMember.characters.class}`,
        onPress: () => onViewCharacter(selectedMember.characters!.id),
      });
    }

    // Remover da campanha (apenas mestre pode, e não pode remover a si mesmo)
    if (isMaster && !isMasterMember && onRemoveMember) {
      actions.push({
        id: 'remove',
        label: 'Remover da Campanha',
        icon: UserMinus,
        destructive: true,
        onPress: () => onRemoveMember(selectedMember.id),
      });
    }

    return actions;
  };

  return (
    <aside className="w-80 xl:w-96 border-l border-border bg-gradient-to-b from-card/50 to-card/30 backdrop-blur-sm hidden lg:flex flex-col">
      {/* Header expandido */}
      <div className="p-5 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-sm tracking-wider text-foreground">
              AGENTES DA OPERAÇÃO
            </h3>
            <p className="text-xs text-muted-foreground">
              {members.length} membro{members.length !== 1 ? 's' : ''} ativo{members.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {members.map((member, index) => {
            const isMasterMember = member.role === 'master';
            const isOnline = true; // Could be connected to realtime presence
            const hasActions = member.characters?.id || (isMaster && !isMasterMember);
            const char = member.characters;
            const classColor = char ? CLASS_COLORS[char.class] || 'from-muted/20 to-muted/10 border-muted/30' : '';
            
            // Cálculo de porcentagens
            const hpPercent = char ? getResourcePercentage(char.hp_current, char.hp_max) : 0;
            const pePercent = char ? getResourcePercentage(char.pe_current, char.pe_max) : 0;
            const sanPercent = char ? getResourcePercentage(char.san_current, char.san_max) : 0;
            
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'group relative rounded-xl overflow-hidden transition-all duration-300',
                  'border bg-gradient-to-br',
                  isMasterMember 
                    ? 'border-primary/40 from-primary/15 to-primary/5' 
                    : char 
                      ? classColor 
                      : 'border-border/50 from-secondary/30 to-secondary/10',
                  hasActions && 'cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5'
                )}
                onClick={() => handleMemberClick(member)}
              >
                {/* Conteúdo principal */}
                <div className="p-4">
                  {/* Header do card - Avatar e Info básica */}
                  <div className="flex items-start gap-3">
                    {/* Avatar expandido */}
                    <div className="relative flex-shrink-0">
                      <div className={cn(
                        'w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden',
                        'bg-muted border-2 transition-colors',
                        isMasterMember ? 'border-primary/60' : 'border-border/50 group-hover:border-primary/30'
                      )}>
                        {char?.photo_url ? (
                          <img 
                            src={char.photo_url} 
                            alt={char.name}
                            className="w-full h-full object-cover"
                          />
                        ) : member.profiles?.avatar_url ? (
                          <img 
                            src={member.profiles.avatar_url} 
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : isMasterMember ? (
                          <Crown className="w-6 h-6 text-primary" />
                        ) : (
                          <User className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      {/* Indicador online */}
                      <div className={cn(
                        'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card',
                        isOnline ? 'bg-emerald-500' : 'bg-muted-foreground'
                      )} />
                    </div>
                    
                    {/* Informações do jogador/personagem */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm truncate">
                          {member.profiles?.display_name || 'Jogador'}
                        </span>
                        {isMasterMember && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-display border border-primary/30">
                            MESTRE
                          </span>
                        )}
                      </div>
                      
                      {char ? (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground/90 truncate">
                            {char.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="px-1.5 py-0.5 rounded bg-muted/50">
                              {char.class}
                            </span>
                            <span>•</span>
                            <span className="font-mono">NEX {char.nex}%</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground/70 italic">
                          Aguardando personagem...
                        </p>
                      )}
                    </div>
                    
                    {/* Botão remover e indicador de ação */}
                    <div className="flex items-center gap-1">
                      {isMaster && !isMasterMember && onRemoveMember && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveMember(member.id);
                          }}
                        >
                          <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      )}
                      {hasActions && (
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>
                  
                  {/* Barras de recursos expandidas */}
                  {char && (
                    <div className="mt-4 space-y-2.5">
                      {/* PV */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Shield className="w-3.5 h-3.5 text-emerald-500" />
                            <span>PV</span>
                          </div>
                          <span className="font-mono text-foreground/80">
                            {char.hp_current}/{char.hp_max}
                          </span>
                        </div>
                        <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                          <motion.div 
                            className={cn('h-full rounded-full transition-colors', getResourceColor(hpPercent, 'hp'))}
                            initial={{ width: 0 }}
                            animate={{ width: `${hpPercent}%` }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                          />
                        </div>
                      </div>
                      
                      {/* PE */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Zap className="w-3.5 h-3.5 text-blue-500" />
                            <span>PE</span>
                          </div>
                          <span className="font-mono text-foreground/80">
                            {char.pe_current}/{char.pe_max}
                          </span>
                        </div>
                        <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                          <motion.div 
                            className={cn('h-full rounded-full', getResourceColor(pePercent, 'pe'))}
                            initial={{ width: 0 }}
                            animate={{ width: `${pePercent}%` }}
                            transition={{ duration: 0.5, delay: 0.15 }}
                          />
                        </div>
                      </div>
                      
                      {/* SAN */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Brain className="w-3.5 h-3.5 text-violet-500" />
                            <span>SAN</span>
                          </div>
                          <span className="font-mono text-foreground/80">
                            {char.san_current}/{char.san_max}
                          </span>
                        </div>
                        <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                          <motion.div 
                            className={cn('h-full rounded-full transition-colors', getResourceColor(sanPercent, 'san'))}
                            initial={{ width: 0 }}
                            animate={{ width: `${sanPercent}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Footer com patente (se tiver personagem) */}
                {char && char.patent && (
                  <div className="px-4 py-2 bg-muted/20 border-t border-border/30">
                    <p className="text-[10px] font-display tracking-wider text-muted-foreground uppercase">
                      {char.patent}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>

      {/* MobileActionSheet para ações do membro */}
      <MobileActionSheet
        open={actionSheetOpen}
        onOpenChange={setActionSheetOpen}
        title={selectedMember?.profiles?.display_name || 'Jogador'}
        description={selectedMember?.characters?.name 
          ? `${selectedMember.characters.name} • NEX ${selectedMember.characters.nex}%`
          : 'Sem personagem vinculado'
        }
        actions={getMemberActions()}
      />
    </aside>
  );
}

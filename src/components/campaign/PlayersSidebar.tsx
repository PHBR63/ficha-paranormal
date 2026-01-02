/**
 * PlayersSidebar - Barra lateral de jogadores da campanha
 * 
 * Exibe lista de membros com avatares, status online e barra de PV
 * Inclui MobileActionSheet para ações em cada membro
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, User, Circle, X, Eye, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MobileActionSheet } from '@/components/ui/mobile-action-sheet';
import { cn } from '@/lib/utils';

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
    hp_current: number;
    hp_max: number;
  } | null;
}

interface PlayersSidebarProps {
  members: Member[];
  masterId: string;
  isMaster: boolean;
  onRemoveMember?: (memberId: string) => void;
  onViewCharacter?: (characterId: string) => void;
}

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
    <aside className="w-72 border-l border-border bg-card/30 backdrop-blur-sm hidden lg:flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-display text-sm tracking-wider text-muted-foreground flex items-center gap-2">
          <User className="w-4 h-4" />
          JOGADORES ({members.length})
        </h3>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {members.map((member, index) => {
            const isMasterMember = member.role === 'master';
            const isOnline = true; // Could be connected to realtime presence
            const hasActions = member.characters?.id || (isMaster && !isMasterMember);
            
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'group p-3 rounded-lg transition-all',
                  'bg-secondary/30 border border-border/50 hover:border-border',
                  isMasterMember && 'border-primary/30 bg-primary/5',
                  hasActions && 'cursor-pointer hover:bg-secondary/50'
                )}
                onClick={() => handleMemberClick(member)}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      'bg-muted border border-border',
                      isMasterMember && 'border-primary/50'
                    )}>
                      {member.profiles?.avatar_url ? (
                        <img 
                          src={member.profiles.avatar_url} 
                          alt=""
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : isMasterMember ? (
                        <Crown className="w-4 h-4 text-primary" />
                      ) : (
                        <User className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    {/* Online indicator */}
                    <Circle 
                      className={cn(
                        'absolute -bottom-0.5 -right-0.5 w-3 h-3',
                        isOnline ? 'text-success fill-success' : 'text-muted-foreground fill-muted'
                      )}
                    />
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm truncate">
                        {member.profiles?.display_name || 'Jogador'}
                      </span>
                      {isMasterMember && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-display">
                          MESTRE
                        </span>
                      )}
                    </div>
                    {member.characters ? (
                      <p className="text-xs text-muted-foreground truncate">
                        {member.characters.name} • {member.characters.class}
                      </p>
                    ) : (
                      <p className="text-xs text-foreground/60 italic">
                        Sem personagem
                      </p>
                    )}
                  </div>
                  
                  {/* Remove button (mantido para hover rápido no desktop) */}
                  {isMaster && !isMasterMember && onRemoveMember && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveMember(member.id);
                      }}
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                    </Button>
                  )}
                </div>
                
                {/* Character HP bar */}
                {member.characters && (
                  <div className="mt-2 ml-[52px]">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span>PV</span>
                      <span>{member.characters.hp_current}/{member.characters.hp_max}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-destructive to-destructive/70 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(member.characters.hp_current / member.characters.hp_max) * 100}%` }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      />
                    </div>
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

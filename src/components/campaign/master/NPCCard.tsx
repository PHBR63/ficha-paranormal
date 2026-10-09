/**
 * NPCCard - Card de exibição de NPC
 * 
 * Exibe informações resumidas do NPC com ações rápidas.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Swords,
  Shield,
  Heart,
  Zap,
  Eye,
  EyeOff,
  User,
  Skull,
  Users,
  Ghost,
  Minus,
  Plus,
} from '@/components/icons/ordem-icons';
import type { CampaignNPC } from './NPCManager';

// Configuração de categorias
const CATEGORY_CONFIG: Record<string, { icon: typeof Users; label: string; color: string; bgColor: string }> = {
  ally: { icon: User, label: 'Aliado', color: 'text-green-500', bgColor: 'bg-green-500/10' },
  enemy: { icon: Skull, label: 'Inimigo', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  neutral: { icon: Users, label: 'Neutro', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  creature: { icon: Ghost, label: 'Criatura', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
};

interface NPCCardProps {
  npc: CampaignNPC;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleActive: () => void;
  onAddToCombat?: () => void;
  onUpdateHP: (hp: number) => void;
}

export function NPCCard({
  npc,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleActive,
  onAddToCombat,
  onUpdateHP,
}: NPCCardProps) {
  const [hpInput, setHpInput] = useState<string | null>(null);
  
  const config = CATEGORY_CONFIG[npc.category] || CATEGORY_CONFIG.neutral;
  const CategoryIcon = config.icon;
  
  const hpPercentage = (npc.hp_current / npc.hp_max) * 100;
  const pePercentage = npc.pe_max > 0 ? (npc.pe_current / npc.pe_max) * 100 : 0;

  // Ajusta HP
  const adjustHP = (delta: number) => {
    const newHP = Math.max(0, Math.min(npc.hp_max, npc.hp_current + delta));
    onUpdateHP(newHP);
  };

  // Confirma HP manual
  const confirmHP = () => {
    if (hpInput !== null) {
      const newHP = Math.max(0, Math.min(npc.hp_max, parseInt(hpInput) || 0));
      onUpdateHP(newHP);
      setHpInput(null);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'ordo-panel p-4 transition-all',
        !npc.is_active && 'opacity-50'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg shrink-0',
            config.bgColor
          )}>
            <CategoryIcon className={cn('w-4 h-4', config.color)} />
          </div>
          <div className="min-w-0">
            <h4 className="font-medium truncate">{npc.name}</h4>
            <Badge variant="outline" className={cn('text-xs', config.color)}>
              {config.label}
            </Badge>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onAddToCombat && (
              <DropdownMenuItem onClick={onAddToCombat}>
                <Swords className="w-4 h-4 mr-2" />
                Adicionar ao Combate
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onEdit}>
              <Edit2 className="w-4 h-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleActive}>
              {npc.is_active ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Ocultar
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Mostrar
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Descrição */}
      {npc.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {npc.description}
        </p>
      )}

      {/* Stats */}
      <div className="space-y-3">
        {/* HP Bar com controles */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-red-500" />
              <span className="text-muted-foreground">PV</span>
            </div>
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => adjustHP(-1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>-1 PV</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {hpInput !== null ? (
                <Input
                  type="number"
                  value={hpInput}
                  onChange={(e) => setHpInput(e.target.value)}
                  onBlur={confirmHP}
                  onKeyDown={(e) => e.key === 'Enter' && confirmHP()}
                  className="w-16 h-6 text-center text-xs"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setHpInput(npc.hp_current.toString())}
                  className="font-medium hover:underline"
                >
                  {npc.hp_current}/{npc.hp_max}
                </button>
              )}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => adjustHP(1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>+1 PV</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <Progress 
            value={hpPercentage} 
            className={cn(
              "h-2",
              hpPercentage > 50 ? '[&>div]:bg-green-500' :
              hpPercentage > 25 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500'
            )}
          />
        </div>

        {/* PE Bar (se tiver) */}
        {npc.pe_max > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-muted-foreground">PE</span>
              </div>
              <span className="font-medium">{npc.pe_current}/{npc.pe_max}</span>
            </div>
            <Progress 
              value={pePercentage} 
              className="h-2 [&>div]:bg-blue-500"
            />
          </div>
        )}

        {/* Defesa e Movimento */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-sm">
                  <Shield className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">{npc.defense}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Defesa</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="text-xs text-muted-foreground">
            Mov: {npc.movement}m
          </div>

          {onAddToCombat && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1"
                    onClick={onAddToCombat}
                  >
                    <Swords className="w-3.5 h-3.5" />
                    Combate
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Adicionar ao combate atual</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default NPCCard;

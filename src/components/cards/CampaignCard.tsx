"use client";

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { MagicCard } from "@/components/ui/magic-card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Crown, 
  Calendar, 
  ChevronRight, 
  Trash2, 
  MapPin,
  Pause,
  CheckCircle,
  Archive,
  Play
} from "lucide-react";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Interface para dados da campanha no card
 */
export interface CampaignCardData {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  status: 'active' | 'paused' | 'completed' | 'archived';
  current_session: number;
  master_id: string;
  master_name?: string;
  master_avatar?: string | null;
  player_count: number;
  next_session?: string | null;
  user_character?: {
    id: string;
    name: string;
    class: string;
    photo_url?: string | null;
  } | null;
  is_master: boolean;
}

interface CampaignCardProps {
  campaign: CampaignCardData;
  onDelete?: (id: string, name: string) => void;
  index?: number;
}

// Configuração de cores de status com alta visibilidade
const STATUS_CONFIG = {
  active: { 
    label: 'Ativa', 
    icon: Play, 
    color: 'text-emerald-300',
    bgColor: 'bg-emerald-500/25',
    borderColor: 'border-emerald-400/50'
  },
  paused: { 
    label: 'Pausada', 
    icon: Pause, 
    color: 'text-amber-300',
    bgColor: 'bg-amber-500/25',
    borderColor: 'border-amber-400/50'
  },
  completed: { 
    label: 'Concluída', 
    icon: CheckCircle, 
    color: 'text-sky-300',
    bgColor: 'bg-sky-500/25',
    borderColor: 'border-sky-400/50'
  },
  archived: { 
    label: 'Arquivada', 
    icon: Archive, 
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-500/20',
    borderColor: 'border-zinc-400/40'
  },
} as const;

/**
 * CampaignCard - Card de campanha para o Dashboard
 * 
 * Exibe informações completas da campanha:
 * - Imagem de capa
 * - Status (ativa/pausada/concluída/arquivada)
 * - Número de jogadores
 * - Próxima sessão agendada
 * - Personagem vinculado do usuário
 * - Indicador de mestre
 */
export function CampaignCard({ 
  campaign, 
  onDelete, 
  index = 0 
}: CampaignCardProps) {
  const statusConfig = STATUS_CONFIG[campaign.status];
  const StatusIcon = statusConfig.icon;

  // Verifica se a próxima sessão é em breve (próximos 3 dias)
  const isSessionSoon = campaign.next_session && 
    isAfter(new Date(campaign.next_session), new Date()) &&
    isBefore(new Date(campaign.next_session), addDays(new Date(), 3));

  // Formata a data da próxima sessão
  const formattedNextSession = campaign.next_session 
    ? format(new Date(campaign.next_session), "dd 'de' MMM', 'HH:mm", { locale: ptBR })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <MagicCard
        className="group overflow-hidden"
        gradientColor="hsl(var(--primary))"
        gradientOpacity={0.15}
        tiltAmount={6}
      >
        {/* Imagem de capa */}
        <div className="relative h-32 sm:h-40 overflow-hidden">
          {campaign.cover_image_url ? (
            <img 
              src={campaign.cover_image_url} 
              alt={campaign.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-background to-primary/10 flex items-center justify-center">
              <MapPin className="w-12 h-12 text-primary/30" />
            </div>
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          
          {/* Status badge */}
          <div className="absolute top-3 right-3">
            <Badge 
              variant="outline" 
              className={cn(
                "font-mono text-[10px] uppercase tracking-wider",
                statusConfig.bgColor,
                statusConfig.borderColor,
                statusConfig.color
              )}
            >
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Indicador de mestre */}
          {campaign.is_master && (
            <div className="absolute top-3 left-3">
              <Badge 
                variant="outline" 
                className="bg-accent/10 border-accent/30 text-accent font-mono text-[10px] uppercase tracking-wider"
              >
                <Crown className="w-3 h-3 mr-1" />
                Mestre
              </Badge>
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="p-4 sm:p-5">
          {/* Título e descrição */}
          <h4 className="font-display text-lg sm:text-xl tracking-wide text-foreground mb-1 truncate">
            {campaign.name}
          </h4>
          {campaign.description && (
            <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2 mb-3">
              {campaign.description}
            </p>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-muted-foreground">
            {/* Jogadores */}
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{campaign.player_count} jogador{campaign.player_count !== 1 ? 'es' : ''}</span>
            </div>

            {/* Sessão atual */}
            <div className="flex items-center gap-1.5">
              <span className="text-primary font-mono">#{campaign.current_session}</span>
              <span>sessão</span>
            </div>

            {/* Próxima sessão */}
            {formattedNextSession && (
              <div className={cn(
                "flex items-center gap-1.5",
                isSessionSoon && "text-accent"
              )}>
                <Calendar className="w-3.5 h-3.5" />
                <span>{formattedNextSession}</span>
              </div>
            )}
          </div>

          {/* Personagem vinculado */}
          {campaign.user_character && !campaign.is_master && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10 mb-4">
              <Avatar className="w-8 h-8">
                {campaign.user_character.photo_url ? (
                  <AvatarImage src={campaign.user_character.photo_url} />
                ) : null}
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {campaign.user_character.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{campaign.user_character.name}</p>
                <p className="text-[10px] text-muted-foreground/80 uppercase tracking-wider">
                  {campaign.user_character.class}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link to={`/campaigns/${campaign.id}`} className="flex-1">
              <Button 
                variant="secondary" 
                className="w-full group-hover:bg-primary/20 transition-colors"
              >
                {campaign.is_master ? 'Abrir Mesa' : 'Entrar na Sessão'}
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            {onDelete && campaign.is_master && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(campaign.id, campaign.name)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </MagicCard>
    </motion.div>
  );
}

/**
 * Grid container para cards de campanha
 */
interface CampaignGridProps {
  campaigns: CampaignCardData[];
  onDelete?: (id: string, name: string) => void;
}

export function CampaignGrid({ campaigns, onDelete }: CampaignGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {campaigns.map((campaign, index) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          onDelete={onDelete}
          index={index}
        />
      ))}
    </div>
  );
}

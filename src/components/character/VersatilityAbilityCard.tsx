/**
 * VersatilityAbilityCard - Exibe a habilidade obtida via Versatilidade (NEX 50%)
 * 
 * Mostra a habilidade de outra trilha que o personagem adquiriu no NEX 50%,
 * incluindo nome, descrição, mecânicas e indicador visual de que é de Versatilidade.
 * 
 * @module VersatilityAbilityCard
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Route, 
  Sparkles, 
  Sword, 
  Brain,
  Info,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTrackById, getInitialAbility } from '@/lib/class-powers/track-registry';

// ========== TIPOS ==========

interface VersatilityTrackInfo {
  trackId: string;
  trackName: string;
  abilityId: string;
  abilityName: string;
}

interface VersatilityAbilityCardProps {
  /** Dados da trilha de Versatilidade */
  versatilityTrack: VersatilityTrackInfo;
  /** Classe do personagem (para ícone/cor) */
  classId: string;
  /** Se o card deve ser compacto */
  compact?: boolean;
}

// ========== CONSTANTES ==========

const CLASS_ICONS: Record<string, React.ElementType> = {
  'Combatente': Sword,
  'Especialista': Brain,
  'Ocultista': Sparkles,
};

const CLASS_COLORS: Record<string, string> = {
  'Combatente': 'border-red-500/30 bg-red-500/5',
  'Especialista': 'border-green-500/30 bg-green-500/5',
  'Ocultista': 'border-purple-500/30 bg-purple-500/5',
};

// ========== COMPONENTE ==========

export function VersatilityAbilityCard({
  versatilityTrack,
  classId,
  compact = false,
}: VersatilityAbilityCardProps) {
  // Busca dados completos da habilidade
  const abilityData = useMemo(() => {
    const track = getTrackById(versatilityTrack.trackId);
    if (!track) return null;
    
    const ability = track.abilities.find(a => a.id === versatilityTrack.abilityId);
    if (!ability) return null;
    
    return {
      track,
      ability,
    };
  }, [versatilityTrack.trackId, versatilityTrack.abilityId]);
  
  const ClassIcon = CLASS_ICONS[classId] || Route;
  const classColor = CLASS_COLORS[classId] || 'border-primary/30 bg-primary/5';
  
  if (!abilityData) {
    // Fallback se não encontrar dados (exibe informação básica)
    return (
      <Card className={cn("border-dashed", classColor)}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Route className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-medium">Versatilidade</CardTitle>
            <Badge variant="secondary" className="ml-auto text-xs">NEX 50%</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{versatilityTrack.abilityName}</span>
            {' '}da trilha {versatilityTrack.trackName}
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const { track, ability } = abilityData;
  const mechanics = ability.effects?.base;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        "border-2 transition-all hover:shadow-md",
        classColor
      )}>
        <CardHeader className={compact ? "pb-2 py-3" : "pb-3"}>
          <div className="flex items-center gap-2">
            {/* Ícone da classe */}
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <ClassIcon className="w-4 h-4 text-primary" />
            </div>
            
            {/* Título e trilha */}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold text-foreground truncate">
                {ability.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Trilha {track.name}
              </p>
            </div>
            
            {/* Badge de Versatilidade */}
            <Badge 
              variant="outline" 
              className="flex items-center gap-1 text-xs bg-primary/10 border-primary/30 text-primary"
            >
              <Route className="w-3 h-3" />
              Versatilidade
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className={compact ? "pt-0 pb-3" : "pt-0"}>
          {/* Descrição */}
          <p className={cn(
            "text-sm text-muted-foreground",
            compact ? "line-clamp-2" : "line-clamp-4"
          )}>
            {ability.description}
          </p>
          
          {/* Mecânicas (se houver) */}
          {mechanics && (
            <div className="mt-3 flex flex-wrap gap-2">
              {/* Custo de PE */}
              {mechanics.activation?.cost && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {mechanics.activation.cost} PE
                </Badge>
              )}
              
              {/* Tipo de ação */}
              {mechanics.activation?.action && (
                <Badge variant="outline" className="text-xs">
                  {mechanics.activation.action === 'reaction' ? 'Reação' :
                   mechanics.activation.action === 'complete' ? 'Completa' :
                   mechanics.activation.action}
                </Badge>
              )}
              
              {/* Bônus de dano */}
              {mechanics.damageBonus?.value && (
                <Badge variant="secondary" className="text-xs">
                  +{mechanics.damageBonus.value} dano
                </Badge>
              )}
            </div>
          )}
          
          {/* Indicador de fonte */}
          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <Info className="w-3 h-3" />
            <span>Obtido no NEX 50% via Versatilidade</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

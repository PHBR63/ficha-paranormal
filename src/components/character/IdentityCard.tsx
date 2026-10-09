/**
 * IdentityCard - Card de identidade do personagem
 * Mostra foto, classe, origem, NEX e patente
 */

import { motion } from 'framer-motion';
import { Shield, ArrowUp, Sparkles } from '@/components/icons/ordem-icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ORIGINS, getTrackById } from '@/lib/character-data';

interface IdentityCardProps {
  name: string;
  photoUrl?: string | null;
  characterClass: string;
  classTrack?: string | null;
  origin: string;
  nex: number;
  patent: string;
  onLevelUp?: () => void;
  className?: string;
}

export function IdentityCard({
  name,
  photoUrl,
  characterClass,
  classTrack,
  origin,
  nex,
  patent,
  onLevelUp,
  className,
}: IdentityCardProps) {
  const originData = ORIGINS.find(o => o.id === origin);
  const trackData = classTrack ? getTrackById(classTrack) : null;

  // Cor temática por classe
  const classColors: Record<string, string> = {
    'Combatente': 'border-destructive/50',
    'Especialista': 'border-secondary/50',
    'Ocultista': 'border-paranormal/50',
  };

  return (
    <div className={cn("ordo-panel p-4", className)}>
      <div className="flex gap-4">
        {/* Foto do personagem */}
        <motion.div 
          className={cn(
            "w-24 h-24 rounded-lg bg-secondary/20 border-2 flex-shrink-0 overflow-hidden",
            classColors[characterClass] || 'border-border'
          )}
          whileHover={{ scale: 1.02 }}
        >
          {photoUrl ? (
            <img 
              src={photoUrl} 
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Shield className="w-10 h-10 text-muted-foreground/30" />
            </div>
          )}
        </motion.div>

        {/* Informações */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Classe */}
          <div>
            <p className="text-[10px] text-foreground/60 uppercase tracking-wider">CLASSE</p>
            <p className="font-display text-lg leading-tight">{characterClass}</p>
          </div>

          {/* Trilha (se houver) */}
          {trackData && (
            <div className="flex items-center gap-1 text-xs text-primary">
              <Sparkles className="w-3 h-3" />
              <span>{trackData.name}</span>
            </div>
          )}

          {/* Origem */}
          <div>
            <p className="text-[10px] text-foreground/60 uppercase tracking-wider">ORIGEM</p>
            <p className="font-display text-sm leading-tight truncate">
              {originData?.name || origin}
            </p>
          </div>
        </div>

        {/* NEX e Patente */}
        <div className="text-right flex flex-col items-end justify-between">
          <div>
            <p className="text-[10px] text-foreground/60 uppercase tracking-wider">NEX</p>
            <motion.p 
              key={nex}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="font-display text-3xl text-secondary"
            >
              {nex}%
            </motion.p>
            <span className="patent-badge text-[10px]">{patent}</span>
          </div>

          {/* Botão de subir NEX */}
          {nex < 99 && onLevelUp && (
            <Button
              variant="outline"
              size="sm"
              onClick={onLevelUp}
              className="text-xs h-7 border-primary/50 text-primary hover:bg-primary/10 mt-2"
            >
              <ArrowUp className="w-3 h-3 mr-1" />
              SUBIR NEX
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
/**
 * LiveDossierPreview - Preview visual do dossiê do agente em construção
 * 
 * Mostra uma ficha visual que vai se preenchendo progressivamente durante
 * a criação do personagem, com animações suaves e feedback visual.
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, Heart, Zap, Brain, Footprints, 
  MapPin, Sword, Route, Sparkles, Lock, Check,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CharacterFormData } from '@/pages/CharacterCreate';
import { ORIGINS, CLASSES, getTrackById, calculateDerivedStats, calculateDefense } from '@/lib/character-data';
import { ATTRIBUTE_ABBR, type AttributeKey } from '@/lib/constants/attributes';

interface LiveDossierPreviewProps {
  formData: CharacterFormData;
  currentStep: number;
  completedSteps: number[];
}

// Cores por classe para tema visual
const CLASS_THEMES: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  Combatente: { 
    bg: 'bg-red-500/10', 
    border: 'border-red-500/30', 
    text: 'text-red-400',
    glow: 'shadow-red-500/20'
  },
  Especialista: { 
    bg: 'bg-blue-500/10', 
    border: 'border-blue-500/30', 
    text: 'text-blue-400',
    glow: 'shadow-blue-500/20'
  },
  Ocultista: { 
    bg: 'bg-purple-500/10', 
    border: 'border-purple-500/30', 
    text: 'text-purple-400',
    glow: 'shadow-purple-500/20'
  },
};

// Componente para seção bloqueada
function LockedSection({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground/50">
      <Lock className="w-3 h-3" />
      <span className="text-xs italic">{label}</span>
    </div>
  );
}

// Componente para seção com check de completo
function CompletedBadge() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="flex items-center justify-center w-4 h-4 rounded-full bg-primary"
    >
      <Check className="w-3 h-3 text-primary-foreground" />
    </motion.div>
  );
}

export function LiveDossierPreview({ 
  formData, 
  currentStep,
  completedSteps 
}: LiveDossierPreviewProps) {
  const origin = ORIGINS.find(o => o.id === formData.origin);
  const characterClass = CLASSES.find(c => c.id === formData.characterClass);
  const track = formData.classTrack ? getTrackById(formData.classTrack) : null;
  const theme = characterClass ? CLASS_THEMES[characterClass.id] : null;

  // Calcular stats derivados
  const derivedStats = useMemo(() => {
    if (!formData.characterClass) return null;
    
    const stats = calculateDerivedStats(
      formData.characterClass,
      formData.attributes.vigor,
      formData.attributes.presence,
      formData.nex,
      formData.origin,
      formData.abilities,
      0
    );
    
    return {
      ...stats,
      defense: calculateDefense(formData.attributes.agility),
      movement: formData.origin === 'atleta' ? 12 : 9,
    };
  }, [formData]);

  // Verificar quais seções estão desbloqueadas
  const sections = {
    identity: formData.name.length >= 2,
    nex: true,
    attributes: completedSteps.some(s => s >= 3),
    origin: !!formData.origin,
    class: !!formData.characterClass,
    track: !!formData.classTrack,
    rituals: formData.characterClass === 'Ocultista' && formData.rituals.length > 0,
  };

  return (
    <motion.div
      className={cn(
        'rounded-lg border overflow-hidden',
        'bg-card/80 backdrop-blur-sm',
        theme?.border || 'border-border'
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header com foto e nome */}
      <div className={cn(
        'p-4 border-b',
        theme?.bg || 'bg-muted/30',
        theme?.border || 'border-border'
      )}>
        <div className="flex items-start gap-3">
          {/* Avatar/Foto placeholder */}
          <div className={cn(
            'w-16 h-16 rounded-lg flex items-center justify-center',
            'bg-muted/50 border border-dashed',
            theme?.border || 'border-muted-foreground/30'
          )}>
            {formData.photoUrl ? (
              <img 
                src={formData.photoUrl} 
                alt="Avatar" 
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <User className="w-8 h-8 text-muted-foreground/50" />
            )}
          </div>

          {/* Nome e conceito */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {sections.identity ? (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                >
                  <h3 className={cn(
                    'font-display text-lg tracking-wider truncate',
                    theme?.text || 'text-primary'
                  )}>
                    {formData.name}
                  </h3>
                  {formData.concept && (
                    <p className="text-xs text-muted-foreground italic truncate">
                      "{formData.concept}"
                    </p>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-1"
                >
                  <div className="h-5 w-32 bg-muted/50 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-muted/30 rounded animate-pulse" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* NEX Badge */}
            <motion.div 
              className="flex items-center gap-2 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <span className={cn(
                'px-2 py-0.5 rounded text-xs font-bold',
                theme?.bg || 'bg-secondary/20',
                theme?.text || 'text-secondary'
              )}>
                NEX {formData.nex}%
              </span>
              {/* Indicador visual de nível */}
              <div className="flex gap-0.5">
                {[5, 25, 50, 75, 99].map((threshold, i) => (
                  <div
                    key={threshold}
                    className={cn(
                      'w-1.5 h-3 rounded-sm transition-colors',
                      formData.nex >= threshold 
                        ? (theme?.text || 'bg-secondary') + ' bg-current'
                        : 'bg-muted/30'
                    )}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Corpo do dossiê */}
      <div className="p-3 space-y-3">
        {/* Origem, Classe, Trilha */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {/* Origem */}
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase">Origem</span>
            </div>
            <AnimatePresence mode="wait">
              {sections.origin ? (
                <motion.p
                  key={origin?.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-xs font-medium truncate"
                >
                  {origin?.name}
                </motion.p>
              ) : (
                <LockedSection label="..." />
              )}
            </AnimatePresence>
          </div>

          {/* Classe */}
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Sword className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase">Classe</span>
            </div>
            <AnimatePresence mode="wait">
              {sections.class ? (
                <motion.p
                  key={characterClass?.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn('text-xs font-medium truncate', theme?.text)}
                >
                  {characterClass?.name}
                </motion.p>
              ) : (
                <LockedSection label="..." />
              )}
            </AnimatePresence>
          </div>

          {/* Trilha */}
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Route className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase">Trilha</span>
            </div>
            <AnimatePresence mode="wait">
              {sections.track ? (
                <motion.p
                  key={track?.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-xs font-medium truncate"
                >
                  {track?.name}
                </motion.p>
              ) : (
                <LockedSection label="..." />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Separador */}
        <div className={cn('h-px', theme?.bg || 'bg-border')} />

        {/* Stats */}
        <AnimatePresence mode="wait">
          {derivedStats ? (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-5 gap-1"
            >
              {/* PV */}
              <div className="text-center p-1.5 rounded bg-red-500/10 border border-red-500/20">
                <Heart className="w-3 h-3 mx-auto text-red-400 mb-0.5" />
                <p className="text-[10px] text-red-400/70">PV</p>
                <p className="font-display text-sm text-red-400">{derivedStats.hp}</p>
              </div>

              {/* PE */}
              <div className="text-center p-1.5 rounded bg-secondary/10 border border-secondary/20">
                <Zap className="w-3 h-3 mx-auto text-secondary mb-0.5" />
                <p className="text-[10px] text-secondary/70">PE</p>
                <p className="font-display text-sm text-secondary">{derivedStats.pe}</p>
              </div>

              {/* SAN */}
              <div className="text-center p-1.5 rounded bg-purple-500/10 border border-purple-500/20">
                <Brain className="w-3 h-3 mx-auto text-purple-400 mb-0.5" />
                <p className="text-[10px] text-purple-400/70">SAN</p>
                <p className="font-display text-sm text-purple-400">{derivedStats.san}</p>
              </div>

              {/* DEF */}
              <div className="text-center p-1.5 rounded bg-muted/30 border border-muted/50">
                <Shield className="w-3 h-3 mx-auto text-muted-foreground mb-0.5" />
                <p className="text-[10px] text-muted-foreground">DEF</p>
                <p className="font-display text-sm">{derivedStats.defense}</p>
              </div>

              {/* MOV */}
              <div className="text-center p-1.5 rounded bg-muted/30 border border-muted/50">
                <Footprints className="w-3 h-3 mx-auto text-muted-foreground mb-0.5" />
                <p className="text-[10px] text-muted-foreground">MOV</p>
                <p className="font-display text-sm">{derivedStats.movement}m</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="stats-placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-5 gap-1"
            >
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="text-center p-1.5 rounded bg-muted/20 border border-dashed border-muted/30">
                  <div className="w-3 h-3 mx-auto bg-muted/30 rounded mb-0.5" />
                  <div className="h-2 w-6 mx-auto bg-muted/20 rounded mb-1" />
                  <div className="h-4 w-8 mx-auto bg-muted/30 rounded" />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Atributos */}
        {sections.attributes && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="pt-2"
          >
            <div className="flex items-center justify-center gap-3">
              {Object.entries(formData.attributes).map(([key, value]) => (
                <motion.div
                  key={key}
                  className="text-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <p className="text-[9px] text-muted-foreground uppercase">
                    {ATTRIBUTE_ABBR[key as AttributeKey]}
                  </p>
                  <p className={cn(
                    'font-display text-sm',
                    value === 0 && 'text-destructive',
                    value >= 4 && 'text-primary'
                  )}>
                    {value}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Rituais (apenas Ocultista) */}
        {sections.rituals && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-1 pt-1"
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span className="text-[10px] text-purple-400">
              {formData.rituals.length} rituais conhecidos
            </span>
          </motion.div>
        )}
      </div>

      {/* Footer com indicador de visualização */}
      <div className={cn(
        'px-3 py-2 border-t flex items-center justify-center gap-1',
        'bg-muted/20',
        theme?.border || 'border-border'
      )}>
        <Eye className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">Preview do Dossiê</span>
      </div>
    </motion.div>
  );
}

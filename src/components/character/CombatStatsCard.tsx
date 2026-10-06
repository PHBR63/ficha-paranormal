/**
 * CombatStatsCard - Card consolidado de stats de combate
 * Mostra HP, PE, SAN em um layout compacto e visual
 */

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Zap, Brain, Edit2, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AnimatedProgress } from '@/components/ui/animated-progress';
import { HeartbeatIcon } from '@/components/character/HeartbeatIcon';
import { cn } from '@/lib/utils';

interface CombatStatsCardProps {
  hpCurrent: number;
  hpMax: number;
  peCurrent: number;
  peMax: number;
  sanCurrent: number;
  sanMax: number;
  onStatsChange?: (stats: { hp: number; pe: number; san: number }) => void | boolean | Promise<void | boolean>;
  className?: string;
}

export function CombatStatsCard({
  hpCurrent,
  hpMax,
  peCurrent,
  peMax,
  sanCurrent,
  sanMax,
  onStatsChange,
  className,
}: CombatStatsCardProps) {
  const [editMode, setEditMode] = useState(false);
  const [tempHp, setTempHp] = useState(hpCurrent);
  const [tempPe, setTempPe] = useState(peCurrent);
  const [tempSan, setTempSan] = useState(sanCurrent);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveLock = useRef(false);

  // Percentuais para animações (clampados entre 0 e 100)
  const hpPercent = Math.min(100, Math.max(0, (hpCurrent / hpMax) * 100));
  const pePercent = Math.min(100, Math.max(0, (peCurrent / peMax) * 100));
  const sanPercent = Math.min(100, Math.max(0, (sanCurrent / sanMax) * 100));

  // Valores de exibição (clampados para não mostrar negativos ou acima do max)
  const displayHp = Math.max(0, hpCurrent);
  const displayPe = Math.max(0, peCurrent);
  const displaySan = Math.max(0, sanCurrent);

  // Estados críticos
  const isHpLow = hpPercent <= 25;
  const isSanLow = sanPercent <= 30;
  
  // Estados de colapso (HP ou SAN = 0)
  const isUnconscious = displayHp === 0; // Inconsciente
  const isMentalCollapse = displaySan === 0; // Colapso mental

  // Fecha somente após a gravação confirmada; valores inválidos não são ajustados silenciosamente.
  const handleSave = async () => {
    if (saveLock.current || !onStatsChange) return;
    if ([[tempHp, hpMax], [tempPe, peMax], [tempSan, sanMax]].some(([value, max]) => !Number.isInteger(value) || value < 0 || value > max)) {
      setSaveError('Informe valores inteiros entre zero e o máximo de cada recurso.');
      return;
    }
    saveLock.current = true; setSaving(true); setSaveError(null);
    try {
      const confirmed = await onStatsChange({ hp: tempHp, pe: tempPe, san: tempSan });
      if (confirmed === false) throw new Error('Gravação não confirmada.');
      setEditMode(false);
    }
    catch { setSaveError('Não foi possível confirmar os recursos. Confira a conexão e tente novamente.'); }
    finally { saveLock.current = false; setSaving(false); }
  };

  const handleCancel = () => {
    setTempHp(hpCurrent);
    setTempPe(peCurrent);
    setTempSan(sanCurrent);
    setEditMode(false);
  };

  const startEdit = () => {
    setSaveError(null);
    setTempHp(hpCurrent);
    setTempPe(peCurrent);
    setTempSan(sanCurrent);
    setEditMode(true);
  };

  // Efeito de pulsação intensa para estados críticos
  const showIntensePulse = isHpLow || isSanLow;
  const pulseColor = isHpLow ? "rgba(220, 38, 38, 0.4)" : "rgba(168, 85, 247, 0.4)";

  return (
    <motion.div 
      className={cn(
        "ordo-panel p-4 space-y-4 relative overflow-hidden",
        showIntensePulse && "border-destructive/50",
        className
      )}
      animate={showIntensePulse ? {
        boxShadow: [
          `0 0 0px 0px ${pulseColor}`,
          `0 0 20px 5px ${pulseColor}`,
          `0 0 0px 0px ${pulseColor}`,
        ],
      } : {}}
      transition={showIntensePulse ? {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      } : {}}
    >
      {/* Overlay de pulsação vermelha para estados críticos */}
      <AnimatePresence>
        {showIntensePulse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.15, 0],
              scale: [1, 1.02, 1],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={cn(
              "absolute inset-0 pointer-events-none rounded-lg",
              isHpLow ? "bg-destructive" : "bg-paranormal"
            )}
          />
        )}
      </AnimatePresence>
      {/* Header com botão de edição */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-foreground/70 uppercase tracking-wider">
          RECURSOS
        </span>
        {editMode ? (
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={handleSave}
              aria-label="Salvar recursos"
              disabled={saving}
            >
              <Check className="w-3 h-3 text-primary" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={handleCancel}
              aria-label="Cancelar edição de recursos"
              disabled={saving}
            >
              <X className="w-3 h-3 text-destructive" />
            </Button>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={startEdit}
            aria-label="Editar recursos"
            disabled={!onStatsChange}
          >
            <Edit2 className="w-3 h-3 text-muted-foreground" />
          </Button>
        )}
      </div>

      {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
      {saving && <p role="status" className="text-sm text-muted-foreground">Salvando recursos...</p>}

      {/* HP - Pontos de Vida */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartbeatIcon hpPercent={hpPercent} size="md" />
            <span className="text-sm font-medium">PV</span>
          </div>
          {editMode ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={Number.isNaN(tempHp) ? '' : tempHp}
                onChange={(e) => setTempHp(e.target.value === '' ? NaN : Number(e.target.value))}
                aria-label="PV atual"
                disabled={saving}
                className="w-16 h-7 text-center text-sm"
                min={0}
                max={hpMax}
              />
              <span className="text-muted-foreground">/</span>
              <span className="font-display text-lg">{hpMax}</span>
            </div>
          ) : (
            <motion.span 
              key={displayHp}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className={cn(
                "font-display text-xl",
                isHpLow ? "text-destructive" : "text-hp"
              )}
            >
              {displayHp}/{hpMax}
            </motion.span>
          )}
        </div>
        <AnimatedProgress 
          value={editMode ? tempHp : hpCurrent} 
          max={hpMax} 
          variant="hp" 
          size="md" 
          glow={isHpLow} 
        />
      </div>

      {/* PE - Pontos de Esforço */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-pe" />
            <span className="text-sm font-medium">PE</span>
          </div>
          {editMode ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={Number.isNaN(tempPe) ? '' : tempPe}
                onChange={(e) => setTempPe(e.target.value === '' ? NaN : Number(e.target.value))}
                aria-label="PE atual"
                disabled={saving}
                className="w-16 h-7 text-center text-sm"
                min={0}
                max={peMax}
              />
              <span className="text-muted-foreground">/</span>
              <span className="font-display text-lg">{peMax}</span>
            </div>
          ) : (
            <motion.span 
              key={displayPe}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="font-display text-xl text-pe"
            >
              {displayPe}/{peMax}
            </motion.span>
          )}
        </div>
        <AnimatedProgress 
          value={editMode ? tempPe : peCurrent} 
          max={peMax} 
          variant="pe" 
          size="md" 
        />
      </div>

      {/* SAN - Sanidade */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              isSanLow && "animate-pulse"
            )}>
              <Brain className={cn(
                "w-5 h-5",
                isSanLow ? "text-paranormal" : "text-san"
              )} />
            </div>
            <span className="text-sm font-medium">SAN</span>
          </div>
          {editMode ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={Number.isNaN(tempSan) ? '' : tempSan}
                onChange={(e) => setTempSan(e.target.value === '' ? NaN : Number(e.target.value))}
                aria-label="SAN atual"
                disabled={saving}
                className="w-16 h-7 text-center text-sm"
                min={0}
                max={sanMax}
              />
              <span className="text-muted-foreground">/</span>
              <span className="font-display text-lg">{sanMax}</span>
            </div>
          ) : (
            <motion.span 
              key={displaySan}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className={cn(
                "font-display text-xl",
                isSanLow ? "text-paranormal" : "text-san"
              )}
            >
              {displaySan}/{sanMax}
            </motion.span>
          )}
        </div>
        <AnimatedProgress 
          value={editMode ? tempSan : sanCurrent} 
          max={sanMax} 
          variant="san" 
          size="md" 
          glow={isSanLow} 
        />
      </div>

      {/* Indicadores de estado crítico e colapso */}
      <AnimatePresence mode="wait">
        {/* Estado de Colapso Total (HP e SAN = 0) */}
        {isUnconscious && isMentalCollapse && (
          <motion.div
            key="total-collapse"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              boxShadow: [
                '0 0 0 0 rgba(239, 68, 68, 0)',
                '0 0 20px 5px rgba(239, 68, 68, 0.4)',
                '0 0 0 0 rgba(239, 68, 68, 0)',
              ],
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ boxShadow: { duration: 1.5, repeat: Infinity } }}
            className="relative text-center py-2 px-3 rounded-lg bg-gradient-to-r from-destructive/30 via-paranormal/30 to-destructive/30 border border-destructive/50"
          >
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="text-destructive font-display text-sm tracking-wider"
            >
              PV E SAN EM ZERO
            </motion.div>
            <p className="text-[10px] text-foreground/60 mt-0.5">
              Confira as condições ativas e a contagem da cena com o mestre.
            </p>
          </motion.div>
        )}

        {/* Estado Inconsciente (HP = 0) */}
        {isUnconscious && !isMentalCollapse && (
          <motion.div
            key="unconscious"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              boxShadow: [
                '0 0 0 0 rgba(239, 68, 68, 0)',
                '0 0 15px 3px rgba(239, 68, 68, 0.3)',
                '0 0 0 0 rgba(239, 68, 68, 0)',
              ],
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ boxShadow: { duration: 1.5, repeat: Infinity } }}
            className="relative text-center py-2 px-3 rounded-lg bg-destructive/20 border border-destructive/40"
          >
            <motion.div
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="flex items-center justify-center gap-2"
            >
              <Heart className="w-4 h-4 text-destructive" />
              <span className="text-destructive font-display text-sm tracking-wider">
                PV EM ZERO
              </span>
            </motion.div>
            <p className="text-[10px] text-foreground/60 mt-0.5">
              Confira Inconsciente e Morrendo nas condições ativas.
            </p>
          </motion.div>
        )}

        {/* Estado Colapso Mental (SAN = 0) */}
        {isMentalCollapse && !isUnconscious && (
          <motion.div
            key="mental-collapse"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              boxShadow: [
                '0 0 0 0 rgba(168, 85, 247, 0)',
                '0 0 15px 3px rgba(168, 85, 247, 0.3)',
                '0 0 0 0 rgba(168, 85, 247, 0)',
              ],
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ boxShadow: { duration: 1.5, repeat: Infinity } }}
            className="relative text-center py-2 px-3 rounded-lg bg-paranormal/20 border border-paranormal/40"
          >
            <motion.div
              animate={{ 
                opacity: [1, 0.6, 1],
                rotate: [-1, 1, -1],
              }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="flex items-center justify-center gap-2"
            >
              <Brain className="w-4 h-4 text-paranormal" />
              <span className="text-paranormal font-display text-sm tracking-wider">
                SAN EM ZERO
              </span>
            </motion.div>
            <p className="text-[10px] text-foreground/60 mt-0.5">
              Confira Enlouquecendo e a contagem da cena; estabilização pode encerrar a condição com SAN ainda em zero.
            </p>
          </motion.div>
        )}

        {/* Aviso de estado baixo (não em colapso) */}
        {!isUnconscious && !isMentalCollapse && (isHpLow || isSanLow) && (
          <motion.div
            key="warning"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "text-xs text-center py-1 px-2 rounded",
              isHpLow && isSanLow 
                ? "bg-destructive/20 text-destructive" 
                : isHpLow 
                  ? "bg-destructive/20 text-destructive"
                  : "bg-paranormal/20 text-paranormal"
            )}
          >
            {isHpLow && isSanLow 
              ? "⚠ Estado crítico!" 
              : isHpLow 
                ? "⚠ HP baixo!" 
                : "⚠ Sanidade baixa!"}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

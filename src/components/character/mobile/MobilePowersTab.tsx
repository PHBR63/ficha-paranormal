/**
 * MobilePowersTab - Tab de poderes extraída do MobileCharacterSheet
 * Usa virtualização para listas longas de poderes e rituais
 */

import { memo, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  Sparkles, 
  User,
  Scroll,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MobileCollapsibleSection } from './MobileCollapsibleSection';
import { getElementIcon, getElementColor } from './utils';
import { ALL_CLASS_ABILITIES } from '@/lib/class-abilities';
import { ALL_RITUALS } from '@/lib/rituals/legacy-exports';

// Altura estimada por tipo de item
const POWER_ITEM_HEIGHT = 76;
const RITUAL_ITEM_HEIGHT = 60;

// Tipos
interface ParanormalPower {
  id: string;
  name: string;
  element: string;
  description: string;
}

interface GeneralPower {
  id: string;
  name: string;
  description: string;
  category?: string;
}

interface OriginPower {
  name: string;
  description: string;
}

interface PowerDetailData {
  type: 'ability' | 'paranormal' | 'general' | 'origin' | 'ritual';
  name: string;
  description?: string;
  element?: string;
  category?: string;
  circle?: number;
  execution?: string;
  range?: string;
  target?: string;
  duration?: string;
  resistance?: string;
}

interface MobilePowersTabProps {
  abilities: string[];
  paranormalPowers?: ParanormalPower[];
  generalPowers?: GeneralPower[];
  originPowers: OriginPower[];
  rituals: string[];
  powerLimits: { total: number; fromTranscender: number; fromOrigin: number };
  ritualLimits: { count: number } | null;
  hasExcessPowers: boolean;
  hasExcessRituals: boolean;
  // Contagem de slots de Transcender usados (poderes paranormais escolhidos via Transcender)
  transcenderUsed?: number;
  // Total de slots de NEX usados (Transcender + Poder de Classe)
  totalSlotsUsed?: number;
  onPowerClick: (power: PowerDetailData) => void;
  onOpenExcessPowersModal: () => void;
  onOpenExcessRitualsModal: () => void;
  onOpenRemovedPowersHistory: () => void;
  // Componente opcional de histórico de rituais (renderizado na seção de rituais)
  ritualHistoryButton?: React.ReactNode;
}

// Item de poder paranormal virtualizado
const ParanormalPowerItem = memo(function ParanormalPowerItem({
  power,
  onClick,
  style,
}: {
  power: ParanormalPower;
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <div style={style} className="py-1">
      <button
        onClick={onClick}
        className={cn(
          "w-full p-3 rounded-lg border text-left active:opacity-80 transition-colors",
          getElementColor(power.element)
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getElementIcon(power.element)}</span>
              <span className="font-medium text-sm">{power.name}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{power.description}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
        </div>
      </button>
    </div>
  );
});

// Item de poder geral virtualizado
const GeneralPowerItem = memo(function GeneralPowerItem({
  power,
  onClick,
  style,
}: {
  power: GeneralPower;
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <div style={style} className="py-1">
      <button
        onClick={onClick}
        className="w-full p-3 bg-success/10 rounded-lg border border-success/20 text-left active:bg-success/20 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-medium text-sm text-success">{power.name}</span>
              {power.category && (
                <span className="text-[9px] px-1.5 py-0.5 bg-success/30 text-success rounded capitalize">
                  {power.category}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-2">{power.description}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-success/50 flex-shrink-0 ml-2" />
        </div>
      </button>
    </div>
  );
});

// Item de ritual virtualizado
const RitualItem = memo(function RitualItem({
  ritualId,
  ritualData,
  onClick,
  style,
}: {
  ritualId: string;
  ritualData: typeof ALL_RITUALS[number] | undefined;
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <div style={style} className="py-1">
      <button
        onClick={onClick}
        className="w-full p-2.5 bg-paranormal/10 rounded-lg border border-paranormal/20 flex items-center gap-3 active:bg-paranormal/20 transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-full bg-paranormal/20 flex items-center justify-center flex-shrink-0">
          {ritualData?.circle ? (
            <span className="text-sm font-display text-paranormal">{ritualData.circle}º</span>
          ) : (
            <Scroll className="w-4 h-4 text-paranormal" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm text-paranormal font-medium">{ritualData?.name || ritualId}</span>
          {ritualData?.element && (
            <p className="text-[10px] text-muted-foreground capitalize">{ritualData.element}</p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-paranormal/50 flex-shrink-0" />
      </button>
    </div>
  );
});

// Lista virtualizada de poderes paranormais
const VirtualizedParanormalList = memo(function VirtualizedParanormalList({
  powers,
  onPowerClick,
}: {
  powers: ParanormalPower[];
  onPowerClick: (power: ParanormalPower) => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const rowVirtualizer = useVirtualizer({
    count: powers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => POWER_ITEM_HEIGHT,
    overscan: 3,
  });

  // Usa altura dinâmica: mostra todos se poucos, virtualiza se muitos
  const needsVirtualization = powers.length > 5;
  // Altura responsiva: usa calc para adaptar ao viewport
  const maxHeight = needsVirtualization ? 'min(320px, calc(100vh - 350px))' : undefined;

  if (!needsVirtualization) {
    return (
      <div className="space-y-1">
        {powers.map((power) => (
          <ParanormalPowerItem
            key={power.id}
            power={power}
            onClick={() => onPowerClick(power)}
          />
        ))}
      </div>
    );
  }

  return (
    <div 
      ref={parentRef}
      className="overflow-auto scrollbar-hide overscroll-contain"
      style={{ maxHeight }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const power = powers[virtualRow.index];
          return (
            <ParanormalPowerItem
              key={power.id}
              power={power}
              onClick={() => onPowerClick(power)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
});

// Lista virtualizada de poderes gerais
const VirtualizedGeneralList = memo(function VirtualizedGeneralList({
  powers,
  onPowerClick,
}: {
  powers: GeneralPower[];
  onPowerClick: (power: GeneralPower) => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const rowVirtualizer = useVirtualizer({
    count: powers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => POWER_ITEM_HEIGHT,
    overscan: 3,
  });

  const needsVirtualization = powers.length > 5;
  const maxHeight = needsVirtualization ? 'min(320px, calc(100vh - 350px))' : undefined;

  if (!needsVirtualization) {
    return (
      <div className="space-y-1">
        {powers.map((power) => (
          <GeneralPowerItem
            key={power.id}
            power={power}
            onClick={() => onPowerClick(power)}
          />
        ))}
      </div>
    );
  }

  return (
    <div 
      ref={parentRef}
      className="overflow-auto scrollbar-hide"
      style={{ maxHeight }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const power = powers[virtualRow.index];
          return (
            <GeneralPowerItem
              key={power.id}
              power={power}
              onClick={() => onPowerClick(power)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
});

// Lista virtualizada de rituais
const VirtualizedRitualsList = memo(function VirtualizedRitualsList({
  ritualIds,
  getRitualData,
  onRitualClick,
}: {
  ritualIds: string[];
  getRitualData: (id: string) => typeof ALL_RITUALS[number] | undefined;
  onRitualClick: (ritualId: string, ritualData: typeof ALL_RITUALS[number] | undefined) => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const rowVirtualizer = useVirtualizer({
    count: ritualIds.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => RITUAL_ITEM_HEIGHT,
    overscan: 3,
  });

  const needsVirtualization = ritualIds.length > 6;
  const maxHeight = needsVirtualization ? 300 : undefined;

  if (!needsVirtualization) {
    return (
      <div className="space-y-1">
        {ritualIds.map((ritualId) => {
          const ritualData = getRitualData(ritualId);
          return (
            <RitualItem
              key={ritualId}
              ritualId={ritualId}
              ritualData={ritualData}
              onClick={() => onRitualClick(ritualId, ritualData)}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div 
      ref={parentRef}
      className="overflow-auto scrollbar-hide"
      style={{ maxHeight }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const ritualId = ritualIds[virtualRow.index];
          const ritualData = getRitualData(ritualId);
          return (
            <RitualItem
              key={ritualId}
              ritualId={ritualId}
              ritualData={ritualData}
              onClick={() => onRitualClick(ritualId, ritualData)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
});

export const MobilePowersTab = memo(function MobilePowersTab({
  abilities,
  paranormalPowers = [],
  generalPowers = [],
  originPowers,
  rituals,
  powerLimits,
  ritualLimits,
  hasExcessPowers,
  hasExcessRituals,
  transcenderUsed = 0,
  totalSlotsUsed = 0,
  onPowerClick,
  onOpenExcessPowersModal,
  onOpenExcessRitualsModal,
  onOpenRemovedPowersHistory,
  ritualHistoryButton,
}: MobilePowersTabProps) {
  // Buscar descrição de habilidade de classe
  const getAbilityDescription = useCallback((abilityName: string): string => {
    const ability = ALL_CLASS_ABILITIES.find(a => a.name === abilityName);
    return ability?.description || '';
  }, []);

  // Buscar dados do ritual
  const getRitualData = useCallback((ritualName: string) => {
    return ALL_RITUALS.find(r => r.name === ritualName || r.id === ritualName);
  }, []);

  // Handler para poderes paranormais
  const handleParanormalClick = useCallback((power: ParanormalPower) => {
    if ('vibrate' in navigator) navigator.vibrate(10);
    onPowerClick({
      type: 'paranormal',
      name: power.name,
      description: power.description,
      element: power.element,
    });
  }, [onPowerClick]);

  // Handler para poderes gerais
  const handleGeneralClick = useCallback((power: GeneralPower) => {
    if ('vibrate' in navigator) navigator.vibrate(10);
    onPowerClick({
      type: 'general',
      name: power.name,
      description: power.description,
      category: power.category,
    });
  }, [onPowerClick]);

  // Handler para rituais
  const handleRitualClick = useCallback((ritualId: string, ritualData: typeof ALL_RITUALS[number] | undefined) => {
    if ('vibrate' in navigator) navigator.vibrate(10);
    onPowerClick({
      type: 'ritual',
      name: ritualData?.name || ritualId,
      description: ritualData?.description || '',
      circle: ritualData?.circle,
      element: ritualData?.element,
      execution: ritualData?.execution,
      range: ritualData?.range,
      target: ritualData?.target,
      duration: ritualData?.duration,
      resistance: ritualData?.resistance,
    });
  }, [onPowerClick]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-3"
    >
      {/* Resumo de poderes */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {abilities.length > 0 && (
          <div className="flex-shrink-0 px-3 py-1.5 bg-primary/10 rounded-full text-[10px] text-primary">
            {abilities.length} Habilidades
          </div>
        )}
        {paranormalPowers.length > 0 && (
          <div className="flex-shrink-0 px-3 py-1.5 bg-paranormal/10 rounded-full text-[10px] text-paranormal">
            {paranormalPowers.length} Paranormais
          </div>
        )}
        {generalPowers.length > 0 && (
          <div className="flex-shrink-0 px-3 py-1.5 bg-success/10 rounded-full text-[10px] text-success">
            {generalPowers.length} Gerais
          </div>
        )}
        {originPowers.length > 0 && (
          <div className="flex-shrink-0 px-3 py-1.5 bg-secondary/10 rounded-full text-[10px] text-secondary">
            {originPowers.length} Origem
          </div>
        )}
        {rituals.length > 0 && (
          <div className="flex-shrink-0 px-3 py-1.5 bg-paranormal/10 rounded-full text-[10px] text-paranormal">
            {rituals.length} Rituais
          </div>
        )}
      </div>

      {/* Habilidades de Classe */}
      {abilities.length > 0 && (
        <MobileCollapsibleSection 
          title="HABILIDADES DE CLASSE" 
          icon={<Sparkles className="w-4 h-4 text-primary" />}
          badge={abilities.length}
          defaultOpen={true}
        >
          <div className="space-y-2">
            {abilities.map((ability, i) => {
              const description = getAbilityDescription(ability);
              return (
                <button
                  key={i}
                  onClick={() => {
                    if ('vibrate' in navigator) navigator.vibrate(10);
                    onPowerClick({
                      type: 'ability',
                      name: ability,
                      description,
                    });
                  }}
                  className="w-full p-3 bg-primary/10 rounded-lg border border-primary/20 text-left active:bg-primary/20 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-primary">{ability}</span>
                    <ChevronRight className="w-4 h-4 text-primary/50 flex-shrink-0" />
                  </div>
                  {description && (
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{description}</p>
                  )}
                </button>
              );
            })}
          </div>
        </MobileCollapsibleSection>
      )}

      {/* Poderes Paranormais - Virtualizados */}
      {paranormalPowers.length > 0 && (
        <MobileCollapsibleSection 
          title="PODERES PARANORMAIS" 
          icon={<Sparkles className="w-4 h-4 text-paranormal" />}
          badge={paranormalPowers.length}
        >
          {/* Alerta de poderes excedentes */}
          <div className="flex items-center justify-between gap-2 mb-2">
            {hasExcessPowers ? (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/30 flex-1">
                <span className="text-destructive font-medium text-xs">
                  ⚠️ {paranormalPowers.length}/{powerLimits.total} poderes
                </span>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="h-7 text-xs ml-auto"
                  onClick={onOpenExcessPowersModal}
                >
                  Remover
                </Button>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">
                {paranormalPowers.length}/{powerLimits.total} poderes
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={onOpenRemovedPowersHistory}
            >
              Histórico
            </Button>
          </div>

          <VirtualizedParanormalList
            powers={paranormalPowers}
            onPowerClick={handleParanormalClick}
          />
        </MobileCollapsibleSection>
      )}

      {/* Poderes Gerais - Virtualizados */}
      {generalPowers.length > 0 && (
        <MobileCollapsibleSection 
          title="PODERES GERAIS" 
          icon={<Sparkles className="w-4 h-4 text-success" />}
          badge={generalPowers.length}
        >
          <VirtualizedGeneralList
            powers={generalPowers}
            onPowerClick={handleGeneralClick}
          />
        </MobileCollapsibleSection>
      )}

      {/* Poderes de Origem */}
      {originPowers.length > 0 && (
        <MobileCollapsibleSection 
          title="PODERES DE ORIGEM" 
          icon={<User className="w-4 h-4 text-secondary" />}
          badge={originPowers.length}
        >
          <div className="space-y-2">
            {originPowers.map((power, i) => (
              <button
                key={i}
                onClick={() => {
                  if ('vibrate' in navigator) navigator.vibrate(10);
                  onPowerClick({
                    type: 'origin',
                    name: power.name,
                    description: power.description,
                  });
                }}
                className="w-full p-3 bg-secondary/10 rounded-lg border border-secondary/20 text-left active:bg-secondary/20 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm">{power.name}</span>
                    {power.description && (
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{power.description}</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-secondary/50 flex-shrink-0 ml-2" />
                </div>
              </button>
            ))}
          </div>
        </MobileCollapsibleSection>
      )}

      {/* Rituais - Virtualizados */}
      {rituals.length > 0 && (
        <MobileCollapsibleSection 
          title="RITUAIS" 
          icon={<Scroll className="w-4 h-4 text-paranormal" />}
          badge={rituals.length}
        >
          {/* Alerta de rituais excedentes (apenas Ocultista) + botão histórico */}
          <div className="flex items-center justify-between gap-2 mb-2">
            {ritualLimits && (
              <>
                {hasExcessRituals ? (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/30 flex-1">
                    <span className="text-destructive font-medium text-xs">
                      ⚠️ {rituals.length}/{ritualLimits.count} rituais
                    </span>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="h-7 text-xs ml-auto"
                      onClick={onOpenExcessRitualsModal}
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {rituals.length}/{ritualLimits.count} rituais
                  </span>
                )}
              </>
            )}
            {/* Botão de histórico de conjurações */}
            {ritualHistoryButton}
          </div>

          <VirtualizedRitualsList
            ritualIds={rituals}
            getRitualData={getRitualData}
            onRitualClick={handleRitualClick}
          />
        </MobileCollapsibleSection>
      )}

      {/* Mensagem quando não há nenhum poder */}
      {abilities.length === 0 && 
       originPowers.length === 0 && 
       rituals.length === 0 &&
       paranormalPowers.length === 0 &&
       generalPowers.length === 0 && (
        <div className="ordo-panel p-3">
          <p className="text-muted-foreground text-sm text-center py-4">
            Nenhum poder registrado.
          </p>
        </div>
      )}
    </motion.div>
  );
});

export default MobilePowersTab;

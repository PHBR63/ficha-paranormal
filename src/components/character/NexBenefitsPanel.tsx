/**
 * NexBenefitsPanel - Painel visual que mostra todos os benefícios do NEX selecionado
 * 
 * Exibe:
 * - PV/PE/SAN calculados
 * - Patente atual
 * - Perícias extras
 * - Pontos de atributo extras
 * - Habilidades de classe disponíveis
 * - Rituais (se Ocultista)
 * - Círculo máximo de rituais
 */

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Zap, 
  Brain, 
  Star,
  Award,
  BookOpen,
  Swords,
  Sparkles,
  ChevronUp,
  ChevronDown,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  calculateDerivedStats, 
  getNexProgression,
  getOcultistRituals,
  CLASSES
} from '@/lib/character-data';
import { Separator } from '@/components/ui/separator';

interface NexBenefitsPanelProps {
  nex: number;
  characterClass?: string;
  vigor?: number;
  presence?: number;
  intellect?: number;
  originId?: string;
  previousNex?: number;
  compact?: boolean;
}

export function NexBenefitsPanel({
  nex,
  characterClass,
  vigor = 1,
  presence = 1,
  intellect = 1,
  originId,
  previousNex,
  compact = false,
}: NexBenefitsPanelProps) {
  // Obter dados de progressão
  const progression = getNexProgression(nex);
  const previousProgression = previousNex ? getNexProgression(previousNex) : null;
  
  // Calcular stats derivados
  const stats = characterClass 
    ? calculateDerivedStats(characterClass, vigor, presence, nex, originId)
    : { hp: 0, pe: 0, san: 0 };
  
  const previousStats = characterClass && previousNex
    ? calculateDerivedStats(characterClass, vigor, presence, previousNex, originId)
    : null;
  
  // Dados da classe - perícias extras vêm apenas do poder "Treinamento em Perícia", não do NEX
  const classData = CLASSES.find(c => c.id === characterClass);
  
  // Rituais (apenas Ocultista)
  const rituals = characterClass === 'Ocultista' ? getOcultistRituals(nex) : null;

  // Função para mostrar diferença
  const renderDiff = (current: number, previous: number | undefined) => {
    if (previous === undefined || previous === current) return null;
    const diff = current - previous;
    if (diff === 0) return null;
    
    return (
      <motion.span
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'text-xs ml-1 font-medium',
          diff > 0 ? 'text-success' : 'text-destructive'
        )}
      >
        {diff > 0 ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />}
        {diff > 0 ? `+${diff}` : diff}
      </motion.span>
    );
  };

  if (compact) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
        <BenefitBadge 
          icon={Star} 
          label="Atributos" 
          value={`+${progression.attributePoints}`}
          color="text-primary"
        />
        <BenefitBadge 
          icon={Swords} 
          label="Habilidades" 
          value={`${progression.abilityChoices}`}
          color="text-destructive"
        />
        {rituals && (
          <BenefitBadge 
            icon={Sparkles} 
            label="Rituais" 
            value={`${rituals.count} (${rituals.maxCircle}°)`}
            color="text-paranormal"
          />
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="ordo-panel p-4 space-y-4"
    >
      {/* Header - Sem badge de patente */}
      <div className="flex items-center justify-between">
        <h4 className="font-display text-sm tracking-wider text-muted-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          BENEFÍCIOS DO NEX {nex}%
        </h4>
      </div>

      <Separator />

      {/* Stats Derivados */}
      {characterClass && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">STATS BASE</p>
          <div className="grid grid-cols-3 gap-3">
            <StatCard 
              icon={Heart} 
              label="PV" 
              value={stats.hp}
              previousValue={previousStats?.hp}
              color="text-destructive bg-destructive/10"
            />
            <StatCard 
              icon={Zap} 
              label="PE" 
              value={stats.pe}
              previousValue={previousStats?.pe}
              color="text-success bg-success/10"
            />
            <StatCard 
              icon={Brain} 
              label="SAN" 
              value={stats.san}
              previousValue={previousStats?.san}
              color="text-paranormal bg-paranormal/10"
            />
          </div>
        </div>
      )}

      {/* Benefícios de Progressão */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">PROGRESSÃO</p>
        <div className="grid grid-cols-2 gap-3">
          <ProgressionCard
            icon={Star}
            label="Pontos de Atributo"
            value={progression.attributePoints}
            previousValue={previousProgression?.attributePoints}
            description="Extras para distribuir"
            color="text-primary"
          />
          <ProgressionCard
            icon={Swords}
            label="Habilidades de Classe"
            value={progression.abilityChoices}
            previousValue={previousProgression?.abilityChoices}
            description="Opcionais disponíveis"
            color="text-destructive"
          />
          <ProgressionCard
            icon={Award}
            label="Habilidades de Trilha"
            value={progression.trackAbilityUnlocks}
            previousValue={previousProgression?.trackAbilityUnlocks}
            description="Desbloqueadas"
            color="text-warning"
          />
        </div>
      </div>

      {/* Rituais (apenas Ocultista) */}
      <AnimatePresence>
        {rituals && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <p className="text-xs text-muted-foreground font-medium">RITUAIS</p>
            <div className="grid grid-cols-2 gap-3">
              <ProgressionCard
                icon={Sparkles}
                label="Rituais Conhecidos"
                value={rituals.count}
                description="Total disponível"
                color="text-paranormal"
              />
              <ProgressionCard
                icon={Sparkles}
                label="Círculo Máximo"
                value={rituals.maxCircle}
                description={`Até ${rituals.maxCircle}º círculo`}
                color="text-paranormal"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Componente auxiliar para badge compacto
interface BenefitBadgeProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}

function BenefitBadge({ icon: Icon, label, value, color }: BenefitBadgeProps) {
  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-lg',
      'bg-muted/50 border border-border'
    )}>
      <Icon className={cn('w-4 h-4', color)} />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn('font-display text-sm', color)}>{value}</span>
      </div>
    </div>
  );
}

// Componente auxiliar para card de stat
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  previousValue?: number;
  color: string;
}

function StatCard({ icon: Icon, label, value, previousValue, color }: StatCardProps) {
  const diff = previousValue !== undefined ? value - previousValue : 0;
  
  return (
    <div className={cn(
      'flex flex-col items-center gap-1 p-3 rounded-lg border border-border',
      color
    )}>
      <Icon className="w-5 h-5" />
      <motion.span
        key={value}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className="font-display text-xl"
      >
        {value}
      </motion.span>
      <span className="text-xs opacity-70">{label}</span>
      {diff !== 0 && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            'text-xs font-medium',
            diff > 0 ? 'text-success' : 'text-destructive'
          )}
        >
          {diff > 0 ? `+${diff}` : diff}
        </motion.span>
      )}
    </div>
  );
}

// Componente auxiliar para card de progressão
interface ProgressionCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  previousValue?: number;
  description: string;
  color: string;
}

function ProgressionCard({ 
  icon: Icon, 
  label, 
  value, 
  previousValue, 
  description, 
  color 
}: ProgressionCardProps) {
  const diff = previousValue !== undefined ? value - previousValue : 0;
  
  return (
    <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-1">
      <div className="flex items-center gap-2">
        <Icon className={cn('w-4 h-4', color)} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <motion.span
          key={value}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className="font-display text-3xl font-extrabold tracking-wide text-amber-300 drop-shadow-lg"
          style={{
            textShadow: '0 0 12px rgba(251, 191, 36, 0.6), 0 2px 4px rgba(0,0,0,0.5)'
          }}
        >
          {value}
        </motion.span>
        {diff !== 0 && (
          <motion.span
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              'text-sm font-medium',
              diff > 0 ? 'text-success' : 'text-destructive'
            )}
          >
            {diff > 0 ? `+${diff}` : diff}
          </motion.span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

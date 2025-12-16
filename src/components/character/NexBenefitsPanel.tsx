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
 * - NOVO: Timeline visual de marcos de progressão
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
  TrendingUp,
  GraduationCap,
  Shield,
  Flame,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  calculateDerivedStats, 
  getNexProgression,
  getOcultistRituals,
  CLASSES
} from '@/lib/character-data';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// ==================== MARCOS DE NEX (Tabelas 1.3, 1.4, 1.5) ====================
// Define em quais NEX cada tipo de benefício é obtido

const NEX_MILESTONES = {
  // Aumento de Atributo: NEX 20%, 50%, 80%, 95%
  attributeIncrease: [20, 50, 80, 95],
  // Poderes de Classe: NEX 15%, 30%, 45%, 60%, 75%, 90%
  classPowers: [15, 30, 45, 60, 75, 90],
  // Habilidade de Trilha: NEX 10%, 40%, 65%, 99%
  trackAbilities: [10, 40, 65, 99],
  // Grau de Treinamento: NEX 35%, 70%
  trainingGrade: [35, 70],
  // Versatilidade: NEX 50%
  versatility: [50],
  // Melhoria da Habilidade Base: NEX 25%, 55%, 85%
  coreAbilityUpgrade: [25, 55, 85],
} as const;

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
  
  // Dados da classe
  const classData = CLASSES.find(c => c.id === characterClass);
  
  // Rituais (apenas Ocultista)
  const rituals = characterClass === 'Ocultista' ? getOcultistRituals(nex) : null;

  // Função para verificar se o NEX atual está em um marco específico
  const isAtMilestone = (milestoneNex: number) => nex >= milestoneNex;
  const isCurrentMilestone = (milestoneNex: number) => nex === milestoneNex;

  // Obter descrição da melhoria da habilidade base por classe
  const getCoreUpgradeDescription = (milestoneNex: number) => {
    if (!characterClass) return '';
    
    const upgrades: Record<string, Record<number, string>> = {
      'Combatente': {
        25: '3 PE, +10',
        55: '4 PE, +15',
        85: '5 PE, +20'
      },
      'Especialista': {
        25: '+1d8 (3 PE)',
        55: '+1d10 (4 PE)',
        85: '+1d12 (5 PE)'
      },
      'Ocultista': {
        25: '2º Círculo',
        55: '3º Círculo',
        85: '4º Círculo'
      }
    };
    
    return upgrades[characterClass]?.[milestoneNex] || '';
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
          label="Poderes" 
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
      {/* Header */}
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
        <p className="text-xs text-muted-foreground font-medium">PROGRESSÃO ACUMULADA</p>
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
            label="Poderes de Classe"
            value={progression.abilityChoices}
            previousValue={previousProgression?.abilityChoices}
            description="Escolhas disponíveis"
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

      <Separator />

      {/* Timeline de Marcos de NEX */}
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground font-medium">MARCOS DE PROGRESSÃO</p>
        
        {/* Aumento de Atributo */}
        <MilestoneRow
          icon={Star}
          label="Aumento de Atributo"
          milestones={NEX_MILESTONES.attributeIncrease}
          currentNex={nex}
          color="text-primary"
          bgColor="bg-primary/20"
        />

        {/* Poderes de Classe */}
        <MilestoneRow
          icon={Swords}
          label="Poder de Classe"
          milestones={NEX_MILESTONES.classPowers}
          currentNex={nex}
          color="text-destructive"
          bgColor="bg-destructive/20"
        />

        {/* Habilidade de Trilha */}
        <MilestoneRow
          icon={Award}
          label="Habilidade de Trilha"
          milestones={NEX_MILESTONES.trackAbilities}
          currentNex={nex}
          color="text-warning"
          bgColor="bg-warning/20"
        />

        {/* Grau de Treinamento */}
        <MilestoneRow
          icon={GraduationCap}
          label="Grau de Treinamento"
          milestones={NEX_MILESTONES.trainingGrade}
          currentNex={nex}
          color="text-blue-400"
          bgColor="bg-blue-400/20"
        />

        {/* Versatilidade */}
        <MilestoneRow
          icon={Shield}
          label="Versatilidade"
          milestones={NEX_MILESTONES.versatility}
          currentNex={nex}
          color="text-emerald-400"
          bgColor="bg-emerald-400/20"
        />

        {/* Melhoria da Habilidade Base */}
        {characterClass && (
          <MilestoneRow
            icon={Flame}
            label={
              characterClass === 'Combatente' ? 'Ataque Especial' :
              characterClass === 'Especialista' ? 'Perito' :
              characterClass === 'Ocultista' ? 'Círculo de Rituais' : 'Habilidade Base'
            }
            milestones={NEX_MILESTONES.coreAbilityUpgrade}
            currentNex={nex}
            color="text-paranormal"
            bgColor="bg-paranormal/20"
            descriptions={NEX_MILESTONES.coreAbilityUpgrade.map(m => getCoreUpgradeDescription(m))}
          />
        )}
      </div>
    </motion.div>
  );
}

// ==================== COMPONENTES AUXILIARES ====================

// Componente para linha de marcos
interface MilestoneRowProps {
  icon: React.ElementType;
  label: string;
  milestones: readonly number[];
  currentNex: number;
  color: string;
  bgColor: string;
  descriptions?: string[];
}

function MilestoneRow({ 
  icon: Icon, 
  label, 
  milestones, 
  currentNex, 
  color, 
  bgColor,
  descriptions 
}: MilestoneRowProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Icon className={cn('w-3.5 h-3.5', color)} />
        <span className="text-xs font-medium text-foreground">{label}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 pl-5">
        {milestones.map((milestone, idx) => {
          const isReached = currentNex >= milestone;
          const isCurrent = currentNex === milestone;
          
          return (
            <motion.div
              key={milestone}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Badge
                variant="outline"
                className={cn(
                  'text-xs px-2 py-0.5 transition-all duration-200',
                  isReached 
                    ? cn(bgColor, color, 'border-current') 
                    : 'text-muted-foreground border-muted opacity-50',
                  isCurrent && 'ring-2 ring-offset-1 ring-offset-background ring-current scale-110'
                )}
              >
                {isReached ? (
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                ) : (
                  <Circle className="w-3 h-3 mr-1" />
                )}
                {milestone}%
                {descriptions?.[idx] && isReached && (
                  <span className="ml-1 opacity-80">({descriptions[idx]})</span>
                )}
              </Badge>
            </motion.div>
          );
        })}
      </div>
    </div>
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

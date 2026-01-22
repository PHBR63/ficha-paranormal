/**
 * Widget de Debug de Automações
 * 
 * Exibe em tempo real o estado de todas as automações ativas
 * na ficha do personagem para fins de verificação e debug.
 */

import { useState } from 'react';
import { 
  Bug, 
  ChevronDown, 
  ChevronUp, 
  Activity, 
  Shield, 
  Zap, 
  Heart,
  Brain,
  Sparkles,
  Swords,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { CustomScroll } from '@/components/ui/custom-scroll';
import type { DefenseBonuses as DefenseBonusesType } from '@/hooks/useDefenseBonuses';
import type { SustainedRitual } from '@/hooks/useSustainedRituals';
import type { WeaponBuff } from '@/hooks/useWeaponBuffs';
import type { BonusSummary } from '@/hooks/useCharacterBonusSummary';

// Interface simplificada para condições ativas
interface ActiveCondition {
  id: string;
  name: string;
  turnsRemaining?: number;
}

interface AutomationDebugWidgetProps {
  // Dados de auditoria
  auditCounts: {
    total: number;
    errors: number;
    warnings: number;
    info: number;
    autoFixable: number;
  };
  isAuditing: boolean;
  
  // Bônus consolidados (hook useCharacterBonusSummary)
  bonusSummary: BonusSummary;
  
  // Defesa (do bonusSummary.defenseBonuses)
  defenseBonuses: DefenseBonusesType;
  
  // Condições ativas (parseadas de character.conditions)
  activeConditions: ActiveCondition[];
  
  // Rituais sustentados
  sustainedRituals: SustainedRitual[];
  
  // Buffs de arma
  weaponBuffs: WeaponBuff[];
  
  // Bônus condicionais ativos
  activeConditionalBonuses: string[];
  
  // Afinidade elemental
  affinityActive: boolean;
  elementalAffinity?: string;
  
  // Defesa total do personagem
  characterDefense: number;
  characterAgility: number;
}

export function AutomationDebugWidget({
  auditCounts,
  isAuditing,
  bonusSummary,
  defenseBonuses,
  activeConditions,
  sustainedRituals,
  weaponBuffs,
  activeConditionalBonuses,
  affinityActive,
  elementalAffinity,
  characterDefense,
  characterAgility,
}: AutomationDebugWidgetProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Conta automações ativas
  const activeAutomationsCount = 
    (auditCounts.total > 0 ? 1 : 0) +
    (Object.keys(bonusSummary.skills).length > 0 ? 1 : 0) +
    (activeConditions.length > 0 ? 1 : 0) +
    (sustainedRituals.length > 0 ? 1 : 0) +
    (weaponBuffs.length > 0 ? 1 : 0) +
    (activeConditionalBonuses.length > 0 ? 1 : 0) +
    (affinityActive ? 1 : 0);

  // Status geral
  const hasErrors = auditCounts.errors > 0;
  const hasWarnings = auditCounts.warnings > 0;
  const statusColor = hasErrors ? 'text-destructive' : hasWarnings ? 'text-yellow-500' : 'text-green-500';
  const StatusIcon = hasErrors ? XCircle : hasWarnings ? AlertTriangle : CheckCircle2;

  if (!isVisible) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border shadow-lg"
        title="Mostrar debug de automações"
      >
        <Bug className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-h-[70vh] overflow-hidden rounded-lg border bg-background/95 backdrop-blur-sm shadow-xl">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Automações</span>
          <Badge variant="secondary" className="text-xs">
            {activeAutomationsCount} ativas
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <StatusIcon className={cn("h-4 w-4", statusColor)} />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsVisible(false)}
            title="Ocultar"
          >
            <EyeOff className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Conteúdo com scroll visível */}
      <CustomScroll maxHeight="calc(70vh - 56px)" className="p-2">
        <div className="space-y-2 pr-1">
        
        {/* Auditoria */}
        <AutomationSection
          icon={<Activity className="h-4 w-4" />}
          title="Auditoria"
          status={isAuditing ? 'loading' : auditCounts.errors > 0 ? 'error' : auditCounts.warnings > 0 ? 'warning' : 'ok'}
          badge={auditCounts.total > 0 ? `${auditCounts.total}` : undefined}
        >
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-destructive" />
              <span>{auditCounts.errors} erros</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-yellow-500" />
              <span>{auditCounts.warnings} avisos</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-blue-500" />
              <span>{auditCounts.info} info</span>
            </div>
          </div>
          {auditCounts.autoFixable > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              {auditCounts.autoFixable} corrigíveis automaticamente
            </div>
          )}
        </AutomationSection>

        {/* Bônus de Combate */}
        <AutomationSection
          icon={<Swords className="h-4 w-4" />}
          title="Bônus de Combate"
          status={bonusSummary.combat.attack.total > 0 || bonusSummary.combat.damage.total > 0 ? 'active' : 'inactive'}
        >
          <div className="space-y-1 text-xs">
            {bonusSummary.combat.attack.total !== 0 && (
              <div className="flex justify-between">
                <span>Ataque:</span>
                <span className={bonusSummary.combat.attack.total > 0 ? 'text-green-500' : 'text-destructive'}>
                  {bonusSummary.combat.attack.total > 0 ? '+' : ''}{bonusSummary.combat.attack.total}
                </span>
              </div>
            )}
            {bonusSummary.combat.damage.total !== 0 && (
              <div className="flex justify-between">
                <span>Dano:</span>
                <span className={bonusSummary.combat.damage.total > 0 ? 'text-green-500' : 'text-destructive'}>
                  {bonusSummary.combat.damage.total > 0 ? '+' : ''}{bonusSummary.combat.damage.total}
                </span>
              </div>
            )}
            {bonusSummary.combat.damage.extraDice.length > 0 && (
              <div className="flex justify-between">
                <span>Dados extras:</span>
                <span className="text-purple-500">{bonusSummary.combat.damage.extraDice.join(', ')}</span>
              </div>
            )}
            {bonusSummary.combat.criticalMargin.total > 0 && (
              <div className="flex justify-between">
                <span>Margem crítico:</span>
                <span className="text-green-500">+{bonusSummary.combat.criticalMargin.total}</span>
              </div>
            )}
            {bonusSummary.combat.initiative.total > 0 && (
              <div className="flex justify-between">
                <span>Iniciativa:</span>
                <span className="text-green-500">+{bonusSummary.combat.initiative.total}</span>
              </div>
            )}
          </div>
        </AutomationSection>

        {/* Defesa */}
        <AutomationSection
          icon={<Shield className="h-4 w-4" />}
          title="Defesa"
          status="active"
          badge={`${characterDefense}`}
        >
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base:</span>
              <span>10</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Agilidade:</span>
              <span>+{characterAgility}</span>
            </div>
            {defenseBonuses.totalBonus > 0 && (
              <div className="flex justify-between col-span-2">
                <span className="text-muted-foreground">Bônus:</span>
                <span className="text-green-500">+{defenseBonuses.totalBonus}</span>
              </div>
            )}
          </div>
          {defenseBonuses.breakdown.filter(b => b.active).length > 0 && (
            <div className="mt-2 space-y-0.5">
              {defenseBonuses.breakdown.filter(b => b.active && !b.excluded).slice(0, 4).map((b, i) => (
                <div key={i} className="text-[10px] text-muted-foreground flex justify-between">
                  <span className="truncate max-w-[160px]">{b.source}</span>
                  <span className="text-green-500">+{b.bonus}</span>
                </div>
              ))}
            </div>
          )}
        </AutomationSection>

        {/* Condições */}
        <AutomationSection
          icon={<Heart className="h-4 w-4" />}
          title="Condições"
          status={activeConditions.length > 0 ? 'active' : 'inactive'}
          badge={activeConditions.length > 0 ? `${activeConditions.length}` : undefined}
        >
          {activeConditions.length > 0 ? (
            <div className="space-y-1">
              {activeConditions.slice(0, 5).map((cond) => (
                <div key={cond.id} className="flex items-center justify-between text-xs">
                  <span>{cond.name}</span>
                  {cond.turnsRemaining !== undefined && cond.turnsRemaining > 0 && (
                    <Badge variant="outline" className="text-[10px] h-4">
                      <Clock className="h-2 w-2 mr-1" />
                      {cond.turnsRemaining}t
                    </Badge>
                  )}
                </div>
              ))}
              {activeConditions.length > 5 && (
                <div className="text-xs text-muted-foreground">
                  +{activeConditions.length - 5} mais
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">Nenhuma condição ativa</div>
          )}
        </AutomationSection>

        {/* Rituais Sustentados */}
        <AutomationSection
          icon={<Sparkles className="h-4 w-4" />}
          title="Rituais Sustentados"
          status={sustainedRituals.length > 0 ? 'active' : 'inactive'}
          badge={sustainedRituals.length > 0 ? `${sustainedRituals.length}` : undefined}
        >
          {sustainedRituals.length > 0 ? (
            <div className="space-y-1">
              {sustainedRituals.slice(0, 3).map((ritual) => (
                <div key={ritual.id} className="flex items-center justify-between text-xs">
                  <span className="truncate max-w-[180px]">{ritual.ritualName}</span>
                  {ritual.turnsActive !== undefined && (
                    <Badge variant="outline" className="text-[10px] h-4">
                      {ritual.turnsActive}t
                    </Badge>
                  )}
                </div>
              ))}
              {sustainedRituals.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{sustainedRituals.length - 3} mais
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">Nenhum ritual sustentado</div>
          )}
        </AutomationSection>

        {/* Buffs de Arma */}
        <AutomationSection
          icon={<Zap className="h-4 w-4" />}
          title="Buffs de Arma"
          status={weaponBuffs.length > 0 ? 'active' : 'inactive'}
          badge={weaponBuffs.length > 0 ? `${weaponBuffs.length}` : undefined}
        >
          {weaponBuffs.length > 0 ? (
            <div className="space-y-1">
              {weaponBuffs.map((buff) => (
                <div key={buff.id} className="flex items-center justify-between text-xs">
                  <span className="truncate max-w-[180px]">{buff.ritualName}</span>
                  {buff.element && (
                    <Badge variant="outline" className="text-[10px] h-4 capitalize">
                      {buff.element}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">Nenhum buff ativo</div>
          )}
        </AutomationSection>

        {/* Bônus Condicionais */}
        <AutomationSection
          icon={<Brain className="h-4 w-4" />}
          title="Bônus Condicionais"
          status={activeConditionalBonuses.length > 0 ? 'active' : 'inactive'}
          badge={activeConditionalBonuses.length > 0 ? `${activeConditionalBonuses.length}` : undefined}
        >
          {activeConditionalBonuses.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {activeConditionalBonuses.slice(0, 5).map((bonus) => (
                <Badge key={bonus} variant="secondary" className="text-[10px]">
                  {bonus}
                </Badge>
              ))}
              {activeConditionalBonuses.length > 5 && (
                <Badge variant="outline" className="text-[10px]">
                  +{activeConditionalBonuses.length - 5}
                </Badge>
              )}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">Nenhum bônus condicional ativo</div>
          )}
        </AutomationSection>

        {/* Afinidade Elemental */}
        {elementalAffinity && (
          <AutomationSection
            icon={<Sparkles className="h-4 w-4" />}
            title="Afinidade Elemental"
            status={affinityActive ? 'active' : 'inactive'}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="capitalize">{elementalAffinity}</span>
              <Badge variant={affinityActive ? 'default' : 'secondary'} className="text-[10px]">
                {affinityActive ? 'Ativa' : 'Inativa'}
              </Badge>
            </div>
          </AutomationSection>
        )}

        {/* Bônus de Perícias */}
        {Object.keys(bonusSummary.skills).length > 0 && (
          <AutomationSection
            icon={<Brain className="h-4 w-4" />}
            title="Bônus de Perícias"
            status="active"
            badge={`${Object.keys(bonusSummary.skills).length}`}
          >
            <div className="grid grid-cols-2 gap-1 text-xs">
              {Object.entries(bonusSummary.skills).slice(0, 6).map(([skill, data]) => (
                <div key={skill} className="flex justify-between">
                  <span className="truncate max-w-[80px]">{skill}:</span>
                  <span className="text-green-500">+{data.total}</span>
                </div>
              ))}
            </div>
            {Object.keys(bonusSummary.skills).length > 6 && (
              <div className="text-xs text-muted-foreground mt-1">
                +{Object.keys(bonusSummary.skills).length - 6} perícias com bônus
              </div>
            )}
          </AutomationSection>
        )}

        {/* Redução de Dano */}
        {(bonusSummary.damageReduction.physical.total > 0 || bonusSummary.damageReduction.paranormal.total > 0) && (
          <AutomationSection
            icon={<Shield className="h-4 w-4" />}
            title="Redução de Dano"
            status="active"
          >
            <div className="space-y-1 text-xs">
              {bonusSummary.damageReduction.physical.total > 0 && (
                <div className="flex justify-between">
                  <span>Físico:</span>
                  <span className="text-green-500">RD {bonusSummary.damageReduction.physical.total}</span>
                </div>
              )}
              {bonusSummary.damageReduction.paranormal.total > 0 && (
                <div className="flex justify-between">
                  <span>Paranormal:</span>
                  <span className="text-purple-500">RD {bonusSummary.damageReduction.paranormal.total}</span>
                </div>
              )}
            </div>
          </AutomationSection>
        )}

        {/* Stats Bônus */}
        {(bonusSummary.hpBonus > 0 || bonusSummary.peBonus > 0) && (
          <AutomationSection
            icon={<Heart className="h-4 w-4" />}
            title="Bônus de Stats"
            status="active"
          >
            <div className="grid grid-cols-2 gap-2 text-xs">
              {bonusSummary.hpBonus > 0 && (
                <div className="flex justify-between">
                  <span>PV:</span>
                  <span className="text-green-500">+{bonusSummary.hpBonus}</span>
                </div>
              )}
              {bonusSummary.peBonus > 0 && (
                <div className="flex justify-between">
                  <span>PE:</span>
                  <span className="text-blue-500">+{bonusSummary.peBonus}</span>
                </div>
              )}
            </div>
          </AutomationSection>
        )}
        </div>
      </CustomScroll>
    </div>
  );
}

// Componente auxiliar para seções colapsáveis
interface AutomationSectionProps {
  icon: React.ReactNode;
  title: string;
  status: 'active' | 'inactive' | 'ok' | 'warning' | 'error' | 'loading';
  badge?: string;
  children: React.ReactNode;
}

function AutomationSection({ icon, title, status, badge, children }: AutomationSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const statusColors = {
    active: 'border-l-green-500',
    inactive: 'border-l-muted',
    ok: 'border-l-green-500',
    warning: 'border-l-yellow-500',
    error: 'border-l-destructive',
    loading: 'border-l-blue-500',
  };

  const statusDot = {
    active: 'bg-green-500',
    inactive: 'bg-muted',
    ok: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-destructive',
    loading: 'bg-blue-500 animate-pulse',
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn(
        "rounded border border-l-2 bg-card/50",
        statusColors[status]
      )}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full p-2 text-left hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <div className={cn("h-2 w-2 rounded-full", statusDot[status])} />
              {icon}
              <span className="text-sm font-medium">{title}</span>
              {badge && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1">
                  {badge}
                </Badge>
              )}
            </div>
            {isOpen ? (
              <ChevronUp className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-2 pb-2 pt-0">
            {children}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

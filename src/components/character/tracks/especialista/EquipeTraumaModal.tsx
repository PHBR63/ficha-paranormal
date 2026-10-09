/**
 * EquipeTraumaModal - Modal de seleção de alvo para Equipe de Trauma
 * 
 * Habilidade: Médico de Campo (NEX 40%)
 * Efeito: Remove uma condição negativa de um aliado adjacente (exceto morrendo)
 * Custo: 2 PE
 * 
 * Este modal permite:
 * - Modo Ficha: Selecionar "você mesmo" ou "aliado adjacente" (narrativo)
 * - Modo Campanha: Selecionar entre os personagens aliados da campanha
 * 
 * @module tracks/especialista/EquipeTraumaModal
 */

import { useState, useMemo } from 'react';
import { 
  Activity, 
  User, 
  Users, 
  X, 
  Check, 
  AlertTriangle,
  ChevronRight
} from '@/components/icons/ordem-icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DrawerClose } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  MobileDrawer,
  MobileDrawerContent,
  MobileDrawerHeader,
  MobileDrawerTitle,
  MobileDrawerDescription,
  MobileDrawerBody,
  MobileDrawerFooter,
} from '@/components/ui/mobile-drawer';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
import type { ActiveCondition } from '@/hooks/character/useConditions';

// =====================================================
// Tipos
// =====================================================

/** Aliado de campanha com suas condições */
export interface CampaignAlly {
  id: string; // ID do membro na campanha
  characterId: string; // ID do personagem
  name: string;
  photoUrl?: string;
  conditions: ActiveCondition[];
}

/** Props do modal */
export interface EquipeTraumaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Dados do personagem atual
  characterId: string;
  characterName: string;
  characterConditions: ActiveCondition[];
  // Aliados de campanha (opcional)
  campaignAllies?: CampaignAlly[];
  // Callbacks
  onConfirm: (targetId: 'self' | 'narrative' | string, conditionId: string | null) => void;
  // Bônus de Resgate
  hasResgate: boolean;
  defenseBonus: number;
  // Custo de PE
  peCost?: number;
  canAfford?: boolean;
}

// Condições que NÃO podem ser removidas por Equipe de Trauma
const EXCLUDED_CONDITIONS = ['morrendo'];

// =====================================================
// Componentes Auxiliares
// =====================================================

/** Badge de condição com cor e ícone */
function ConditionBadge({ condition }: { condition: ActiveCondition }) {
  const colorClass = condition.color 
    ? `bg-${condition.color}-500/20 text-${condition.color}-300 border-${condition.color}-500/30`
    : 'bg-muted text-muted-foreground';
    
  const isExcluded = EXCLUDED_CONDITIONS.includes(condition.condition_id.toLowerCase());
  
  return (
    <Badge 
      variant="outline" 
      className={`text-[10px] ${isExcluded ? 'bg-destructive/20 text-destructive border-destructive/30 line-through' : colorClass}`}
    >
      {condition.condition_name}
      {condition.stacks > 1 && ` x${condition.stacks}`}
    </Badge>
  );
}

/** Item de alvo selecionável */
function TargetItem({ 
  id, 
  name, 
  conditions, 
  isSelected, 
  onSelect,
  photoUrl,
  isNarrative = false 
}: { 
  id: string; 
  name: string; 
  conditions: ActiveCondition[]; 
  isSelected: boolean; 
  onSelect: () => void;
  photoUrl?: string;
  isNarrative?: boolean;
}) {
  // Filtra apenas condições removíveis (negativas, exceto morrendo)
  const removableConditions = conditions.filter(c => 
    (c.condition_type === 'condition' || c.condition_type === 'debuff') &&
    !EXCLUDED_CONDITIONS.includes(c.condition_id.toLowerCase())
  );
  
  const hasRemovable = removableConditions.length > 0 || isNarrative;
  
  return (
    <div 
      role="button"
      tabIndex={0}
      onClick={() => hasRemovable && onSelect()}
      onKeyDown={(e) => e.key === 'Enter' && hasRemovable && onSelect()}
      className={`
        flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer
        ${isSelected 
          ? 'border-blue-500 bg-blue-500/10' 
          : hasRemovable
            ? 'border-border hover:border-blue-500/50 hover:bg-blue-500/5'
            : 'border-border/50 opacity-50 cursor-not-allowed'
        }
      `}
    >
      {/* Avatar ou ícone */}
      <div className={`
        h-10 w-10 rounded-full flex items-center justify-center shrink-0
        ${isNarrative ? 'bg-muted' : 'bg-blue-500/20'}
      `}>
        {photoUrl ? (
          <img src={photoUrl} alt={name} className="h-full w-full rounded-full object-cover" />
        ) : (
          <User className={`h-5 w-5 ${isNarrative ? 'text-muted-foreground' : 'text-blue-400'}`} />
        )}
      </div>
      
      {/* Informações */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{name}</p>
        
        {/* Condições */}
        {conditions.length > 0 && !isNarrative ? (
          <div className="flex flex-wrap gap-1 mt-1">
            {conditions.slice(0, 4).map((c) => (
              <ConditionBadge key={c.id} condition={c} />
            ))}
            {conditions.length > 4 && (
              <Badge variant="outline" className="text-[10px]">
                +{conditions.length - 4}
              </Badge>
            )}
          </div>
        ) : isNarrative ? (
          <p className="text-xs text-muted-foreground">Selecione e narre a cura</p>
        ) : (
          <p className="text-xs text-muted-foreground">Sem condições removíveis</p>
        )}
      </div>
      
      {/* Indicador de seleção */}
      <div className={`
        h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0
        ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-muted-foreground/30'}
      `}>
        {isSelected && <Check className="h-3 w-3 text-white" />}
      </div>
    </div>
  );
}

/** Item de condição selecionável */
function ConditionItem({ 
  condition, 
  isSelected, 
  onSelect 
}: { 
  condition: ActiveCondition; 
  isSelected: boolean; 
  onSelect: () => void;
}) {
  return (
    <div 
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      className={`
        flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer
        ${isSelected 
          ? 'border-emerald-500 bg-emerald-500/10' 
          : 'border-border hover:border-emerald-500/50 hover:bg-emerald-500/5'
        }
      `}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{condition.condition_name}</p>
        {condition.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {condition.description}
          </p>
        )}
        {condition.mechanical_effect && (
          <p className="text-xs text-yellow-400/80 mt-1">
            {condition.mechanical_effect}
          </p>
        )}
      </div>
      
      <div className={`
        h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0
        ${isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-muted-foreground/30'}
      `}>
        {isSelected && <Check className="h-3 w-3 text-white" />}
      </div>
    </div>
  );
}

// =====================================================
// Componente Principal
// =====================================================

export function EquipeTraumaModal({
  open,
  onOpenChange,
  characterId,
  characterName,
  characterConditions,
  campaignAllies = [],
  onConfirm,
  hasResgate,
  defenseBonus,
  peCost = 2,
  canAfford = true,
}: EquipeTraumaModalProps) {
  const isMobile = useIsMobile();
  
  // Estado do fluxo: 'target' → 'condition'
  const [step, setStep] = useState<'target' | 'condition'>('target');
  const [selectedTarget, setSelectedTarget] = useState<'self' | 'narrative' | string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  
  // Reseta estado ao abrir/fechar
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setStep('target');
      setSelectedTarget(null);
      setSelectedCondition(null);
    }
    onOpenChange(isOpen);
  };
  
  // Filtra condições do personagem (apenas removíveis)
  const selfRemovableConditions = useMemo(() => 
    characterConditions.filter(c => 
      (c.condition_type === 'condition' || c.condition_type === 'debuff') &&
      !EXCLUDED_CONDITIONS.includes(c.condition_id.toLowerCase())
    ),
    [characterConditions]
  );
  
  // Obtém condições do alvo selecionado
  const targetConditions = useMemo(() => {
    if (!selectedTarget) return [];
    if (selectedTarget === 'self') return selfRemovableConditions;
    if (selectedTarget === 'narrative') return [];
    
    const ally = campaignAllies.find(a => a.id === selectedTarget || a.characterId === selectedTarget);
    if (!ally) return [];
    
    return ally.conditions.filter(c => 
      (c.condition_type === 'condition' || c.condition_type === 'debuff') &&
      !EXCLUDED_CONDITIONS.includes(c.condition_id.toLowerCase())
    );
  }, [selectedTarget, selfRemovableConditions, campaignAllies]);
  
  // Nome do alvo selecionado
  const targetName = useMemo(() => {
    if (selectedTarget === 'self') return characterName;
    if (selectedTarget === 'narrative') return 'Aliado adjacente';
    const ally = campaignAllies.find(a => a.id === selectedTarget || a.characterId === selectedTarget);
    return ally?.name ?? 'Alvo';
  }, [selectedTarget, characterName, campaignAllies]);
  
  // Avança para seleção de condição
  const handleTargetConfirm = () => {
    if (!selectedTarget) return;
    
    // Se é narrativo, confirma direto
    if (selectedTarget === 'narrative') {
      onConfirm('narrative', null);
      handleOpenChange(false);
      return;
    }
    
    // Se não tem condições removíveis, não pode avançar
    if (targetConditions.length === 0) return;
    
    setStep('condition');
  };
  
  // Confirma a remoção da condição
  const handleConditionConfirm = () => {
    if (!selectedTarget || !selectedCondition) return;
    onConfirm(selectedTarget, selectedCondition);
    handleOpenChange(false);
  };
  
  // Volta para seleção de alvo
  const handleBack = () => {
    setStep('target');
    setSelectedCondition(null);
  };
  
  // Verifica se tem aliados de campanha
  const hasCampaignAllies = campaignAllies.length > 0;
  
  // ===== CONTEÚDO DO STEP 1: Seleção de Alvo =====
  const TargetSelectionContent = () => (
    <div className="space-y-4">
      {/* Você mesmo */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">
          Você
        </Label>
        <TargetItem
          id="self"
          name={characterName}
          conditions={characterConditions.filter(c => 
            c.condition_type === 'condition' || c.condition_type === 'debuff'
          )}
          isSelected={selectedTarget === 'self'}
          onSelect={() => setSelectedTarget('self')}
        />
      </div>
      
      {/* Aliados de campanha */}
      {hasCampaignAllies && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Users className="h-3 w-3" />
            Aliados da Campanha
          </Label>
          <div className="space-y-2">
            {campaignAllies.map(ally => (
              <TargetItem
                key={ally.id}
                id={ally.characterId}
                name={ally.name}
                conditions={ally.conditions.filter(c => 
                  c.condition_type === 'condition' || c.condition_type === 'debuff'
                )}
                photoUrl={ally.photoUrl}
                isSelected={selectedTarget === ally.characterId}
                onSelect={() => setSelectedTarget(ally.characterId)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Opção narrativa (sem campanha) */}
      {!hasCampaignAllies && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">
            Outro Aliado
          </Label>
          <TargetItem
            id="narrative"
            name="Aliado adjacente (narrativo)"
            conditions={[]}
            isSelected={selectedTarget === 'narrative'}
            onSelect={() => setSelectedTarget('narrative')}
            isNarrative
          />
        </div>
      )}
      
      {/* Aviso sobre Resgate */}
      {hasResgate && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
            <p className="text-xs text-emerald-300">
              <strong>Resgate:</strong> Você e o aliado receberão +{defenseBonus} de Defesa até o início do seu próximo turno.
            </p>
          </div>
        </div>
      )}
      
      {/* Aviso sobre condições não removíveis */}
      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-xs text-destructive/80">
            <strong>Atenção:</strong> Não é possível remover a condição <em>Morrendo</em> com esta habilidade.
          </p>
        </div>
      </div>
    </div>
  );
  
  // ===== CONTEÚDO DO STEP 2: Seleção de Condição =====
  const ConditionSelectionContent = () => (
    <div className="space-y-4">
      {/* Cabeçalho com alvo selecionado */}
      <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <User className="h-4 w-4 text-blue-400" />
        <span className="text-sm">
          Removendo condição de: <strong>{targetName}</strong>
        </span>
      </div>
      
      {/* Lista de condições */}
      {targetConditions.length > 0 ? (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">
            Selecione a condição a remover
          </Label>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2 pr-4">
              {targetConditions.map(condition => (
                <ConditionItem
                  key={condition.id}
                  condition={condition}
                  isSelected={selectedCondition === condition.id}
                  onSelect={() => setSelectedCondition(condition.id)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <div className="p-4 text-center text-muted-foreground">
          <p>Nenhuma condição removível encontrada.</p>
        </div>
      )}
    </div>
  );
  
  // ===== DRAWER MOBILE =====
  if (isMobile) {
    return (
      <MobileDrawer open={open} onOpenChange={handleOpenChange}>
        <MobileDrawerContent maxHeight="lg">
          <MobileDrawerHeader>
            <MobileDrawerTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-400" />
              Equipe de Trauma
              <Badge variant="outline" className="ml-auto text-xs">
                {peCost} PE
              </Badge>
            </MobileDrawerTitle>
            <MobileDrawerDescription>
              {step === 'target' 
                ? 'Selecione o alvo para remover uma condição negativa.'
                : `Escolha a condição a remover de ${targetName}.`
              }
            </MobileDrawerDescription>
          </MobileDrawerHeader>
          
          <MobileDrawerBody>
            {step === 'target' ? <TargetSelectionContent /> : <ConditionSelectionContent />}
          </MobileDrawerBody>
          
          <MobileDrawerFooter>
            {step === 'target' ? (
              <>
                <Button 
                  onClick={handleTargetConfirm}
                  disabled={!selectedTarget || !canAfford}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                >
                  {selectedTarget === 'narrative' ? (
                    <>Confirmar (Narrativo)</>
                  ) : (
                    <>
                      Continuar
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
                <DrawerClose asChild>
                  <Button variant="ghost" className="w-full h-10">
                    Cancelar
                  </Button>
                </DrawerClose>
              </>
            ) : (
              <>
                <Button 
                  onClick={handleConditionConfirm}
                  disabled={!selectedCondition}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Remover Condição
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleBack}
                  className="w-full h-10"
                >
                  Voltar
                </Button>
              </>
            )}
          </MobileDrawerFooter>
        </MobileDrawerContent>
      </MobileDrawer>
    );
  }
  
  // ===== DRAWER DESKTOP =====
  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            Equipe de Trauma
            <Badge variant="outline" className="ml-2 text-xs">
              {peCost} PE
            </Badge>
          </DrawerTitle>
          <DrawerDescription>
            {step === 'target' 
              ? 'Selecione o alvo para remover uma condição negativa (exceto morrendo).'
              : `Escolha a condição a remover de ${targetName}.`
            }
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="p-4 max-w-md mx-auto w-full">
          {step === 'target' ? <TargetSelectionContent /> : <ConditionSelectionContent />}
        </div>
        
        <DrawerFooter className="max-w-md mx-auto w-full">
          {step === 'target' ? (
            <>
              <Button 
                onClick={handleTargetConfirm}
                disabled={!selectedTarget || !canAfford}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {selectedTarget === 'narrative' ? (
                  'Confirmar (Narrativo)'
                ) : (
                  <>
                    Continuar
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
              <DrawerClose asChild>
                <Button variant="ghost">Cancelar</Button>
              </DrawerClose>
            </>
          ) : (
            <>
              <Button 
                onClick={handleConditionConfirm}
                disabled={!selectedCondition}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Remover Condição
              </Button>
              <Button variant="ghost" onClick={handleBack}>
                Voltar
              </Button>
            </>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

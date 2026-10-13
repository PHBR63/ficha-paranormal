import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useItemSituationalAction } from '@/hooks/useItemSituationalAction';
import { concealmentOtherBonuses, itemActionCost, itemConcealmentBonus, type ItemAction, type SituationalItem } from '@/lib/item-situational-actions';
import { getSkillTrainingBonus, getSkillTrainingLevel } from '@/lib/skill-training';
import { describeCharacterActivity } from '@/lib/character-activity-presentation';
import { getConditionTestDicePenalty } from '@/lib/conditions/condition-test-penalty';
import type { BonusSummary } from '@/hooks/useBonusSummaryFromSUE';
import type { TestDiceModifiers } from '@/lib/unified-effects-engine';
import type { Json } from '@/integrations/supabase/types';
import { PostAttackStealthPanel } from './PostAttackStealthPanel';

interface Props {
  characterId: string; inventory: SituationalItem[]; agility: number;
  skills: Record<string, number>; conditions: Json; conditionIds: string[];
  summary: BonusSummary & { unifiedEffects?: { computed: { testDice?: TestDiceModifiers } } };
  onRefetch: () => unknown | Promise<unknown>;
}

/** Escolhe um item e declara requisitos da cena; somente o recibo altera o estado apresentado. */
export function ItemSituationalActionsPanel({ characterId, inventory, agility, skills, conditions, conditionIds, summary, onRefetch }: Props) {
  const [itemId, setItemId] = useState('');
  const [action, setAction] = useState<ItemAction>('conceal');
  const [slot, setSlot] = useState('primary_weapon');
  const [confirmed, setConfirmed] = useState(false);
  const state = useItemSituationalAction(characterId, onRefetch);
  const candidates = inventory.filter((item): item is SituationalItem & { id: string } => !!item.id && (item.itemType === 'weapon' || itemConcealmentBonus(item) > 0));
  if (!candidates.length && !state.uncertain && !state.receipt) return null;
  const item = candidates.find(entry => entry.id === itemId);
  const modifier = item ? itemConcealmentBonus(item) : 0;
  const untrained = getSkillTrainingLevel(skills, 'crime') === 0;
  const blocked = !item || !confirmed || (action === 'conceal' && untrained && !modifier)
    || (action !== 'conceal' && item.itemType !== 'weapon') || (action === 'draw' && !!item.isEquipped)
    || (action === 'stow' && !item.isEquipped);
  const frozen = state.busy || state.uncertain;
  const dice = summary.unifiedEffects?.computed.testDice;
  const diceModifier = dice ? (dice.all ?? 0) + (dice.attributes?.agility ?? 0) + (dice.skills?.crime ?? 0)
    : -getConditionTestDicePenalty(conditionIds, 'agility', 'crime');
  const submit = () => {
    if (state.uncertain) { void state.recover(); return; }
    if (!item) return;
    void state.confirm({ item: JSON.parse(JSON.stringify(item)) as Json, action, slot, requirementsConfirmed: confirmed,
      expectedAgility: agility, expectedSkills: skills, expectedConditions: conditions,
      otherBonuses: concealmentOtherBonuses(summary), dicePenalty: Math.max(0, -diceModifier), extraDice: Math.max(0, diceModifier) });
  };
  return <section className="my-3 space-y-3 rounded-lg border border-border bg-card p-3" aria-label="Ocultação e saque de itens">
    <h3 className="font-semibold text-foreground">Ocultação e saque de itens</h3>
    <p className="text-sm text-muted-foreground">Escolha o item. O servidor confirma a melhoria, o teste e o equipamento. Sem gasto de PE.</p>
    <Select value={itemId} disabled={frozen} onValueChange={value => { setItemId(value); setConfirmed(false); }}>
      <SelectTrigger aria-label="Item para ocultação ou saque"><SelectValue placeholder="Escolha um item" /></SelectTrigger>
      <SelectContent>{candidates.map(entry => <SelectItem key={entry.id} value={entry.id}>{entry.name}</SelectItem>)}</SelectContent>
    </Select>
    <Select value={action} disabled={frozen} onValueChange={value => { setAction(value as ItemAction); setConfirmed(false); }}>
      <SelectTrigger aria-label="Ação do item"><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value="conceal">Ocultar o item — Crime</SelectItem><SelectItem value="draw">Sacar arma</SelectItem><SelectItem value="stow">Guardar arma</SelectItem></SelectContent>
    </Select>
    {item && <p className="text-sm text-foreground">Ação {itemActionCost(item, action)}{action !== 'conceal' ? ` · ${item.isEquipped ? 'Arma equipada' : 'Arma guardada'}` : ''}.</p>}
    {action === 'conceal' ? <div className="space-y-1 text-sm text-muted-foreground">
      <p>Crime: treino +{getSkillTrainingBonus(skills, 'crime')} · melhoria do item +{modifier} · outros bônus da ficha {concealmentOtherBonuses(summary)}.</p>
      <p>O maior bônus de equipamento aprovado/em uso é conferido no servidor; não se soma duas vezes.</p>
      {untrained && <p className="text-foreground">{modifier ? 'Esta melhoria permite ocultar somente este item sem treino.' : 'Crime exige treino: este item não tem a exceção de ocultação.'}</p>}
      <p>Teste oposto de Percepção. Quem revistar recebe +10. O resultado fica pendente da comparação dos observadores; rolar não garante que o item foi ocultado.</p>
    </div> : <div className="space-y-2 text-sm text-muted-foreground">
      <p>Tática permite somente sacar como ação livre. Guardar usa movimento. Slots e mãos ocupados bloqueiam o saque; confira outras limitações com a mesa.</p>
      {action === 'draw' && <Select value={slot} disabled={frozen} onValueChange={setSlot}>
        <SelectTrigger aria-label="Slot do saque"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="primary_weapon">Arma principal</SelectItem><SelectItem value="secondary_weapon">Arma secundária</SelectItem></SelectContent>
      </Select>}
    </div>}
    <div className="flex items-start gap-2"><Checkbox id={`item-requirements-${characterId}`} checked={confirmed} disabled={frozen} onCheckedChange={value => setConfirmed(value === true)} />
      <Label className="text-sm leading-snug" htmlFor={`item-requirements-${characterId}`}>Conferi a ação disponível e os requisitos físicos com a mesa, incluindo mãos livres para o saque.</Label></div>
    <Button className="h-auto min-h-10 w-full whitespace-normal" disabled={state.busy || (!state.uncertain && blocked)} onClick={submit}>
      {state.busy ? 'Aguardando servidor…' : state.uncertain ? 'Recuperar a mesma tentativa' : action === 'conceal' ? 'Rolar ocultação e registrar' : action === 'draw' ? 'Confirmar saque no servidor' : 'Confirmar guardar no servidor'}
    </Button>
    {state.error && <p role="alert" className="text-sm text-red-300">{state.error}</p>}
    {state.receipt && <p role="status" className="break-words text-sm text-foreground">Confirmado no servidor: {describeCharacterActivity(state.receipt)}</p>}
    <PostAttackStealthPanel characterId={characterId} inventory={inventory} agility={agility} skills={skills}
      conditions={conditions} conditionIds={conditionIds} summary={summary} onRefetch={onRefetch} />
    <p className="text-xs text-muted-foreground">Livro Base: pp. 44, 60–62, 64 e 87. Este painel não aplica Saque Rápido nem gerencia o orçamento geral de ações.</p>
  </section>;
}

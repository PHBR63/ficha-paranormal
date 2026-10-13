import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useItemSituationalAction } from '@/hooks/useItemSituationalAction';
import { getSkillTrainingBonus } from '@/lib/skill-training';
import { getConditionTestDicePenalty } from '@/lib/conditions/condition-test-penalty';
import { hasApplicableSilencer, postAttackStealthPenalty, type StealthWeapon } from '@/lib/post-attack-stealth';
import { describeCharacterActivity } from '@/lib/character-activity-presentation';
import type { BonusSummary } from '@/hooks/useBonusSummaryFromSUE';
import type { TestDiceModifiers } from '@/lib/unified-effects-engine';
import type { Json } from '@/integrations/supabase/types';

interface Props {
  characterId: string; inventory: StealthWeapon[]; agility: number; skills: Record<string, number>;
  conditions: Json; conditionIds: string[];
  summary: BonusSummary & { unifiedEffects?: { computed: { testDice?: TestDiceModifiers } } };
  onRefetch: () => unknown | Promise<unknown>;
}

/** Declara o contexto físico; servidor confere arma, treino, Gatuno e modificadores antes do recibo. */
export function PostAttackStealthPanel(props: Props) {
  const [itemId, setItemId] = useState('');
  const [fullMovement, setFullMovement] = useState(false);
  const [otherLoudAction, setOtherLoudAction] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const state = useItemSituationalAction(props.characterId, props.onRefetch, 'confirm_character_post_attack_stealth');
  const weapons = props.inventory.filter(item => item.id && item.itemType === 'weapon');
  if (!weapons.length && !state.uncertain && !state.receipt) return null;
  const item = weapons.find(entry => entry.id === itemId);
  const frozen = state.busy || state.uncertain;
  const skill = props.summary.skills.furtividade;
  const equipment = (skill?.breakdown ?? []).filter(entry => entry.active && entry.type === 'equipment')
    .reduce((sum, entry) => sum + Number(entry.value || 0), 0);
  const otherBonuses = (skill?.total ?? 0) - equipment;
  const dice = props.summary.unifiedEffects?.computed.testDice;
  const modifier = dice ? (dice.all ?? 0) + (dice.attributes?.agility ?? 0) + (dice.skills?.furtividade ?? 0)
    : -getConditionTestDicePenalty(props.conditionIds, 'agility', 'furtividade');
  const resetConfirmation = () => setConfirmed(false);
  const submit = () => {
    if (state.uncertain) { void state.recover(); return; }
    if (!item || !confirmed) return;
    void state.confirm({ item: JSON.parse(JSON.stringify(item)) as Json, requirementsConfirmed: true,
      fullMovement, otherLoudAction, expectedAgility: props.agility, expectedSkills: props.skills,
      expectedConditions: props.conditions, otherBonuses, dicePenalty: Math.max(0, -modifier), extraDice: Math.max(0, modifier) });
  };
  return <section aria-label="Esconder-se após atacar" className="space-y-3 rounded border border-border p-3">
    <h4 className="font-semibold">Esconder-se após atacar — Furtividade</h4>
    <label className="block text-sm">Arma usada neste turno
      <select aria-label="Arma usada neste turno" className="mt-1 w-full rounded border bg-background p-2" value={itemId} disabled={frozen}
        onChange={event => { setItemId(event.target.value); resetConfirmation(); }}>
        <option value="">Escolha a arma</option>{weapons.map(weapon => <option key={weapon.id} value={weapon.id}>{weapon.name}</option>)}
      </select>
    </label>
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={fullMovement} disabled={frozen}
      onChange={event => { setFullMovement(event.target.checked); resetConfirmation(); }} />Movi mais da metade do deslocamento neste turno.</label>
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={otherLoudAction} disabled={frozen}
      onChange={event => { setOtherLoudAction(event.target.checked); resetConfirmation(); }} />Também fiz outra ação chamativa ou ataque com outra arma.</label>
    {item && <p className="text-sm">{hasApplicableSilencer(item) ? 'Silenciador válido: reduz dois dados da penalidade deste ataque.' : 'Sem redução por Silenciador.'}
      {' '}Penalidade situacional: −{postAttackStealthPenalty(hasApplicableSilencer(item), fullMovement, otherLoudAction)}d20 antes de Gatuno.
      {' '}Treino +{getSkillTrainingBonus(props.skills, 'furtividade')} · outros bônus {otherBonuses}. Gatuno e maior bônus de equipamento são conferidos no servidor.</p>}
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={confirmed} disabled={frozen}
      onChange={event => setConfirmed(event.target.checked)} />Conferi fim do turno, ação livre, esconderijo possível e os ataques e movimentos declarados com a mesa.</label>
    <Button className="h-auto min-h-10 w-full whitespace-normal" disabled={state.busy || (!state.uncertain && (!item || !confirmed))} onClick={submit}>
      {state.busy ? 'Aguardando servidor…' : state.uncertain ? 'Recuperar o mesmo teste' : 'Rolar Furtividade após atacar'}
    </Button>
    {state.error && <p role="alert" className="text-red-300 text-sm">{state.error}</p>}
    {state.receipt && <p role="status" className="break-words text-sm">{describeCharacterActivity(state.receipt)}</p>}
    <p className="text-xs text-muted-foreground">Livro Base pp.45 e60. Percepção oposta de cada observador fica pendente; rolar não garante ocultação nem concede camuflagem automaticamente. Contexto do turno é declarado, sem medição pelo mapa.</p>
  </section>;
}

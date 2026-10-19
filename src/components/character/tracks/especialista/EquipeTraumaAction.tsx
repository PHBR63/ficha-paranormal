import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { usePETurnBudget } from '@/hooks/character/usePETurnBudget';
import { useTemporaryResources } from '@/hooks/character/useTemporaryResources';
import { useItemSituationalAction } from '@/hooks/useItemSituationalAction';
import { activityClient, activityFailure } from '@/services/character-activity-service';
import type { Json } from '@/integrations/supabase/types';

interface TraumaTarget {
  id: string;
  name: string;
  conditions: Array<{ id: string; name: string }>;
  conditionsSnapshot: Json[];
}
interface TraumaOptions {
  eligible: boolean;
  trained: boolean;
  medicalKit: boolean;
  targets: TraumaTarget[];
}

/** Aceita somente opções completas; uma resposta incompleta nunca habilita gasto de PE. */
function parseOptions(value: unknown): TraumaOptions {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Equipe de Trauma indisponível.');
  const data = value as Record<string, unknown>;
  if (typeof data.eligible !== 'boolean' || typeof data.trained !== 'boolean'
    || typeof data.medicalKit !== 'boolean' || !Array.isArray(data.targets)) throw new Error('Requisitos incompletos.');
  const targets = data.targets.map((value: unknown) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Alvo incompleto.');
    const target = value as Record<string, unknown>;
    if (typeof target.id !== 'string' || typeof target.name !== 'string'
      || !Array.isArray(target.conditions) || !Array.isArray(target.conditionsSnapshot)) throw new Error('Alvo incompleto.');
    const conditions = target.conditions.map((value: unknown) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Condição incompleta.');
      const condition = value as Record<string, unknown>;
      if (typeof condition.id !== 'string' || typeof condition.name !== 'string') throw new Error('Condição incompleta.');
      return { id: condition.id, name: condition.name };
    });
    return { id: target.id, name: target.name, conditions, conditionsSnapshot: target.conditionsSnapshot as Json[] };
  });
  return { eligible: data.eligible, trained: data.trained, medicalKit: data.medicalKit, targets };
}

interface Props {
  characterId: string;
  nex: number;
  peCurrent: number;
  onRefetch?: () => unknown | Promise<unknown>;
}

/** A mesa confirma a ação e a adjacência; o servidor remove a condição e cobra PE de modo atômico. */
export function EquipeTraumaAction({ characterId, nex, peCurrent, onRefetch }: Props) {
  const [open, setOpen] = useState(false);
  const [targetId, setTargetId] = useState('');
  const [conditionId, setConditionId] = useState('');
  const [standardAction, setStandardAction] = useState(false);
  const [adjacent, setAdjacent] = useState(false);
  const options = useQuery({
    queryKey: ['equipe-trauma-options', characterId], enabled: !!characterId,
    queryFn: async () => {
      const { data, error } = await activityClient.rpc('get_character_equipe_trauma_options', { p_character_id: characterId });
      if (error) throw activityFailure('Não foi possível conferir Equipe de Trauma.', error);
      return parseOptions(data);
    }, refetchOnReconnect: true, refetchOnWindowFocus: true,
  });
  const refreshOptions = options.refetch;
  const budget = usePETurnBudget(characterId);
  const temporary = useTemporaryResources(characterId);
  const action = useItemSituationalAction(characterId, onRefetch ?? (() => undefined), 'confirm_character_equipe_trauma');
  const target = options.data?.targets.find(entry => entry.id === targetId);
  const condition = target?.conditions.find(entry => entry.id === conditionId);
  const enoughPE = peCurrent + temporary.pe >= 2;
  const withinBudget = !!budget.data && (!budget.data.tracked || budget.data.remaining >= 2);
  const ready = !!options.data?.eligible && !!options.data.trained && !!options.data.medicalKit
    && !!target && !!condition && standardAction && adjacent && enoughPE && withinBudget
    && (budget.data?.mode !== 'combat' || budget.data.actorId === characterId)
    && !action.busy && !action.uncertain;

  useEffect(() => {
    const payload = action.receipt?.payload;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload) || payload.kind !== 'equipe_trauma') return;
    setOpen(false); setTargetId(''); setConditionId(''); setStandardAction(false); setAdjacent(false);
    void refreshOptions();
  }, [action.receipt, refreshOptions]);

  const confirm = () => {
    if (!ready || !target || !budget.data) return;
    void action.confirm({ targetId, conditionId, expectedTargetConditions: target.conditionsSnapshot,
      standardActionConfirmed: true, adjacencyConfirmed: true, expectedPE: peCurrent,
      expectedNex: nex, expectedTurnKey: budget.data.key });
  };
  const result = action.receipt?.payload;
  const confirmed = result && typeof result === 'object' && !Array.isArray(result)
    && result.kind === 'equipe_trauma' ? result : null;

  return <section className="rounded-lg border border-blue-500/30 bg-blue-950/20 p-3 space-y-3" aria-label="Equipe de Trauma">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><strong className="text-sm text-blue-200">Equipe de Trauma</strong>
        <p className="text-xs text-muted-foreground">Ação padrão · 2 PE · uma condição negativa de aliado adjacente.</p></div>
      <Button type="button" size="sm" variant="outline" onClick={() => { setOpen(value => !value); void options.refetch(); }}>
        {open ? 'Fechar' : 'Escolher condição'}
      </Button>
    </div>
    {confirmed && <p role="status" className="text-sm text-blue-200">
      Confirmado no servidor: {String(confirmed.conditionName)} removida de {String(confirmed.targetName)}.
      {' '}Custo: 2 PE; o resultado foi salvo no histórico.
    </p>}
    {open && <div className="space-y-3 text-sm">
      {options.isLoading && <p>Conferindo requisitos e condições no servidor…</p>}
      {options.error && <p role="alert" className="text-destructive">Não foi possível conferir os requisitos. Atualize e tente novamente.</p>}
      {options.data && <>
        {!options.data.eligible && <p role="alert" className="text-destructive">Requer Médico de Campo no NEX 40% ou superior.</p>}
        {!options.data.trained && <p role="alert" className="text-destructive">Requer Medicina treinada.</p>}
        {!options.data.medicalKit && <p role="alert" className="text-destructive">Requer kit de Medicina identificado no inventário.</p>}
        <label className="block space-y-1"><span>Aliado da campanha</span>
          <select aria-label="Alvo de Equipe de Trauma" className="w-full rounded border border-border bg-background p-2 text-foreground"
            value={targetId} disabled={action.busy || action.uncertain}
            onChange={event => { setTargetId(event.target.value); setConditionId(''); setAdjacent(false); }}>
            <option value="">Selecione um aliado</option>
            {options.data.targets.map(ally => <option key={ally.id} value={ally.id}>{ally.name}</option>)}
          </select></label>
        {options.data.targets.length === 0 && <p>Sem aliado vinculado à campanha. Nenhum PE será cobrado.</p>}
        {target && <label className="block space-y-1"><span>Condição negativa</span>
          <select aria-label="Condição a remover" className="w-full rounded border border-border bg-background p-2 text-foreground"
            value={conditionId} disabled={action.busy || action.uncertain} onChange={event => setConditionId(event.target.value)}>
            <option value="">Selecione uma condição</option>
            {target.conditions.map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
          </select></label>}
        {target && target.conditions.length === 0 && <p>O aliado não tem condição negativa conhecida e removível. Condições personalizadas precisam de revisão da mesa.</p>}
        <label className="flex items-start gap-2"><Checkbox checked={standardAction} disabled={action.busy || action.uncertain}
          onCheckedChange={value => setStandardAction(value === true)} />Confirmei uma ação padrão disponível.</label>
        <label className="flex items-start gap-2"><Checkbox checked={adjacent} disabled={action.busy || action.uncertain}
          onCheckedChange={value => setAdjacent(value === true)} />Confirmei com a mesa que o aliado está adjacente.</label>
        <p className="text-xs text-muted-foreground">A condição e os 2 PE são confirmados juntos. Morrendo e estados derivados de PV/SAN exigem outro procedimento; Inconsciente por zero PV exige cura.</p>
        {!enoughPE && <p role="alert" className="text-destructive">PE insuficiente.</p>}
        {budget.error && <p role="alert" className="text-destructive">Orçamento do turno indisponível.</p>}
        {budget.data?.tracked && !withinBudget && <p role="alert" className="text-destructive">Limite de PE deste turno insuficiente.</p>}
        {budget.data?.mode === 'combat' && budget.data.actorId !== characterId &&
          <p role="status">Ação preparada fora do turno exige registro e gatilho no servidor. Este painel ainda não confirma essa execução; aguarde seu turno ou resolva com a mesa.</p>}
        {action.error && <p role="alert" className="text-destructive">{action.error}</p>}
        {action.uncertain && <Button type="button" variant="outline" disabled={action.busy}
          onClick={() => void action.recover()}>Recuperar confirmação</Button>}
        <Button type="button" disabled={!ready} onClick={confirm}>Remover condição · 2 PE</Button>
      </>}
    </div>}
  </section>;
}

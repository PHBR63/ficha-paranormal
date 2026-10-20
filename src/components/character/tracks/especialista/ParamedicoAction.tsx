import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useItemSituationalAction } from '@/hooks/useItemSituationalAction';
import { usePETurnBudget } from '@/hooks/character/usePETurnBudget';
import { useTemporaryResources } from '@/hooks/character/useTemporaryResources';
import { useMedicalStandardAction } from '@/hooks/character/useMedicalStandardAction';
import { activityClient, activityFailure } from '@/services/character-activity-service';

interface ParamedicoOptions {
  eligible: boolean;
  trained: boolean;
  medicalKit: boolean;
  maxExtraDice: number;
  originBonus: number;
  targets: Array<{ id: string; name: string; currentHp: number; maxHp: number }>;
}

/** Confere o formato recebido antes de usá-lo para habilitar uma cura. */
function parseOptions(value: unknown): ParamedicoOptions {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Requisitos de Paramédico indisponíveis. Atualize a ficha.');
  const data = value as Record<string, unknown>;
  if (typeof data.eligible !== 'boolean' || typeof data.trained !== 'boolean'
    || typeof data.medicalKit !== 'boolean' || !Number.isInteger(data.maxExtraDice)
    || !Array.isArray(data.targets)) throw new Error('Requisitos de Paramédico incompletos. Atualize a ficha.');
  const targets = data.targets.map((entry: unknown) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('Alvo inválido. Atualize a ficha.');
    const target = entry as Record<string, unknown>;
    if (typeof target.id !== 'string' || typeof target.name !== 'string'
      || !Number.isInteger(target.currentHp) || !Number.isInteger(target.maxHp)) throw new Error('Alvo incompleto. Atualize a ficha.');
    return { id: target.id, name: target.name, currentHp: target.currentHp as number, maxHp: target.maxHp as number };
  });
  return { eligible: data.eligible, trained: data.trained, medicalKit: data.medicalKit,
    maxExtraDice: data.maxExtraDice as number, originBonus: typeof data.originBonus === 'number' ? data.originBonus : 0, targets };
}

interface ParamedicoActionProps {
  characterId: string;
  characterName: string;
  currentHp: number;
  maxHp: number;
  nex: number;
  peCurrent: number;
  onRefetch?: () => unknown | Promise<unknown>;
  canAct?: boolean;
}

/** A mesa declara ação e posição; a cura, os dados, o gasto e o histórico vêm do servidor. */
export function ParamedicoAction({ characterId, characterName, currentHp, maxHp, nex, peCurrent, onRefetch, canAct = true }: ParamedicoActionProps) {
  const [open, setOpen] = useState(false);
  const [targetId, setTargetId] = useState(characterId);
  const [extraDice, setExtraDice] = useState(0);
  const [standardAction, setStandardAction] = useState(false);
  const [adjacent, setAdjacent] = useState(false);
  const options = useQuery({
    queryKey: ['paramedico-options', characterId], enabled: !!characterId,
    queryFn: async () => {
      const { data, error } = await activityClient.rpc('get_character_paramedico_options', { p_character_id: characterId });
      if (error) throw activityFailure('Não foi possível conferir Paramédico.', error);
      return parseOptions(data);
    }, refetchOnReconnect: true, refetchOnWindowFocus: true,
  });
  const refetchOptions = options.refetch;
  const budget = usePETurnBudget(characterId);
  const temporary = useTemporaryResources(characterId);
  const medicalAction = useMedicalStandardAction(characterId);
  const action = useItemSituationalAction(characterId, onRefetch ?? (() => undefined), 'confirm_character_paramedico');
  const target = targetId === characterId
    ? { id: characterId, name: characterName, currentHp, maxHp }
    : options.data?.targets.find(entry => entry.id === targetId);
  const cost = 2 + extraDice;
  const enoughPE = peCurrent + temporary.pe >= cost;
  const withinBudget = !!budget.data && (!budget.data.tracked || budget.data.remaining >= cost);
  const ready = canAct && !!options.data?.eligible && !!options.data.trained && !!options.data.medicalKit
    && extraDice <= options.data.maxExtraDice
    && !!target && !!standardAction && (targetId === characterId || adjacent)
    && enoughPE && withinBudget && !!medicalAction.data
    && medicalAction.data.eligible && (!medicalAction.data.tracked || (medicalAction.data.available ?? 0) > 0)
    && !action.busy && !action.uncertain;

  useEffect(() => {
    const payload = action.receipt?.payload;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload) || payload.kind !== 'paramedico') return;
    setOpen(false); setExtraDice(0); setStandardAction(false); setAdjacent(false);
    void refetchOptions();
  }, [action.receipt, refetchOptions]);

  const confirm = () => {
    if (!ready || !target || !budget.data) return;
    void action.confirm({ targetId, extraDice, standardActionConfirmed: true,
      adjacencyConfirmed: targetId !== characterId && adjacent, expectedPE: peCurrent, expectedNex: nex,
      expectedTargetHP: target.currentHp, expectedTurnKey: budget.data.key });
  };
  const result = action.receipt?.payload;
  const confirmed = result && typeof result === 'object' && !Array.isArray(result) && result.kind === 'paramedico' ? result : null;

  return (
    <section className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 space-y-3" aria-label="Paramédico">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <strong className="text-sm text-emerald-200">Paramédico</strong>
          <p className="text-xs text-muted-foreground">Ação padrão · 2d10 PV por 2 PE · +1d10 e +1 PE por dado extra.</p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => { setOpen(value => !value); void options.refetch(); }}>
          {open ? 'Fechar' : 'Preparar cura'}
        </Button>
      </div>
      {confirmed && <p role="status" className="text-sm text-emerald-200">
        Confirmado no servidor: {String(confirmed.targetName)} recebeu {String(confirmed.effectiveHealing)} PV.
        {' '}Dados [{Array.isArray(confirmed.dice) ? confirmed.dice.join(' + ') : 'indisponíveis'}]
        {Number(confirmed.originBonus) > 0 ? ` + ${String(confirmed.originBonus)} de Agente de Saúde` : ''}
        {' '}= {String(confirmed.totalHealing)} PV rolados. Custo: {String(confirmed.peCost)} PE.
        A rolagem e os saldos estão no histórico.
      </p>}
      {open && <div className="space-y-3 text-sm">
        {options.isLoading && <p>Conferindo trilha, Medicina e kit no servidor…</p>}
        {options.error && <p role="alert" className="text-destructive">Não foi possível conferir os requisitos. Atualize e tente novamente.</p>}
        {options.data && <>
          {!options.data.eligible && <p role="alert" className="text-destructive">Paramédico não está disponível para esta trilha e NEX.</p>}
          {!options.data.trained && <p role="alert" className="text-destructive">É necessário ser treinado em Medicina.</p>}
          {!options.data.medicalKit && <p role="alert" className="text-destructive">É necessário possuir um kit identificado como de Medicina. Defina a perícia de um kit genérico no inventário.</p>}
          {medicalAction.error && <p role="alert" className="text-destructive">Não foi possível conferir ações médicas deste turno. Atualize a ficha.</p>}
          {medicalAction.data?.tracked && (medicalAction.data.available ?? 0) < 1 && <p role="alert" className="text-destructive">A ação padrão médica deste turno já foi usada ou ainda não é seu turno. Peça ao mestre que registre uma ação extra, se houver uma habilidade que a conceda.</p>}
          <label className="block space-y-1">
            <span>Alvo da cura</span>
            <select aria-label="Alvo do Paramédico" className="w-full rounded border border-border bg-background p-2 text-foreground"
              value={targetId} disabled={action.busy || action.uncertain}
              onChange={event => { setTargetId(event.target.value); setAdjacent(false); }}>
              <option value={characterId}>Você — {characterName} ({currentHp}/{maxHp} PV)</option>
              {options.data.targets.map(ally => <option key={ally.id} value={ally.id}>
                {ally.name} ({ally.currentHp}/{ally.maxHp} PV)
              </option>)}
            </select>
          </label>
          <label className="block space-y-1">
            <span>Dados extras disponíveis: {options.data.maxExtraDice}</span>
            <select aria-label="Dados extras de Paramédico" className="w-full rounded border border-border bg-background p-2 text-foreground"
              value={extraDice} disabled={action.busy || action.uncertain}
              onChange={event => setExtraDice(Number(event.target.value))}>
              {Array.from({ length: options.data.maxExtraDice + 1 }, (_, count) => <option key={count} value={count}>
                {count === 0 ? 'Nenhum dado extra' : `+${count}d10 · +${count} PE`}
              </option>)}
            </select>
          </label>
          {options.data.originBonus > 0 && <p>Bônus de Agente de Saúde: +{options.data.originBonus} PV (Intelecto).</p>}
          <label className="flex items-start gap-2"><Checkbox checked={standardAction} disabled={action.busy || action.uncertain}
            onCheckedChange={value => setStandardAction(value === true)} />Confirmei com a mesa uma ação padrão disponível, considerando ataques, rituais e outros poderes.</label>
          {targetId !== characterId && <label className="flex items-start gap-2"><Checkbox checked={adjacent} disabled={action.busy || action.uncertain}
            onCheckedChange={value => setAdjacent(value === true)} />Confirmei com a mesa que o aliado está adjacente.</label>}
          <p className="font-medium">Cura: {2 + extraDice}d10{options.data.originBonus > 0 ? ` + ${options.data.originBonus}` : ''} PV · custo: {cost} PE</p>
          <p className="text-xs text-muted-foreground">A cobrança e a rolagem ocorrem juntas ao confirmar. O kit permanece no inventário. Cura não estabiliza Morrendo.</p>
          {!enoughPE && <p role="alert" className="text-destructive">PE insuficiente para esta cura.</p>}
          {budget.error && <p role="alert" className="text-destructive">Orçamento do turno indisponível. Atualize antes de confirmar.</p>}
          {budget.data?.tracked && !withinBudget && <p role="alert" className="text-destructive">Limite de PE deste turno insuficiente.</p>}
          {action.error && <p role="alert" className="text-destructive">{action.error}</p>}
          {action.uncertain && <Button type="button" variant="outline" disabled={action.busy} onClick={() => void action.recover()}>Recuperar confirmação</Button>}
          <Button type="button" disabled={!ready} onClick={confirm}>Confirmar cura · {cost} PE</Button>
        </>}
      </div>}
    </section>
  );
}

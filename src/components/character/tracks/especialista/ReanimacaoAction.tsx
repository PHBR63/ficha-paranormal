import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { usePETurnBudget } from '@/hooks/character/usePETurnBudget';
import { useTemporaryResources } from '@/hooks/character/useTemporaryResources';
import { useItemSituationalAction } from '@/hooks/useItemSituationalAction';
import { activityClient, activityFailure } from '@/services/character-activity-service';

interface ReanimationTarget {
  id: string;
  name: string;
  currentHp: number;
  maxHp: number;
  deathId: string | null;
  deathCause: 'ordinary' | 'massive_damage' | null;
}
interface ReanimationCampaign {
  id: string;
  name: string;
  sceneNumber: number | null;
  canConfirmDeath: boolean;
  usedInScene: boolean;
  targets: ReanimationTarget[];
}
interface ReanimationOptions {
  eligible: boolean;
  trained: boolean;
  medicalKit: boolean;
  campaigns: ReanimationCampaign[];
}

/** Rejeita respostas incompletas antes de disponibilizar confirmação e gasto. */
function parseOptions(value: unknown): ReanimationOptions {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Reanimação indisponível.');
  const data = value as Record<string, unknown>;
  if (typeof data.eligible !== 'boolean' || typeof data.trained !== 'boolean'
    || typeof data.medicalKit !== 'boolean' || !Array.isArray(data.campaigns)) {
    throw new Error('Requisitos de Reanimação incompletos.');
  }
  const campaigns = data.campaigns.map((entry: unknown) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('Campanha incompleta.');
    const campaign = entry as Record<string, unknown>;
    if (typeof campaign.id !== 'string' || typeof campaign.name !== 'string'
      || !(campaign.sceneNumber === null || Number.isInteger(campaign.sceneNumber))
      || typeof campaign.canConfirmDeath !== 'boolean' || typeof campaign.usedInScene !== 'boolean'
      || !Array.isArray(campaign.targets)) throw new Error('Campanha incompleta.');
    const targets = campaign.targets.map((candidate: unknown) => {
      if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) throw new Error('Alvo incompleto.');
      const target = candidate as Record<string, unknown>;
      if (typeof target.id !== 'string' || typeof target.name !== 'string'
        || !Number.isInteger(target.currentHp) || !Number.isInteger(target.maxHp)
        || !(target.deathId === null || typeof target.deathId === 'string')
        || ![null, 'ordinary', 'massive_damage'].includes(target.deathCause as string | null)) {
        throw new Error('Alvo incompleto.');
      }
      return target as unknown as ReanimationTarget;
    });
    return { ...campaign, targets } as ReanimationCampaign;
  });
  return { eligible: data.eligible, trained: data.trained, medicalKit: data.medicalKit, campaigns };
}

interface Props {
  characterId: string;
  nex: number;
  peCurrent: number;
  onRefetch?: () => unknown | Promise<unknown>;
}

/** O mestre confirma a morte; o médico executa a ação completa na mesma cena. */
export function ReanimacaoAction({ characterId, nex, peCurrent, onRefetch }: Props) {
  const [open, setOpen] = useState(false);
  const [campaignId, setCampaignId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [cause, setCause] = useState<'ordinary' | 'massive_damage'>('ordinary');
  const [deathConfirmed, setDeathConfirmed] = useState(false);
  const [completeAction, setCompleteAction] = useState(false);
  const options = useQuery({
    queryKey: ['reanimacao-options', characterId], enabled: !!characterId,
    queryFn: async () => {
      const { data, error } = await activityClient.rpc('get_character_reanimacao_options', { p_character_id: characterId });
      if (error) throw activityFailure('Não foi possível conferir Reanimação.', error);
      return parseOptions(data);
    }, refetchOnReconnect: true, refetchOnWindowFocus: true,
  });
  const budget = usePETurnBudget(characterId);
  const temporary = useTemporaryResources(characterId);
  const registerDeath = useItemSituationalAction(characterId, onRefetch ?? (() => undefined),
    'confirm_character_reanimacao_death');
  const reanimate = useItemSituationalAction(characterId, onRefetch ?? (() => undefined),
    'confirm_character_reanimacao');
  const refreshOptions = options.refetch;
  const campaign = options.data?.campaigns.find(entry => entry.id === campaignId)
    ?? options.data?.campaigns[0];
  const target = campaign?.targets.find(entry => entry.id === targetId);
  const busy = registerDeath.busy || registerDeath.uncertain || reanimate.busy || reanimate.uncertain;
  const turnAvailable = budget.data?.mode !== 'combat' || budget.data.actorId === characterId;
  const enoughPE = peCurrent + temporary.pe >= 10;
  const withinBudget = !!budget.data && (!budget.data.tracked || budget.data.remaining >= 10);
  const canRegister = !!campaign?.canConfirmDeath && Number.isInteger(campaign.sceneNumber)
    && !!target && target.currentHp === 0 && !target.deathId && deathConfirmed && !busy;
  const canReanimate = !!options.data?.eligible && !!options.data.trained && !!options.data.medicalKit
    && !!campaign && Number.isInteger(campaign.sceneNumber) && !campaign.usedInScene
    && !!target && target.currentHp === 0 && !!target.deathId && target.deathCause === 'ordinary'
    && completeAction && enoughPE && withinBudget && turnAvailable && !busy;

  useEffect(() => {
    if (!registerDeath.receipt && !reanimate.receipt) return;
    setDeathConfirmed(false);
    setCompleteAction(false);
    void refreshOptions();
  }, [registerDeath.receipt, reanimate.receipt, refreshOptions]);

  const confirmDeath = () => {
    if (!canRegister || !campaign || !target) return;
    void registerDeath.confirm({ campaignId: campaign.id, targetId: target.id, cause,
      deathConfirmed: true, expectedScene: campaign.sceneNumber, expectedTargetHp: target.currentHp });
  };
  const confirmReanimation = () => {
    if (!canReanimate || !campaign || !target || !budget.data) return;
    void reanimate.confirm({ campaignId: campaign.id, targetId: target.id, deathId: target.deathId,
      completeActionConfirmed: true, expectedScene: campaign.sceneNumber,
      expectedTargetHp: target.currentHp, expectedPE: peCurrent, expectedNex: nex,
      expectedTurnKey: budget.data.key });
  };

  return <section className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 space-y-3" aria-label="Reanimação">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><strong className="text-sm text-amber-200">Reanimação</strong>
        <p className="text-xs text-muted-foreground">Ação completa · 10 PE · uma vez por cena. Nesta mesa, o alvo retorna com 1 PV.</p></div>
      <Button type="button" size="sm" variant="outline" onClick={() => { setOpen(value => !value); void options.refetch(); }}>
        {open ? 'Fechar' : 'Conferir alvo'}
      </Button>
    </div>
    {reanimate.receipt && <p role="status" className="text-sm text-amber-200">
      Reanimação confirmada no servidor: o aliado voltou com 1 PV; 10 PE e os dois históricos foram registrados.
    </p>}
    {registerDeath.receipt && <p role="status" className="text-sm text-amber-200">
      Morte registrada pelo mestre na cena atual. Nenhum PE foi cobrado.
    </p>}
    {open && <div className="space-y-3 text-sm">
      {options.isLoading && <p>Conferindo cena, requisitos e alvos no servidor…</p>}
      {options.error && <p role="alert" className="text-destructive">Não foi possível conferir a cena. Atualize e tente novamente.</p>}
      {options.data && <>
        {!options.data.eligible && <p role="alert" className="text-destructive">Exige Médico de Campo NEX 99%.</p>}
        {!options.data.trained && <p role="alert" className="text-destructive">Exige Medicina treinada.</p>}
        {!options.data.medicalKit && <p role="alert" className="text-destructive">Exige kit de Medicina no inventário.</p>}
        {options.data.campaigns.length === 0 && <p>Sem campanha v2 vinculada. Reanimação exige conferência manual nesta ficha.</p>}
        {options.data.campaigns.length > 0 && <label className="block space-y-1"><span>Campanha e cena</span>
          <select aria-label="Campanha de Reanimação" className="w-full rounded border border-border bg-background p-2 text-foreground"
            value={campaign?.id ?? ''} disabled={busy}
            onChange={event => { setCampaignId(event.target.value); setTargetId(''); setDeathConfirmed(false); }}>
            {options.data.campaigns.map(entry => <option key={entry.id} value={entry.id}>
              {entry.name} · {entry.sceneNumber ? `cena ${entry.sceneNumber}` : 'cena não controlada'}
            </option>)}
          </select></label>}
        {campaign && <>
          {campaign.sceneNumber === null && <p role="alert" className="text-destructive">Esta campanha ainda não tem cena controlada no servidor. Nenhum PE será cobrado.</p>}
          {campaign.usedInScene && <p role="status">Reanimação já usada nesta cena.</p>}
          <label className="block space-y-1"><span>Aliado</span>
            <select aria-label="Alvo de Reanimação" className="w-full rounded border border-border bg-background p-2 text-foreground"
              value={targetId} disabled={busy}
              onChange={event => { setTargetId(event.target.value); setDeathConfirmed(false); setCompleteAction(false); }}>
              <option value="">Selecione um aliado</option>
              {campaign.targets.map(entry => <option key={entry.id} value={entry.id}>
                {entry.name} · {entry.currentHp}/{entry.maxHp} PV
              </option>)}
            </select></label>
        </>}
        {target && <>
          {target.currentHp !== 0 && <p>O alvo precisa estar morto com 0 PV confirmados pelo mestre.</p>}
          {target.deathCause === 'massive_damage' && <p role="alert" className="text-destructive">Morte por dano massivo não pode receber Reanimação.</p>}
          {target.currentHp === 0 && !target.deathId && !campaign?.canConfirmDeath &&
            <p>Aguarde o mestre registrar a morte e sua causa nesta cena.</p>}
          {campaign?.canConfirmDeath && target.currentHp === 0 && !target.deathId && <div className="space-y-2 rounded border border-amber-500/20 p-2">
            <p>Confirmação do mestre — não cobra PE.</p>
            <select aria-label="Causa da morte" className="w-full rounded border border-border bg-background p-2 text-foreground"
              value={cause} disabled={busy} onChange={event => setCause(event.target.value as 'ordinary' | 'massive_damage')}>
              <option value="ordinary">Morte nesta cena, sem dano massivo</option>
              <option value="massive_damage">Morte por dano massivo</option>
            </select>
            <label className="flex items-start gap-2"><Checkbox checked={deathConfirmed} disabled={busy}
              onCheckedChange={value => setDeathConfirmed(value === true)} />Confirmei como mestre a morte e a causa nesta cena.</label>
            <Button type="button" variant="outline" disabled={!canRegister} onClick={confirmDeath}>Registrar morte</Button>
          </div>}
          {target.deathId && target.deathCause === 'ordinary' && <>
            <p>Morte elegível confirmada pelo mestre nesta cena. O alvo retorna com 1 PV; efeitos passivos adicionais exigem resolução da mesa.</p>
            <label className="flex items-start gap-2"><Checkbox checked={completeAction} disabled={busy}
              onCheckedChange={value => setCompleteAction(value === true)} />Confirmei uma ação completa disponível.</label>
            {!enoughPE && <p role="alert" className="text-destructive">PE insuficiente.</p>}
            {budget.error && <p role="alert" className="text-destructive">Orçamento do turno indisponível.</p>}
            {budget.data?.tracked && !withinBudget && <p role="alert" className="text-destructive">Limite de PE deste turno insuficiente.</p>}
            {!turnAvailable && <p>Aguarde o próprio turno para usar Reanimação.</p>}
            {campaign?.usedInScene && <p>O uso desta cena já foi consumido.</p>}
            <Button type="button" disabled={!canReanimate} onClick={confirmReanimation}>Reanimar · 10 PE · 1 PV</Button>
          </>}
        </>}
      </>}
      {registerDeath.error && <p role="alert" className="text-destructive">{registerDeath.error}</p>}
      {reanimate.error && <p role="alert" className="text-destructive">{reanimate.error}</p>}
      {registerDeath.uncertain && <Button type="button" variant="outline" disabled={registerDeath.busy} onClick={() => void registerDeath.recover()}>Recuperar registro</Button>}
      {reanimate.uncertain && <Button type="button" variant="outline" disabled={reanimate.busy} onClick={() => void reanimate.recover()}>Recuperar aplicação</Button>}
    </div>}
  </section>;
}

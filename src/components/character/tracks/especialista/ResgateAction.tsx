import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { usePETurnBudget } from '@/hooks/character/usePETurnBudget';
import { useItemSituationalAction } from '@/hooks/useItemSituationalAction';
import { activityClient, activityFailure } from '@/services/character-activity-service';
import { ResgateOtherSourceReview } from './ResgateOtherSourceReview';

interface Target { id: string; name: string; currentHp: number; maxHp: number }
interface Options { eligible: boolean; trained: boolean; medicalKit: boolean; usedInCurrentControl: boolean; targets: Target[] }

/** O servidor filtra aliados machucados ou morrendo e revalida a posição declarada. */
function parseOptions(value: unknown): Options {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Resgate indisponível.');
  const data = value as Record<string, unknown>;
  if (typeof data.eligible !== 'boolean' || typeof data.trained !== 'boolean'
    || typeof data.medicalKit !== 'boolean' || typeof data.usedInCurrentControl !== 'boolean'
    || !Array.isArray(data.targets)) throw new Error('Requisitos de Resgate incompletos.');
  const targets = data.targets.map((value: unknown) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Alvo incompleto.');
    const target = value as Record<string, unknown>;
    if (typeof target.id !== 'string' || typeof target.name !== 'string'
      || !Number.isInteger(target.currentHp) || !Number.isInteger(target.maxHp)) throw new Error('Alvo incompleto.');
    return target as unknown as Target;
  });
  return { eligible: data.eligible, trained: data.trained, medicalKit: data.medicalKit,
    usedInCurrentControl: data.usedInCurrentControl, targets };
}

interface Props { characterId: string; nex: number; onRefetch?: () => unknown | Promise<unknown> }

/** Movimento livre: a mesa confirma alcance e caminho; o servidor controla uso por turno ativo. */
export function ResgateAction({ characterId, nex, onRefetch }: Props) {
  const [open, setOpen] = useState(false);
  const [targetId, setTargetId] = useState('');
  const [freeAction, setFreeAction] = useState(false);
  const [shortRange, setShortRange] = useState(false);
  const [normalMovement, setNormalMovement] = useState(false);
  const [roundConfirmed, setRoundConfirmed] = useState(false);
  const options = useQuery({
    queryKey: ['resgate-movement-options', characterId], enabled: !!characterId,
    queryFn: async () => {
      const { data, error } = await activityClient.rpc('get_character_resgate_movement_options', { p_character_id: characterId });
      if (error) throw activityFailure('Não foi possível conferir Resgate.', error);
      return parseOptions(data);
    }, refetchOnReconnect: true, refetchOnWindowFocus: true,
  });
  const refreshOptions = options.refetch;
  const defense = useQuery({
    queryKey: ['resgate-defense-status', characterId], enabled: !!characterId,
    queryFn: async () => {
      const { data, error } = await activityClient.rpc('get_character_resgate_defense_status', { p_character_id: characterId });
      if (error || !data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Defesa indisponível.');
      const status = data as Record<string, unknown>;
      return { bonus: status.bonus === 5 ? 5 : 0 };
    }, refetchInterval: 5000, refetchOnReconnect: true, refetchOnWindowFocus: true,
  });
  const budget = usePETurnBudget(characterId);
  const action = useItemSituationalAction(characterId, onRefetch ?? (() => undefined), 'confirm_character_resgate_movement');
  const target = options.data?.targets.find(entry => entry.id === targetId);
  const ready = !!options.data?.eligible && !!options.data.trained && !!options.data.medicalKit
    && !!target && !options.data.usedInCurrentControl && freeAction && shortRange && normalMovement && roundConfirmed
    && (budget.data?.mode !== 'combat' || budget.data.actorId === characterId)
    && !!budget.data && !action.busy && !action.uncertain;

  useEffect(() => {
    const payload = action.receipt?.payload;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload) || payload.kind !== 'resgate_movement') return;
    setOpen(false); setTargetId(''); setFreeAction(false); setShortRange(false); setNormalMovement(false); setRoundConfirmed(false);
    void refreshOptions();
  }, [action.receipt, refreshOptions]);

  const confirm = () => {
    if (!ready || !budget.data) return;
    void action.confirm({ targetId, expectedNex: nex, expectedTurnKey: budget.data.key,
      freeActionConfirmed: true, shortRangeConfirmed: true, normalMovementConfirmed: true,
      roundConfirmed: true });
  };
  const result = action.receipt?.payload;
  const confirmed = result && typeof result === 'object' && !Array.isArray(result)
    && result.kind === 'resgate_movement' ? result : null;

  return <section className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 space-y-3" aria-label="Resgate">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><strong className="text-sm text-emerald-200">Resgate</strong>
        <p className="text-xs text-muted-foreground">Ação livre · 1 vez por rodada · aliado machucado ou morrendo em alcance curto.</p></div>
      <Button type="button" size="sm" variant="outline" onClick={() => { setOpen(value => !value); void options.refetch(); }}>
        {open ? 'Fechar' : 'Registrar movimento'}
      </Button>
    </div>
    {confirmed && <p role="status" className="text-sm text-emerald-200">
      Movimento até {String(confirmed.targetName)} confirmado no servidor e salvo no histórico.
    </p>}
    {defense.data?.bonus === 5 && <p role="status" className="text-xs text-emerald-200">
      +5 Defesa confirmado pelo servidor até o início do seu próximo turno.
    </p>}
    {budget.data && !budget.data.tracked && <p className="text-xs text-muted-foreground">
      Sem controle de turnos, a mesa aplica e encerra manualmente o +5 de Defesa após curar PV ou remover condição do aliado.
    </p>}
    <p className="text-xs text-muted-foreground">
      O +5 de Defesa é automático para curas de Paramédico e remoções de Equipe de Trauma. Outras fontes registradas neste turno podem ser confirmadas pelo mestre abaixo.
    </p>
    <ResgateOtherSourceReview characterId={characterId} onRefetch={onRefetch} />
    {open && <div className="space-y-3 text-sm">
      {options.isLoading && <p>Conferindo aliados no servidor…</p>}
      {options.error && <p role="alert" className="text-destructive">Não foi possível conferir Resgate. Atualize e tente novamente.</p>}
      {options.data && <>
        {!options.data.eligible && <p role="alert" className="text-destructive">Requer Médico de Campo no NEX 65% ou superior.</p>}
        {!options.data.trained && <p role="alert" className="text-destructive">Requer Medicina treinada.</p>}
        {!options.data.medicalKit && <p role="alert" className="text-destructive">Requer kit de Medicina identificado.</p>}
        {options.data.usedInCurrentControl && <p role="status">Resgate já registrado nesta rodada ou turno manual.</p>}
        {budget.data?.mode === 'combat' && budget.data.actorId !== characterId &&
          <p role="status">Resgate preparado fora do turno exige registro e gatilho no servidor. Este painel ainda não confirma essa execução; aguarde seu turno ou resolva com a mesa.</p>}
        <label className="block space-y-1"><span>Aliado machucado ou morrendo</span>
          <select aria-label="Alvo de Resgate" className="w-full rounded border border-border bg-background p-2 text-foreground"
            value={targetId} disabled={action.busy || action.uncertain} onChange={event => setTargetId(event.target.value)}>
            <option value="">Selecione um aliado</option>
            {options.data.targets.map(ally => <option key={ally.id} value={ally.id}>
              {ally.name} ({ally.currentHp}/{ally.maxHp} PV)</option>)}
          </select></label>
        {options.data.targets.length === 0 && <p>Nenhum aliado elegível vinculado à campanha.</p>}
        <label className="flex items-start gap-2"><Checkbox checked={freeAction} disabled={action.busy || action.uncertain}
          onCheckedChange={value => setFreeAction(value === true)} />Tenho uma ação livre disponível.</label>
        <label className="flex items-start gap-2"><Checkbox checked={shortRange} disabled={action.busy || action.uncertain}
          onCheckedChange={value => setShortRange(value === true)} />A mesa confirmou alcance curto.</label>
        <label className="flex items-start gap-2"><Checkbox checked={normalMovement} disabled={action.busy || action.uncertain}
          onCheckedChange={value => setNormalMovement(value === true)} />Posso chegar ao aliado com meu deslocamento normal.</label>
        <label className="flex items-start gap-2"><Checkbox checked={roundConfirmed} disabled={action.busy || action.uncertain}
          onCheckedChange={value => setRoundConfirmed(value === true)} />A mesa confirmou que ainda não usei Resgate nesta rodada.</label>
        <p className="text-xs text-muted-foreground">Sem controle de turnos, a mesa confere o limite de 1 vez por rodada. Ao carregar um personagem, conte metade dos espaços ocupados; confirme a carga com o mestre.</p>
        {budget.error && <p role="alert" className="text-destructive">Turno indisponível. Atualize antes de confirmar.</p>}
        {action.error && <p role="alert" className="text-destructive">{action.error}</p>}
        {action.uncertain && <Button type="button" variant="outline" disabled={action.busy}
          onClick={() => void action.recover()}>Recuperar confirmação</Button>}
        <Button type="button" disabled={!ready} onClick={confirm}>Confirmar movimento</Button>
      </>}
    </div>}
  </section>;
}

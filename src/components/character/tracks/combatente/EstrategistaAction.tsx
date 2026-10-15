import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useItemSituationalAction } from '@/hooks/useItemSituationalAction';
import { usePETurnBudget } from '@/hooks/character/usePETurnBudget';
import { useTemporaryResources } from '@/hooks/character/useTemporaryResources';
import { activityClient, activityFailure } from '@/services/character-activity-service';

interface EstrategistaActionProps {
  characterId: string;
  nex: number;
  intellect: number;
  peCurrent: number;
  onRefetch?: () => unknown | Promise<unknown>;
}

/** Prepara o pedido; o servidor revalida ficha, campanha, alvos, PE e turno. */
export function EstrategistaAction({ characterId, nex, intellect, peCurrent, onRefetch }: EstrategistaActionProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [standardAction, setStandardAction] = useState(false);
  const [rangeConfirmed, setRangeConfirmed] = useState(false);
  const targets = useQuery({
    queryKey: ['estrategista-targets', characterId], enabled: !!characterId,
    queryFn: async () => {
      const { data, error } = await activityClient.rpc('get_character_estrategista_targets', { p_character_id: characterId });
      if (error) throw activityFailure('Não foi possível listar os aliados.', error);
      return data ?? [];
    }, refetchOnWindowFocus: true,
  });
  const budget = usePETurnBudget(characterId);
  const temporary = useTemporaryResources(characterId);
  const action = useItemSituationalAction(characterId, onRefetch ?? (() => undefined), 'confirm_character_estrategista');
  const cost = selected.length;
  const max = Math.max(0, Math.min(5, intellect));
  const affordable = cost > 0 && peCurrent + temporary.pe >= cost && (!budget.data?.tracked || cost <= budget.data.remaining);

  useEffect(() => {
    const payload = action.receipt?.payload;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload) || payload.kind !== 'estrategista') return;
    setSelected([]); setStandardAction(false); setRangeConfirmed(false); setOpen(false);
  }, [action.receipt]);

  if (nex < 40) return null;
  const toggle = (id: string, checked: boolean) => setSelected(current => checked
    ? current.includes(id) || current.length >= max ? current : [...current, id]
    : current.filter(value => value !== id));
  const confirm = () => {
    if (!affordable || !standardAction || !rangeConfirmed || !budget.data || action.busy || action.uncertain) return;
    void action.confirm({ targets: selected, standardActionConfirmed: true, rangeConfirmed: true,
      expectedPE: peCurrent, expectedIntellect: intellect, expectedNex: nex,
      expectedTurnKey: budget.data.key });
  };
  return (
    <section className="rounded-lg border border-primary/40 bg-card/70 p-3 space-y-3" aria-label="Estrategista">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <strong className="text-sm">Estrategista</strong>
          <p className="text-xs text-muted-foreground">Ação padrão · 1 PE por aliado · até {max} aliado(s) · alcance {nex >= 65 ? 'médio' : 'curto'}.</p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(value => !value)}>{open ? 'Fechar' : 'Preparar'}</Button>
      </div>
      {action.receipt && <p role="status" className="text-xs text-foreground">Confirmado no servidor: os aliados selecionados receberam uma ação de movimento para o próximo turno. O custo e os alvos estão no histórico da ficha.</p>}
      {open && <div className="space-y-3">
        <p className="text-xs">Escolha aliados da mesma campanha. Cada um terá uma ação de movimento adicional no próximo turno.</p>
        {targets.isLoading && <p className="text-xs">Carregando aliados…</p>}
        {targets.error && <p role="alert" className="text-xs text-destructive">Não foi possível carregar os aliados. Tente novamente.</p>}
        {!targets.isLoading && !targets.error && targets.data?.length === 0 && <p className="text-xs text-warning">Nenhum aliado vinculado à mesma campanha.</p>}
        {targets.data?.map(target => <label key={target.id} className="flex items-center gap-2 rounded border border-border/60 p-2 text-sm">
          <Checkbox checked={selected.includes(target.id)} disabled={action.busy || action.uncertain || (!selected.includes(target.id) && selected.length >= max)}
            onCheckedChange={checked => toggle(target.id, checked === true)} aria-label={`Direcionar ${target.name}`} />
          <span>{target.name}</span>
        </label>)}
        <label className="flex items-start gap-2 text-xs"><Checkbox checked={standardAction} disabled={action.busy || action.uncertain} onCheckedChange={value => setStandardAction(value === true)} />Confirmei que há uma ação padrão disponível.</label>
        <label className="flex items-start gap-2 text-xs"><Checkbox checked={rangeConfirmed} disabled={action.busy || action.uncertain} onCheckedChange={value => setRangeConfirmed(value === true)} />Confirmei com a mesa que cada aliado está em alcance {nex >= 65 ? 'médio' : 'curto'}.</label>
        <p className="text-sm font-medium">{cost} aliado(s) · custo total {cost} PE · saldo disponível {peCurrent + temporary.pe} PE{budget.data?.tracked ? ` · orçamento restante ${budget.data.remaining} PE` : ''}</p>
        {budget.error && <p role="alert" className="text-xs text-destructive">Orçamento indisponível; atualize antes de confirmar.</p>}
        {action.error && <p role="alert" className="text-xs text-destructive">{action.error}</p>}
        {action.uncertain && <Button type="button" size="sm" variant="outline" disabled={action.busy} onClick={() => void action.recover()}>Recuperar confirmação</Button>}
        <Button type="button" size="sm" disabled={!affordable || !standardAction || !rangeConfirmed || !budget.data || action.busy || action.uncertain}
          onClick={confirm}>Confirmar Estrategista · {cost} PE</Button>
      </div>}
    </section>
  );
}

/** Mostra ao aliado a concessão persistida; o uso exige declarar o próximo turno. */
export function EstrategistaGrantedActions({ characterId, onRefetch }: { characterId: string; onRefetch?: () => unknown | Promise<unknown> }) {
  const queries = useQueryClient();
  const [nextTurn, setNextTurn] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState<{ grantId: string; operationId: string } | null>(null);
  const [error, setError] = useState('');
  const grants = useQuery({
    queryKey: ['estrategista-grants', characterId], enabled: !!characterId,
    queryFn: async () => {
      const { data, error: failure } = await activityClient.rpc('list_character_estrategista_grants', { p_character_id: characterId });
      if (failure) throw activityFailure('Não foi possível carregar ações adicionais.', failure);
      return data ?? [];
    }, refetchOnReconnect: true, refetchOnWindowFocus: true, refetchInterval: 15000,
  });
  if (!grants.data?.length && !grants.error && !pending) return null;
  const confirmGrantUse = async (grantId: string) => {
    const operation = pending?.grantId === grantId ? pending : { grantId, operationId: crypto.randomUUID() };
    setPending(operation); setError('');
    try {
      const { data, error: failure } = await activityClient.rpc('use_character_estrategista_grant', {
        p_operation_id: operation.operationId, p_character_id: characterId,
        p_grant_operation_id: grantId, p_next_turn_confirmed: true,
      });
      if (failure) {
        if (['22023','42501','55004','23505'].includes(failure.code ?? '')) setPending(null);
        throw activityFailure('A ação adicional não foi confirmada.', failure);
      }
      if (!data || data.operation_id !== operation.operationId || data.character_id !== characterId) throw new Error('O recibo não corresponde à ficha. Recupere a mesma tentativa.');
      setPending(null); setNextTurn(previous => ({ ...previous, [grantId]: false }));
      try {
        await Promise.all([grants.refetch(), queries.invalidateQueries({ predicate: query => query.queryKey[0] === 'character-activity' && query.queryKey[2] === characterId })]);
        await onRefetch?.();
      } catch { setError('Uso confirmado no servidor. Recarregue a ficha para atualizar a tela; não repita a ação.'); }
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Confira a conexão e recupere a tentativa.'); }
  };
  return <section className="rounded-lg border border-primary/40 bg-card/70 p-3 space-y-2" aria-label="Ações de movimento concedidas">
    <strong className="text-sm">Ações de movimento concedidas</strong>
    {grants.error && <p role="alert" className="text-xs text-destructive">Não foi possível carregar as concessões. Atualize a ficha.</p>}
    {grants.data?.map(grant => <div key={grant.operation_id} className="space-y-2 border-t border-border/60 pt-2">
      <p className="text-xs">Estrategista de {grant.source_name}: +1 ação de movimento no seu próximo turno.</p>
      <label className="flex items-center gap-2 text-xs"><Checkbox checked={!!nextTurn[grant.operation_id]}
        onCheckedChange={value => setNextTurn(previous => ({ ...previous, [grant.operation_id]: value === true }))} />Este é meu próximo turno após a concessão.</label>
      <Button size="sm" variant="outline" disabled={!nextTurn[grant.operation_id] || !!pending && pending.grantId !== grant.operation_id}
        onClick={() => void confirmGrantUse(grant.operation_id)}>{pending?.grantId === grant.operation_id ? 'Recuperar uso' : 'Registrar uso'}</Button>
    </div>)}
    {pending && !grants.data?.some(grant => grant.operation_id === pending.grantId) &&
      <Button size="sm" variant="outline" onClick={() => void confirmGrantUse(pending.grantId)}>Recuperar uso pendente</Button>}
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
  </section>;
}

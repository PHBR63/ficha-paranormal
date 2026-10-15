import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useItemSituationalAction } from '@/hooks/useItemSituationalAction';
import { usePETurnBudget } from '@/hooks/character/usePETurnBudget';
import { useTemporaryResources } from '@/hooks/character/useTemporaryResources';
import { activityClient, activityFailure } from '@/services/character-activity-service';

interface InspirarConfiancaActionProps {
  characterId: string;
  nex: number;
  peCurrent: number;
  onRefetch?: () => unknown | Promise<unknown>;
}

/** O servidor escolhe os dados, cobra PE e grava o novo teste nas duas fichas. */
export function InspirarConfiancaAction({ characterId, nex, peCurrent, onRefetch }: InspirarConfiancaActionProps) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [reactionConfirmed, setReactionConfirmed] = useState(false);
  const [rangeConfirmed, setRangeConfirmed] = useState(false);
  const [recentConfirmed, setRecentConfirmed] = useState(false);
  const queries = useQueryClient();
  const tests = useQuery({
    queryKey: ['inspirar-tests', characterId], enabled: !!characterId && open,
    queryFn: async () => {
      const { data, error } = await activityClient.rpc('get_character_inspirar_tests', { p_character_id: characterId });
      if (error) throw activityFailure('Não foi possível carregar os testes dos aliados.', error);
      return data ?? [];
    }, refetchOnWindowFocus: true, refetchOnReconnect: true,
  });
  const budget = usePETurnBudget(characterId);
  const temporary = useTemporaryResources(characterId);
  const action = useItemSituationalAction(characterId, onRefetch ?? (() => undefined), 'confirm_character_inspirar_confianca');
  const selected = tests.data?.find(test => test.event_id === selectedId);
  const affordable = peCurrent + temporary.pe >= 2 && (!budget.data?.tracked || budget.data.remaining >= 2);
  const receipt = action.receipt?.payload;
  const confirmed = receipt && typeof receipt === 'object' && !Array.isArray(receipt) && receipt.kind === 'inspirar_confianca' ? receipt : null;

  useEffect(() => {
    const payload = action.receipt?.payload;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload) || payload.kind !== 'inspirar_confianca') return;
    setOpen(false); setSelectedId(''); setReactionConfirmed(false); setRangeConfirmed(false); setRecentConfirmed(false);
    void queries.invalidateQueries({ queryKey: ['inspirar-tests', characterId] });
  }, [action.receipt, characterId, queries]);

  if (nex < 10) return null;
  const confirm = () => {
    if (!selected || !budget.data || !affordable || !reactionConfirmed || !rangeConfirmed || !recentConfirmed || action.busy || action.uncertain) return;
    void action.confirm({ targetId: selected.target_id, originalEventId: selected.event_id,
      reactionConfirmed: true, rangeConfirmed: true, recentConfirmed: true,
      expectedPE: peCurrent, expectedNex: nex, expectedTurnKey: budget.data.key });
  };
  return <section className="rounded-lg border border-primary/40 bg-card/70 p-3 space-y-3" aria-label="Inspirar Confiança">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <strong className="text-sm">Inspirar Confiança</strong>
        <p className="text-xs text-muted-foreground">Reação · 2 PE · um aliado em alcance {nex >= 65 ? 'médio' : 'curto'} repete um teste recém realizado.</p>
      </div>
      <Button type="button" size="sm" variant="outline" onClick={() => { setOpen(value => !value); void tests.refetch(); }}>
        {open ? 'Fechar' : 'Preparar'}
      </Button>
    </div>
    {confirmed && <p role="status" className="text-xs text-foreground">Confirmado no servidor: {String(confirmed.testLabel)} de {String(confirmed.targetName)}, {String(confirmed.originalTotal)} → {String(confirmed.rerollTotal)}. Os 2 PE e a nova rolagem constam nos históricos das duas fichas.{confirmed.requiresReview === true ? ' Efeitos do ataque aguardam revisão da mesa.' : ''}</p>}
    {open && <div className="space-y-3">
      <p className="text-xs">Selecione o último teste elegível do aliado. A mesa confirma que ele acaba de ser realizado; um teste antigo não deve ser repetido.</p>
      {tests.isLoading && <p className="text-xs">Carregando testes…</p>}
      {tests.error && <p role="alert" className="text-xs text-destructive">Não foi possível carregar os testes. Tente novamente.</p>}
      {!tests.isLoading && !tests.error && tests.data?.length === 0 && <p className="text-xs text-warning">Nenhum aliado com teste elegível salvo no servidor.</p>}
      {tests.data?.map(test => <label key={test.event_id} className="flex items-start gap-2 rounded border border-border/60 p-2 text-sm">
        <Checkbox checked={selectedId === test.event_id} disabled={action.busy || action.uncertain}
          onCheckedChange={checked => setSelectedId(checked === true ? test.event_id : '')} aria-label={`Selecionar teste de ${test.target_name}`} />
        <span><strong>{test.target_name}</strong> · {test.test_label} ({test.test_type}) · resultado anterior {test.original_total}
          <span className="block text-xs text-muted-foreground">Registrado em {new Date(test.performed_at).toLocaleString('pt-BR')}</span></span>
      </label>)}
      <label className="flex items-start gap-2 text-xs"><Checkbox checked={reactionConfirmed} disabled={action.busy || action.uncertain} onCheckedChange={value => setReactionConfirmed(value === true)} />Tenho uma reação disponível.</label>
      <label className="flex items-start gap-2 text-xs"><Checkbox checked={rangeConfirmed} disabled={action.busy || action.uncertain} onCheckedChange={value => setRangeConfirmed(value === true)} />Confirmei alcance {nex >= 65 ? 'médio' : 'curto'} com a mesa.</label>
      <label className="flex items-start gap-2 text-xs"><Checkbox checked={recentConfirmed} disabled={action.busy || action.uncertain} onCheckedChange={value => setRecentConfirmed(value === true)} />Este teste acaba de ser realizado e ainda pode ser repetido.</label>
      {selected?.test_type === 'attack' && <p className="text-xs text-warning">Em ataques, confira novamente acerto, camuflagem e efeitos com o mestre. Dano, munição e custos do ataque não são repetidos automaticamente.</p>}
      <p className="text-sm font-medium">Custo 2 PE · saldo disponível {peCurrent + temporary.pe} PE{budget.data?.tracked ? ` · orçamento restante ${budget.data.remaining} PE` : ''}</p>
      {budget.error && <p role="alert" className="text-xs text-destructive">Orçamento indisponível; atualize antes de confirmar.</p>}
      {action.error && <p role="alert" className="text-xs text-destructive">{action.error}</p>}
      {action.uncertain && <Button type="button" size="sm" variant="outline" disabled={action.busy} onClick={() => void action.recover()}>Recuperar confirmação</Button>}
      <Button type="button" size="sm" disabled={!selected || !budget.data || !affordable || !reactionConfirmed || !rangeConfirmed || !recentConfirmed || action.busy || action.uncertain}
        onClick={confirm}>Confirmar nova rolagem · 2 PE</Button>
    </div>}
  </section>;
}

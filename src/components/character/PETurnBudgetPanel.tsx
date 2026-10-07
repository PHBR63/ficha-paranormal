import { useRef, useState } from 'react';
import { usePETurnBudget } from '@/hooks/character/usePETurnBudget';
import { beginManualTurn, getRitualTurn } from '@/services/sustained-ritual-service';
import { pauseManualTurn } from '@/services/pe-turn-budget-service';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

/** Controle explícito do relógio manual e leitura do gasto confirmado de rituais/manutenção. */
export function PETurnBudgetPanel({ characterId }: { characterId: string }) {
  const query = usePETurnBudget(characterId);
  const [request, setRequest] = useState<{ operationId: string; number: number; action: 'start' | 'pause' } | null>(null);
  // Mantém o contexto visual durante a animação de fechamento, sem reutilizá-lo para enviar operações.
  const displayedRequest = useRef<typeof request>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const executing = useRef(false);
  const budget = query.data;
  const dialogRequest = request ?? displayedRequest.current;

  async function prepare(action: 'start' | 'pause') {
    if (executing.current || request) return;
    executing.current = true; setBusy(true); setFailure(null);
    try {
      const turn = await getRitualTurn(characterId);
      if (turn.mode !== 'manual' || !Number.isSafeInteger(turn.number)) throw new Error('Use o turno do combate ativo.');
      const prepared = { operationId: crypto.randomUUID(), number: turn.number!, action };
      displayedRequest.current = prepared;
      setRequest(prepared);
    } catch (cause) { setFailure(cause instanceof Error ? cause.message : 'Turno não confirmado.'); }
    finally { executing.current = false; setBusy(false); }
  }

  async function confirm() {
    if (executing.current || !request) return;
    executing.current = true; setBusy(true); setFailure(null);
    try {
      if (request.action === 'start') await beginManualTurn(characterId, request.operationId, request.number);
      else await pauseManualTurn(characterId, request.operationId, request.number);
      setRequest(null);
      const fresh = await query.refetch();
      if (fresh.error) setFailure('Operação confirmada. Recarregue para conferir o orçamento atual.');
    } catch (cause) {
      setFailure(cause instanceof Error ? cause.message : 'O servidor não confirmou. Recupere a mesma operação.');
      if (cause instanceof Error && 'serverRejected' in cause && cause.serverRejected) setRequest(null);
    } finally { executing.current = false; setBusy(false); }
  }

  return <section aria-label="Orçamento de PE por turno" className="rounded-lg border p-3 space-y-3 min-w-0">
    <h3 className="font-semibold">PE por turno — rituais e manutenção</h3>
    {query.isLoading && <p role="status">Conferindo orçamento no servidor…</p>}
    {(query.error || failure) && <p role="alert">{failure ?? (query.error instanceof Error ? query.error.message : 'Orçamento não confirmado.')}</p>}
    {budget && <>
      <p>{budget.tracked ? `${budget.mode === 'manual' ? `Turno manual ${budget.number}` : `Combate · rodada ${budget.round}`} · ${budget.spent} PE gastos · limite ${budget.limit}` : 'Sem controle de turnos ativo. Gastos são registrados sem criar turnos artificiais.'}</p>
      {budget.ritualLimit !== budget.limit && <p>Limite para conjuração: {budget.ritualLimit} PE, incluindo Presença Poderosa.</p>}
      <p className="text-xs text-muted-foreground">Temporários contam pelo custo total. Iniciar turno não mantém rituais nem cobra PE. Gastos de poderes em outros fluxos ainda exigem conferência.</p>
      <div className="flex flex-wrap gap-2">
        {budget.mode !== 'combat' && <Button variant="outline" disabled={busy || !!request || !!query.error} onClick={() => { void prepare('start'); }}>Iniciar ou avançar turno manual</Button>}
        {budget.mode === 'manual' && <Button variant="outline" disabled={busy || !!request || !!query.error} onClick={() => { void prepare('pause'); }}>Pausar controle manual</Button>}
        <Button variant="outline" disabled={busy || !!request} onClick={() => { void query.refetch(); }}>Atualizar orçamento</Button>
      </div>
    </>}
    {!budget && query.error && <Button onClick={() => { void query.refetch(); }}>Recarregar orçamento</Button>}
    <Dialog open={!!request} onOpenChange={open => { if (!open && !busy && !failure) setRequest(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogRequest?.action === 'pause' ? 'Pausar controle manual?' : 'Confirmar novo turno manual?'}</DialogTitle>
          <DialogDescription>{dialogRequest?.action === 'pause'
            ? 'A contagem cumulativa será pausada. Saldo, efeitos e histórico serão preservados; rituais sustentados continuam exigindo conferência e encerramento explícitos.'
            : `Turno ${dialogRequest?.number ?? 0} → ${(dialogRequest?.number ?? 0) + 1}. Confirme apenas no início real do turno. Nenhum PE será cobrado.`}</DialogDescription>
        </DialogHeader>
        {failure && <p role="alert">{failure}</p>}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={busy || !!failure} onClick={() => setRequest(null)}>Cancelar</Button>
          <Button disabled={busy} onClick={() => { void confirm(); }}>{busy ? 'Aguardando servidor…' : failure ? 'Recuperar mesma operação' : 'Confirmar'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  </section>;
}

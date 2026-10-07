import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useTemporaryResources } from '@/hooks/character/useTemporaryResources';
import { confirmTemporaryGrant, endTemporaryResource, type TemporaryGrant, type TemporaryResource } from '@/services/temporary-resource-service';

/** A tela prepara e confirma; o serviço grava fonte/saldo/histórico juntos no servidor. */
export function TemporaryResourcesPanel({ characterId }: { characterId: string }) {
  const state = useTemporaryResources(characterId);
  const [source, setSource] = useState(''); const [amount, setAmount] = useState('');
  const [resource, setResource] = useState<'hp' | 'pe'>('hp'); const [cumulative, setCumulative] = useState(false);
  const [request, setRequest] = useState<{ grant: TemporaryGrant } | { end: TemporaryResource; operationId: string } | null>(null);
  const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false); const lock = useRef(false);
  async function confirm() {
    if (!request || lock.current) return;
    lock.current = true; setBusy(true); setError(null);
    try {
      if ('grant' in request) await confirmTemporaryGrant(characterId, request.grant);
      else await endTemporaryResource(characterId, request.operationId, request.end);
      setRequest(null);
      const refreshed = await state.refetch();
      if (refreshed.error) setError('Operação confirmada; recarregue para conferir o saldo.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Repita a mesma operação para recuperar o recibo.');
      if (cause instanceof Error && 'serverRejected' in cause && cause.serverRejected) setRequest(null);
    }
    finally { lock.current = false; setBusy(false); }
  }
  return <section aria-label="Recursos temporários" className="rounded-lg border p-3 space-y-3 min-w-0">
    <h3 className="font-medium">Recursos temporários — {state.hp} PV · {state.pe} PE</h3>
    <p className="text-sm text-muted-foreground">Reservatórios separados dos máximos. Rituais, manutenção, dano de rituais e reduções de recursos consomem temporários primeiro. Informar um saldo absoluto altera o recurso normal. Fontes manuais devem ser encerradas quando sua duração acabar.</p>
    {(state.error || error) && <p role="alert">{error ?? state.error?.message}</p>}
    <fieldset disabled={busy || !!request || state.isPending || !!state.error} className="space-y-2 min-w-0">
      {state.data?.map(item => <div key={item.id} className="flex flex-wrap items-center gap-2 text-sm">
        <span>{item.source_name}: {item.remaining} {item.resource === 'hp' ? 'PV' : 'PE'} · {item.campaign_id ? 'termina com a cena vinculada' : 'encerramento manual'}{item.damage_types?.length ? ` · Apenas dano: ${item.damage_types.join(', ')}` : ''}</span>
        <Button size="sm" variant="outline" onClick={() => { setError(null); setRequest({ end: item, operationId: crypto.randomUUID() }); }}>Encerrar fonte</Button>
      </div>)}
      <details><summary className="cursor-pointer">Registrar concessão conferida com o mestre</summary>
        <div className="space-y-2 pt-2">
          <label className="block">Fonte<Input value={source} maxLength={150} onChange={event => setSource(event.target.value)} /></label>
          <label className="block">Recurso<select className="w-full rounded border bg-background p-2" value={resource} onChange={event => setResource(event.target.value as 'hp' | 'pe')}><option value="hp">PV temporários</option><option value="pe">PE temporários</option></select></label>
          <label className="block">Quantidade<Input type="number" min={1} max={1000000} step={1} value={amount} onChange={event => setAmount(event.target.value)} /></label>
          <label className="flex gap-2"><input type="checkbox" checked={cumulative} onChange={event => setCumulative(event.target.checked)} />A fonte autoriza acúmulo explicitamente; conferi no livro.</label>
          <Button disabled={!source.trim() || !Number.isSafeInteger(Number(amount)) || Number(amount) < 1 || Number(amount) > 1000000}
            onClick={() => { setError(null); setRequest({ grant: { operationId: crypto.randomUUID(), resource, source, amount: Number(amount), cumulative } }); }}>Revisar concessão</Button>
        </div>
      </details>
    </fieldset>
    <Dialog open={!!request} onOpenChange={open => { if (!open && !busy && !error) setRequest(null); }}><DialogContent>
      <DialogHeader><DialogTitle>{request && 'grant' in request ? 'Confirmar recurso temporário?' : 'Encerrar recurso temporário?'}</DialogTitle>
        <DialogDescription>{request && 'grant' in request ? `${request.grant.source}: ${request.grant.amount} ${request.grant.resource === 'hp' ? 'PV' : 'PE'}. ${request.grant.cumulative ? 'Acúmulo declarado pela fonte.' : 'A mesma fonte conserva o maior saldo.'} Encerramento manual conforme a duração. Não altera máximos normais.` : 'O saldo desta fonte será zerado; o histórico permanece e os recursos normais não mudam.'}</DialogDescription></DialogHeader>
      {error && <p role="alert">{error}</p>}
      <Button variant="outline" disabled={busy || !!error} onClick={() => setRequest(null)}>Cancelar</Button>
      <Button disabled={busy} onClick={() => void confirm()}>{busy ? 'Aguardando servidor…' : error ? 'Recuperar mesma confirmação' : 'Confirmar'}</Button>
    </DialogContent></Dialog>
  </section>;
}

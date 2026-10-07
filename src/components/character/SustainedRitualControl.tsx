import { useRef, useState } from 'react';
import { toast } from 'sonner';
import type { UseSustainedRitualsReturn, SustainedRitual } from '@/hooks/useSustainedRituals';
import { confirmSustainedAction, type SustainedActionRequest } from '@/services/sustained-ritual-service';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SustainedRitualsPanel } from './SustainedRitualsPanel';
import { MobileSustainedRitualsPanel } from './mobile/MobileSustainedRitualsPanel';

interface Props {
  characterId: string;
  peCurrent: number;
  state: Pick<UseSustainedRitualsReturn, 'rituals' | 'loading' | 'error' | 'reload'>;
  onRefetch?: () => unknown | Promise<unknown>;
  mobile?: boolean;
}

/** Compartilha confirmação e recuperação entre as duas fichas. Nunca debita PE localmente. */
export function SustainedRitualControl({ characterId, peCurrent, state, onRefetch, mobile }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [request, setRequest] = useState<SustainedActionRequest | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const executing = useRef(false);
  const Panel = mobile ? MobileSustainedRitualsPanel : SustainedRitualsPanel;

  function prepare(action: SustainedActionRequest['action'], rituals: SustainedRitual[]) {
    if (executing.current || request || state.loading || state.error || !rituals.length) return;
    if (rituals.some(ritual => !ritual.snapshot)) {
      setFailure('Recarregue as sustentações antes de confirmar.'); return;
    }
    setFailure(null);
    setRequest({ operationId: crypto.randomUUID(), characterId, action,
      expected: rituals.map(ritual => ritual.snapshot!).sort((a, b) => a.id.localeCompare(b.id)),
      expectedPE: action === 'maintain' ? peCurrent : null });
  }

  async function confirm() {
    if (!request || executing.current) return;
    executing.current = true; setBusy(true); setFailure(null);
    try {
      await confirmSustainedAction(request);
      setRequest(null); setSelected([]);
      toast.success(request.action === 'maintain' ? 'Manutenção confirmada pelo servidor.' : 'Encerramento confirmado pelo servidor.');
      try {
        const loaded = await state.reload();
        const character = await onRefetch?.();
        if (!loaded || character === null) throw new Error('Atualização pendente');
      } catch {
        setFailure('A operação foi confirmada. Recarregue para conferir os recursos e efeitos atuais.');
      }
    } catch (error) {
      setFailure(error instanceof Error ? error.message : 'Não foi possível confirmar. Repita a mesma operação.');
      // Uma rejeição explícita do banco não executou nada; timeout conserva UUID e snapshot.
      if (error instanceof Error && 'serverRejected' in error && error.serverRejected) setRequest(null);
    } finally { executing.current = false; setBusy(false); }
  }

  if (!state.rituals.length && !state.error && !failure && !request) return null;
  const cost = request?.action === 'maintain' ? request.expected.length : 0;
  return <section aria-label="Controle de sustentações" className="space-y-3">
    {(state.error || failure) && <div role="alert" className="text-sm text-destructive">
      {failure || state.error}
      {!request && <Button variant="outline" disabled={busy} onClick={() => { void state.reload(); }}>Recarregar sustentações</Button>}
    </div>}
    <fieldset disabled={busy || !!request || state.loading || !!state.error} className="space-y-3 min-w-0">
      <Panel rituals={state.rituals}
        onDeactivate={id => prepare('end', state.rituals.filter(ritual => ritual.id === id))}
        onClearAll={() => prepare('end_all', state.rituals)} />
      {state.rituals.length > 0 && <div className="rounded-lg border p-3 space-y-2 text-sm">
        <p>No início do seu turno: 1 PE por ritual, após confirmação. Confira os efeitos acima. Turnos são confirmados manualmente.</p>
        {state.rituals.map(ritual => <label key={ritual.id} className="flex items-start gap-2">
          <input type="checkbox" className="mt-1" checked={selected.includes(ritual.id)}
            disabled={ritual.casterCharacterId !== characterId}
            onChange={event => setSelected(previous => event.target.checked ? [...previous, ritual.id] : previous.filter(id => id !== ritual.id))} />
          <span>{ritual.ritualName} — 1 PE
            {ritual.casterCharacterId !== characterId && <span className="block text-muted-foreground">Manutenção manual: {ritual.casterCharacterId ? 'o conjurador é outra ficha.' : 'origem antiga não comprovada.'}</span>}
          </span>
        </label>)}
        <Button disabled={!selected.length} onClick={() => prepare('maintain', state.rituals.filter(ritual => selected.includes(ritual.id)))}>Revisar manutenção</Button>
      </div>}
    </fieldset>
    <Dialog open={!!request} onOpenChange={open => { if (!open && !busy && !failure) setRequest(null); }}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{request?.action === 'maintain' ? 'Confirmar manutenção deste turno?' : 'Confirmar encerramento?'}</DialogTitle>
          <DialogDescription>{request?.action === 'maintain'
            ? `Custo: ${cost} PE. Saldo: ${request.expectedPE} → ${(request.expectedPE ?? 0) - cost} PE. Os efeitos selecionados continuarão ativos.`
            : 'Os rituais selecionados serão encerrados. O histórico será preservado, sem estorno de PE. Efeitos antigos ou personalizados sem vínculo comprovado exigem conferência manual.'}</DialogDescription>
        </DialogHeader>
        {request?.action === 'maintain' && (request.expectedPE ?? 0) < cost && <p role="alert">PE insuficiente. Cancele e encerre os rituais que não puder manter.</p>}
        <ul className="space-y-2">{request?.expected.map(snapshot => {
          const ritual = state.rituals.find(item => item.id === snapshot.id);
          return <li key={snapshot.id}>
            <strong>{ritual?.ritualName ?? snapshot.ritual_id}</strong>
            <p className="text-sm text-muted-foreground">{ritual?.mechanics?.summary ?? 'Efeito sem resumo no catálogo: confira os efeitos da ficha e a descrição do ritual.'}</p>
          </li>;
        })}</ul>
        {failure && <p role="alert">{failure}</p>}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={busy || !!failure} onClick={() => setRequest(null)}>Cancelar</Button>
          <Button disabled={busy || (request?.action === 'maintain' && (request.expectedPE ?? 0) < cost)} onClick={() => { void confirm(); }}>
            {busy ? 'Aguardando servidor…' : failure ? 'Recuperar mesma confirmação' : 'Confirmar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </section>;
}

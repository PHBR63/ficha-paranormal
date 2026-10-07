import { useRef, useState } from 'react';
import { toast } from 'sonner';
import type { UseSustainedRitualsReturn, SustainedRitual } from '@/hooks/useSustainedRituals';
import { beginManualTurn, getRitualTurn, confirmSustainedAction, type SustainedActionRequest } from '@/services/sustained-ritual-service';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SustainedRitualsPanel } from './SustainedRitualsPanel';
import { MobileSustainedRitualsPanel } from './mobile/MobileSustainedRitualsPanel';
import { SustainedRitualEndingForm } from './SustainedRitualEndingForm';
import { validateRitualEndReason, type RitualEndReasonKind } from '@/lib/rituals/ritual-ending';
import { useTemporaryResources } from '@/hooks/character/useTemporaryResources';

interface Props {
  characterId: string;
  peCurrent: number;
  state: Pick<UseSustainedRitualsReturn, 'rituals' | 'loading' | 'error' | 'reload'>;
  onRefetch?: () => unknown | Promise<unknown>;
  mobile?: boolean;
}

/** Compartilha confirmação e recuperação entre as duas fichas. Nunca debita PE localmente. */
export function SustainedRitualControl({ characterId, peCurrent, state, onRefetch, mobile }: Props) {
  const temporary = useTemporaryResources(characterId);
  const [selected, setSelected] = useState<string[]>([]);
  const [request, setRequest] = useState<SustainedActionRequest | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [manualTurn, setManualTurn] = useState<{ operationId: string; number: number } | null>(null);
  const executing = useRef(false);
  const [endKind, setEndKind] = useState<RitualEndReasonKind | ''>('');
  const [endNote, setEndNote] = useState('');
  const [rangeConfirmed, setRangeConfirmed] = useState(false);
  const Panel = mobile ? MobileSustainedRitualsPanel : SustainedRitualsPanel;

  async function prepare(action: SustainedActionRequest['action'], rituals: SustainedRitual[]) {
    if (executing.current || request || manualTurn || state.loading || state.error || !rituals.length) return;
    if (rituals.some(ritual => !ritual.snapshot)) {
      setFailure('Recarregue as sustentações antes de confirmar.'); return;
    }
    setFailure(null);
    setEndKind(''); setEndNote(''); setRangeConfirmed(false);
    executing.current = true; setBusy(true);
    try {
      const turn = action === 'maintain' ? await getRitualTurn(characterId) : undefined;
      if (turn && !turn.eligible) throw new Error(turn.mode === 'manual' ? 'Registre o início do turno manual antes de manter.' : 'Aguarde o turno do conjurador no combate.');
      setRequest({ operationId: crypto.randomUUID(), characterId, action, turn,
        expected: rituals.map(ritual => ritual.snapshot!).sort((a, b) => a.id.localeCompare(b.id)),
        expectedPE: action === 'maintain' ? peCurrent : null, temporaryPE: temporary.pe });
    } catch (cause) { setFailure(cause instanceof Error ? cause.message : 'Turno não confirmado.'); }
    finally { executing.current = false; setBusy(false); }
  }

  async function prepareManualTurn() {
    if (executing.current || request || manualTurn) return;
    executing.current = true; setBusy(true); setFailure(null);
    try {
      const turn = await getRitualTurn(characterId);
      if (turn.mode !== 'manual' || !Number.isSafeInteger(turn.number)) throw new Error('Use o turno salvo do combate ativo.');
      setManualTurn({ operationId: crypto.randomUUID(), number: turn.number! });
    } catch (cause) { setFailure(cause instanceof Error ? cause.message : 'Turno não confirmado.'); }
    finally { executing.current = false; setBusy(false); }
  }
  async function confirmManualTurn() {
    if (executing.current || !manualTurn) return;
    executing.current = true; setBusy(true); setFailure(null);
    try {
      await beginManualTurn(characterId, manualTurn.operationId, manualTurn.number);
      setManualTurn(null); toast.success('Novo turno registrado. Nenhum PE foi cobrado.');
    } catch (cause) {
      setFailure(cause instanceof Error ? cause.message : 'Repita a mesma confirmação do turno.');
      if (cause instanceof Error && 'serverRejected' in cause && cause.serverRejected) setManualTurn(null);
    }
    finally { executing.current = false; setBusy(false); }
  }

  async function confirm() {
    if (!request || executing.current) return;
    const frozen = request.action === 'maintain' || request.endReason ? request : {
      ...request, endReason: endKind ? { kind: endKind, note: endNote.trim(), rangeConfirmed } : undefined,
    };
    if (frozen.action !== 'maintain') {
      const invalid = validateRitualEndReason(frozen.endReason);
      if (invalid) { setFailure(invalid); return; }
    }
    setRequest(frozen);
    executing.current = true; setBusy(true); setFailure(null);
    try {
      await confirmSustainedAction(frozen);
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
  const availablePE = (request?.expectedPE ?? 0) + (request?.temporaryPE ?? 0);
  const ending = request && request.action !== 'maintain';
  const draftReason = request?.endReason ?? (endKind ? { kind: endKind, note: endNote, rangeConfirmed } : undefined);
  const ownOrigin = !!request && request.expected.every(snapshot => state.rituals.find(ritual => ritual.id === snapshot.id)?.casterCharacterId === characterId);
  return <section aria-label="Controle de sustentações" className="space-y-3">
    {(state.error || failure) && <div role="alert" className="text-sm text-destructive">
      {failure || state.error}
      {!request && <Button variant="outline" disabled={busy} onClick={() => { void state.reload(); }}>Recarregar sustentações</Button>}
    </div>}
    <fieldset disabled={busy || !!request || !!manualTurn || state.loading || !!state.error} className="space-y-3 min-w-0">
      <Panel rituals={state.rituals}
        onDeactivate={id => prepare('end', state.rituals.filter(ritual => ritual.id === id))}
        onClearAll={() => prepare('end_all', state.rituals)} />
      {state.rituals.length > 0 && <div className="rounded-lg border p-3 space-y-2 text-sm">
        <p>No início do seu turno: 1 PE por ritual, após confirmação. A cobrança fica vinculada ao turno salvo no servidor. No combate v2, aguarde seu turno; fora dele, registre um turno manual.</p>
        <Button variant="outline" onClick={() => void prepareManualTurn()}>Registrar início de turno manual</Button>
        <details className="text-sm text-muted-foreground">
          <summary className="cursor-pointer">Concentração e encerramento — Livro Base</summary>
          <p className="mt-2">Concentração é exigida durante a execução: Vontade contra DT 15 + PE em condição ruim, 20 + PE em condição terrível, ou DT igual ao dano sofrido durante a execução (p.119). Falhar perde os PE e impede o ritual.</p>
          <p>Esta tela trata de efeitos já ativos. Dano depois da conjuração não é um gatilho geral para encerrá-los. Confira os gatilhos específicos da descrição. Sem manutenção, a sustentação termina (p.120); o conjurador pode encerrá-la com ação livre dentro do alcance (p.121).</p>
        </details>
        {state.rituals.map(ritual => <label key={ritual.id} className="flex items-start gap-2">
          <input type="checkbox" className="mt-1" checked={selected.includes(ritual.id)}
            disabled={ritual.casterCharacterId !== characterId}
            onChange={event => setSelected(previous => event.target.checked ? [...previous, ritual.id] : previous.filter(id => id !== ritual.id))} />
          <span>{ritual.ritualName} — 1 PE
            <span className="block text-muted-foreground">Manutenções confirmadas: {Number.isInteger(ritual.turnsActive) ? ritual.turnsActive : 'conferir'} · PE consumidos: {Number.isInteger(ritual.peSpentTotal) ? ritual.peSpentTotal : 'conferir'}</span>
            {ritual.sustainConfig.concentration && <span className="block text-muted-foreground">O catálogo indica concentração: confira a descrição específica, sem presumir teste contínuo após a conjuração.</span>}
            {Array.isArray(ritual.sustainConfig.endTriggers) && ritual.sustainConfig.endTriggers.length > 0 &&
              <span className="block text-muted-foreground break-words">Gatilhos cadastrados — conferir: {ritual.sustainConfig.endTriggers.map(trigger => typeof trigger === 'string' ? trigger : 'Gatilho antigo exige revisão').join('; ')}</span>}
            {ritual.sustainConfig.endTriggers != null && !Array.isArray(ritual.sustainConfig.endTriggers) &&
              <span className="block text-muted-foreground">Gatilhos antigos em formato não reconhecido: confira a descrição antes de encerrar.</span>}
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
            ? `Custo: ${cost} PE. Saldo normal: ${request.expectedPE}; temporário: ${request.temporaryPE ?? 0}. Total disponível: ${availablePE}; após manutenção: ${availablePE - cost}. Temporários são consumidos primeiro. Os efeitos selecionados continuarão ativos.`
            : 'Os rituais selecionados serão encerrados. O histórico será preservado, sem estorno de PE. Efeitos antigos ou personalizados sem vínculo comprovado exigem conferência manual.'}</DialogDescription>
        </DialogHeader>
        {request?.turn && <p role="status" className="text-sm">{request.turn.mode === 'combat' ? `Combate · cena ${request.turn.scene} · rodada ${request.turn.round}` : `Turno manual ${request.turn.number}`} · O servidor impede nova manutenção do mesmo ritual neste turno.</p>}
        {ending && <SustainedRitualEndingForm kind={draftReason?.kind ?? ''} note={draftReason?.note ?? ''}
          rangeConfirmed={draftReason?.rangeConfirmed ?? false} ownOrigin={ownOrigin} disabled={busy || !!request.endReason}
          onKind={kind => { setEndKind(kind); setRangeConfirmed(false); setFailure(null); }} onNote={note => { setEndNote(note); setFailure(null); }}
          onRange={confirmed => { setRangeConfirmed(confirmed); setFailure(null); }} />}
        {request?.action === 'maintain' && availablePE < cost && <p role="alert">PE insuficiente. Cancele e encerre os rituais que não puder manter.</p>}
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
          <Button disabled={busy || (ending && !!validateRitualEndReason(draftReason)) || (request?.action === 'maintain' && availablePE < cost)} onClick={() => { void confirm(); }}>
            {busy ? 'Aguardando servidor…' : failure ? 'Recuperar mesma confirmação' : 'Confirmar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    <Dialog open={!!manualTurn} onOpenChange={open => { if (!open && !busy && !failure) setManualTurn(null); }}>
      <DialogContent><DialogHeader><DialogTitle>Registrar novo turno manual?</DialogTitle>
        <DialogDescription>Turno {manualTurn?.number} → {(manualTurn?.number ?? 0) + 1}. Confirme somente quando um novo turno realmente começar. Nenhum PE será cobrado; a manutenção exige outra confirmação.</DialogDescription></DialogHeader>
        {failure && <p role="alert">{failure}</p>}
        <Button variant="outline" disabled={busy || !!failure} onClick={() => setManualTurn(null)}>Cancelar</Button>
        <Button disabled={busy} onClick={() => void confirmManualTurn()}>{busy ? 'Aguardando servidor…' : failure ? 'Recuperar mesmo início de turno' : 'Confirmar novo turno'}</Button>
      </DialogContent>
    </Dialog>
  </section>;
}

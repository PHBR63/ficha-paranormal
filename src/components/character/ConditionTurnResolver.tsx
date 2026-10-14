import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ActiveCondition } from './ConditionManager';
import { prepareConditionTurn, validateTurnResolution, type ConditionTurnResolution } from '@/lib/rules/condition-turn';
import type { CharacterActivityEvent } from '@/types/character-activity';

export type PrepareTurnApplication = (resolution: ConditionTurnResolution) => () => Promise<CharacterActivityEvent | void>;

/** Lê somente o resultado confirmado; prévias locais nunca são apresentadas como dados oficiais. */
function confirmedBleeding(receipt: CharacterActivityEvent | void): string | null {
  const payload = receipt ? receipt.payload : null;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const resolution = payload.resolution;
  if (!resolution || typeof resolution !== 'object' || Array.isArray(resolution)) return null;
  const tests = resolution.bleedingTests;
  if (!Array.isArray(tests) || !tests.length) return null;
  const test = tests[0];
  if (!test || typeof test !== 'object' || Array.isArray(test) || !Array.isArray(test.dice)) return null;
  const dice = test.dice.filter((value): value is number => typeof value === 'number');
  if (dice.length !== test.dice.length || typeof test.total !== 'number' || typeof test.passed !== 'boolean') return null;
  const effect = Array.isArray(resolution.effects) ? resolution.effects.find(entry => entry && typeof entry === 'object' && !Array.isArray(entry) && entry.conditionId === 'sangrando') : null;
  const loss = effect && typeof effect === 'object' && !Array.isArray(effect) && typeof effect.finalAmount === 'number' ? effect.finalAmount : 0;
  return `Sangrando: dados [${dice.join(', ')}], total ${test.total} contra DT 20. ${test.passed ? 'Estabilizado.' : `Falha: ${loss} de perda de PV; temporários são gastos primeiro.`}`;
}

/** Compartilha a resolução desktop/mobile. A prévia conserva os dados até confirmação ou cancelamento. */
export function ConditionTurnResolver({ conditions, vigor, prepareApplication }: {
  conditions: ActiveCondition[]; vigor?: number; prepareApplication?: PrepareTurnApplication;
}) {
  const [open, setOpen] = useState(false);
  const [modifier, setModifier] = useState('0');
  const [preview, setPreview] = useState<ConditionTurnResolution | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [confirmedResult, setConfirmedResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const operation = useRef<(() => Promise<CharacterActivityEvent | void>) | null>(null);
  const locked = useRef(false);
  // Congela condições/Vigor na abertura: uma mudança externa será rejeitada pelo snapshot no servidor.
  const snapshot = useRef({ conditions, vigor });
  const applicationAtOpen = useRef(prepareApplication);
  const openPreview = () => {
    snapshot.current = { conditions, vigor };
    applicationAtOpen.current = prepareApplication;
    setPreview(null); setDone(false); setConfirmedResult(null); setError(null); operation.current = null; setOpen(true);
  };
  const generate = () => {
    try {
      if (snapshot.current.vigor === undefined) throw new Error('Vigor indisponível. Resolva com o mestre.');
      if (!modifier.trim()) throw new Error('Informe o modificador do teste de Vigor.');
      setPreview(prepareConditionTurn(snapshot.current.conditions, snapshot.current.vigor, Number(modifier)));
      setError(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível preparar os efeitos.'); }
  };
  const confirm = async () => {
    if (locked.current || !preview || !applicationAtOpen.current) return;
    locked.current = true; setBusy(true); setError(null);
    try {
      validateTurnResolution(preview);
      operation.current ??= applicationAtOpen.current(preview);
      const receipt = await operation.current();
      setConfirmedResult(confirmedBleeding(receipt));
      setDone(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'O servidor não confirmou os efeitos.'); }
    finally { locked.current = false; setBusy(false); }
  };
  return <>
    <Button type="button" variant="outline" size="sm" className="max-w-full h-auto whitespace-normal" onClick={openPreview}>Resolver início de turno</Button>
    <Dialog open={open} onOpenChange={value => { if (!locked.current) setOpen(value); }}>
      <DialogContent className="max-w-lg max-h-[85dvh] overflow-y-auto" onEscapeKeyDown={event => { if (busy) event.preventDefault(); }}>
        <DialogHeader><DialogTitle>Início de turno — Livro Base</DialogTitle>
          <DialogDescription>Confira se este início de turno ainda não foi resolvido. Sangrando será sorteado no servidor apenas ao confirmar.</DialogDescription></DialogHeader>
        <p className="text-xs text-muted-foreground">Base v1.3, pp. 46, 88 e 311. Sangrando usa Vigor, sem treinamento de Fortitude. A perda ignora RD, mas gasta PV temporários gerais primeiro. Informe apenas bônus numéricos adicionais; os demais efeitos ainda usam a prévia declarada.</p>
        {!preview && <div className="space-y-2">
          <Label htmlFor="turn-vigor-modifier">Modificador adicional de Vigor</Label>
          <Input id="turn-vigor-modifier" inputMode="numeric" type="number" step="1" value={modifier} onChange={event => setModifier(event.target.value)} />
          <Button onClick={generate}>Conferir efeitos do turno</Button>
        </div>}
        {preview && <div className="space-y-3">
          {preview.effects.map((effect, index) => <div key={index} className="space-y-1 border rounded p-2">
            <p className="text-sm">{effect.label}: dados [{effect.dice.join(', ')}], resultado {effect.rolled}.</p>
            {effect.ignoresResistance ? <p className="text-xs">Perda de PV: {effect.rolled}. Não recebe redução por RD.</p> : <>
              <Label htmlFor={`turn-damage-${index}`}>Dano final de {effect.label} após resistências</Label>
              <Input id={`turn-damage-${index}`} type="number" inputMode="numeric" min="0" max={effect.rolled} step="1" disabled={busy || done || operation.current !== null}
                value={Number.isFinite(effect.finalAmount) ? effect.finalAmount : ''} onChange={event => setPreview({ ...preview, effects: preview.effects.map((entry, position) => position === index ? { ...entry, finalAmount: event.target.value.trim() ? Number(event.target.value) : NaN } : entry) })} />
              <p className="text-xs text-muted-foreground">Confira tipo de dano, resistências e imunidades com o mestre.</p>
            </>}
          </div>)}
          {preview.notices.map((notice, index) => <p key={index} className="text-sm text-warning">{notice}</p>)}
          {!preview.effects.length && !preview.removeIndexes.length && <p>Nenhuma alteração automática de recursos para este turno. Os avisos podem ser registrados na confirmação.</p>}
          {prepareApplication && (preview.effects.length > 0 || preview.removeIndexes.length > 0 || preview.notices.length > 0) && !done && <Button disabled={busy} onClick={() => void confirm()}>{busy ? 'Confirmando no servidor...' : operation.current ? 'Repetir a mesma confirmação' : 'Confirmar efeitos na ficha'}</Button>}
          {!prepareApplication && <p role="status">Resolução manual: esta tela não tem aplicação conectada ao servidor.</p>}
        </div>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {done && <p role="status">Efeitos confirmados e registrados no histórico da ficha.</p>}
        {confirmedResult && <p className="text-sm" role="status">{confirmedResult}</p>}
        <Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>{done ? 'Fechar' : 'Cancelar'}</Button>
      </DialogContent>
    </Dialog>
  </>;
}

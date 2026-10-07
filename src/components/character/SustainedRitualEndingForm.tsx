import { RITUAL_END_REASONS, type RitualEndReasonKind } from '@/lib/rituals/ritual-ending';
import { Input } from '@/components/ui/input';

interface Props {
  kind: RitualEndReasonKind | '';
  note: string;
  rangeConfirmed: boolean;
  ownOrigin: boolean;
  disabled: boolean;
  onKind: (kind: RitualEndReasonKind | '') => void;
  onNote: (note: string) => void;
  onRange: (confirmed: boolean) => void;
}

/** Coleta a declaração do encerramento; não altera efeitos nem recursos. */
export function SustainedRitualEndingForm(props: Props) {
  const selected = RITUAL_END_REASONS.find(reason => reason.kind === props.kind);
  return <fieldset disabled={props.disabled} className="space-y-3 min-w-0">
    <label className="block text-sm space-y-1">
      <span>Motivo do encerramento</span>
      <select className="w-full min-w-0 rounded-md border bg-background p-2" value={props.kind}
        onChange={event => props.onKind(event.target.value as RitualEndReasonKind | '')}>
        <option value="">Selecione o motivo</option>
        {RITUAL_END_REASONS.map(reason => <option key={reason.kind} value={reason.kind}
          disabled={reason.kind === 'voluntario' && !props.ownOrigin}>{reason.label}</option>)}
      </select>
    </label>
    {selected && <p className="text-sm text-muted-foreground">{selected.guidance}</p>}
    {!props.ownOrigin && <p className="text-sm text-muted-foreground">Outra ficha conjurou o efeito ou a origem é antiga. Confira o encerramento com o mestre; o encerramento pelo próprio conjurador não está comprovado aqui.</p>}
    {props.kind === 'voluntario' && <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" className="mt-1" checked={props.rangeConfirmed} onChange={event => props.onRange(event.target.checked)} />
      <span>Confirmo que o conjurador está dentro do alcance do ritual.</span>
    </label>}
    {props.kind && <label className="block text-sm space-y-1">
      <span>{['efeito_especifico', 'ajuste_manual'].includes(props.kind) ? 'Descrição do motivo (obrigatória)' : 'Observação (opcional)'}</span>
      <Input value={props.note} maxLength={500} onChange={event => props.onNote(event.target.value)} />
    </label>}
  </fieldset>;
}

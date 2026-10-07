import type { CastingConcentrationContext } from '@/lib/rituals/casting-concentration';
import { validateCastingConcentration } from '@/lib/rituals/casting-concentration';
import { Input } from '@/components/ui/input';

interface Props { value: CastingConcentrationContext; onChange: (value: CastingConcentrationContext) => void; peCost: number; disabled: boolean }
/** Preparação compartilhada; nenhuma rolagem, recurso ou efeito muda ao editar. */
export function CastingConcentrationForm({ value, onChange, peCost, disabled }: Props) {
  const error = validateCastingConcentration(value);
  return <fieldset disabled={disabled} className="rounded-lg border p-3 space-y-2 min-w-0 text-sm">
    <legend className="px-1 font-medium">Concentração durante a execução</legend>
    <p className="text-muted-foreground">Livro Base, p.119. Ao confirmar, o sistema rola Vontade com os bônus atuais da ficha. Falhar consome os PE e impede os efeitos.</p>
    <label className="block space-y-1"><span>Situação da conjuração</span>
      <select className="w-full min-w-0 rounded-md border bg-background p-2" value={value.situation}
        onChange={event => onChange({ ...value, situation: event.target.value as CastingConcentrationContext['situation'] })}>
        <option value="normal">Normal — sem teste situacional</option>
        <option value="ruim">Ruim — Vontade DT {15 + peCost}</option>
        <option value="terrivel">Terrível — Vontade DT {20 + peCost}</option>
      </select>
    </label>
    <p className="text-xs text-muted-foreground">Ruim: proteção leve, veículo em movimento, caído ou tempestade. Terrível: proteção pesada, veículo em alta velocidade, agarrado ou terremoto. Confira a situação com o mestre.</p>
    <label className="block space-y-1"><span>Dano durante a execução</span>
      <Input type="number" min={0} max={1000000} step={1} value={Number.isNaN(value.damage) ? '' : value.damage}
        onChange={event => onChange({ ...value, damage: event.target.value === '' ? NaN : Number(event.target.value) })} />
    </label>
    <p className="text-xs text-muted-foreground">0 indica ausência de dano. Um evento de dano gera teste separado, com DT igual ao dano; não desconta PV novamente. Em execução padrão ou menor, confira reação ou dano contínuo. Dano após conjuração não exige este teste.</p>
    {error && <p role="alert" className="text-destructive">{error}</p>}
  </fieldset>;
}

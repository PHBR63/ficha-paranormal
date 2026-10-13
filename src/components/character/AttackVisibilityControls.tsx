import { concealmentChance, hasHeatVision, describeConcealment, type AttackVisibilitySelection, type ConcealmentResult } from '@/lib/attack-concealment';

interface Props {
  value: AttackVisibilitySelection; onChange: (value: AttackVisibilitySelection) => void; disabled: boolean; blind: boolean;
  weapon: Parameters<typeof hasHeatVision>[0];
}
/** Contexto por ataque, declarado pela mesa; a prévia não sorteia o d10 nem mede o mapa. */
export function AttackVisibilityControls({ value, onChange, disabled, blind, weapon }: Props) {
  const heat = hasHeatVision(weapon);
  const needsConfirmation = value.level !== 'none' || blind;
  return <section aria-label="Camuflagem e cobertura do alvo" className="space-y-2 rounded border border-border p-3 text-sm">
    <label className="block">Camuflagem do alvo
      <select aria-label="Camuflagem do alvo" disabled={disabled} className="mt-1 w-full rounded border bg-background p-2" value={value.level}
        onChange={event => onChange({ ...value, level: event.target.value as AttackVisibilitySelection['level'], confirmed: false })}>
        <option value="none">Nenhuma declarada</option><option value="light">Leve — 20%</option><option value="total">Total — 50%</option>
      </select>
    </label>
    <p>{heat ? 'Visão de Calor instalada nesta arma: ignora camuflagem ao disparar.' : 'Sem Visão de Calor válida nesta arma.'}
      {blind && ' Cego impõe camuflagem total aos alvos; suas penalidades de dados permanecem.'}</p>
    <p>Chance efetiva: {concealmentChance(value.level,blind,heat)}%. D10 confirmado pelo servidor junto ao ataque. Falha não permite rolar dano, mesmo com crítico.</p>
    <label className="flex items-start gap-2"><input type="checkbox" checked={value.totalCover} disabled={disabled}
      onChange={event => onChange({ ...value, totalCover: event.target.checked, confirmed: false })} />Alvo tem cobertura total — não pode ser atacado.</label>
    {value.totalCover && <p role="alert" className="text-red-300">Cobertura total bloqueia o ataque. Visão de Calor não permite atravessar obstáculos.</p>}
    {needsConfirmation && <label className="flex items-start gap-2"><input type="checkbox" disabled={disabled} checked={value.confirmed}
      onChange={event => onChange({ ...value, confirmed: event.target.checked })} />Conferi a camuflagem, a situação de visão e a possibilidade de atacar este alvo com a mesa.</label>}
    <p className="text-xs text-muted-foreground">Posição e alvo são declarados. Cobertura leve deve entrar na Defesa informada; não será somada novamente. Outras exceções que ignoram camuflagem exigem conferência da mesa.</p>
  </section>;
}
export function AttackConcealmentSummary({ result }: { result?: ConcealmentResult }) {
  return result ? <p role="status" className={`rounded border p-3 text-sm ${result.failed ? 'border-red-400 text-red-300' : 'border-border text-foreground'}`}>{describeConcealment(result)}</p> : null;
}

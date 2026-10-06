import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { RitualEffect } from '@/lib/rituals/legacy-exports';
import { getAttributeDicePool } from '@/lib/attribute-dice-pool';
import { rollRitualResistance, type RitualResistanceBonuses, type RitualTargetAttributes } from '@/lib/rituals/ritual-resistance';
import { RitualFinalDamageConfirmation } from './RitualFinalDamageConfirmation';

/** Etapa compartilhada: usa atributos e treinamento do alvo, conservando DT explícita. */
export function RitualResistanceStep({ effect, damage, casterResistanceDT, targetAttributes,
  targetResistanceBonuses, onResult, mobile = false }: {
  effect: RitualEffect;
  damage: number;
  casterResistanceDT?: number;
  targetAttributes?: RitualTargetAttributes;
  targetResistanceBonuses?: RitualResistanceBonuses;
  onResult: (passed: boolean, adjustedDamage?: number) => void;
  mobile?: boolean;
}) {
  const [customDT, setCustomDT] = useState<string | null>(null);
  const [customBonus, setCustomBonus] = useState<string | null>(null);
  const [manualRoll, setManualRoll] = useState('');
  const [result, setResult] = useState<ReturnType<typeof rollRitualResistance> | null>(null);
  const resistance = effect.resistance;
  const type = resistance?.type ?? 'fortitude';
  const attrKey = { fortitude: 'vigor', reflexos: 'agility', vontade: 'presence' } as const;
  const attribute = targetAttributes?.[attrKey[type]];
  const defaultBonus = targetResistanceBonuses?.[type] ?? 0;
  const defaultDT = resistance?.dt ?? casterResistanceDT ?? 15;
  const dt = customDT === null ? defaultDT : customDT.trim() === '' ? NaN : Number(customDT);
  const bonus = customBonus === null ? defaultBonus : customBonus.trim() === '' ? NaN : Number(customBonus);
  const validDT = Number.isSafeInteger(dt) && dt >= 1;
  const validBonus = Number.isSafeInteger(bonus);
  const hasTarget = attribute !== undefined && Number.isSafeInteger(attribute);
  const canRoll = hasTarget && validDT && validBonus;
  const pool = hasTarget ? getAttributeDicePool(attribute) : undefined;
  useEffect(() => { setResult(null); setCustomBonus(null); }, [attribute, defaultBonus]);
  if (!resistance) return null;
  const handleRoll = (selectedDie?: number) => {
    if (canRoll) setResult(rollRitualResistance(attribute!, bonus, dt, selectedDie));
  };
  const adjustedDamage = result ? result.passed ? resistance.effect === 'anula' ? 0 : Math.floor(damage / 2) : damage : 0;
  const manualValid = Number.isInteger(Number(manualRoll)) && Number(manualRoll) >= 1 && Number(manualRoll) <= 20;
  return <div className="space-y-3">
    <p className="font-medium">Teste de {type}</p>
    <p className="text-xs text-muted-foreground">{resistance.effect === 'anula' ? 'Sucesso anula o efeito.' : 'Sucesso reduz o dano pela metade.'}</p>
    {!hasTarget && <p role="alert" className="text-sm text-destructive">Selecione um alvo para rolar e confirmar a resistência.</p>}
    <Input type="number" min={1} step={1} aria-label="Dificuldade da resistência" aria-invalid={!validDT}
      value={customDT ?? defaultDT} onChange={event => { setCustomDT(event.target.value); setResult(null); }} />
    {!validDT && <p role="alert" className="text-sm text-destructive">Informe uma DT inteira maior que zero.</p>}
    <Input type="number" step={1} aria-label="Bônus numérico da resistência" aria-invalid={!validBonus}
      value={customBonus ?? defaultBonus} onChange={event => { setCustomBonus(event.target.value); setResult(null); }} />
    <p className="text-xs text-muted-foreground">Bônus total de perícia e ajustes adicionais. Confira efeitos, equipamentos e bônus SUE do alvo; esses ajustes não são calculados automaticamente nesta etapa. O atributo determina os dados e não é somado ao resultado.</p>
    {!validBonus && <p role="alert" className="text-xs text-destructive">Informe um bônus inteiro, que pode ser negativo.</p>}
    {result ? <div className="space-y-2 text-center">
      <p>Dados: {result.dice.join(', ')}; selecionado: {result.kept}</p>
      <p>{result.kept} {result.modifier >= 0 ? '+' : '−'} {Math.abs(result.modifier)} = {result.total} vs DT {result.dt}</p>
      <p className="font-medium">{result.passed ? 'SUCESSO!' : 'FALHOU!'}</p>
      {effect.damage && !(result.passed && resistance.effect === 'anula') ? <RitualFinalDamageConfirmation key={`${result.total}-${result.dt}-${adjustedDamage}`}
        suggestedDamage={adjustedDamage} disabled={!canRoll} onConfirm={amount => onResult(result.passed, amount)} />
        : <Button className="w-full" disabled={!canRoll} onClick={() => onResult(result.passed, effect.damage ? 0 : undefined)}>Continuar</Button>}
    </div> : <div className="space-y-2">
      <Button className="w-full" disabled={!canRoll} onClick={() => handleRoll()}>
        {mobile ? 'Rolar d20' : 'Rolar Resistência'} ({pool?.count ?? '?'}d20, {pool?.keep === 'lowest' ? 'menor' : 'maior'})
      </Button>
      <p className="text-xs text-muted-foreground">Rolagem manual: informe o dado selecionado depois de rolar o pool acima.</p>
      <div className="flex gap-2">
        <Input type="number" min={1} max={20} step={1} aria-label="Dado selecionado do pool" value={manualRoll} onChange={event => setManualRoll(event.target.value)} />
        <Button variant="outline" disabled={!canRoll || !manualValid} onClick={() => handleRoll(Number(manualRoll))}>Usar</Button>
      </div>
    </div>}
  </div>;
}

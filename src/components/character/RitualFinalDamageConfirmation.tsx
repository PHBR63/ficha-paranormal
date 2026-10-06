import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/** Recebe o dano após resistência; confirma o valor final conferido pelo usuário após RD. */
export function RitualFinalDamageConfirmation({ suggestedDamage, onConfirm, disabled = false }: {
  suggestedDamage: number;
  onConfirm: (damage: number) => void;
  disabled?: boolean;
}) {
  const [adjustment, setAdjustment] = useState<string | null>(null);
  const damage = adjustment === null ? suggestedDamage : adjustment.trim() === '' ? NaN : Number(adjustment);
  const valid = Number.isSafeInteger(damage) && damage >= 0;
  return <div className="space-y-2">
    <p className="text-xs text-muted-foreground">Dano calculado antes da RD. Confira resistências, redução de dano e outros ajustes do alvo antes de aplicar.</p>
    <Input type="number" min={0} step={1} aria-label="Dano final para aplicação" aria-invalid={!valid}
      value={adjustment ?? suggestedDamage} onChange={event => setAdjustment(event.target.value)} />
    {!valid && <p role="alert" className="text-xs text-destructive">Informe um dano final inteiro maior ou igual a zero.</p>}
    <Button className="w-full" disabled={disabled || !valid} onClick={() => onConfirm(damage)}>Continuar</Button>
  </div>;
}

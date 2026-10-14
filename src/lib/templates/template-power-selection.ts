import { getPowerById } from '@/lib/class-powers/power-registry';

/**
 * Recebe os poderes sugeridos por um template e devolve somente escolhas opcionais.
 * Habilidades fundamentais são concedidas pela classe e não ocupam vagas de poder.
 * IDs desconhecidos permanecem para que a revisão da criação mostre o erro.
 */
export function templateOptionalPowerIds(powers: ReadonlyArray<{ powerId: string }> | null | undefined): string[] {
  return (powers ?? []).map(power => power.powerId).filter(id => !getPowerById(id)?.isCore);
}

import { describe, expect, it } from 'vitest';
import { templateOptionalPowerIds } from '../template-power-selection';

describe('poderes sugeridos por templates', () => {
  it('não ocupa vagas com habilidades fundamentais concedidas pela classe', () => {
    expect(templateOptionalPowerIds([
      { powerId: 'ecletico' },
      { powerId: 'perito' },
      { powerId: 'perito-explosivos' },
    ])).toEqual(['perito-explosivos']);
  });

  it('preserva IDs desconhecidos para a revisão apontar a incompatibilidade', () => {
    expect(templateOptionalPowerIds([{ powerId: 'poder-desconhecido' }]))
      .toEqual(['poder-desconhecido']);
  });
});

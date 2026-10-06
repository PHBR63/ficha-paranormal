/** Perfil adotado pela mesa; suplementos não são habilitados por esta revisão. */
export const BASE_RULES_PROFILE = {
  id: 'base-v1.3-mesa',
  revision: 1,
  label: 'Livro Base v1.3',
  naturalTwenty: 'requires-total',
  rest: 'existing-house-rule',
  supplements: [] as string[],
} as const;

export const BASE_RULES_NOTICES = [
  '20 natural: o total precisa alcançar a DT ou a Defesa, conforme a regra desta mesa.',
  'Descanso: mantém a regra atual do sistema; o interlúdio do livro ainda exige resolução manual.',
  'Suplementos e variantes adicionais não foram habilitados. Registros existentes são preservados.',
];

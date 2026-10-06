# Correções verificadas das regras

Registro por lote, baseado nos PDFs fornecidos. A auditoria original pertence ao
commit11c0c1a; este arquivo acompanha correções posteriores, sem substituir sua
proveniência nem declarar conformidade integral do sistema.

## Lote1 — custo básico dos rituais

### 1. Resumo

Livro Base v1.3, tabela5.2, impressa119/PDF129: custos básicos1/3/6/10PE.
Corrigidos22 registros de2º círculo (2→3PE) e17 de3º (4→6PE). O card da ficha
desktop agora apresenta o mesmo custo do modal, sem multiplicar por classe.

### 2. Arquivos e responsabilidades

- `src/lib/rituals/second-circle.ts`: dados tipados dos22 rituais de2º círculo;
  importa `UnifiedRitual`, fornece listas a `unified-rituals.ts`.
- `src/lib/rituals/third-circle.ts`: dados dos17 rituais de3º círculo; mesma ponte.
- `src/components/character/RitualCard.tsx`: recebe ritual, saldo e callback
  `onCast`; consulta o registro para custo conhecido e retorna a seleção à ficha.
  Preserva custo de ritual customizado e gratuidade explícita. A prop legada
  `isNonOccultist` continua aceita, sem alterar custo básico/adicional.
- `src/lib/rituals/__tests__/ritual-system.vitest.ts`: compara cada entrada,
  cálculo, conversão legada e fronteiras de saldo com expectativa da fonte.
- `src/components/character/__tests__/RitualCastRules.test.tsx`: exercita card e
  modais desktop/mobile, custo legado, saldo insuficiente e casos personalizados.
- `docs/RULES_FIXES.md`: este registro, sem consumidor no aplicativo.

### 3. Comunicação

Catálogos → `unified-rituals.ts` → `ritual-registry.ts`/`ritual-adapter.ts` →
card e modais → callback da ficha → serviço de débito de PE.
O card apenas apresenta/encaminha: não debita recursos. Modais usam o catálogo
atual para IDs conhecidos, inclusive quando recebem objetos com custo antigo.
Não houve migration nem alteração de fichas existentes.

### 4. Patch

Os campos `cost` básicos passaram a3 e6. Os adicionais Discente/Verdadeiro não
foram substituídos por uma tabela genérica. No card, o custo consulta o registro;
o adicional não tem multiplicador por classe.

### 5. Observações

Este lote fecha custo básico e apresentação/fronteira de saldo demonstrados;
não certifica SAN, concentração, resistência, duração ou efeitos de um ritual.
Preservadas as decisões de20 natural e Ataque Especial+5por2PE.

### 6. Testes

Antes:52 falhas reproduzidas no recorte de142 casos. Depois:142/142 aprovados.
Após casos adicionais de compatibilidade e expansão para testes do sistema de
rituais:203/203 aprovados. Tipos da aplicação aprovados.
Verificações reproduzíveis: `ritual-system.vitest.ts`, `RitualCastRules.test.tsx`
e os demais testes em `src/lib/rituals`, além de `ritual-casting.vitest.ts`.

## Lote 2 — dano de Deflagração de Energia

### 1. Resumo

Livro Base v1.3, impressa 129/PDF 139: rolar três d10 e multiplicar a soma por
dez. Corrigida a representação anterior de 30d10, que alterava a distribuição.
As formas básica e verdadeira herdam a mesma fórmula de dano.

### 2. Arquivos e responsabilidades

- `src/lib/rituals/fourth-circle.ts`: catálogo de Deflagração; fornece a fórmula.
- `src/lib/rituals/types.ts` e `legacy-exports.ts`: contratos e apresentação do
  multiplicador opcional; fórmulas antigas continuam com multiplicador 1.
- `src/lib/rituals/ritual-adapter.ts`: transporta o multiplicador ao modelo legado.
- `src/lib/rituals/ritual-damage.ts`: recebe fórmula e bônus, valida entradas,
  retorna dados originais, multiplicador, bônus e total; sem acesso ao banco.
- `src/lib/rituals/ritual-effects-engine.ts`: utiliza o cálculo nos efeitos.
- `src/hooks/sue/useRitualDamageWithSUE.ts`: aplica o cálculo antes dos adicionais
  do SUE; usado pelo modal legado.
- `src/components/character/RitualDamageModal.tsx`: apresenta e entrega o resultado.
- `src/components/character/RitualEffectWizard.tsx` e
  `mobile/MobileRitualEffectWizard.tsx`: processam dano e resistência nas fichas.
- `src/lib/rituals/__tests__/ritual-damage.vitest.ts` e
  `src/components/character/__tests__/RitualEffectWizardRules.test.tsx`: regressões
  do catálogo, motor, cálculo e três caminhos de interface.
- `docs/RULES_FIXES.md`: documentação sem consumidor no aplicativo.

### 3. Comunicação

Catálogo → registro/adaptador → motor, wizards ou hook SUE → callback da ficha.
O multiplicador afeta os dados; bônus fixos entram depois. Resistência reduz o
total pela metade antes do callback. Não há alteração de tabelas ou migration.

### 4. Patch

`{ diceCount: 3, diceType: 10, diceMultiplier: 10 }` substitui 30d10.
O total compartilhado é `somaDosDados * multiplicador + bonus`.

### 5. Observações

Este lote verifica o dano e sua redução. Não implementa seleção de todos os
alvos, imunidade do conjurador ou destruição de eletrônicos. Callbacks de dano
que apenas exibem avisos continuam sujeitos à integração com o alvo correto.
Cura e PV temporários não recebem o novo multiplicador.

### 6. Testes

Reproduzidas três falhas reais no catálogo/motor antes da correção. Depois,
14 casos focados passaram, incluindo dados 1/5/10 → 160, bônus +4 → 164 e
resistência bem-sucedida → 82. Expansão de rituais e interfaces: 217/217.
Incluídos casos sem multiplicador e rejeição de valores inválidos.

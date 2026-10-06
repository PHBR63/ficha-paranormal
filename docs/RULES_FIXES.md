# Correções verificadas das regras

Registro por lote, baseado nos PDFs fornecidos. A auditoria original pertence ao
commit 11c0c1a; este arquivo acompanha correções posteriores, sem substituir sua
proveniência nem declarar conformidade integral do sistema.

## Lote 1 — custo básico dos rituais

### 1. Resumo

Livro Base v1.3, tabela 5.2, impressa 119/PDF 129: custos básicos 1/3/6/10 PE.
Corrigidos 22 registros de 2º círculo (2→3 PE) e 17 de 3º (4→6 PE). O card da ficha
desktop agora apresenta o mesmo custo do modal, sem multiplicar por classe.

### 2. Arquivos e responsabilidades

- `src/lib/rituals/second-circle.ts`: dados tipados dos 22 rituais de 2º círculo;
  importa `UnifiedRitual`, fornece listas a `unified-rituals.ts`.
- `src/lib/rituals/third-circle.ts`: dados dos 17 rituais de 3º círculo; mesma ponte.
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

Os campos `cost` básicos passaram a 3 e 6. Os adicionais Discente/Verdadeiro não
foram substituídos por uma tabela genérica. No card, o custo consulta o registro;
o adicional não tem multiplicador por classe.

### 5. Observações

Este lote fecha custo básico e apresentação/fronteira de saldo demonstrados;
não certifica SAN, concentração, resistência, duração ou efeitos de um ritual.
Preservadas as decisões de 20 natural e Ataque Especial +5 por 2 PE.

### 6. Testes

Antes: 52 falhas reproduzidas no recorte de 142 casos. Depois: 142/142 aprovados.
Após casos adicionais de compatibilidade e expansão para testes do sistema de
rituais: 203/203 aprovados. Tipos da aplicação aprovados.
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

## Lote 3 — dificuldade da resistência aos rituais

### 1. Resumo

Livro Base v1.3, impressa 121/PDF 131: DT = 10 + limite de PE + Presença.
As fichas fornecem a DT do conjurador aos wizards desktop/mobile. Incluídos os
bônus de limite e de DT que o SUE já entrega. Preservados DT explícita do efeito
e ajuste manual da mesa; valores manuais não positivos/fracionários são bloqueados.

### 2. Arquivos e responsabilidades

- `src/lib/rituals/ritual-resistance.ts`: cálculo puro; importa o seletor de limite
  de `dice-roller.ts`, recebe NEX, PRE e bônus, retorna DT sem banco/API.
- `src/pages/CharacterSheet.tsx`: ficha desktop; fornece dados atuais e bônus do
  ritual ao wizard por `casterResistanceDT`.
- `src/components/character/MobileCharacterSheet.tsx`: ficha mobile; fornece
  Presença do conjurador à preparação por `casterPresence`.
- `src/components/character/mobile/MobileRitualCastModal.tsx`: preparação mobile;
  combina NEX, PRE e bônus do ritual confirmado e encaminha a DT ao wizard.
- `src/components/character/RitualEffectWizard.tsx` e
  `mobile/MobileRitualEffectWizard.tsx`: recebem a DT, distinguem conjurador/alvo,
  permitem ajuste e invalidam resultado anterior quando o valor muda.
- `src/lib/rituals/ritual-adapter.ts`: preserva DT explícita na conversão legada.
- `src/lib/rituals/__tests__/ritual-resistance.vitest.ts`: exemplos do livro,
  Presença zero, bônus, valores inválidos e preservação do contrato.
- `src/components/character/__tests__/RitualEffectWizardRules.test.tsx`: regressão
  dos dois wizards e passagem real da preparação mobile para o wizard.
- `docs/RULES_FIXES.md`: documentação sem consumidor no aplicativo.

### 3. Comunicação

Ficha → NEX/PRE/limite e bônus SUE → cálculo puro → prop do wizard → campo DT
→ comparação do resultado de resistência. Os atributos do alvo não determinam
a DT do conjurador. A preparação mobile usa o ritual efetivamente confirmado.
Sem alteração de banco, permissões ou recursos durante os testes.

### 4. Patch

`10 + getPELimitWithBonus(nex, peLimitBonus) + presence + ritualDTBonus`.
Precedência: DT explícita do efeito → DT recebida do conjurador → compatibilidade
legada (15 para consumidores isolados que não forneçam dados). As chamadas das
fichas desktop e mobile fornecem os dados; círculo e custo gasto não calculam DT.

### 5. Observações

Este lote trata a DT. O modelo de rolagem do alvo, identificação do alvo e
aplicação persistente de dano permanecem itens distintos da auditoria.
Não declara que todo o fluxo de resistência já está conforme ao livro.

### 6. Testes

Antes: seis falhas reproduzidas nos wizards (DT 14/35/22 vs. padrão 15).
Depois: 19 casos focados aprovados. Exemplos do livro: NEX 5/PRE 3 → 14,
NEX 99/PRE 5 → 35. Testados bônus, ajuste manual, bloqueio de DT zero e a
preparação mobile com limite +1 → 36. Suíte completa, tipos e build aprovados
na integração dos três lotes. A execução completa criou quatro arquivos de
snapshots que não existiam na base; esses registros iniciais não demonstram
comparação visual com uma versão anterior e não integram o patch deste lote.

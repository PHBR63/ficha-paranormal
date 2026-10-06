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

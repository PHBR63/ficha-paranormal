# Diagnóstico do build malsucedido (somente leitura)

## Erro exato
O build do editor falha na checagem de tipos (TypeScript), não no empacotamento:

```text
src/components/character/mobile/__tests__/weapon-entry-flow.test.tsx
linhas 47, 57, 58, 69, 71, 81
error TS2769: No overload matches this call.
Object literal may only specify known properties, and 'exact' does not
exist in type 'ByRoleOptions'.
```

Causa: `getByRole('button', { name: '...', exact: true })`. No Testing Library, `exact` não existe nas opções de `ByRole` (só em `ByText`/`ByLabelText` etc.). A linha 46 (`getByText('19', { exact: true })`) é válida.

Por que passou localmente: `npm run build` (vite build) não roda checagem de tipos e o Vitest transpila sem checar tipos. O editor checa `src/` inteiro (o `tsconfig.app.json` inclui `src`, então inclui os testes).

Dependências/lockfiles: não são a causa. Os três lockfiles existem (package-lock.json, bun.lock, bun.lockb); recomenda-se manter só um gerenciador no futuro, mas isso não gera este erro.

## Deploy e commit
- Base: main em `7ef6904` (Merge PR #2), contida na branch atual.
- A cópia de trabalho do editor está em `b91d514 "Work in progress"` (filho de 7ef6904) — é essa versão que o editor compilou.
- Não tenho acesso de leitura ao status do deploy `c986de0c...` nem aos logs do servidor de publicação; não consigo confirmar se terminou. Confirme no diálogo Publicar.

## Correção mínima (aguardando aprovação)
Remover apenas `, exact: true` das 6 chamadas `getByRole` nesse arquivo de teste (a correspondência por `name` string já é exata por padrão). Nenhuma regra, banco ou dependência é alterada.

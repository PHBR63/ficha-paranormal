

# Otimização de Bundle JS e CSS

## Diagnóstico Atual

**JS (1,1 MB):** O lazy loading por rota já está implementado para a maioria das páginas. Porém:
- `Index` (346 linhas), `Auth` (600 linhas) e `NotFound` são importados eagerly no bundle principal
- Não há `manualChunks` no Vite — todas as dependências de vendor (react, supabase, konva, framer-motion, recharts, dnd-kit) ficam num único chunk
- Bibliotecas pesadas como `konva`, `react-konva`, `framer-motion`, `recharts` e `@rive-app/react-canvas` entram no bundle mesmo quando não são usadas na rota atual

**CSS (190 KB / 1120 linhas em `index.css`):** O `content` do Tailwind já está configurado corretamente (`src/**/*.{ts,tsx}`). Os 190 KB vêm principalmente de:
- CSS custom extenso (variáveis de 5 temas, animações, efeitos atmosféricos, gradients por tema)
- Muitas keyframes e animações customizadas no `tailwind.config.ts`
- Arquivo `App.css` com estilos legados não utilizados (logo spin, .card, .read-the-docs)

## Plano de Implementação

### 1. Configurar `manualChunks` no Vite (maior impacto)

Adicionar em `vite.config.ts` a configuração `build.rollupOptions.output.manualChunks` para separar vendors pesados em chunks independentes:

- **`vendor-react`**: react, react-dom, react-router-dom
- **`vendor-supabase`**: @supabase/supabase-js, @tanstack/react-query
- **`vendor-ui`**: @radix-ui/*, class-variance-authority, tailwind-merge, cmdk, sonner, vaul
- **`vendor-canvas`**: konva, react-konva (carregado apenas na rota do mapa)
- **`vendor-motion`**: framer-motion (carregado apenas quando componentes animados são usados)
- **`vendor-charts`**: recharts (carregado apenas em páginas com gráficos)

Isso permite caching granular — atualizar código da app não invalida o cache dos vendors.

### 2. Lazy load de `Auth` e `NotFound`

Converter `Auth` e `NotFound` para `lazy()` — são páginas que não precisam estar no bundle inicial. A landing page (`Index`) permanece eager pois é o first paint.

### 3. Remover `App.css` legado

O arquivo `src/App.css` contém apenas estilos não utilizados (`.logo`, `.card`, `.read-the-docs`, `logo-spin`). Será removido e qualquer import eliminado.

### 4. Resultado esperado

- Bundle inicial reduzido de ~1,1 MB para ~400-500 KB (vendors separados + lazy routes)
- Vendors cacheados independentemente pelo browser
- CSS reduzido em ~2-3 KB (remoção do App.css legado)
- O CSS de 190 KB em si é majoritariamente variáveis de tema necessárias — a redução significativa exigiria remover temas, o que não é desejável


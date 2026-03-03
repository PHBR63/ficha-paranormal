

## Plano: Evolução do Mapa 2D — Desenhos, Textos e Tokens Animados (WebM)

### Análise do Estado Atual

O mapa tático já possui:
- ✅ Canvas via React-Konva (zoom, pan, pinch)
- ✅ Tokens arrastáveis com imagem
- ✅ Fog of War
- ✅ Imagens de fundo (mapas)
- ✅ Grid, medição, pings
- ✅ Realtime para tokens (Supabase)

**Faltam** (conforme a imagem de referência):
- ❌ Camada de desenhos (freehand, linhas, formas)
- ❌ Camada de textos (anotações no mapa)
- ❌ Suporte a tokens WebM (animados)

---

### Etapa 1 — Tabelas no Banco (Migração SQL)

Criar duas tabelas para persistir desenhos e textos no mapa:

**`map_drawings`**: `id`, `map_id`, `created_by`, `tool` (pen/line/rect/circle/eraser), `points` (jsonb — array de coordenadas), `color`, `stroke_width`, `opacity`, `created_at`

**`map_texts`**: `id`, `map_id`, `created_by`, `text`, `x`, `y`, `font_size`, `color`, `rotation`, `created_at`

Ambas com RLS para membros da campanha e Realtime habilitado.

---

### Etapa 2 — DrawingLayer (Konva)

Novo componente `src/components/campaign/tactical/layers/DrawingLayer.tsx`:
- Renderiza `Line` (Konva) para cada desenho salvo
- Modo de desenho ativo: captura `onMouseDown/Move/Up` no Stage para criar strokes freehand
- Ferramentas: caneta, linha reta, retângulo, círculo, borracha
- Cada stroke é salvo no banco ao `mouseUp`
- Sincroniza via Realtime (INSERT na `map_drawings`)

---

### Etapa 3 — TextLayer (Konva)

Novo componente `src/components/campaign/tactical/layers/TextLayer.tsx`:
- Renderiza `Text` (Konva) para cada anotação
- Clique no mapa com ferramenta "texto" abre input inline
- Textos arrastáveis e editáveis (double-click)
- Salvos no banco e sincronizados via Realtime

---

### Etapa 4 — Tokens WebM (Animados)

- Modificar `TokenShape` em `TokenLayer.tsx` para detectar URLs `.webm`
- Para WebM: usar `<video>` como fonte de imagem Konva via `Konva.Animation` loop
- O vídeo é carregado em um elemento `<video>` oculto, e cada frame é pintado no canvas via `requestAnimationFrame`
- Atualizar dialog de criação de token para aceitar upload de `.webm`

---

### Etapa 5 — Ferramentas na Toolbar

Expandir a toolbar existente com novas ferramentas:
- **Caneta** (draw mode — já existe no enum, mas sem implementação)
- **Texto** (nova ferramenta)
- Controles: cor, espessura, tamanho de fonte
- Botão "Limpar desenhos" (mestre)

---

### Etapa 6 — Integração no Hook `useTacticalBoard`

Adicionar ao hook:
- `drawings` / `texts` — estado local
- `loadDrawings()` / `loadTexts()` — carrega do banco
- `createDrawing()` / `deleteDrawing()`
- `createText()` / `updateText()` / `deleteText()`
- Subscrições Realtime para ambas tabelas

---

### Ordem de Implementação

1. Migração SQL (tabelas + RLS + Realtime)
2. Hook: funções de CRUD e Realtime para drawings/texts
3. DrawingLayer + integração no TacticalBoardKonva
4. TextLayer + integração no TacticalBoardKonva
5. Suporte WebM no TokenLayer
6. Toolbar expandida com controles de desenho/texto


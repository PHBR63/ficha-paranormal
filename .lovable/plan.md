

# Auto-ajuste de dimensões do mapa baseado na imagem

## Problema
Ao fazer upload de uma imagem, os campos de Largura/Altura (cells) ficam nos valores padrão (30x20) independentemente do tamanho real da imagem. O mapa resultante pode ficar pequeno ou desproporcional.

## Solução

### 1. Expandir callback do `MapImageUploader` para retornar dimensões da imagem

No `handleFileSelect` e `handleUrlSubmit`, ao carregar a imagem, extrair `naturalWidth` e `naturalHeight` e incluí-los no callback `onImageSelect`:

```ts
onImageSelect({ file, previewUrl: url, imageWidth: img.naturalWidth, imageHeight: img.naturalHeight })
```

### 2. Auto-calcular cells no `CreateMapDialog`

Quando `onImageSelect` retorna as dimensões:
- Calcular `widthCells = Math.ceil(imageWidth / gridSize)` e `heightCells = Math.ceil(imageHeight / gridSize)`
- Aplicar limites mínimos (10 cells) e máximos (200 cells)
- Se a imagem for menor que 800x600px, exibir um aviso amarelo: "Imagem pequena — recomenda-se uma resolução maior para mapas táticos (mínimo 1920x1080)"
- Mostrar a resolução da imagem ao lado do preview (ex: "2048 x 1536 px")

### 3. Recalcular ao mudar gridSize

Se o usuário alterar o `gridSize` depois do upload, recalcular automaticamente `widthCells` e `heightCells` com base nas dimensões da imagem armazenadas.

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/campaign/tactical/MapImageUploader.tsx` | Expandir interface do callback para incluir `imageWidth`/`imageHeight`; ler dimensões via `Image()` |
| `src/components/campaign/v3/tabs/CreateMapDialog.tsx` | Auto-calcular cells ao receber dimensões; aviso de imagem pequena; recalcular ao mudar gridSize |


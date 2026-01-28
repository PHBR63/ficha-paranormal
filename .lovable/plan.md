
# Plano: Migração do Mapa Tático para React-Konva

## Análise da Situação Atual

### Implementação Existente
O mapa tático usa **Canvas 2D nativo** com renderização imperativa:
- ~1200 linhas em `TacticalBoard.tsx`
- Função `drawCanvas()` redesenha tudo a cada frame
- Eventos de mouse tratados manualmente
- Zoom/pan implementados via transformações de contexto

### Limitações Identificadas
1. **Escalabilidade**: Redesenho completo a cada interação
2. **Interatividade**: Detecção de clique em tokens é manual
3. **Tamanho fixo**: Canvas não é verdadeiramente "infinito"
4. **Ferramentas limitadas**: Desenho livre não implementado
5. **Performance**: Sem otimização de objetos fora do viewport

## Comparativo de Bibliotecas

| Característica | React-Konva | Tldraw | Pixi.js |
|----------------|-------------|--------|---------|
| React 19 | Suporte total | Suporte total | Requer bridge |
| Bundle | ~72KB | ~250-400KB | ~150KB |
| Performance | Alta (layers) | Excelente | Ultra-alta (WebGL) |
| Mobile/Touch | Nativo | Melhor da classe | Manual |
| Curva de aprendizado | Baixa | Média | Alta |
| Colaboração nativa | Manual | Embutida | Manual |

## Decisão: React-Konva

**Justificativa:**
- Bundle 3-5x menor que Tldraw
- API declarativa se encaixa perfeitamente no React
- Suporte completo a React 19 (versão 19.2.1)
- Drag & drop, zoom, transformações são built-in
- Mantemos controle total sobre sincronização via Supabase
- Comunidade ativa e bem documentada

## Arquitetura Proposta

```text
src/components/campaign/tactical/
├── TacticalBoardKonva.tsx      # Novo componente principal
├── layers/
│   ├── BackgroundLayer.tsx     # Imagem de fundo do mapa
│   ├── GridLayer.tsx           # Grid quadrado/hexagonal
│   ├── TokenLayer.tsx          # Tokens arrastáveis
│   ├── FogOfWarLayer.tsx       # Névoa de guerra
│   ├── HighlightLayer.tsx      # Células destacadas (movimento)
│   ├── DrawingLayer.tsx        # Desenhos e anotações
│   └── PingLayer.tsx           # Pings animados
├── shapes/
│   ├── TokenShape.tsx          # Componente de token individual
│   ├── AuraShape.tsx           # Auras e raios de luz
│   └── MeasurementLine.tsx     # Linha de régua
├── hooks/
│   └── useKonvaTransform.ts    # Zoom/pan com gestos
└── TacticalBoard.tsx           # Mantido como wrapper/fallback
```

## Novas Funcionalidades

### Fase 1: Migração Base
- Renderização declarativa com Stage/Layer
- Drag & drop nativo de tokens
- Zoom com scroll wheel + pinch (mobile)
- Pan com drag no fundo
- Seleção múltipla de tokens

### Fase 2: Ferramentas Avançadas
- Desenho livre (caneta) com cores
- Formas geométricas (círculo, retângulo, cone)
- Borracha para anotações
- Texto em qualquer posição
- Undo/Redo de ações

### Fase 3: Melhorias de Combate
- Tokens com imagem do personagem (fotos)
- Barras de HP/Sanidade sobre tokens
- Indicadores de condições visuais
- Animações de dano/cura
- Área de efeito visual (explosões, cones)

### Fase 4: Mapa Infinito
- Viewport virtualizado
- Lazy loading de tiles
- Minimap para navegação
- Camadas com opacidade ajustável

## Implementação Técnica

### Dependências
```json
{
  "konva": "^9.3.18",
  "react-konva": "^18.2.10"
}
```

### Estrutura do Stage

```text
<Stage>
  ├── <Layer> Background (imagem do mapa)
  ├── <Layer> Grid (linhas do grid)
  ├── <Layer> Highlights (células de movimento)
  ├── <Layer> Fog of War (névoa)
  ├── <Layer> Tokens (personagens/criaturas)
  ├── <Layer> Drawing (anotações)
  └── <Layer> UI (pings, régua, seleção)
</Stage>
```

### Token Interativo (exemplo)

```typescript
function TokenShape({ token, onDragEnd, onSelect }) {
  return (
    <Group
      x={token.x * gridSize}
      y={token.y * gridSize}
      draggable={!token.locked}
      onDragEnd={(e) => onDragEnd(token.id, e.target.x(), e.target.y())}
      onClick={() => onSelect(token.id)}
    >
      {/* Aura de luz */}
      {token.light_radius > 0 && (
        <Circle
          radius={token.light_radius * gridSize}
          fill={token.light_color}
          opacity={0.2}
        />
      )}
      
      {/* Círculo principal ou imagem */}
      {token.image_url ? (
        <Image image={loadedImage} width={size} height={size} cornerRadius={size/2} />
      ) : (
        <Circle radius={size/2} fill={colorByType[token.token_type]} />
      )}
      
      {/* Badge de condições */}
      {token.conditions.length > 0 && (
        <Label offsetX={-size + 8} offsetY={-8}>
          <Tag fill="#f59e0b" cornerRadius={8} />
          <Text text={token.conditions.length} />
        </Label>
      )}
      
      {/* Nome */}
      <Text text={token.name} y={size + 4} align="center" />
    </Group>
  );
}
```

### Fog of War Eficiente

```typescript
function FogOfWarLayer({ cells, mapWidth, mapHeight }) {
  // Usa composite operation para "recortar" áreas reveladas
  return (
    <Layer>
      {/* Névoa cobrindo tudo */}
      <Rect width={mapWidth} height={mapHeight} fill="rgba(0,0,0,0.85)" />
      
      {/* Células reveladas como "buracos" */}
      <Group globalCompositeOperation="destination-out">
        {cells.map(cell => (
          <Rect 
            key={`${cell.x}-${cell.y}`}
            x={cell.x * gridSize}
            y={cell.y * gridSize}
            width={gridSize}
            height={gridSize}
            fill="white"
          />
        ))}
      </Group>
    </Layer>
  );
}
```

## Plano de Migração

### Etapa 1: Setup (1 arquivo)
- Instalar `konva` e `react-konva`
- Criar `TacticalBoardKonva.tsx` básico

### Etapa 2: Camadas Base (4 arquivos)
- `BackgroundLayer.tsx` - Imagem de fundo
- `GridLayer.tsx` - Grid quadrado
- `TokenLayer.tsx` - Tokens com drag
- `PingLayer.tsx` - Pings animados

### Etapa 3: Ferramentas (3 arquivos)
- `FogOfWarLayer.tsx` - Névoa de guerra
- `HighlightLayer.tsx` - Células de movimento
- `MeasurementLine.tsx` - Régua de distância

### Etapa 4: Integração (2 arquivos)
- `useKonvaTransform.ts` - Zoom/pan/gestos
- Atualizar `TacticalBoard.tsx` para usar novo componente

### Etapa 5: Desenho (2 arquivos)
- `DrawingLayer.tsx` - Ferramenta de desenho
- Persistência de desenhos no banco

## Compatibilidade

### Mantido Inalterado
- `useTacticalBoard.ts` - Toda lógica de dados
- Tabelas `campaign_maps` e `map_tokens`
- Sincronização realtime via Supabase
- Integração com sistema de combate
- Upload de imagens para Storage

### Migrado
- Renderização de Canvas 2D → Konva Stage
- Event handlers manuais → Eventos Konva
- Transformações ctx → Propriedades declarativas

## Resultado Esperado

- Mapa maior (virtualmente infinito)
- Zoom suave de 10% a 500%
- Tokens arrastáveis com animação
- Gestos touch/pinch em mobile
- Ferramenta de desenho livre
- Seleção múltipla de tokens
- Performance otimizada (apenas redesenha o que muda)
- Código 40% menor e mais legível

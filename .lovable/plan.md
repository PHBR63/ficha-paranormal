

# Diagnóstico — GIF Animado Estático no Mapa Tático

## Causa Raiz Identificada

O bug está na **linha 280 vs linha 360** do `TokenLayer.tsx`. A lógica usa `useRef` (`gifRef`) para armazenar o elemento `<img>` do GIF, mas **refs não disparam re-render no React**. O fluxo atual:

```text
1. Render inicial → gifRef.current = null → animatedSource = null → renderiza círculo colorido
2. useEffect executa → cria <img>, seta gifRef.current = img
3. React NÃO re-renderiza (ref mudou, não state)
4. animatedSource continua null → KonvaImage do GIF NUNCA monta
5. batchDraw() roda no loop mas não tem nada para atualizar
```

O `KonvaImage` animado simplesmente **nunca é montado** porque a condição `isAnimated && animatedSource` (linha 395) é `false` durante todo o ciclo de vida — `animatedSource` lê `gifRef.current` que era `null` no último render e nenhum state change forçou novo render.

## Plano de Correção

### Mudança única em `TokenLayer.tsx`

1. **Substituir `gifRef` por estado** — Trocar `const gifRef = useRef<HTMLImageElement | null>(null)` por `const [gifImage, setGifImage] = useState<HTMLImageElement | null>(null)` para que quando o GIF carregar, o React re-renderize e monte o `KonvaImage`.

2. **Atualizar o `useEffect` do GIF** (linhas 262-294):
   - Continuar criando o `<img>` via `document.createElement` e anexando ao DOM (necessário para animação)
   - No `onload`, chamar `setGifImage(img)` em vez de apenas `startAnimationLoop()`
   - No cleanup, chamar `setGifImage(null)` além de remover do DOM

3. **Atualizar `animatedSource`** (linhas 360-364):
   - Trocar `gifRef.current` por `gifImage`

4. **Iniciar loop de animação quando KonvaImage monta** — Adicionar um `useEffect` que observe `gifImage` para iniciar o `startAnimationLoop()` somente quando a imagem estiver carregada E o componente re-renderizado.

### Verificação do WebM (mesmo padrão)

O `videoRef` tem o mesmo problema potencial, mas como o `video.addEventListener('loadeddata')` dispara e o `startAnimationLoop` roda, o `batchDraw` funciona SOMENTE se o `animatedSource` estiver montado. Precisamos aplicar a mesma correção: trocar `videoRef` usado no render por estado.

### Resumo das alterações

| Linha | De | Para |
|-------|-----|------|
| 202 | `const videoRef = useRef` (para render) | `const [videoElement, setVideoElement] = useState` |
| 202-203 | `const gifRef = useRef` | `const [gifImage, setGifImage] = useState` |
| 280 | `gifRef.current = img` | `setGifImage(img)` (no onload) |
| 317 | `videoRef.current = video` | `setVideoElement(video)` (no loadeddata) |
| 360-364 | `gifRef.current` / `videoRef.current` | `gifImage` / `videoElement` |

**Arquivo**: `src/components/campaign/tactical/layers/TokenLayer.tsx`  
**Escopo**: ~15 linhas alteradas, zero arquivos novos.


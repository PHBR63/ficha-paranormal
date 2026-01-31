

# Plano: Correção do Tabuleiro Tático - Canvas Não Preenche Espaço Disponível

## Diagnóstico

Analisando a screenshot e o código, identifiquei o problema raiz:

```text
┌────────────────────────────────────────────────────────────────────────────────┐
│                      PROBLEMA IDENTIFICADO                                      │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                         │   │
│  │                      ESPAÇO VAZIO (grande)                              │   │
│  │                                                                         │   │
│  │                                                                         │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │ [Toolbar]                                                               │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │ ░░░░░░░░░░░░░░░░░░ MAPA COMPRIMIDO (faixa fina) ░░░░░░░░░░░░░░░░░░░░░░░│   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  CAUSA:                                                                         │
│  1. useEffect usa window.addEventListener('resize') em vez de ResizeObserver  │
│  2. containerRef.current pode ter altura 0 no primeiro render                 │
│  3. O canvas não recalcula quando o container pai muda de tamanho            │
│                                                                                 │
└────────────────────────────────────────────────────────────────────────────────┘
```

### Código Problemático

```typescript
// TacticalBoard.tsx (linhas 520-534)
useEffect(() => {
  const container = containerRef.current;
  if (!container) return;
  
  const updateSize = () => {
    setCanvasSize({
      width: container.clientWidth,
      height: container.clientHeight,  // ← Pode ser 0 no primeiro render!
    });
  };
  
  updateSize();  // ← Chamado apenas uma vez no mount
  window.addEventListener('resize', updateSize);  // ← Só escuta resize da janela
  return () => window.removeEventListener('resize', updateSize);
}, []);  // ← Sem dependências = não re-executa
```

---

## Solução: Usar ResizeObserver

O `ResizeObserver` é a API correta para detectar mudanças de tamanho em elementos DOM, independentemente da causa (layout, visibilidade, troca de abas, etc.).

### Alterações em TacticalBoard.tsx

**Fase 1: Substituir o useEffect de tamanho (linhas 520-534)**

```tsx
// ANTES:
useEffect(() => {
  const container = containerRef.current;
  if (!container) return;
  
  const updateSize = () => {
    setCanvasSize({
      width: container.clientWidth,
      height: container.clientHeight,
    });
  };
  
  updateSize();
  window.addEventListener('resize', updateSize);
  return () => window.removeEventListener('resize', updateSize);
}, []);

// DEPOIS - Com ResizeObserver:
useEffect(() => {
  const container = containerRef.current;
  if (!container) return;
  
  // ResizeObserver detecta mudanças de tamanho do container
  // independentemente da causa (resize da janela, layout, visibilidade)
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      // Só atualiza se tiver dimensões válidas (> 0)
      if (width > 0 && height > 0) {
        setCanvasSize({ width, height });
      }
    }
  });
  
  resizeObserver.observe(container);
  
  // Cleanup
  return () => {
    resizeObserver.disconnect();
  };
}, []);
```

**Fase 2: Adicionar fallback com requestAnimationFrame**

Para garantir que o tamanho seja calculado após o layout estar pronto:

```tsx
useEffect(() => {
  const container = containerRef.current;
  if (!container) return;
  
  // Função para atualizar tamanho com validação
  const updateSize = () => {
    const { clientWidth, clientHeight } = container;
    if (clientWidth > 0 && clientHeight > 0) {
      setCanvasSize({ width: clientWidth, height: clientHeight });
    }
  };
  
  // ResizeObserver para mudanças dinâmicas
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        setCanvasSize({ width, height });
      }
    }
  });
  
  resizeObserver.observe(container);
  
  // Fallback: força atualização após o layout inicial
  // Usa requestAnimationFrame para garantir que o layout foi calculado
  const rafId = requestAnimationFrame(() => {
    updateSize();
  });
  
  return () => {
    resizeObserver.disconnect();
    cancelAnimationFrame(rafId);
  };
}, []);
```

---

## Resumo das Alterações

| Arquivo | Linhas | Descrição |
|---------|--------|-----------|
| `TacticalBoard.tsx` | 520-534 | Substituir window.resize por ResizeObserver + RAF fallback |

---

## Resultado Esperado

```text
┌────────────────────────────────────────────────────────────────────────────────┐
│                      LAYOUT CORRIGIDO                                           │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ [Toolbar: Seletor de mapa | Ferramentas | Zoom]                         │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                         │   │
│  │                                                                         │   │
│  │                     MAPA TÁTICO (preenche espaço)                       │   │
│  │                                                                         │   │
│  │                     ┌─────────────────────────┐                         │   │
│  │                     │  Grid + Tokens + Fog    │                         │   │
│  │                     │       (Konva Stage)     │                         │   │
│  │                     └─────────────────────────┘                         │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## Benefícios

- **Responsivo real**: ResizeObserver detecta mudanças de qualquer origem
- **Sem espaço vazio**: Canvas preenche todo o container disponível
- **Performance**: ResizeObserver é mais eficiente que window.resize
- **Troca de abas**: Funciona quando o usuário navega entre abas
- **Primeiro render correto**: RAF garante que o layout foi calculado

---

## Conformidade com Regras do Projeto

- Comentários em PT-BR
- Segue padrão de memória `architecture/campaign-view-scroll-and-flex-hierarchy`
- Não modifica mecânicas de Ordem Paranormal RPG
- Usa APIs nativas do navegador (ResizeObserver)


# Operações Especiais — confirmação de PE

## 1. Resumo
Ataque Extra e Surto de Adrenalina aguardam o retorno da gravação de PE antes de conceder o efeito e marcar o uso por rodada. Recusa ou exceção não anuncia sucesso. O painel atualiza saldo e usos externos; cliques e fechamento são bloqueados durante a espera.

Fonte de custos e requisitos preservados: Livro Base v1.3, p. 27 (página física 37 da extração fornecida): Ataque Extra em NEX 40, custo 2 PE; Surto em NEX 65, custo 5 PE. Nenhuma regra nova foi presumida nesta correção.

## 2. Arquivos
- `useOperacoesEspeciaisTrack.ts`: recebe trilha/NEX, saldo, usos e callbacks. `onPEChange` admite retorno síncrono/assíncrono e recusa explícita. Valida desbloqueio/saldo/uso ao confirmar, mantém trava imediata e estado visual. Depois do retorno aceito, notifica gasto, uso e efeito. Usa React, toast e tipos dos hooks.
- `OperacoesEspeciaisPanel.tsx`: recebe as mesmas props das fichas desktop/mobile, consome o hook e renderiza os controles. Mantém escolha aberta diante de recusa; mostra espera e bloqueia ações concorrentes. A memoização padrão considera saldo, usos e callbacks. Usa componentes existentes de UI, drawer, dialog e detecção mobile.
- `operacoes-confirmation.test.tsx`: testa hook/painel reais com gravação simulada; recusa, espera, duplicação, Surto, saldo novo, usos externos, erro e NEX.

## 3. Fluxo
Ficha desktop/mobile → painel → hook → `onPEChange` da ficha → serviço existente de recursos → RPC autenticada → confirmação → callback retorna true/false → hook registra uso e ativa o efeito no fluxo existente. O painel não chama a API diretamente.

As fichas atuais devolvem booleano após confirmação. Callbacks legados sem retorno continuam compatíveis, mas não constituem prova de persistência. A confirmação de recurso não torna esta habilidade uma operação atômica de custo/efeito/orçamento; isso pertence ao próximo lote.

## 4. Patch central
```ts
const confirmed = (await onPEChange(peCurrent - ability.peCost)) !== false;
if (!confirmed) {
  // Mostra erro; não concede efeito nem marca uso.
  return;
}
markAbilityAsUsed(ability.id);
```

## 5. Limites
Sem migration, nova biblioteca ou alteração de custo. O uso por rodada continua no tracking existente; não se afirma compartilhamento autoritativo dessa frequência entre dispositivos. Efeito ativado e recurso permanecem em operações separadas. Se a resposta for incerta, conferir PE/histórico antes de repetir; este fluxo ainda não conserva um UUID único de habilidade como o ataque integrado.

## 6. Testar
Recusar a gravação e esperar ausência de uso/efeito. Durante promessa pendente, clicar duas vezes e tentar fechar Surto: uma chamada, sem efeito antecipado e escolha aberta. Confirmar: um efeito e um uso. Alterar saldo antes da escolha: custo insuficiente não é enviado. Atualizar usos externos: botão muda para Usada. Testar desktop/mobile com ficha QA após publicação; não usar ficha pessoal para consumo.

Os cinco cenários iniciais falharam antes da correção. Após correção e ampliação: oito cenários novos aprovados; regressão relacionada de três arquivos: 247 testes aprovados. Resultados de tipos/build e publicação devem ser conferidos separadamente no relatório da execução.

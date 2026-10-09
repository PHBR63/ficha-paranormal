# Compatibilidade de Disparo Letal

## 1. Resumo
O catálogo e as fichas usam `atirador-elite`, enquanto a confirmação de ataque no servidor exigia `atirador-de-elite`. A nova migration aceita ambos sem reescrever fichas ou históricos.

## 2. Arquivos
- `supabase/migrations/20261009160000_lethal_shot_track_compatibility.sql`: substitui a função existente, alterando somente a comparação da trilha. Mantém assinatura, permissões, locks, custo, orçamento e recibos.
- `supabase/tests/lethal_shot_track_compatibility.sql`: testa IDs atual/legado, normalização existente, repetição, UUID adulterado, trilhas inválidas, classe, NEX, custo e autorização. Usuário, ficha e eventos são criados em transação e desfeitos.
- Este documento: mapeia o fluxo, a alteração e os limites.

## 3. Fluxo
Tela de ataque → `useConfirmedDiceRoll.ts` → `combat-attack-service.ts` → RPC `confirm_character_combat_attack` → ficha, recursos temporários, orçamento por turno e evento de histórico.

A RPC recebe UUID da operação/ficha, PE e custo esperados, chave de turno, seleção de habilidades e resultado da rolagem. Usa a ficha salva para validar classe, trilha e NEX. Retorna evento confirmado com custo e saldos; recusa desfaz gasto e evento. Uma repetição idêntica retorna o recibo existente.

## 4. Patch
```sql
IF ficha.class<>'Especialista'
 OR track NOT IN ('atirador-elite','atirador-de-elite')
 OR ficha.nex<40 THEN
 RAISE EXCEPTION 'Disparo Letal não disponível.' USING ERRCODE='22023';
END IF;
```

## 5. Impacto
Sem colunas novas, exclusão, dependências ou conversão de dados. Permissões autenticadas preservadas; acesso anônimo continua revogado. Custo de 1 PE e NEX 40 continuam iguais. A migration anterior permanece intacta.

Esta alteração corrige elegibilidade por identificação. Não acrescenta sorteio no servidor, automação de munição, dano ou economia completa de ações.

## 6. Testar
Executar o novo ensaio e `combat_attack_pe_budget.sql`, sempre com rollback. Antes do patch, o novo ensaio falha em “Disparo Letal não disponível”. Depois, os dois devem retornar `passed; fixtures rolled back`.

Conferir na versão publicada uma ficha QA de Especialista/Atirador de Elite com NEX 40 e arma equipada: confirmar ataque com Disparo Letal, verificar 1 PE e histórico; recarregar e conferir recuperação do saldo. Situação real de aplicação e homologação deve ser registrada no relatório do lote, sem inferir publicação a partir do merge.

# Lote 2 — orçamento de PE para rituais e manutenção

## 1. Resumo

Conjuração e manutenção usam um orçamento cumulativo confirmado no servidor quando há combate v2 ou controle manual ativo. Fora desses contextos, os gastos continuam registrados sem criar turnos artificiais, conforme decisão do usuário. A pausa manual preserva saldo, efeitos e histórico. Não há cobrança automática de sustentação.

## 2. Arquivos e responsabilidades

- `supabase/migrations/20261007190000_ritual_pe_turn_budget.sql`: adiciona `active` ao relógio manual; cria catálogo privado de custos mínimos e ledger privado de gastos vinculado aos eventos e fichas. Encapsula as operações existentes sem mudar suas assinaturas. Disponibiliza consulta e pausa autorizadas. Helpers e tabelas não aceitam acesso direto por clientes.
- `src/services/pe-turn-budget-service.ts`: recebe UUID da ficha e valida o orçamento retornado; envia UUID da operação e turno esperado ao pausar. Confirma recibo e distingue rejeição de resposta incerta. Utiliza `character-activity-service.ts`, que tipa as RPCs e traduz o bloqueio do limite.
- `src/hooks/character/usePETurnBudget.ts`: consulta o serviço, compartilha cache por ficha e recupera dados no foco, reconexão e eventos de ficha/histórico/combate.
- `src/components/character/PETurnBudgetPanel.tsx`: recebe ID da ficha, apresenta contexto e gasto confirmado, prepara e confirma início/avanço/pausa. Usa o hook e os serviços de orçamento e sustentação. Respostas incertas conservam UUID e turno para recuperação.
- `src/pages/CharacterSheet.tsx` e `src/components/character/MobileCharacterSheet.tsx`: compõem o painel e entregam orçamento, carregamento e erro aos modais desktop/mobile.
- `src/components/character/RitualCastModal.tsx` e `mobile/MobileRitualCastModal.tsx`: bloqueiam a conjuração sem orçamento confirmado e mostram limite e gasto atual. Não concedem exceção de custo mínimo a aprimoramentos.
- `src/hooks/useRitualValidation.ts`: valida saldo, custo e orçamento informado. A exceção de custo mínimo só pode ocorrer antes de outros gastos; custo zero não é bloqueado por um gasto anterior acima do limite.
- `src/lib/character-activity-presentation.ts`: apresenta orçamento do recibo e pausa no histórico; registros antigos sem esse dado conservam apresentação compatível.
- `src/lib/rules/base-rule-coverage.ts`: informa o alcance parcial na tela de regras, incluindo os fluxos ainda pendentes.
- Testes de serviço, painel, modais, validação e apresentação verificam confirmação, bloqueio e recuperação. `supabase/tests/ritual_pe_turn_budget.sql` testa banco, temporários, rollback, turnos e permissões. `lot_one_rules.sql` usa NEX amplo para isolar suas regras do novo limite cumulativo.

## 3. Comunicação e dados

Ficha → hook → `get_character_pe_budget(p_character_id)` → autorização → bloqueio estável das campanhas e ficha → contexto e soma de gastos confirmados → painel/modal.

Conjuração/manutenção → UUID idempotente → autorização e bloqueio → orçamento → operação existente → registro do custo no mesmo contexto e metadados no evento. Exceder o limite rejeita a transação inteira, incluindo PE temporário, PE normal, SAN, efeitos e histórico.

Pausa → UUID + ficha + turno esperado → conferência de contexto/concorrência → `active=false` + evento confirmado. Repetir o UUID retorna o mesmo recibo; recuperar um início anterior após pausa não reativa o relógio.

RPCs mantêm autenticação Supabase existente. O cliente nunca envia o limite. O servidor lê NEX, origem e trilha: NEX 99 usa 20; Universitário acrescenta 1; Presença Poderosa acrescenta Presença apenas ao limite de conjuração. O catálogo de custos mínimos usa os IDs atuais com custos por círculo 1/3/6/10; isso não certifica todos os efeitos de cada ritual.

## 4. Patch principal

```text
sem controle ativo → registrar gasto, sem orçamento cumulativo artificial
combate v2 ativo → campanha + cena + rodada + ator do turno
controle manual ativo → ficha + número do turno
excesso → rejeição atômica; repetir operação → mesmo recibo
```

## 5. Impactos e limites

Relógios manuais existentes começam inativos e precisam de início explícito. Não há cobrança retroativa nem exclusão de históricos. Combate tem prioridade sobre relógio manual; ao encerrar, um relógio manual ainda ativo conserva seu número e orçamento. Mais de um combate ativo vinculado bloqueia a operação e exige resolução do contexto.

Campanhas v1 usam controle manual; a iniciativa v1 não é tratada como autoridade do banco. Gastos de poderes por outros fluxos e ajustes manuais de PE ainda não compõem este ledger. O mapa de regras permanece parcial. Pausar não dispensa conferir e encerrar rituais sustentados. A sustentação continua dependente de confirmação explícita no início real do turno.

## 6. Como testar

1. Sem turno ativo, conjurar e conferir recibo sem contagem artificial.
2. Iniciar manualmente; cancelar confirmação não altera relógio nem PE.
3. Conjurar e manter ritual no mesmo turno: custos somam, inclusive quando pagos com PE temporário.
4. Tentar ultrapassar o limite: saldo, SAN e eventos não mudam.
5. Pausar e repetir resposta incerta: um recibo, nenhum estorno e nenhum novo turno.
6. Avançar turno e conferir orçamento zerado; durante combate usar o turno do tracker v2.
7. Trocar ator/rodada e recuperar uma operação antiga: orçamento atual não recebe nova cobrança.
8. Recarregar, reconectar e comparar outra aba; conferir desktop/mobile e mensagens de erro.
9. Usuário sem permissão não lê orçamento nem pausa; clientes não acessam helpers ou tabelas privadas.

Os testes SQL usam dados sintéticos em transação revertida. A validação local, instalação no banco e conferência publicada devem ser registradas separadamente.

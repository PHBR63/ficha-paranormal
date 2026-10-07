# Turno manual no servidor

## 1. Resumo da alteração

O controle de sustentação aceita turnos manuais fora de um combate v2 ativo. Registrar um turno e confirmar a manutenção são operações diferentes: iniciar o turno não consome PE. Cada ritual pode ter apenas uma manutenção confirmada por identidade de turno.

Implementação integrada pela PR #41. A migration foi instalada permanentemente em 07/10/2026 junto ao lote; o contrato SQL passou novamente contra o banco instalado. A interface publicada autenticada confirmou turno manual sem gasto e manutenção consumindo PE temporário primeiro.

## 2. Arquivos alterados/criados

| Arquivo | Responsabilidade e dependências | Dados recebidos e retornados |
| --- | --- | --- |
| `src/components/character/SustainedRitualControl.tsx` | Controle compartilhado entre desktop e mobile; usa os cartões existentes, os diálogos de confirmação, `sustained-ritual-service` e o estado de recursos temporários do lote. É usado pelas fichas desktop/mobile. | Recebe ficha, PE e sustentações; prepara confirmação; atualiza a interface somente após recibo confirmado. |
| `src/services/sustained-ritual-service.ts` | Valida solicitações e recibos; usa o cliente e os validadores de `character-activity-service`. | Envia ficha, UUID, número esperado ou identidade do turno e snapshot das sustentações; retorna turno ou evento confirmado. |
| `src/services/character-activity-service.ts` | Declara os contratos das novas operações no cliente tipado do Supabase. | Transporta os argumentos para as funções autorizadas do banco. |
| `src/lib/character-activity-presentation.ts` | Formata eventos para o histórico existente. | Recebe evento persistido; retorna texto com início manual, turno da manutenção e consumo temporário quando registrado. |
| `supabase/migrations/20261007170000_sustained_turn_identity.sql` | Cria contador protegido e comprovantes únicos; mantém o encerramento antigo compatível e impede manutenção sem identidade de turno. Depende das tabelas, permissões e funções de atividade/sustentação existentes. | Recebe identidade autenticada, ficha, UUID, snapshot e turno; grava contador, comprovante e evento de forma transacional. |
| `src/services/__tests__/sustained-ritual-service.test.ts` | Testa contratos e falhas com o cliente simulado. | Verifica confirmação, validação, turno inelegível e diferença entre rejeição SQL e conexão incerta. |
| `src/components/character/__tests__/sustained-ritual-control.test.tsx` | Testa a confirmação compartilhada da interface. | Verifica cancelamento, confirmação separada, recuperação com a mesma identidade e bloqueio em combate ativo. |
| `src/lib/__tests__/character-activity-presentation.test.ts` | Testa os textos do histórico. | Confere turno manual, manutenção e consumo de recursos temporários sem inventar informação em eventos antigos. |
| `supabase/tests/lot_one_rules.sql` | Regressão transacional integrada do lote com ficha e identidade sintéticas. | Confere ausência de cobrança ao iniciar, repetição, snapshot antigo, turno adulterado, cobrança única e acesso não autorizado. Reverte os dados no fim. |
| `docs/TURNO_MANUAL_SERVIDOR.md` | Documenta o contrato e o estado da entrega. | Não participa do fluxo de execução. |

## 3. Fluxo de comunicação

1. A ficha abre o controle de sustentações. O serviço consulta `get_character_ritual_turn` com o ID da ficha.
2. Se houver combate v2 ativo, o servidor retorna campanha, cena, rodada e se é a vez do conjurador. A interface orienta a usar esse turno e bloqueia o início manual.
3. Fora do combate v2, a interface oferece **Registrar início de turno manual**, consulta o contador e mostra o próximo número sem gravar nada.
4. Após confirmação, `begin_character_manual_turn` valida autorização e contador esperado, avança o número e grava um evento com custo zero na mesma transação.
5. A manutenção exige outra confirmação. `confirm_sustained_ritual_maintenance` confere a identidade atual, o snapshot e a exclusividade por ritual/turno antes de executar a cobrança existente.
6. O histórico recebe o evento pelo fluxo de atividades existente. O número manual é consultado novamente em cada preparação, sem depender de relógio ou contador no navegador.

Falhas de conexão preservam UUID e parâmetros para recuperar o mesmo resultado. Rejeição SQL explícita libera a tentativa para atualizar o estado e preparar outra confirmação. Uma nova tela não consegue cobrar de novo apenas trocando o UUID.

## 4. Código ou patch

O contrato principal é:

```ts
getRitualTurn(characterId)
beginManualTurn(characterId, operationId, expectedTurn)
confirmSustainedAction({ operationId, characterId, action: 'maintain', expected, expectedPE, turn })
```

O banco impede comprovantes duplicados:

```sql
PRIMARY KEY (sustained_id, turn_key)
```

O início manual usa comparação do contador antes de avançar e retorna o mesmo recibo quando a operação é repetida. Os detalhes completos estão nos arquivos listados acima.

## 5. Observações importantes

- O número do turno é persistido por ficha, e não por navegador.
- Registrar início de turno não é rolar iniciativa, mover o combate ou manter automaticamente um ritual.
- O servidor exige permissão sobre a ficha; as tabelas novas não permitem escrita direta pelo cliente.
- Um combate v2 ativo tem prioridade. Campanhas antigas sem esse contrato de combate podem usar a confirmação manual.
- Clientes antigos que tentem manter sem informar turno recebem erro claro e precisam atualizar a aplicação.
- O usuário continua responsável por confirmar quando um turno manual realmente começa; o servidor protege persistência, concorrência e cobrança por turno.
- Publicação, instalação permanente das migrations e teste visual no sistema publicado continuam sendo etapas distintas da validação local/transacional aqui registrada.
- A migration integra o lote atual; não executar arquivos posteriores do lote fora de ordem nem presumir que este documento certifica todas as mecânicas do livro.

## 6. Como testar

### Interface

1. Com um ritual sustentado, abrir a revisão do início manual e cancelar: nenhuma operação deve ser enviada.
2. Confirmar novo turno: o aviso deve informar que não houve gasto de PE.
3. Revisar e confirmar manutenção: conferir custo, efeitos selecionados e turno no histórico.
4. Tentar manter o mesmo ritual no mesmo turno em outra tela: deve ser rejeitado sem novo gasto.
5. Iniciar outro turno e manter novamente: deve ser permitido após a nova confirmação.
6. Simular resposta incerta e recuperar: a solicitação deve conservar o mesmo UUID e número esperado.
7. Com combate v2 ativo, tentar criar turno manual ou manter fora da vez: ambas as operações devem ser bloqueadas.

### Evidências executadas

- Regressão completa: **143 arquivos de teste, 3271 testes aprovados**. Os dois novos cenários de apresentação do histórico também passaram na execução específica de 13 testes.
- Checagem de tipos: aprovada.
- Build: aprovado; permanece aviso de tamanho de pacote já existente.
- Verificação estática dos arquivos de turno e apresentação: aprovada.
- SQL integrado: aprovado em transação revertida, incluindo cobrança única, repetição sem avanço duplicado, snapshot antigo, turno adulterado e falta de autorização.
- O ensaio transacional preserva dados reais; a instalação permanente posterior foi registrada no histórico de migrations.
- Teste publicado autenticado: concessão, conjuração, início manual, manutenção e tentativa repetida sem nova cobrança. A tentativa repetida recebeu aviso; sua mensagem foi refinada para explicar a próxima ação.

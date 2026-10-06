# Condições em dano/cura de ritual e recursos individuais

## Resumo e fonte

O servidor gravava os PV dos efeitos `heal`/`damage`, ou um recurso individual da campanha, sem reconciliar condições. Isso podia deixar Inconsciente após cura ou omitir Morrendo em zero. Livro Base v1.3 fornecido, página impressa 88; somente regras de transição já conferidas no lote anterior.

As operações passam a gravar recursos, condições e o evento na mesma transação. Não há migração de fichas antigas, mudança de assinaturas das RPCs ou novas permissões para os usuários. Cada próximo pedido confirmado usa as condições atuais da linha bloqueada; abrir a tela não grava nada.

## Arquivos e fluxo

| Arquivo | Função, entrada, saída e dependências |
|---|---|
| `supabase/migrations/20261006190000_server_resource_conditions.sql` | Cria auxiliar privado que recebe condições JSON completas, PV/SAN anteriores e novos, máximos e perda de PV. Retorna JSON preservado com transições. Atualiza `apply_character_effect_core` e `change_character_resource`, conservando validação de contexto, UUID, fingerprint, lock, CAS e recibo. Chamado pelas RPCs existentes. |
| `supabase/tests/server_resource_conditions.sql` | Testa limites, formato legado, metadados, perda/cura, retry, CAS, atomicidade e permissões em fixtures, com rollback. Usa o auxiliar como proprietário do banco e RPCs sob os papéis existentes. |
| `supabase/tests/character_master_actions.sql` | Alinha expectativa antiga de Machucado: 8/10 PV está acima da metade, então o próximo pedido retira essa condição. Conserva ensaios de dono/mestre, clamp, CAS e acesso negado. |
| `src/lib/character-activity-presentation.ts` | Recebe eventos novos ou antigos e exibe diferenças de condições também nos recibos de cura/dano e recurso individual. Usa identificação compartilhada; sem gravações. Consumido pelos históricos desktop/mobile. |
| `src/lib/__tests__/character-activity-presentation.test.ts` | Testa recibos de cura sem estabilização, dano até zero, cura de SAN e compatibilidade com evento antigo sem condições. |
| `src/lib/rules/base-rule-coverage.ts` | Atualiza o mapa `/rules` para delimitar os caminhos integrados e os limites restantes. Mantém estado parcial. |
| `docs/RECURSOS_CONDICOES_SERVIDOR.md` | Mapa desta entrega e critérios de aceitação. |

Ritual: tela/modal → `useRitualApplication` → `ritual-application-service` → wrapper público `apply_character_effect` → core privado → condições e PV em `characters` + `character_activity_events` → recibo → atualização da ficha/histórico. Não muda gasto de PE, cancelamento ou o controle existente de etapa única da mesma conjuração.

Campanha: controle do mestre/dono → `prepareResourceChange` de `character-resource-service` → `change_character_resource` → linha bloqueada e condições atuais → recurso/condições/evento juntos → recibo → refetch/Realtime existente. `before`/`after` mantêm os campos anteriores e acrescentam `conditions`, sem invalidar clientes e registros antigos.

## Regras e compatibilidade

- Machucado acompanha metade ou menos dos PV, sem penalidade própria. Máximos ímpares usam divisão real.
- Perda de PV até zero inicia Inconsciente/Morrendo. Dano positivo informado mesmo com saldo zero é distinguido de dano zero ou edição exclusiva de PE.
- Cura efetiva retira Inconsciente e preserva Morrendo, inclusive contador, data, duração e parâmetros já existentes.
- Perda de SAN até zero inicia Enlouquecendo; cura efetiva retira essa condição. SAN positiva estritamente abaixo da metade indica Perturbado; metade exata não.
- Identidades existentes dessas condições são reconhecidas por ID ou nome legado exato normalizado. Nome de um objeto externo com outro ID não é reinterpretado. Objetos desconhecidos e suas propriedades permanecem intactos.
- Formato não compatível ou limite excedido falha explicitamente e desfaz recurso e evento; não descarta o dado antigo para permitir uma cura.
- Mesmo UUID/pedido recupera o recibo original; não aplica outra vez nem recalcula uma ficha que mudou depois. Nova operação com snapshot de recurso antigo falha por concorrência.

O auxiliar é privado, sem execução direta por `authenticated`, `anon` ou `PUBLIC`. Não altera RLS, permissões de dono/mestre, tabelas ou índices. `CREATE OR REPLACE` preserva os contratos/privilégios das duas RPCs; o wrapper de buffs/sustentação não é substituído.

## Como testar

Executar a migration e o ensaio novo numa transação encerrada com rollback; conferir que a fixture `9aba...0001` não permanece. Repetir os contratos de atividades, ações do mestre, buffs/sustentação, pacote de recursos e início de turno. Executar regressão do frontend, tipos, build e lint dos arquivos alterados.

Na publicação, usar ficha de QA: dano de ritual/controle individual até metade e até zero; cura de 1 PV; verificar Morrendo preservado e Inconsciente retirado. Conferir a mesma mudança no histórico e após recarga. Curar SAN 0→1 pelo controle individual: sai Enlouquecendo e entra Perturbado. Dano zero e edição somente de PE não recriam condições encerradas. Repor a ficha e conservar os eventos de teste.

## Limites

O valor de dano é final, após conferência do tipo/RD/imunidade; a operação não calcula novamente a fórmula do ritual. Não resolve dano massivo, dano não letal, recursos temporários, morte/NPC, estabilização por Medicina, cena de regras ou falha automática de Reflexos. A contagem por cena aguarda a definição do usuário. Duas identidades em ensaio SQL comprovam autorização no banco, sem certificar a experiência simultânea com duas contas reais no navegador.

## Evidência de validação

O ensaio novo e os cinco contratos anteriores passaram na instância ativa, com rollback integral das fixtures e da migration temporária antes de sua ativação. Regressão: 125 arquivos / 3.131 testes; tipos, build e lint dos três módulos TypeScript alterados passaram. O teste de cobertura foi repetido após atualizar o mapa: 18 casos passaram. O lint global conserva a dívida anterior; o build conserva os avisos de tamanho de pacotes/Browserslist. Aplicação permanente, merge, publicação e UAT são registrados separadamente no relatório de operação do workspace.

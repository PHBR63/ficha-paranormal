# Origem e expiração de efeitos por cena

Escopo: Livro Base v1.3, campanhas v2, decisão da mesa de encerrar a cena junto
ao combate e manualmente fora dele. Não modifica o 20 natural personalizado ou
o descanso. Não representa implementação integral de todas as regras do livro.

## Comportamento e compatibilidade

- A conjuração registra campanha e cena no servidor. O gasto de PE, o evento e
  esse vínculo acontecem juntos. Sem campanha ou em v1, a duração segue manual.
- As condições conservam `duration`, separada de `turnsRemaining`. Ausência de
  duração nunca é convertida em cena. Desktop, mobile e aplicador legado usam
  o prazo declarado pelo catálogo; objetos antigos são preservados.
- Novas condições e bônus de arma recebem `effectOrigin` após confirmação. O
  servidor mantém provas em tabelas privadas; metadados editáveis não autorizam
  expiração. Condições já existentes permanecem intactas, sem renovação implícita.
- Somente duração `cena`, instância registrada, campanha/cena correspondentes e
  ficha ainda vinculada permitem expiração. Rodadas, sustentação, permanentes,
  entradas antigas e contadores de Morrendo/Enlouquecendo não são encerrados.
- Alterar explicitamente o contador de uma condição para rodadas muda sua
  categoria para `rodadas`; o encerramento não deve também removê-la.
- Uma conjuração pendente de cena encerrada não pode aplicar efeitos na próxima
  cena. O servidor rejeita com `55000`; PE continua consumido, sem estorno.
  Conjurações legadas sem prova de cena continuam com conferência manual.
- Repetir UUID/argumentos originais confirma o recibo antigo, sem ressuscitar
  efeitos expirados. Novo UUID para a mesma etapa/conjuração continua rejeitado.
- Encerramento, alteração das fichas, recibo de cena e histórico por ficha estão
  na mesma transação. Falha em qualquer etapa reverte a operação inteira.
- O bloqueio segue campanha antes da ficha e fichas por UUID, para evitar uma
  aplicação de ritual concorrente atravessar o encerramento da cena.

## Banco, permissões e dados existentes

Migration `20261006230000_scene_effect_expiration.sql` cria duas tabelas privadas:
`character_scene_casts_v2` vincula evento de conjuração à cena;
`character_scene_effects_v2` vincula aplicação, ficha, campanha, cena, campo JSON
e identidade da instância. RLS habilitada e nenhum acesso direto de anon ou
authenticated. FKs conservam integridade; exclusão do registro pai mantém o
comportamento de cascata existente. Nenhum dado antigo é atualizado em massa.

`campaign_scene_events_v2.expired_effects_count` é nulo nos recibos anteriores,
zero em novos encerramentos sem remoção e positivo quando houve expiração.
O trigger privado de recibos cobre tanto o encerramento novo quanto a transição
ativo → inativo enviada por clientes antigos.

As RPCs públicas conservam assinatura, validação de vínculo, CAS, autoria e
idempotência. As implementações anteriores ficam privadas. A autenticação usa
`auth.uid()` da sessão existente. O cliente envia UUID da operação/ficha,
tipo/valor, snapshot esperado, evento de conjuração e contexto opcional; não
envia autorização, cena confiável ou origem. As respostas são eventos confirmados.

## Arquivos e comunicação

| Arquivo | Função, dados e dependências |
| --- | --- |
| `supabase/migrations/20261006230000_scene_effect_expiration.sql` | Recebe os contratos das RPCs existentes; usa validadores de vínculo, funções anteriores, combate/cena, personagens e eventos. Salva origem/efeitos/recibos; trigger só remove instâncias elegíveis. |
| `supabase/tests/scene_effect_expiration.sql` | Fixtures e rollback; chama RPCs reais como jogador/mestre. Verifica permissões, legado, outra campanha, crítico, retry e PE. |
| `supabase/migrations/20261006235000_scene_expiration_nullable_fields.sql` | Trata condições e bônus independentemente; usa o mesmo trigger privado e conserva NULL/formatos antigos do outro campo, sem impedir expiração de uma instância comprovada. Não muda permissões ou dados em massa. |
| `src/types/effect-duration.ts` | Contrato compartilhado de duração e origem; importado pelos modelos de condições/bônus e aviso. Não grava dados. |
| `src/lib/rituals/ritual-condition-duration.ts` | Recebe condição do catálogo; devolve categoria, rodadas e texto. Usado nos dois wizards; não transforma duração ausente em cena. |
| `src/components/character/RitualEffectWizard.tsx` | Recebe ritual/efeito/alvo; envia condições com duração ao callback da ficha, que usa `useRitualApplication`. |
| `src/components/character/mobile/MobileRitualEffectWizard.tsx` | Mesmo contrato para mobile; confirmação real pelo fluxo já existente. |
| `src/components/character/RitualConditionApplicator.tsx` | Aplicador legado; conserva a categoria do objeto pendente no callback, sem inferir origem. |
| `src/lib/conditions/condition-serialization.ts` | Converte banco/runtime mantendo metadados e datas inválidas legadas; usado pela persistência, ficha e aplicações de turno. |
| `src/hooks/useWeaponBuffs.ts` | Modelo de bônus com origem opcional; recebe `active_buffs`, expõe bônus às armas e usa callback existente de persistência. |
| `src/components/character/EffectDurationNotice.tsx` | Recebe duração/origem; apresenta prazo, ritual e controle manual sem tooltip obrigatório. Não chama API. |
| `src/components/character/ConditionManager.tsx` | Recebe condições e callback de gravação; usa aviso compartilhado e `useConditionMutation`; ajuste explícito do contador muda para rodadas. |
| `src/components/character/mobile/MobileConditionManager.tsx` | Mesmo aviso e ajuste para mobile; preserva callbacks e parâmetros das condições. |
| `src/components/character/WeaponBuffIndicator.tsx` | Recebe bônus; mostra aviso no indicador e tooltip; integra tabela de armas. |
| `src/components/character/WeaponBuffTurnTracker.tsx` | Recebe bônus/callbacks; mostra prazo/origem no painel de manutenção, com quebra de linha. |
| `src/services/character-activity-service.ts` | Traduz `55000` sem expor SQL; usado pelo serviço de aplicação e histórico autenticado. |
| `src/lib/character-activity-presentation.ts` | Recebe evento confirmado; traduz expiração para histórico de ficha, mantendo o antes/depois persistido. |
| `src/services/campaign-combat-service.ts` | Consulta recibos paginados via Supabase; acrescenta contagem de expirados ao contrato, sem mudar salvamento/encerramento. |
| `src/components/campaign/v3/CampaignScenePanel.tsx` | Recebe campanha/controlador/papel; explica expiração na confirmação e mostra contagem no histórico; usado em painel, combate e mapa. |
| Testes de aviso, wizard, duração, apresentação e painel | Exercitam contrato enviado, mensagens visíveis e recibos; não chamam produção. |

Fluxo: catálogo → wizard → callback de CharacterSheet/MobileCharacterSheet →
`useRitualApplication` → `ritual-application-service` → RPC autenticada → prova
privada + JSON da ficha + evento. Mestre encerra → RPC de cena → trigger do
recibo → fichas e históricos → Realtime existente de characters/activity/combate
→ refetch das telas. Ler um evento nunca reaplica o efeito.

## Como testar

1. Conjurar em campanha v2 e aplicar bônus/condição com duração de cena: conferir
   origem e prazo no desktop/mobile, além do evento confirmado.
2. Cancelar encerramento: nenhuma remoção. Confirmar: próxima cena, efeito
   elegível removido, recibo com contagem e histórico por ficha.
3. Preservar condições antigas, desconhecidas, parâmetros, outra campanha,
   rodadas, sustentados e contadores críticos.
4. Repetir o pedido original após expiração: mesmo recibo, nenhuma reaplicação.
5. Encerrar com efeito ainda pendente: aplicação rejeitada e PE não estornado.
6. Jogador tenta encerrar, ler/escrever tabelas privadas ou misturar campanha:
   rejeição. Mestre só atinge fichas ainda vinculadas.
7. Recarregar/reconectar e observar outra aba: ficha e histórico restaurados;
   dois navegadores com a mesma conta não comprovam uso com dois usuários reais.

Limites restantes: usos de poderes por cena, contadores críticos acumulativos,
manutenção/encerramento de sustentação e efeitos sem origem permanecem manuais.
Não reinterpretar fichas antigas para ativar automação retroativamente.

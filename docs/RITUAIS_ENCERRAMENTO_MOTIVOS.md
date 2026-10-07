# Encerramento confirmado e motivos de rituais sustentados

## Escopo e regras

Livro Base v1.3, páginas impressas 119–121, conferidas no PDF fornecido pelo responsável.
Concentração é necessária durante a execução: situações ruins/terríveis usam Vontade contra 15/20 + custo em PE; dano durante a execução usa DT igual ao dano. Falha impede o ritual e perde os PE.
O guia esclarece essa distinção; este lote **não integra esses testes à tela de conjuração**.
Dano após conjuração e PV zero não provocam encerramento automático. Gatilhos específicos precisam ser resolvidos conforme a descrição do ritual.
Manutenção continua custando 1 PE por ritual, somente após confirmação explícita. Encerrar não cobra nem estorna PE.

## Arquivos e comunicação

| Arquivo | Responsabilidade, entradas e saídas |
| --- | --- |
| `src/lib/rituals/ritual-ending.ts` | Motivos e validação pura; recebe declaração e retorna erro ou validação bem-sucedida. Usado pelo formulário, controle, serviço e histórico. |
| `src/components/character/SustainedRitualEndingForm.tsx` | Formulário compartilhado; recebe motivo, nota, alcance, origem e bloqueio; emite callbacks. Não salva dados. |
| `src/components/character/SustainedRitualControl.tsx` | Recebe ficha, PE e sustentações do hook; prepara snapshot/UUID, exige motivo, congela tentativa e recupera resposta incerta. Usa os painéis desktop/mobile e o serviço. |
| `src/services/sustained-ritual-service.ts` | Recebe pedido congelado; valida e chama RPC. Verifica ficha, operação, estado e motivo no recibo antes do sucesso. |
| `src/services/character-activity-service.ts` | Tipagem da RPC e infraestrutura existente de confirmação, serialização e tratamento de falhas. |
| `src/lib/character-activity-presentation.ts` | Recebe evento e apresenta motivo informado/observação; históricos antigos continuam legíveis. Usado pelo histórico da ficha. |
| `supabase/migrations/20261007020000_sustained_ritual_end_reason.sql` | Nova RPC protegida; valida motivo/origem/permissões, reutiliza encerramento transacional e grava motivo no evento existente. |
| `supabase/tests/sustained_ritual_end_reason.sql` | Fixtures com rollback; valida motivo, alcance declarado, legado, replay, colisão de motivo, PE, estranho e anônimo. |
| `src/lib/rituals/__tests__/ritual-ending.test.ts` | Regras de obrigatoriedade e tamanho. |
| `src/services/__tests__/sustained-ritual-service.test.ts` | Contrato RPC e recibos, incluindo resposta com motivo diferente. |
| `src/components/character/__tests__/sustained-ritual-control.test.tsx` | Confirmação, cancelamento e recuperação com pedido congelado. |
| `src/lib/__tests__/character-activity-presentation.test.ts` | Apresentação de motivos e compatibilidade com recibos antigos. |

Fluxo: ficha desktop/mobile → controle → formulário → serviço → `confirm_sustained_ritual_end` → RPC base → remoção de sustentações/efeitos comprovados + evento → recibo validado → recarga e histórico.
Payload: UUID da operação/ficha, ação `end` ou `end_all`, snapshot dos rituais e `{kind, note?, rangeConfirmed?}`. Autenticação usa a sessão Supabase existente; nenhum segredo novo é enviado.
Tabelas: `characters`, `character_sustained_rituals`, `sustained_ritual_origins` e `character_activity_events`. Sem novas colunas ou exclusão de históricos. Motivo é acrescentado ao JSON do recibo com `reasonSource=user_confirmed`.

## Compatibilidade e limites

- Jogador continua limitado à própria ficha; mestre precisa de vínculo real da ficha à campanha, usando a autorização existente.
- Encerramento voluntário exige origem protegida na própria ficha e declaração explícita de alcance. O sistema não mede distância nem comprova fatos narrativos.
- Registros antigos/outra origem usam conferência manual; não recebem origem inventada.
- Motivo fica congelado junto ao UUID após envio. Retry com outro motivo é rejeitado, mesmo após encerramento concluído.
- A RPC anterior permanece para clientes antigos. Portanto, motivo obrigatório vale no fluxo atualizado; não há retropreenchimento ou bloqueio global de clientes antigos.
- Gatilhos desconhecidos são sinalizados e preservados. Não há cobrança por relógio, encerramento por dano, morte presumida ou teste contínuo automático.

## Validação

Executar checagem de tipos, testes da interface/serviços/histórico, regressão e build. Executar SQL contra PostgreSQL isolado com migrations reais e fixtures acima.
Na aplicação publicada: abrir a ficha QA, cancelar sem mudanças; escolher motivo; conferir bloqueio por descrição/alcance quando exigidos; confirmar; verificar motivo no histórico após recarga e PE preservado. Repetir no mobile e conferir ausência de controles cortados.

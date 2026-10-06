# Leitura da ficha: contexto e respostas atuais

## Ajuste

O carregamento inicial e o refetch de `CharacterSheet` faziam leituras independentes, sem conferir se a rota/conta mudou ou se outra consulta já terminou. Uma resposta antiga podia substituir recursos/condições novos. O preparo assíncrono de inventário também precisava conferir o contexto antes de apresentar seu resultado.

Os dois caminhos usam um leitor compartilhado. Cada pedido obtém uma geração; retorno antigo é descartado, inclusive ao navegar A→B→A, trocar conta ou desmontar. O preparo do inventário confere a geração novamente. Falha atual é visível, com tentativa de recuperação, e não deixa carregamento infinito se uma consulta inicial tiver sido substituída. Ficha/recursos locais são limpos ao trocar contexto.

O banner offline passa a informar que confirmação depende do servidor e orienta conferir pendências. Não promete que qualquer alteração foi armazenada localmente. A quebra de linha mantém o botão acessível em telas pequenas.

## Arquivos e comunicação

| Arquivo | Dados e dependências |
| --- | --- |
| `src/hooks/character/useCharacterServerRead.ts` | Recebe ID da ficha e dono; lê `characters` por Supabase, mantendo filtros e RLS. Retorna resposta atual e verificador para etapas assíncronas, ou null se obsoleta. Não grava dados. Consumido pelos dois leitores de `CharacterSheet`. |
| `src/pages/CharacterSheet.tsx` | Usa leitor para dados completos, parse e recursos. Mantém migração de inventário existente, conferindo atualidade antes/depois. Mostra erro e nova tentativa; distribui ficha completa para desktop/mobile. Recebe notificações `character-server-updated` do hook de atividade. |
| `src/components/ui/OfflineBanner.tsx` | Recebe estado offline/callback de reconexão; apresenta aviso sem prometer gravação e sem enviar recursos à API. Usado pela ficha e consumidores existentes. |
| `src/hooks/character/__tests__/useCharacterServerRead.test.ts` | Exercita leituras fora de ordem, erro antigo, A→B→A, troca de conta, desmontagem, preparo assíncrono, filtros e falha de rede. |
| `docs/LEITURA_FICHA_CONTEXTO.md` | Documenta responsabilidade, fluxo e impacto. |

Servidor → leitura atual → parse → ficha/recursos → componentes. Resposta antiga → descarte; erro atual → aviso → nova leitura. Não há migration, dependência ou alteração de regra/permissão. Uma migração de inventário que já começou continua seguindo seu contrato anterior; descartar apresentação não desfaz gravação confirmada.

## Critérios de teste

1. Entregar a segunda consulta antes da primeira; ficha deve conservar a segunda resposta.
2. Navegar A→B→A ou trocar conta durante consulta; retorno anterior não pode reaparecer.
3. Concluir preparo de inventário após nova leitura; snapshot preparado antigo deve ser ignorado.
4. Simular falha HTTP somente na leitura da ficha e conferir aviso, retry e retorno dos recursos após liberar rede.
5. Em 390×844, conferir aviso offline inteiro e botão acessível. Restaurar rede, fechar simulações e preservar recursos/histórico.

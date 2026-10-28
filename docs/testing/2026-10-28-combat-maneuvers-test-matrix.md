# Matriz de testes: manobras de combate v2

## Objetivo

Provar que Agarrar, Derrubar, Desarmar, Empurrar e Quebrar usam um único contrato servidor, consomem no máximo uma ação padrão, preservam dados desconhecidos e são recuperáveis após repetição ou reconexão.

Esta matriz complementa `docs/strategies/2026-10-28-nonlethal-maneuvers-strategy.md`. Os testes SQL devem ser transacionais (`BEGIN`/`ROLLBACK`) e não podem deixar usuários, fichas, históricos, condições ou inventário de QA no banco.

## Fixture SQL reutilizável

Usar um prefixo UUID exclusivo do arquivo, por exemplo `a1990000-0000-4000-8000-*`, para evitar colisão com os ensaios atuais.

### Identidades

| Papel | UUID sugerido | Uso |
| --- | --- | --- |
| Mestre | `...0001` | Cria o combate, confirma pendências espaciais/objeto e lê todos os recibos. |
| Jogador atacante | `...0002` | Declara e rola manobra da própria ficha. |
| Jogador defensor | `...0003` | Controla o alvo e tenta escapar de Agarrar. |
| Usuário externo | `...0004` | Prova negação de leitura e escrita. |

### Fichas

**Atacante (`...0011`)**

- Luta treinada e atributos suficientes para gerar pool conhecido.
- Inventário com `espada-qa` corpo a corpo equipada, `pistola-qa` à distância equipada/desabilitada conforme o cenário e um item sem relação com a manobra.
- Condição personalizada em objeto: `{"id":"marca-atacante","name":"Marca atacante","params":{"valor":11}}`.

**Defensor (`...0012`)**

- Luta treinada, PV e recursos conhecidos.
- Inventário com `bastao-qa` equipado e `reliquia-qa` não equipado. Ambos devem conter campos desconhecidos em `metadata` para provar preservação estrutural.
- Condição personalizada em objeto e uma condição legada em texto: `Marca da mesa` e `Exausto QA`.

**Terceiro participante (`...0013`)**

- Permite provar que recibos, condições e itens não vazam para outra ficha da campanha.

### Campanha e turno

- Campanha v2 (`...0020`) com atacante, defensor e terceiro participante vinculados.
- Combate ativo, cena 1, rodada 1, atacante no índice atual.
- Capturar `turn_instance_id` depois de `save_campaign_combat_v2`; nunca inventar essa identidade na fixture.
- Capturar o estado de `get_character_turn_action_status` antes de cada caso.
- Cada caso que consome ação deve avançar para uma nova instância de turno, mesmo que permaneça na mesma rodada.

### Operações estáveis

Reservar faixas para facilitar diagnóstico:

- `...0100` a `...0199`: contrato comum e permissões.
- `...0200` a `...0299`: Agarrar.
- `...0300` a `...0399`: Derrubar.
- `...0400` a `...0499`: Desarmar.
- `...0500` a `...0599`: Empurrar.
- `...0600` a `...0699`: Quebrar.

## Separação dos níveis de teste

1. **Funções puras/imutáveis:** validar resultado oposto, empate, margem e distância com totais fornecidos. É aqui que margens exatas 4, 5 e 10 devem ser determinísticas.
2. **SQL transacional:** validar autorização, vínculo ao turno, ação, estado, histórico, inventário, condições e idempotência. A integração não deve depender de obter um número aleatório específico.
3. **Serviços TypeScript:** validar payload, tradução de erros, reconsulta de recibo e assinatura realtime.
4. **Componentes:** validar estados e mensagens em desktop/mobile.
5. **UAT publicado:** validar duas contas reais, reconexão e sincronização visual.

## Matriz comum do contrato servidor

| ID | Cenário | Preparação/ação | Resultado esperado |
| --- | --- | --- | --- |
| MAN-C01 | Declaração válida | Jogador atacante, próprio turno, alvo da campanha e espada equipada. | Intenção `pending`, sem ação consumida, sem condição e sem histórico de resultado. |
| MAN-C02 | Ficha de outro usuário | Defensor tenta declarar pela ficha do atacante. | `42501`; zero alteração em ação, intenção e históricos. |
| MAN-C03 | Usuário externo | Usuário fora da campanha tenta ler/declarar. | Nenhuma linha visível por RLS; RPC falha `42501`. |
| MAN-C04 | Fora do turno | Avançar tracker ao defensor antes de declarar. | `55004`/erro funcional equivalente; nenhum efeito colateral. |
| MAN-C05 | Cena/rodada/turno obsoleto | Reutilizar os valores anteriores após avanço. | `40001`; cliente deve solicitar atualização. |
| MAN-C06 | Ação padrão já usada | Confirmar ataque/ritual padrão antes da manobra. | Manobra rejeitada; ação e histórico anteriores preservados, nenhum novo registro. |
| MAN-C07 | Alvo fora da campanha | Usar uma ficha válida, mas não vinculada. | `42501`; nenhuma intenção persistida. |
| MAN-C08 | Arma à distância | Usar `pistola-qa`. | Rejeição antes da rolagem; exceções como Disparo Impactante não pertencem ao contrato base. |
| MAN-C09 | Reenvio da declaração | Repetir mesmo UUID e payload. | Mesma intenção; nenhuma duplicação. |
| MAN-C10 | UUID com payload divergente | Trocar alvo/manobra/arma no segundo envio. | `23505`; estado original intacto. |
| MAN-C11 | Empate | Função pura recebe totais 17/17; integração persiste resultado empatado. | Nenhum vencedor/efeito; ação ainda pertence à mesma intenção; nova rodada oposta vinculada, não uma segunda manobra. |
| MAN-C12 | Desempate | Resolver nova rodada com um vencedor. | Uma única ação padrão e um único par de históricos para o resultado final; tentativas aparecem dentro do mesmo recibo. |
| MAN-C13 | Derrota do atacante | Total defensor maior. | Ação consumida, resultado registrado nas duas fichas, nenhum efeito mecânico no alvo. |
| MAN-C14 | Duplo clique concorrente | Duas transações enviam mesma operação. | Um recibo, uma ação e no máximo um efeito; segunda chamada recupera o recibo. |
| MAN-C15 | Segunda operação no mesmo turno | Novo UUID após uma manobra confirmada. | Rejeição por ação indisponível, sem novo histórico. |
| MAN-C16 | Condições desconhecidas | Ambas as fichas começam com string e objeto personalizados. | Depois de adicionar/remover condição oficial, os registros desconhecidos ficam byte-equivalentes. |
| MAN-C17 | Expiração de intenção | Avançar turno/cena antes de resolver. | Intenção expirada; não consome ação nem aplica efeito; proveniência preservada. |
| MAN-C18 | Encerramento do combate | Desativar o combate com intenção pendente. | Intenção expirada. Efeitos confirmados seguem regra específica; não são apagados silenciosamente. |
| MAN-C19 | Reconsulta após reconexão | Consultar estado pelo ID da operação em cliente novo. | Mesmo status, tentativas, resultado e pendência; nenhum novo sorteio. |
| MAN-C20 | Isolamento entre fichas | Consultar atividade do terceiro participante. | Nenhum histórico da manobra aparece na ficha não envolvida. |

## Agarrar

| ID | Cenário | Preparação/ação | Resultado esperado |
| --- | --- | --- | --- |
| MAN-A01 | Exige ataque desarmado | Tentar Agarrar com `espada-qa`. | Bloqueado com motivo explícito; sem rolagem ou ação consumida. |
| MAN-A02 | Sucesso | Ataque desarmado vence o teste oposto. | Vínculo único atacante-alvo; alvo recebe Agarrado e consequências derivadas; atacante registra mão ocupada e deslocamento pela metade. |
| MAN-A03 | Reenvio do sucesso | Repetir a confirmação de A02. | Não duplica condição, vínculo, ação ou históricos. |
| MAN-A04 | Segundo Agarrar incompatível | Mesma mão/atacante tenta novo alvo. | Bloqueado enquanto não houver mão livre confirmada; vínculo original intacto. |
| MAN-A05 | Soltar | Atacante usa ação livre para encerrar. | Vínculo e apenas a condição derivada dessa fonte são removidos; condições homônimas/de outras fontes são preservadas. |
| MAN-A06 | Escapar com sucesso | No turno do defensor, gastar ação padrão e vencer teste oposto. | Vínculo encerrado, ação do defensor consumida e recibo comum às fichas. |
| MAN-A07 | Escapar com empate | Totais iguais. | Continua Agarrado; desempate dentro da mesma ação de escapar. |
| MAN-A08 | Escapar com falha | Atacante vence. | Vínculo permanece; ação do defensor consumida; histórico registra falha. |
| MAN-A09 | Esmagar/Sufocar | Atacante substitui ataque, vence teste e resolve dano desarmado de impacto. | Dano usa fluxo de ataque/dano existente uma vez; vínculo permanece. |
| MAN-A10 | Alvo some da cena | Participante é removido ou campanha/cena é encerrada. | Vínculo não fica órfão; encerramento tem motivo explícito e é recuperável no histórico. |
| MAN-A11 | Condição Agarrado preexistente | Alvo já possui condição de outra fonte. | Nova fonte não sobrescreve a anterior; soltar remove somente a relação criada neste teste. |
| MAN-A12 | Reconexão durante Agarrar | Fechar e reabrir atacante e defensor. | Ambos veem relação, fonte, ações possíveis e consequências atuais. |

## Derrubar

| ID | Cenário | Preparação/ação | Resultado esperado |
| --- | --- | --- | --- |
| MAN-D01 | Sucesso com margem 4 | Função pura 19 contra 15 e confirmação equivalente. | Aplica Caído; não cria deslocamento pendente. |
| MAN-D02 | Limite margem 5 | Função pura 20 contra 15. | Aplica Caído e cria pendência de deslocamento de exatamente 1,5 m. |
| MAN-D03 | Alvo já Caído | Resolver novo sucesso contra condição existente. | Não duplica condição; recibo registra que não houve transição de estado. |
| MAN-D04 | Confirmação espacial | Mestre confirma direção da pendência de D02. | Pendência resolvida uma vez; posição não é inventada pelo RPC se o mapa não for autoritativo. |
| MAN-D05 | Cancelamento/rejeição espacial | Mestre informa que não há espaço válido. | Caído permanece; pendência encerra com motivo, sem deslocamento falso. |
| MAN-D06 | Reflexos na beirada | Mestre marca que o deslocamento alcança beirada. | Sistema abre instrução/pendência de Reflexos DT 20, sem assumir queda. |
| MAN-D07 | Condição personalizada | Alvo possui `Caído QA` desconhecido e marca da mesa. | Somente a condição oficial `caido` é gerida; desconhecidas permanecem. |

## Desarmar

| ID | Cenário | Preparação/ação | Resultado esperado |
| --- | --- | --- | --- |
| MAN-S01 | Item obrigatório | Omitir `targetItemId`. | Rejeição `22023`; sem ação ou mutação de inventário. |
| MAN-S02 | Item não empunhado | Escolher `reliquia-qa` não equipada. | Rejeição; item e inventário completos preservados. |
| MAN-S03 | Item de outra ficha | Enviar ID existente apenas no terceiro participante. | Rejeição; nenhum vazamento de nome/metadados no erro. |
| MAN-S04 | Sucesso margem 4 | Escolher `bastao-qa` e vencer por 4. | Apenas esse item passa a não equipado; nenhuma pendência de deslocamento. |
| MAN-S05 | Sucesso margem 5 | Vencer por 5. | Item desequipado e pendência de deslocamento de 1,5 m. |
| MAN-S06 | Reenvio | Repetir S04/S05. | Item não é removido nem recriado; metadados, modificações e ordem do inventário preservados; sem histórico duplicado. |
| MAN-S07 | Estado mudou durante a intenção | Alvo guarda/troca o item antes da resolução. | Falha de concorrência `40001`; não desarma outro item por aproximação de nome. |
| MAN-S08 | IDs duplicados legados | Fixture contém dois itens com mesmo ID. | Operação bloqueada como inventário ambíguo; nenhuma atualização parcial. |
| MAN-S09 | Reconexão | Reabrir a ficha após sucesso. | Item continua visível, porém desequipado; histórico identifica item e autor da confirmação sem expor JSON interno. |

## Empurrar

| ID | Cenário | Preparação/ação | Resultado esperado |
| --- | --- | --- | --- |
| MAN-E01 | Vitória mínima | Margem 1. | Distância calculada de 1,5 m. |
| MAN-E02 | Margem 4 | Totais 19/15. | Distância permanece 1,5 m. |
| MAN-E03 | Margem 5 | Totais 20/15. | Distância 3 m. |
| MAN-E04 | Margem 9 | Totais 24/15. | Distância permanece 3 m. |
| MAN-E05 | Margem 10 | Totais 25/15. | Distância 4,5 m. |
| MAN-E06 | Acompanhar sem ação de movimento | Atacante escolhe acompanhar após já gastar movimento. | Opção rejeitada; empurrão confirmado não é revertido. |
| MAN-E07 | Acompanhar parcialmente | Deslocamento restante menor que a distância calculada. | Acompanhamento limitado ao restante; valor e limite visíveis no recibo. |
| MAN-E08 | Obstáculo informado | Mestre rejeita parte/todo o deslocamento. | Pendência registra distância calculada e distância aplicada separadamente. |
| MAN-E09 | Confirmação repetida | Reenviar confirmação espacial. | Uma resolução e nenhuma segunda movimentação. |
| MAN-E10 | Reconexão pendente | Novo cliente abre antes da confirmação espacial. | Mostra distância calculada, quem deve confirmar e estado pendente. |

## Quebrar

| ID | Cenário | Preparação/ação | Resultado esperado |
| --- | --- | --- | --- |
| MAN-Q01 | Item empunhado obrigatório | Omitir item ou escolher item não equipado. | Rejeição sem consumir ação. |
| MAN-Q02 | Manobra vencida | Vencer teste oposto contra item válido. | Abre uma resolução de objeto; não reduz PV do portador. |
| MAN-Q03 | RD/PV ausentes | Item sem durabilidade catalogada. | Mestre precisa declarar RD/PV; interface não anuncia quebra automática. |
| MAN-Q04 | Dano menor/igual à RD | Confirmar dano que não supera RD. | PV do objeto inalterado; recibo registra dano final zero. |
| MAN-Q05 | Dano parcial | Dano após RD menor que PV. | Durabilidade reduzida uma vez; item continua utilizável. |
| MAN-Q06 | Quebra | Dano após RD zera PV. | Item marcado quebrado/inutilizável, preservado no inventário e histórico; portador não perde PV. |
| MAN-Q07 | Reenvio de dano | Repetir operação de Q05/Q06. | Mesma durabilidade e recibo; sem segundo dano. |
| MAN-Q08 | Payload divergente | Mesmo UUID, outro dano/RD/PV. | `23505`; primeira resolução permanece. |
| MAN-Q09 | Item removido durante a pendência | Alterar inventário antes de confirmar dano. | `40001`; nenhuma quebra aplicada a item por nome semelhante. |
| MAN-Q10 | Campos desconhecidos | Item contém metadados/modificações não reconhecidos. | Somente estado de durabilidade muda; demais campos permanecem estruturalmente iguais. |

## Testes de serviço e interface

| ID | Camada | Cenário | Resultado esperado |
| --- | --- | --- | --- |
| MAN-UI01 | Serviço | RPC retorna `42501`, `40001`, `55004`, `23505`. | Mensagens específicas de autorização, estado obsoleto, ação indisponível e operação reutilizada; sem toast de sucesso. |
| MAN-UI02 | Desktop | Seleção de cada manobra. | Requisitos, ação, arma/item e efeitos aparecem antes da confirmação. |
| MAN-UI03 | Mobile 320 px | Mesmo fluxo de UI02. | Nenhum controle cortado/sobreposto; drawer permite rolar e confirmar; rótulos acessíveis. |
| MAN-UI04 | Duplo clique | Confirmar rapidamente duas vezes. | Controle desabilita durante envio; um resultado exibido. |
| MAN-UI05 | Empate | Resultado empatado. | Interface explica novo teste e mantém a mesma ação/intenção. |
| MAN-UI06 | Pendência do mestre | Derrubar/Desarmar/Empurrar/Quebrar. | Jogador vê “aguardando mestre”; mestre vê ação concreta e valores, não JSON. |
| MAN-UI07 | Realtime em duas contas | Mestre confirma efeito. | Jogador recebe atualização sem recarga; histórico das duas fichas usa mesmo recibo. |
| MAN-UI08 | Reconexão | Desconectar após envio e antes da resposta. | Ao retornar, cliente consulta operação e apresenta o recibo existente sem repetir rolagem/efeito. |
| MAN-UI09 | Página de regras | Abrir `/rules`. | Distingue automação mecânica de confirmação espacial e mantém v1 manual. |

## Consultas de invariantes após cada caso SQL

Cada bloco deve comparar um snapshot anterior e posterior, pelo menos:

- `characters.conditions` de atacante, alvo e terceiro participante;
- `characters.inventory` do alvo;
- status de ação do atacante/defensor;
- contagem de eventos por `operationId`, ficha e categoria;
- contagem de relações/pendências da manobra;
- cena, rodada e `turn_instance_id` do recibo;
- ausência de alterações nas demais fichas da campanha.

Falhas esperadas devem verificar o snapshot completo, não apenas o SQLSTATE.

## Bloqueadores de testabilidade encontrados

1. **Contrato ainda inexistente:** não há tabela/RPC comum de manobra. Os nomes de chamadas e colunas desta matriz precisam acompanhar o design final; os comportamentos são o contrato estável.
2. **Resultados exatos e RNG:** margem 4/5/10 e empate não podem depender de sorte em integração. Extrair uma função imutável de resolução por totais e testar os limites nela. O ensaio transacional pode validar persistência com qualquer resultado válido. Não adicionar parâmetro secreto de dados forçados ao RPC de produção.
3. **Estado de mãos:** o inventário atual não prova quantas mãos estão ocupadas nem qual mão segura cada item. Agarrar não pode bloquear uma segunda relação de forma confiável sem um estado explícito ou confirmação do mestre registrada.
4. **Posição e movimento:** o servidor não possui, no contrato de combate, uma posição autoritativa e um orçamento geral de movimento suficiente para provar deslocamento/aproximação. A distância calculada pode ser automática; aplicar posição deve ficar pendente até existir essa autoridade.
5. **Durabilidade de objetos:** itens de inventário não possuem contrato uniforme de RD/PV. Quebrar precisa de durabilidade persistida ou de valores declarados pelo mestre, sempre associados ao ID estável do item.
6. **Condições com múltiplas fontes:** `conditions` aceita strings e objetos, mas não há garantia de identidade de fonte para duas ocorrências de Agarrado/Caído. A relação da manobra precisa ser a fonte autoritativa para remover apenas seu próprio efeito.
7. **Itens legados duplicados:** inventários JSON podem conter IDs ausentes ou repetidos. Desarmar/Quebrar devem recusar ambiguidade; testes precisam de uma fixture específica.
8. **Realtime não é provado por SQL:** publicação na tabela e RLS podem ser verificadas estaticamente, mas reconexão e entrega entre duas identidades exigem teste TypeScript com dois clientes ou UAT autenticado.
9. **Expiração versus efeito confirmado:** avançar turno já expira intenções de ataque, mas não existe política implementada para relações de manobra. Cada efeito precisa de regra explícita de encerramento; não usar um trigger genérico que apague efeitos válidos.
10. **Ação no empate:** o orçamento atual precisa distinguir intenção reservada de ação consumida. Sem isso, um desempate pode cobrar duas ações ou permitir outra ação concorrente.

## Porta de saída para publicação

- Todos os casos SQL comuns e específicos passam dentro de transação e terminam em `ROLLBACK`.
- Serviços e componentes cobrem sucesso, erro e reconexão.
- Nenhum caso depende de RNG para margem exata.
- UAT usa mestre e jogador em sessões distintas e confirma ao menos uma manobra com efeito e uma pendência espacial.
- A página de regras permanece `partial` para geometria, Quebrar sem dados e integrações de poderes, mas não chama de manual o núcleo realmente automatizado.

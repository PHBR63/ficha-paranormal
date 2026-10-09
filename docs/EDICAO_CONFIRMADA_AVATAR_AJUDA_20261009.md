# Edição confirmada, avatar e ajuda — complemento dos lotes 1–3

## Resumo

A edição tentava enviar a foto na raiz do bucket, enquanto a política de escrita exige a pasta da conta. Em caso de erro, o caminho antigo devolvia a prévia local e seguia salvando o formulário. O envio agora usa a pasta correta e interrompe o salvamento se falhar; a edição fica aberta com aviso para repetir.

A ajuda dos campos usava ícones sem foco e dependia de hover. Passou a abrir por clique ou teclado, com nome do campo e área de interação. Requisitos de perícias também podem ser abertos sem alterar treinamento. Um clique no checkbox não dispara uma segunda troca pelo clique da linha.

Os textos de Intelecto e Presença foram alinhados aos cálculos atuais: Intelecto participa da quantidade de perícias; Presença participa do máximo de PE. SAN máxima não recebe um acréscimo genérico de Presença.

## Arquivos e responsabilidades

| Arquivo | Recebe / usa | Retorna ou salva / consumidor |
| --- | --- | --- |
| `src/services/character-photo-service.ts` | ID da ficha e arquivo; autenticação e Storage do cliente Supabase; valida ficha, tipo, tamanho e conta real. | URL pública após confirmação do envio, ou erro; usado pelo modal de edição. |
| `src/components/character/CharacterEditModal.tsx` | Ficha, estado aberto, callbacks de salvar/fechar; usa serviço de foto e Popover já instalado. | Formulário validado com URL confirmada para `onSave`; só fecha após conclusão. Mantém rascunho e erro na falha. |
| `src/components/ui/image-uploader.tsx` | Arquivo local e callback da tela. | Prévia local e arquivo; aviso esclarece que selecionar não equivale a salvar no servidor. É usado na criação e edição. |
| `src/pages/CharacterSheet.tsx` | Dados enviados pelo modal, ficha e conta atuais. | Atualiza `characters`, exige retorno de exatamente uma linha com ID; depois atualiza cache e registra alterações. Ausência de sessão não retorna sucesso vazio. |
| `supabase/migrations/20261009190000_restrict_avatar_metadata_owner.sql` | Política SELECT existente e identidade autenticada real. | Restringe metadados à pasta do dono; mantém bucket público e escrita existente. Complementa a migration de listagem da PR #55. |
| `supabase/tests/character_avatar_listing.sql` | Metadado sintético e identidades distintas, em transação revertida. | Confirma dono com leitura e visitante/conta anônima/outra conta sem leitura. Não cria arquivo físico. |
| `src/services/__tests__/character-photo-service.test.ts` | Integração simulada. | Confere pasta, ausência de sobrescrita, erros, autenticação e limites do arquivo. |
| `src/components/character/__tests__/CharacterEditModalFlows.test.tsx` | Modal real com envio simulado e callbacks controlados. | Confere ajuda clicável, textos de atributos, checkbox único, falha sem fechar, espera de confirmação e retry sem reenviar mídia já confirmada. |
| Este documento | Escopo, evidências e fluxo. | Handoff para manutenção e teste publicado. |

## Fluxo

Arquivo selecionado → `ImageUploader` prepara prévia → modal valida → serviço confirma conta → Storage envia dentro da pasta do dono → URL confirmada retorna ao modal → página grava a ficha e exige ID retornado → histórico de edição e cache são atualizados → modal fecha.

Falha no envio: nenhum salvamento da ficha. Falha na gravação depois de enviar: modal guarda a URL confirmada, para repetir sem outro upload. O arquivo anterior não é excluído ou sobrescrito.

Ajuda: botão identificado → Popover por clique/teclado → texto do campo/requisito. Abrir ajuda de uma perícia não treina nem destreina. O checkbox impede que seu clique também seja tratado pela linha.

## Patch principal

```ts
const path = `${user.id}/${characterId}-${crypto.randomUUID()}.${extension}`;
const { error } = await bucket.upload(path, file, { upsert: false });
if (error) throw new Error('Não foi possível enviar a foto. Tente novamente.');
```

A atualização da ficha termina com `.select('id').single()`, para tratar zero linhas alteradas como falha.

## Validação

- Três testes de envio/edição falham contra o componente antigo, com integração simulada para não acessar a rede.
- Treze testes focados passam após a correção, incluindo ajuda, atributos e treinamento.
- Checagem de tipos e compilação passaram. A regressão completa passou com 3.359 testes em 153 arquivos; publicação e teste autenticado são confirmados separadamente no relatório final.
- Cinco arquivos TypeScript novos/alterados do fluxo de edição/envio: lint sem erros ou avisos. A página principal mantém a dívida anterior: 41 erros e 13 avisos, iguais antes/depois; não se declara lint global limpo.
- Ensaio da política de metadados com a suite ampliada passou no banco e foi revertido. A aplicação definitiva é confirmada separadamente após merge.
- Testes publicados usam ficha sintética e imagem demonstrativa, preservando dados reais. Sua presença e resultado são informados no relatório final.

## Impactos e limites

Não há nova dependência ou troca de autenticação. A configuração de senhas vazadas salva no Cloud continua separada do cliente. URLs de avatares continuam públicas; somente metadados passam a ficar restritos ao dono. Isso não transforma imagens públicas em arquivos privados.

O limite de 100 MB e os formatos aceitos repetem o seletor existente, incluindo WebM. Otimização/compressão de mídia é outra entrega. A validação não certifica todo o livro nem todas as dependências.

## Como testar

1. Abrir edição, selecionar imagem demonstrativa e salvar; a foto precisa reaparecer após recarregar.
2. Simular falha de envio no teste: modal permanece aberto, apresenta erro e não chama salvar.
3. Simular falha de gravação: repetir salva usando a URL já enviada, sem novo upload.
4. Abrir ajuda de Foto, Intelecto, Presença e requisito de perícia por clique e teclado.
5. Clicar no checkbox de perícia permitida uma vez para treinar e outra para destreinar; a ajuda de requisito não deve alterar treinamento.
6. Conferir em 320 × 568 que controles de atributos podem quebrar linha e a área de conteúdo continua rolável.
7. Executar a suite SQL ampliada; todo metadado sintético deve ser revertido.

**Decisão do usuário:** nenhuma necessária para as correções; regras de 20 natural, descanso e gastos confirmados permanecem as escolhidas anteriormente.

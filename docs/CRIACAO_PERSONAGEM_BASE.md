# Criação de personagem — contrato do Livro Base v1.3

## 1. Resumo da alteração

O criador valida escolhas e progressão antes de permitir finalizar. A revisão, a prévia e o salvamento usam o mesmo contrato. O servidor recalcula a ficha e cria o vínculo da campanha na mesma transação, com repetição segura da solicitação.

O escopo é o Livro Base v1.3. As regras personalizadas de 20 natural e descanso permanecem. Esta entrega corrige criação e consumo de seus dados; não certifica a automação de todos os efeitos situacionais do livro.

## 2. Arquivos e responsabilidades

Todos os caminhos desta tabela são relativos à raiz do repositório. Arquivos com múltiplos nomes na mesma célula participam do mesmo fluxo.

| Arquivo | Entrada, saída e dependências |
| --- | --- |
| `src/pages/CharacterCreate.tsx` | Orquestra formulário, conta, campanha, etapas e foto. Consome o contrato, componentes de etapa, rascunho e serviço. Só navega após confirmação do servidor. |
| `src/lib/character-creation-rules.ts` | Recebe `CharacterFormData`; retorna pendências por etapa, graus, rituais por fonte, poderes completos, inventário, bônus para exibição e dados base. Importa motor, catálogos e regras de classe/paranormais. É consumido pela tela, revisão, painéis e serviço. |
| `src/lib/character-builder-engine.ts` | Reconstrói atributos, perícias e recursos base com escolhas da origem, classe e trilha. Consome catálogos e fórmulas; alimenta o contrato e a interface. |
| `src/lib/character-data.ts` | Fórmulas e listas: origens do Base, Universitário, limites de atributos e deslocamento. Consumido pelo motor, criador e fichas existentes. |
| `src/lib/rules/base-class-catalog.ts` | Lista os poderes escolhíveis das três classes no Base. O registro e o criador a usam para filtrar novas escolhas. |
| `src/lib/rules/base-creation-equipment.ts` | Fornece as 34 armas do Base com os valores da tabela; inclui Machado. Utilizado nas novas escolhas e no catálogo do servidor. O catálogo legado permanece legível. |
| `src/lib/class-powers/power-registry.ts` | Oferece escolhas limitadas ao Base; mantém resolução dos poderes legados. |
| `src/lib/class-powers/types.ts`, `especialista-powers.ts` | Descrevem a escolha de item de Mochila de Utilidades, consumida pelo modal e contrato. |
| `src/lib/category-reduction.ts` | Define categoria/espaço do item beneficiado; consumido pelo inventário e criador. |
| `src/lib/paranormal-powers/power-definitions.ts` | Preserva o poder de outra classe escolhido por Expansão de Conhecimento. Alimenta contrato e efeitos. |
| `src/components/character/CreationTrainingPanel.tsx` | Recebe formulário/atualizador; mostra graus de NEX 35/70 e escolhas de Perito com elegibilidade e contagem. |
| `src/components/character/CreationPowerChoices.tsx` | Recebe formulário/atualizador; registra subescolhas de Transcender, Expansão, itens e afinidade. Consome catálogos, contrato e modal. |
| `src/components/character/CreationRitualExtras.tsx` | Registra rituais adicionais de Saber Ampliado, Grimório e Lâmina, preservando cada fonte. Exibe requisitos de uso. |
| `src/components/character/ClassPowerSubchoiceModal.tsx` | Recebe configuração e escolhas elegíveis; devolve valores validados de perícia, elemento, ritual ou item. |
| `src/components/character/StepOrigin.tsx`, `StepClass.tsx`, `StepSkills.tsx`, `StepAbilities.tsx`, `StepRituals.tsx` | Integram os novos painéis ao formulário. A mudança de classe pede confirmação antes de limpar escolhas dependentes. |
| `src/components/character/CharacterCreationStepper.tsx` | Recebe etapa/estado; fornece navegação com nomes acessíveis e alvos móveis de 44 px. |
| `src/components/character/StatsPreviewWidget.tsx` | Recebe recursos e fontes de bônus; mostra prévia explicável da ficha. |
| `src/components/character/StepReview.tsx` | Consome o contrato; exibe perícias, poderes, subescolhas, rituais e equipamentos efetivamente salvos. O comando de editar retorna à etapa correta. |
| `src/hooks/useCharacterAutoSave.ts` | Recebe formulário, conta, campanha e estado ativo. Salva rascunho validado/específico por contexto; retorna restauração e erros de armazenamento. Não persiste arquivo/foto temporária. |
| `src/services/character-creation-service.ts` | Converte formulário válido em payload canônico e chama `create_character_base`. Retorna ficha confirmada ou erro; não informa sucesso com vínculo incompleto. |
| `src/integrations/supabase/types.ts` | Tipos de `creation_data`, `creation_review` e nova RPC, utilizados pela integração e serviço. |
| `src/lib/effects/character-power-input.ts` | Converte habilidades e subescolhas em poderes ativos para o motor de efeitos, incluindo poderes de outras classes. |
| `src/hooks/useBonusSummaryFromSUE.ts` | Recebe dados da ficha; encaminha escolhas e poderes ao motor e retorna bônus. Evita somar novamente fontes já calculadas. |
| `src/lib/unified-effects-engine.ts` | Identifica a fonte do bônus de dano que depende de arma escolhida. |
| `src/lib/effects/weapon-damage-effects.ts` | Recebe arma/bônus calculados; aplica Ferramenta de Trabalho somente à arma vinculada, preservando as outras fontes. |
| `src/pages/CharacterSheet.tsx` | Carrega a ficha e propaga o vínculo da arma e os avisos de revisão. |
| `src/components/character/CreationReviewNotice.tsx` | Recebe pendências antigas; apresenta detalhes e acesso à edição, sem inventar escolhas ausentes. |
| `src/components/character/MobileCharacterSheet.tsx` | Encaminha poderes e subescolhas ao cálculo móvel e mostra os mesmos avisos. |
| `src/components/character/CombatRollModal.tsx`, `mobile/MobileCombatPanel.tsx`, `mobile/weapon-entry.ts` | Transportam o vínculo do item beneficiado entre inventário, seletor de arma e rolagem. |
| `src/test/fixtures/characterCreation.ts` | Formulários sintéticos válidos usados pelos testes de contrato/serviço. |
| `src/lib/__tests__/character-creation-rules.test.ts` | Verifica regras, pendências, prévia, fontes, itens e progressão cronológica. |
| `src/services/__tests__/character-creation-service.test.ts` | Verifica confirmação, erros do servidor e repetição da solicitação. |
| `src/hooks/__tests__/character-creation-draft.test.tsx` | Verifica isolamento de rascunhos, dados inválidos, quota e falha de limpeza. |
| `src/hooks/__tests__/creation-effects-integration.test.tsx` | Verifica Policial, Precognição, Sensitivo, Reflexos Defensivos e poder concedido, sem duplicação de bônus. |
| `src/lib/effects/__tests__/weapon-damage-effects.test.ts` | Verifica Ferramenta de Trabalho limitada à arma escolhida. |
| `supabase/migrations/20261010013000_character_creation_contract.sql` | Instala catálogo, validação, registro de operações e criação/vínculo atômicos. |
| `supabase/migrations/20261010014000_reconcile_test_character_creation.sql` | Faz backup privado e revisão conservadora das fichas de teste existentes. Preserva dados não recuperáveis e marca pendências. |
| `scripts/character-creation-catalog.ts`, `character-creation-contract.sql.in`, `generate-character-creation.mjs` | Geram a primeira migration a partir das mesmas listas do produto. Não acessam banco nem credenciais. |

## 3. Fluxo de comunicação

1. As etapas atualizam o formulário com IDs e escolhas por fonte/instância.
2. O contrato local calcula a prévia e lista impedimentos. A revisão usa esses mesmos resultados.
3. O serviço envia identificador da operação, payload e campanha opcional para `create_character_base`.
4. A RPC identifica o usuário autenticado, valida sua participação, recalcula recursos/perícias/poderes/itens e grava ficha e associação na mesma transação.
5. O registro de operações devolve o resultado original para uma repetição idêntica; rejeita reutilização do identificador com conteúdo diferente.
6. A confirmação do servidor autoriza limpar o rascunho e abrir a ficha. Falhas mantêm o formulário e aparecem para o usuário.
7. A ficha entrega escolhas ao motor de efeitos; o inventário transmite o vínculo da arma ao cálculo de ataque/dano/crítico.

Tabelas afetadas: `characters` recebe dados canônicos e proveniência; `campaign_members` ou `campaign_members_v2` recebe o vínculo conforme a campanha; `character_creation_operations` guarda resultado/hash por usuário; `character_creation_backups` conserva o estado anterior da revisão. O ajuste de SAN respeita `character_paranormal_san_losses` e evita aplicar a perda permanente duas vezes.

## 4. Patch e contrato

```text
formulário → inspeção local → revisão → RPC autenticada
           → validação e cálculo no servidor
           → INSERT ficha + vínculo + resultado, na mesma transação
           → { character_id, confirmed: true, campaign_id, campaign_version }
```

Regerar o catálogo, antes da aplicação de uma versão nova: `node scripts/generate-character-creation.mjs`. A geração não aplica SQL. Depois de uma migration aplicada, qualquer mudança de regra precisa de uma nova migration; não reutilizar a versão antiga para alterar bancos já migrados.

## 5. Critérios de aceitação e limites

| Achado original | Aceitação desta entrega |
| --- | --- |
| C01, C12, C17 | Prévia/revisão/payload coerentes; servidor rejeita ficha incompleta ou recursos adulterados. |
| C02–C05 | Amnésico exige duas perícias; Perito exige duas iniciais elegíveis; graus 35/70 respeitam treinamento anterior; teto de atributo depende do NEX. |
| C06–C07 | Novas escolhas limitadas ao Base; poderes/origem não adicionam dados ou d20 arbitrários. |
| C08–C09 | Transcender e poderes de classe preservam subescolhas, requisitos e aquisição em ordem. |
| C10–C11 | Universitário e Casca Grossa corrigidos em fórmulas e recursos; SAN respeita Transcender e perdas permanentes. |
| C13–C14 | Rituais de classe, Aprender Ritual, Saber, Grimório, Lâmina e trilha final têm fontes e círculos validados. |
| C15 | Itens beneficiados são materializados/vinculados; bônus de Operário não afetam outra arma. |
| C16 | Criação e associação v1/v2 confirmadas pelo servidor; associação ocupada ou não autorizada falha sem ficha órfã. |
| C18–C19 | Patente escolhida preservada; edição retorna à etapa correta; mudança de classe não descarta dados sem confirmação. |
| C20–C22 | Rascunho por conta/campanha, validação de conteúdo/quota, reanexação de foto e repetição sem duplicar a ficha. |
| C23 | Controles de navegação/editáveis acessíveis e requisitos visíveis; inspeção publicada deve confirmar o recorte móvel. |

**Limites que permanecem explícitos:** fichas antigas não têm proveniência suficiente para reconstruir todas as escolhas, portanto continuam com avisos de revisão. O fluxo legado de gravação direta continua sujeito às políticas existentes e recebe revisão por padrão; esta entrega não elimina todos os caminhos legados. Subescolhas não constituem, por si só, automação de custos/ações situacionais: o uso do Grimório e a ação reduzida de Amaldiçoar Arma requerem seu fluxo próprio. Nenhuma certificação de “todas as regras automatizadas” é feita.

O backup é inacessível para usuários comuns e anônimos. O reparo não remove personagens, históricos, inventários ou condições; normaliza apenas identificadores conhecidos e corrige recursos determinísticos. Escolhas ausentes ficam pendentes. Sua marcação de execução impede repetir o reparo.

## 6. Como testar

- Criar Combatente, Especialista e Ocultista em NEX 5; em NEX mais alto conferir trilha, graus e marcos de poderes. Especialista sem Perito deve continuar bloqueado.
- Criar Amnésico, Operário, Engenheiro e Cultista Arrependido, conferindo escolhas e equipamentos; trocar a arma e verificar que Ferramenta de Trabalho não acompanha outra arma.
- Usar Graduado e Lâmina; escolher rituais por fonte, bloquear repetição inválida e confirmar círculos alcançáveis pela progressão.
- Recarregar rascunho na mesma conta/campanha; mudar de contexto e confirmar isolamento. Falhas de quota/foto/servidor devem aparecer sem mensagem de sucesso.
- Criar na campanha v1/v2 com jogador e mestre autorizados; verificar vínculo. Campanha ocupada ou participação ausente deve rejeitar a operação integralmente.
- Repetir a mesma solicitação confirmada; deve retornar a mesma ficha. Alterar o conteúdo com o mesmo identificador deve ser rejeitado.
- Conferir aviso nas fichas antigas, inventários/condições preservados e ausência de acesso ao backup por anônimos/usuários comuns.
- Executar a checagem de tipos, Vitest e build. Registrar resultados local, banco e publicado separadamente na entrega; nenhum deles substitui os demais.

# Controles individuais das fichas vinculadas

No teste autenticado de Sanidade, uma ficha vinculada ao próprio mestre aparecia no painel, mas desaparecia dos controles individuais. A aba filtrava o papel `master` mesmo com personagem válido. Também foi identificado campo descrito como valor exato apesar de aplicar um delta, com fechamento antes de confirmar e truncamento de decimais.

| Arquivo | Papel, dados e dependências |
|---|---|
| `src/components/campaign/v3/tabs/MasterTab.tsx` | Recebe membros já carregados por `CampaignShell`; lista aqueles com ficha, incluindo o mestre, em Fichas; passa membro e callbacks para `PlayerControlCard`. Não altera filtros de dano em área, combate ou descanso em grupo. |
| `src/components/campaign/v3/master/PlayerControlCard.tsx` | Recebe ficha e callbacks que retornam confirmação booleana; encaminha ID e delta inteiro de PV/SAN/PE. Campo/atalhos nomeados, bloqueio local concorrente, erro claro e conservação da entrada até sucesso. Usa componentes visuais e histórico existentes. Não altera recursos diretamente. |
| `src/components/campaign/__tests__/linked-sheet-controls.test.tsx` | Exercita componentes reais: mestre/jogador com ficha, membro sem ficha, delta destinado ao ID correto, recusa, sucesso, números inválidos, conexão e bloqueio de repetição. Mocka somente ferramentas externas ao fluxo. |
| `docs/CONTROLES_FICHAS_CAMPANHA.md` | Documenta problema, fluxo e critérios. |

Fluxo: `useCampaignData` → `CampaignShell` → `MasterTab` → `PlayerControlCard` → `useMasterActions` → `prepareResourceChange` → RPC `change_character_resource` → `characters` e `character_activity_events` na mesma transação → confirmação/refetch/Realtime → card e histórico. Payload existente conserva UUID, recurso, modo delta, quantidade e valores esperados. Permissões continuam no servidor; nenhuma migration, dependência nova ou alteração de papel do usuário.

Teste publicado: ficha privada de QA SAN máxima 15; ajustar 15→8 (sem Perturbado), 8→7 (Perturbado), 7→0 (Enlouquecendo), curar 0→1 (sai Enlouquecendo, entra Perturbado), curar 1→8 (sai Perturbado). Conferir condições desconhecidas, recibos e recarga. Repor SAN 15 ao final. Contagem por cena e consequências narrativas permanecem manuais.

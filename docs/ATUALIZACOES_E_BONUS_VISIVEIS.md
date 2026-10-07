# Correções encontradas na conferência publicada

Durante o teste de origem/expiração, uma publicação ativou o Service Worker e
recarregou a página com o assistente de ritual aberto. O débito continuou salvo,
mas o efeito ficou pendente. Também foi confirmado que `active_buffs` estava
salvo e não aparecia no desktop quando não havia arma equipada.

Agora novas versões usam `prompt`: a detecção oferece o aviso existente, sem
ativar o worker ou recarregar. O botão Atualizar continua sendo uma ação explícita
que recarrega a página; termine operações abertas antes de usá-lo. A correção
não pode modificar o código de abas que ainda executam a versão anterior.

Bônus persistidos aparecem também sem armas. Desktop, painel mobile e drawer
usam o mesmo indicador com dano, ataque, crítico, multiplicador, duração e origem.
Nenhum novo bônus é calculado, nenhum ataque é liberado e não se escolhe uma
arma automaticamente. A associação continua por ficha, conforme o fluxo atual.

| Arquivo | Papel, entradas, saídas e dependências |
| --- | --- |
| `vite.config.ts` | Configuração de compilação do vite-plugin-pwa; gera worker que aguarda atualização explícita. |
| `src/main.tsx` | Inicializa React e chama `registerAppWorker(registerSW)`; recebe implementação virtual do plugin. Conserva recuperação antiga de cache feita uma única vez no boot. |
| `src/lib/register-app-worker.ts` | Recebe função de registro, configura cache offline e emite `app-update-available`; não ativa/recarrega. Usa apenas tipo do plugin. |
| `src/hooks/usePWAUpdate.ts` | Recebe evento do registro e alterações do worker; devolve estado/ações ao aviso existente. Detecção não chama `applyUpdate`; botão Atualizar continua acionando aplicação. |
| `src/components/character/CombatWeaponsTable.tsx` | Recebe armas/bônus da ficha; ramo sem armas também usa WeaponBuffIndicator. Não grava banco. |
| `src/pages/CharacterSheet.tsx` | Repassa `active_buffs` recebido do banco ao contrato da ficha mobile, incluindo mudanças confirmadas por Realtime. |
| `src/components/character/RitualApplicationTargetSelector.tsx` | Recebe ficha, alvo explícito e callbacks; mantém o Select controlado desde o estado vazio, sem escolher um alvo automaticamente. Usa useRitualApplicationTargets para consultar fichas autorizadas. |
| `src/components/character/CharacterActivityPanel.tsx` | Recebe ID/nome da ficha; usa useCharacterActivity para filtros, páginas e visibilidade. SheetDescription associa a descrição existente ao diálogo, sem mudar eventos ou consultas. |
| `src/hooks/character/__tests__/useRitualApplication.test.tsx` | Testa idempotência e feedback: descarte de leitura antiga não gera aviso; falha real continua visível, sem repetir débito. |
| `src/components/character/MobileCharacterSheet.tsx` | Recebe bônus no tipo compartilhado WeaponBuff e os entrega a useWeaponBuffs, visão geral e combate. Não altera os dados ao fazer esse repasse. |
| `src/components/character/mobile/MobileCombatPanel.tsx` | Recebe armas/bônus/atributos/callbacks; mostra indicador no ramo desarmado e normal. Reutiliza indicador sem duplicar formatação. |
| `src/components/character/mobile/MobileCombatDrawer.tsx` | Recebe mesmos dados e callbacks; substitui resumo incompleto por indicador compartilhado. |
| `src/index.css` | Conserva três nomes de classe legados com cores sólidas do tema, sem máscara de texto; não muda dados/regras. |
| `src/lib/__tests__/register-app-worker.test.ts` | Verifica que detecção emite aviso e não chama ativação. |
| `src/components/character/__tests__/weapon-buff-visibility.test.tsx` | Exercita componentes reais sem armas: nome, dano, ataque, duração e origem aparecem nos dois tamanhos. Animação não participa da validação. |

Fluxo: registro do worker → evento de atualização → hook → aviso → clique no
botão Atualizar → ativação/recarregamento. Para bônus: banco → persistência da
ficha → `useWeaponBuffs` → componentes de combate → indicador → aviso de duração.

Testes: abrir assistente e detectar nova versão (deve continuar aberto); clicar
Atualizar só após concluir/cancelar. Sem arma equipada, conferir bônus persistido
no desktop/mobile; com arma, conferir resumo completo e que ataques continuam
usando o cálculo anterior. Encerrar cena elegível remove o bônus e salva recibos.
Sem alteração de permissões, endpoints ou tabelas nesta correção adicional.

Na conferência publicada em 390 px, o componente mobile estava pronto para
mostrar os bônus, mas CharacterSheet não enviava `active_buffs` na propriedade
`character`. O repasse foi corrigido e o contrato antigo específico de arma foi
substituído pelo tipo compartilhado WeaponBuff. A validação precisa incluir a
tela publicada completa; testes isolados do painel não verificam esse repasse.

Outra conferência mostrou aviso de atualização apesar de a ficha ter recebido
os dados recentes. useCharacterServerRead descarta respostas superadas para
evitar sobrescrita; CharacterSheet agora devolve undefined para esse descarte,
em vez de null, que permanece indicando falha atual. useRitualApplication já
distinguia esses valores. A confirmação do servidor e a proteção contra repetição
continuam iguais. Os demais consumidores que exigem dados imediatos continuam
podendo conferir a ausência de retorno antes de prosseguir.

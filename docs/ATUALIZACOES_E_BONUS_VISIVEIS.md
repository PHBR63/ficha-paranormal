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

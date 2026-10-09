# Proteção de avatares e senhas — complemento da revalidação

## Resumo

A conferência do editor após a PR #54 identificou dois avisos adicionais: ausência de checagem de senhas vazadas e permissão anônima de listagem de metadados do bucket de avatares.

`Password HIBP check` foi ativado e salvo no Lovable Cloud. O controle foi relido após recarregar e continuou habilitado. Atua em novos cadastros e alterações de senha; não troca credenciais existentes. Nenhum outro controle de autenticação foi modificado.

## Arquivos

- `supabase/migrations/20261009180000_restrict_avatar_listing.sql`: restringe a política SELECT de `storage.objects` para `authenticated`, exige identidade presente e recusa contas anônimas. Mantém o nome legado da política para compatibilidade e documenta seu novo alcance. Não altera registros ou o atributo público do bucket, nem políticas de upload/atualização/exclusão do dono.
- `supabase/tests/character_avatar_listing.sql`: usa um metadado sintético dentro de transação revertida; verifica recusa de visitante sem login, recusa de conta anônima e leitura por conta real. Confere que o bucket continua público. Não cria um arquivo físico.
- Este documento: registra a origem do ajuste, o fluxo, os impactos e o limite da validação.

## Fluxo e impacto

`CharacterEditModal.tsx` envia upload ao bucket `character-avatars` e usa `getPublicUrl` para a imagem da ficha. Essa exibição continua compatível com o bucket público. A alteração restringe a API de listagem de metadados, que passa pela política SELECT. O app atual não usa listagem anônima de avatares.

Não há mudança de payload das fichas, exclusão de imagens ou nova dependência. A alteração é reversível restaurando a política anterior. Ela reduz descoberta de arquivos por visitantes; não torna as URLs públicas privadas. Uma mudança integral de privacidade dos avatares é outra regra de produto, não assumida neste lote.

Autenticação: configuração de e-mail no Cloud → verificação de senha em novo cadastro/alteração → aceitação ou rejeição pelo serviço de autenticação. Nenhuma senha, token ou credencial entra no Git.

## Patch

```sql
ALTER POLICY "Anyone can view character avatars" ON storage.objects
  TO authenticated
  USING (
    bucket_id = 'character-avatars'
    AND auth.uid() IS NOT NULL
    AND NOT coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false)
  );
```

## Validação

O ensaio da migration junto com a suite SQL passou no banco ativo e foi revertido. A aplicação definitiva e a releitura do estado do banco são registradas no relatório final entregue após o merge.

A proteção de senha foi verificada por persistência da configuração. Não foi criada conta com senha vazada, nem modificada uma senha de jogador para fazer o teste.

O editor também mostra um indicador de problemas conhecidos em dependências. Ele não foi tratado como inventário atualizado de vulnerabilidades nem como validação de correção neste lote; exige revisão específica dos pacotes e suas versões.

## Como testar

1. Executar `supabase/tests/character_avatar_listing.sql` depois da migration; a transação deve terminar sem exceção e reverter a fixture.
2. Confirmar a política SELECT e o bucket público no catálogo do banco.
3. Confirmar que uma ficha com avatar existente continua mostrando a imagem por sua URL.
4. Reabrir Cloud → Users → Auth settings → Email e verificar `Password HIBP check` habilitado.

**Decisão do usuário:** nenhuma necessária para estes ajustes; a privacidade integral das imagens não foi alterada.

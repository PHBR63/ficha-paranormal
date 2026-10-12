-- Livro Base v1.3, Tabela 3.8 (p. 63): três explosivos têm categoria I.
-- Corrige somente a categoria 0 equivocada de itens identificados pelo catálogo.
-- Preserva melhorias, categorias personalizadas, quantidade e todos os outros dados.
UPDATE public.characters AS c
SET inventory = (
  SELECT jsonb_agg(
    CASE WHEN item->>'catalogType' = 'explosivo'
      AND item->>'catalogId' IN ('granada_fragmentacao','granada_incendiaria','mina_antipessoal')
      AND item->>'category' = '0'
    THEN jsonb_set(item, '{category}', '"I"'::jsonb)
    ELSE item END ORDER BY position
  )
  FROM jsonb_array_elements(c.inventory::jsonb) WITH ORDINALITY AS items(item, position)
)
WHERE EXISTS (
  SELECT 1 FROM jsonb_array_elements(c.inventory::jsonb) AS items(item)
  WHERE item->>'catalogType' = 'explosivo'
    AND item->>'catalogId' IN ('granada_fragmentacao','granada_incendiaria','mina_antipessoal')
    AND item->>'category' = '0'
);

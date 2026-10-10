import { build } from 'esbuild';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Gera apenas o catálogo estático; não lê credenciais nem acessa o banco.
const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), 'ordem-creation-'));
try {
  const bundled = join(temporary, 'catalog.mjs');
  await build({
    entryPoints: [join(root, 'scripts/character-creation-catalog.ts')],
    outfile: bundled,
    bundle: true,
    platform: 'node',
    format: 'esm',
    tsconfig: join(root, 'tsconfig.app.json'),
  });
  const { catalog } = await import(pathToFileURL(bundled).href);
  const template = await readFile(join(root, 'scripts/character-creation-contract.sql.in'), 'utf8');
  const migration = template.replace('__CATALOG__', JSON.stringify(catalog));
  await writeFile(join(root, 'supabase/migrations/20261010013000_character_creation_contract.sql'), migration, 'utf8');
  console.log('Catálogo de criação gerado. Nenhuma alteração aplicada no banco.');
} finally {
  // Diretório temporário criado exclusivamente por este processo.
  await rm(temporary, { recursive: true, force: true });
}

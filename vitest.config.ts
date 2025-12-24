import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Ambiente de teste - jsdom para testes de hooks React
    environment: 'jsdom',
    
    // Configurações de ambiente jsdom
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
    
    // Globals para React Testing Library
    globals: true,
    
    // Padrões de arquivos de teste
    include: ['src/**/*.{test,spec,vitest}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    
    // Excluir node_modules e dist
    exclude: ['node_modules', 'dist', '.git'],
    
    // Configurações de cobertura de código
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
    },
    
    // Timeout para testes
    testTimeout: 10000,
    
    // Reporter padrão
    reporters: ['verbose'],
  },
  
  // Resolver aliases do projeto
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

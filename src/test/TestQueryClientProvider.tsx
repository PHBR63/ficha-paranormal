import { useState, type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/** Reproduz o provedor do aplicativo em testes de hooks, com cache isolado por montagem. */
export function TestQueryClientProvider({ children }: PropsWithChildren) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  }));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

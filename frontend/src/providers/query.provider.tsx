'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getApiStatus } from '@/lib/api-error';

const NO_RETRY_STATUSES = [400, 401, 403, 404, 409, 429];
const MAX_RETRIES = 2;

interface QueryProviderProps {
  children: ReactNode;
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => {
          const status = getApiStatus(error);
          if (status && NO_RETRY_STATUSES.includes(status)) return false;
          return failureCount < MAX_RETRIES;
        },
      },
    },
  });
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(createQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

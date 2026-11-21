'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { endSession, restoreSession } from '../session/session';
import { FormError } from '@/components/common/form-error';
import { RenderIf } from '@/components/common/render-if';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { getApiErrorMessage, getApiStatus } from '@/lib/api-error';
import { useSessionStore } from '@/stores/session.store';

const SIGNED_OUT_STATUSES = [401, 404];

interface SessionGateProps {
  children: ReactNode;
}

export function SessionGate({ children }: SessionGateProps) {
  const router = useRouter();
  const status = useSessionStore((state) => state.status);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }
    if (status !== 'unknown') return;

    restoreSession().catch((reason) => {
      const code = getApiStatus(reason);
      if (code && SIGNED_OUT_STATUSES.includes(code)) endSession();
      else setError(getApiErrorMessage(reason));
    });
  }, [status, router, attempt]);

  const retry = () => {
    setError(null);
    setAttempt((value) => value + 1);
  };

  return (
    <RenderIf
      shouldRender={status === 'authenticated'}
      fallback={
        <div className="app-canvas flex min-h-dvh flex-col items-center justify-center gap-4 px-4">
          <RenderIf shouldRender={error} fallback={<Spinner className="text-tiffany-ink size-6" />}>
            <div className="flex w-full max-w-sm flex-col gap-3">
              <FormError message={error} />
              <Button variant="primary" onClick={retry}>
                Tentar de novo
              </Button>
            </div>
          </RenderIf>
        </div>
      }
    >
      {children}
    </RenderIf>
  );
}

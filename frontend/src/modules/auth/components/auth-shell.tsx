import type { ReactNode } from 'react';
import { Brand } from '@/components/layout/brand';

interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="night-glow flex min-h-dvh flex-col">
      <header className="mx-auto w-full max-w-[1240px] px-4 pt-6 sm:px-6 sm:pt-8">
        <Brand tone="dark" />
      </header>
      <main className="mx-auto grid w-full max-w-[1240px] flex-1 items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-16">
        <section className="animate-fade-up flex flex-col gap-5 text-center lg:text-left">
          <h1 className="text-[clamp(2.1rem,1.05rem+4.2vw,4.4rem)] leading-[1.08] font-semibold tracking-[-0.045em] text-white">
            Cada tarefa no <span className="text-tiffany whitespace-nowrap">seu lugar</span>.
          </h1>
          <p className="mx-auto max-w-[520px] text-[17px] leading-relaxed text-pretty text-white/72 lg:mx-0">
            Boards pessoais para separar os assuntos e acompanhar cada tarefa do início ao fim.
          </p>
        </section>
        <div className="mx-auto w-full max-w-md lg:mr-0">{children}</div>
      </main>
    </div>
  );
}

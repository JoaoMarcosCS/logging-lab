import type { ReactNode } from 'react';

interface AuthCardProps {
  eyebrow: string;
  title: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthCard({ eyebrow, title, children, footer }: AuthCardProps) {
  return (
    <div className="animate-pop bg-surface rounded-[32px] border border-white/70 p-6 shadow-[0_40px_90px_-40px_rgb(79_230_217/0.55)] sm:p-8">
      <div className="mb-6 flex flex-col gap-2">
        <p className="text-eyebrow">{eyebrow}</p>
        <h2 className="text-fg text-[28px] leading-[1.1] font-semibold tracking-[-0.035em]">
          {title}
        </h2>
      </div>
      {children}
      <p className="text-fg-3 mt-6 text-center text-sm">{footer}</p>
    </div>
  );
}

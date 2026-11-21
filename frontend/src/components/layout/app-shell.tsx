'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CircleUserRound, LayoutGrid } from 'lucide-react';
import { Brand } from './brand';
import { RenderItems } from '@/components/common/render-items';
import { cn } from '@/lib/utils';
import { LogoutButton } from '@/modules/auth/components/logout-button';
import { useSessionStore } from '@/stores/session.store';

const NAV_ITEMS = [
  { href: '/boards', label: 'Boards', Icon: LayoutGrid },
  { href: '/profile', label: 'Perfil', Icon: CircleUserRound },
];

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
}

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const user = useSessionStore((state) => state.user);

  return (
    <div className="app-canvas flex min-h-dvh flex-col">
      <header className="fixed inset-x-0 top-0 z-40 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 sm:pt-4">
        <div className="glass-clear mx-auto flex h-14 max-w-[1240px] items-center justify-between gap-3 rounded-full pr-2 pl-3">
          <Link
            href="/boards"
            aria-label="Task Flow, ir para os boards"
            className="focus-visible:outline-tiffany-ink rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <Brand />
          </Link>
          <nav aria-label="Principal" className="flex items-center gap-1">
            <RenderItems items={NAV_ITEMS} getKey={(item) => item.href}>
              {({ href, label, Icon }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'text-fg-2 hover:text-fg focus-visible:outline-tiffany-ink flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 sm:px-4',
                      active && 'bg-surface text-fg shadow-[0_1px_2px_rgb(8_30_28/0.08)]',
                    )}
                  >
                    <Icon className="size-4 sm:hidden" aria-hidden />
                    <span className="sr-only sm:not-sr-only">{label}</span>
                  </Link>
                );
              }}
            </RenderItems>
          </nav>
          <div className="flex items-center gap-1">
            <span
              aria-hidden
              title={user?.name}
              className="bg-night hidden size-10 items-center justify-center rounded-full text-xs font-semibold text-white sm:flex"
            >
              {getInitials(user?.name ?? '')}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col px-4 pt-28 pb-20 sm:px-5 sm:pt-32">
        {children}
      </main>
    </div>
  );
}

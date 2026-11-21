import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { PublicBoard } from '../interface/board.interface';
import { RenderIf } from '@/components/common/render-if';
import { formatDate } from '@/lib/format-date';

interface BoardCardProps {
  board: PublicBoard;
}

export function BoardCard({ board }: BoardCardProps) {
  return (
    <Link
      href={`/boards/${board.id}`}
      className="group border-line-soft bg-surface ease-out-soft hover:border-tiffany/60 focus-visible:outline-tiffany-ink flex min-h-48 flex-col gap-3 rounded-[28px] border p-6 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_30px_60px_-34px_rgb(20_140_128/0.6)] focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-fg line-clamp-2 text-xl leading-snug font-semibold tracking-[-0.025em] [overflow-wrap:anywhere]">
          {board.title}
        </h2>
        <span className="bg-mist text-fg-3 group-hover:bg-night flex size-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300 group-hover:text-white">
          <ArrowUpRight className="size-4" aria-hidden />
        </span>
      </div>
      <RenderIf
        shouldRender={board.description}
        fallback={<p className="text-fg-4 text-sm">Sem descrição</p>}
      >
        <p className="text-fg-3 line-clamp-3 text-sm leading-relaxed [overflow-wrap:anywhere]">
          {board.description}
        </p>
      </RenderIf>
      <p className="text-fg-3 mt-auto font-mono text-[11px] tracking-[0.06em] uppercase">
        Criado em {formatDate(board.createdAt)}
      </p>
    </Link>
  );
}

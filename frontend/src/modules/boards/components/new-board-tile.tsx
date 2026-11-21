import { Plus } from 'lucide-react';

interface NewBoardTileProps {
  onClick: () => void;
}

export function NewBoardTile({ onClick }: NewBoardTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card-tiffany group ease-out-soft focus-visible:outline-tiffany-ink flex min-h-48 cursor-pointer flex-col justify-between gap-6 rounded-[28px] p-6 text-left transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.99]"
    >
      <span className="bg-night ease-spring flex size-11 items-center justify-center rounded-full text-white transition-transform duration-300 group-hover:rotate-90">
        <Plus className="size-5" aria-hidden />
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-night text-xl font-semibold tracking-[-0.025em]">Novo board</span>
        <span className="text-tiffany-deep text-sm leading-relaxed">
          Separe um assunto e comece a listar as tarefas.
        </span>
      </span>
    </button>
  );
}

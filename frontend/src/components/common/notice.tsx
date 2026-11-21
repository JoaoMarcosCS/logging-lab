import { CircleCheck } from 'lucide-react';
import { RenderIf } from './render-if';

interface NoticeProps {
  message: string | null;
}

export function Notice({ message }: NoticeProps) {
  return (
    <RenderIf shouldRender={message}>
      <p
        role="status"
        className="bg-tiffany-soft text-tiffany-deep flex items-start gap-2 rounded-2xl px-4 py-3 text-sm"
      >
        <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        {message}
      </p>
    </RenderIf>
  );
}

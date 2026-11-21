import { CircleAlert } from 'lucide-react';
import { RenderIf } from './render-if';

interface FormErrorProps {
  message: string | null;
}

export function FormError({ message }: FormErrorProps) {
  return (
    <RenderIf shouldRender={message}>
      <p
        role="alert"
        className="bg-danger-soft text-danger flex items-start gap-2 rounded-2xl px-4 py-3 text-sm"
      >
        <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        {message}
      </p>
    </RenderIf>
  );
}

import type { ComponentProps } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const variants = {
  cta: 'cta-fill cta-shine font-semibold hover:brightness-[1.03]',
  primary: 'bg-night text-white hover:bg-night/85',
  soft: 'bg-tiffany-soft text-tiffany-deep hover:bg-tiffany-mist',
  ghost: 'text-fg hover:bg-fg/5',
  outline: 'border border-line bg-surface text-fg hover:border-line-strong',
  danger: 'bg-danger text-white hover:bg-danger/90',
};

const sizes = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-14 px-6 text-base',
  icon: 'size-10',
  'icon-sm': 'size-8',
};

const arrowSizes = {
  sm: 'pr-1 [&>[data-arrow]]:size-7',
  md: 'pr-1.5 [&>[data-arrow]]:size-8',
  lg: 'pr-1.5 [&>[data-arrow]]:size-11',
  icon: '',
  'icon-sm': '',
};

interface ButtonStyle {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  arrow?: boolean;
  className?: string;
}

export function buttonClassName({
  variant = 'primary',
  size = 'md',
  arrow = false,
  className,
}: ButtonStyle) {
  return cn(
    'group inline-flex shrink-0 cursor-pointer items-center justify-center gap-2.5 rounded-full font-medium tracking-[-0.01em] whitespace-nowrap transition-[background-color,border-color,filter,transform] duration-200 ease-out-soft select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tiffany-ink active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45',
    variants[variant],
    sizes[size],
    arrow && arrowSizes[size],
    className,
  );
}

export function ButtonArrow() {
  return (
    <span
      data-arrow
      aria-hidden
      className="bg-night ease-out-soft flex items-center justify-center rounded-full text-white transition-transform duration-200 group-hover:translate-x-0.5"
    >
      <ArrowRight className="size-4" />
    </span>
  );
}

interface ButtonProps extends ComponentProps<'button'>, ButtonStyle {}

export function Button({
  variant,
  size,
  arrow,
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={buttonClassName({ variant, size, arrow, className })} {...props}>
      {children}
      {arrow && <ButtonArrow />}
    </button>
  );
}

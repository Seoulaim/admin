const VARIANTS = {
  primary: 'bg-point text-white hover:bg-point-strong',
  outline: 'border border-line bg-white text-text hover:bg-chip',
  danger: 'border border-border bg-white text-danger hover:bg-danger/5',
}

const SIZES = {
  md: 'h-10 px-4 text-sm',
  sm: 'h-8 px-3 text-[13px]',
}

// Button look; also for links styled as buttons (<Link className={buttonClass()}>).
export function buttonClass(variant = 'outline', size = 'md') {
  return `inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg font-semibold whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTS[variant]} ${SIZES[size]}`
}

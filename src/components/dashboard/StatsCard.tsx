import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: number | string
  description?: string
  icon: LucideIcon
  trend?: { value: number; label: string }
  className?: string
  accent?: 'violet' | 'emerald' | 'amber' | 'sky'
}

const accentStyles = {
  violet: {
    icon: 'bg-primary/10 text-primary',
    border: 'border-l-primary',
  },
  emerald: {
    icon: 'bg-emerald-50 text-emerald-600',
    border: 'border-l-emerald-500',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-600',
    border: 'border-l-amber-500',
  },
  sky: {
    icon: 'bg-sky-50 text-sky-600',
    border: 'border-l-sky-500',
  },
}

export default function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  accent = 'violet',
}: StatsCardProps) {
  const styles = accentStyles[accent]

  return (
    <div
      className={cn(
        'bg-card rounded-xl border border-border border-l-4 px-5 py-4 shadow-sm hover:shadow-md transition-shadow duration-200',
        styles.border,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            {title}
          </p>
          <p className="text-3xl font-bold text-foreground tabular-nums leading-none">
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1.5">{description}</p>
          )}
          {trend && (
            <p className={cn('text-xs mt-1.5 font-medium', trend.value >= 0 ? 'text-emerald-600' : 'text-red-500')}>
              {trend.value >= 0 ? '▲' : '▼'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn('rounded-lg p-2.5 shrink-0', styles.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

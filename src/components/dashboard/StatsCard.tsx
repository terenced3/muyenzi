import { Card, CardBody } from '@heroui/react'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: number | string
  description?: string
  icon: LucideIcon
  trend?: { value: number; label: string }
  accent?: 'primary' | 'success' | 'warning' | 'secondary'
}

const accentConfig = {
  primary: {
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    borderColor: '#6366f1',
    glowColor: 'rgba(99,102,241,0.15)',
  },
  success: {
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    borderColor: '#10b981',
    glowColor: 'rgba(16,185,129,0.12)',
  },
  warning: {
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
    borderColor: '#f59e0b',
    glowColor: 'rgba(245,158,11,0.12)',
  },
  secondary: {
    iconBg: 'bg-secondary/10',
    iconColor: 'text-secondary',
    borderColor: '#7c3aed',
    glowColor: 'rgba(124,58,237,0.12)',
  },
}

export default function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  accent = 'primary',
}: StatsCardProps) {
  const cfg = accentConfig[accent]

  return (
    <Card
      shadow="md"
      radius="lg"
      className="bg-content1 border-none"
      style={{
        borderLeft: `3px solid ${cfg.borderColor}`,
        boxShadow: `0 4px 24px ${cfg.glowColor}, 0 1px 3px rgba(0,0,0,0.08)`,
      }}
    >
      <CardBody className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-default-400 mb-2">
              {title}
            </p>
            <p className="text-4xl font-bold text-foreground tabular-nums leading-none">
              {value}
            </p>
            {description && (
              <p className="text-xs text-default-400 mt-2">{description}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <span
                  className={`text-xs font-semibold ${trend.value >= 0 ? 'text-success' : 'text-danger'}`}
                >
                  {trend.value >= 0 ? '▲' : '▼'} {Math.abs(trend.value)}%
                </span>
                <span className="text-xs text-default-400">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={`rounded-xl p-3 shrink-0 ${cfg.iconBg}`}>
            <Icon className={`h-6 w-6 ${cfg.iconColor}`} />
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

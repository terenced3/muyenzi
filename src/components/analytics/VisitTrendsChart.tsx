'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format, parseISO } from 'date-fns'

interface Props {
  data: { visit_date: string; visit_count: number }[]
}

export default function VisitTrendsChart({ data }: Props) {
  const formatted = data.map(d => ({
    date: format(parseISO(d.visit_date), 'MMM d'),
    visits: Number(d.visit_count),
  }))

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={formatted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={4} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
          labelStyle={{ fontWeight: 600 }}
        />
        <Bar dataKey="visits" fill="#0f172a" radius={[4, 4, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  )
}

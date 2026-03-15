'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface Props {
  data: { hour: number; visit_count: number }[]
}

export default function HourlyChart({ data }: Props) {
  // Fill in missing hours with 0
  const full = Array.from({ length: 24 }, (_, h) => {
    const found = data.find(d => d.hour === h)
    return { hour: `${h}:00`, visits: found ? Number(found.visit_count) : 0 }
  })

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={full} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={3} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
        <Bar dataKey="visits" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  )
}

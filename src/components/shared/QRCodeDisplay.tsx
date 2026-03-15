'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface Props {
  data: string
  size?: number
}

export default function QRCodeDisplay({ data, size = 200 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, data, {
      width: size,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
  }, [data, size])

  return <canvas ref={canvasRef} className="rounded-lg" />
}

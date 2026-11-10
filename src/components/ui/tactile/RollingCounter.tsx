'use client'

import React, { useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

export interface RollingCounterProps {
  value: number
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
}

export function RollingCounter({
  value,
  prefix = '',
  suffix = '',
  className = '',
}: RollingCounterProps) {
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 })
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  useEffect(() => {
    return spring.on('change', (latest) => {
      setDisplayValue(Math.round(latest))
    })
  }, [spring])

  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  )
}

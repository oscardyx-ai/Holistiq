'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_CHECK_IN_TIME_ZONE,
  getDailyCheckInContext,
  getResolvedCheckInTimeZone,
} from '@/components/checkInData'

function getBrowserTimeZone() {
  if (typeof window === 'undefined') {
    return DEFAULT_CHECK_IN_TIME_ZONE
  }

  return getResolvedCheckInTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
}

export function useCheckInWindow() {
  const [timeZone, setTimeZone] = useState(DEFAULT_CHECK_IN_TIME_ZONE)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setTimeZone(getBrowserTimeZone())
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 60_000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  return useMemo(
    () => getDailyCheckInContext(new Date(now), timeZone),
    [now, timeZone]
  )
}

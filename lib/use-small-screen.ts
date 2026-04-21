'use client'

import { useEffect, useState } from 'react'

export function useSmallScreen(breakpoint = 640) {
  const [isSmallScreen, setIsSmallScreen] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)

    function updateScreenSize(event?: MediaQueryListEvent) {
      setIsSmallScreen(event ? event.matches : mediaQuery.matches)
    }

    updateScreenSize()
    mediaQuery.addEventListener('change', updateScreenSize)

    return () => {
      mediaQuery.removeEventListener('change', updateScreenSize)
    }
  }, [breakpoint])

  return isSmallScreen
}

'use client'

import { useEffect } from 'react'
import { setupGlobalErrorHandling } from '@/utils/error-handler'

export function GlobalErrorHandler() {
  useEffect(() => {
    setupGlobalErrorHandling()
  }, [])

  return null
}
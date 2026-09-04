'use client'

import { useEffect, useRef } from 'react'

export function useInnerSwipeBack(step: number, minStep: number, onInnerBack: () => void) {
  const prevStep = useRef(step)
  const depthRef = useRef(0)
  const onInnerBackRef = useRef(onInnerBack)
  onInnerBackRef.current = onInnerBack

  useEffect(() => {
    const prev = prevStep.current
    if (step > prev && step > minStep) {
      depthRef.current += 1
      // Keep Next.js history state so popstate does not reload the app.
      window.history.pushState(
        { ...(window.history.state ?? {}), crtInner: true },
        ''
      )
    } else if (step <= minStep && prev > minStep && depthRef.current > 0) {
      const leftover = depthRef.current
      depthRef.current = 0
      window.history.go(-leftover)
    }
    prevStep.current = step
  }, [step, minStep])

  useEffect(() => {
    const onInner = () => {
      if (depthRef.current > 0) depthRef.current -= 1
      onInnerBackRef.current()
    }
    window.addEventListener('crt-inner-back', onInner)
    return () => window.removeEventListener('crt-inner-back', onInner)
  }, [])
}

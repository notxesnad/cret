'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { freezeSwipeAnimations, isEdgeSwipeBack, unfreezeSwipeAnimations } from '@/app/lib/swipeNav'

export function useInnerSwipeBack(step: number, minStep: number, onInnerBack: () => void) {
  const prevStep = useRef(step)
  const depthRef = useRef(0)
  const onInnerBackRef = useRef(onInnerBack)
  onInnerBackRef.current = onInnerBack

  useLayoutEffect(() => {
    const prev = prevStep.current
    if (step > prev && step > minStep) {
      depthRef.current += 1
      window.history.pushState(
        { ...(window.history.state ?? {}), crtInner: true },
        ''
      )
    }
    prevStep.current = step
  }, [step, minStep])

  useEffect(() => {
    if (step <= minStep && depthRef.current > 0) {
      const leftover = depthRef.current
      depthRef.current = 0
      window.history.go(-leftover)
    }
  }, [step, minStep])

  useEffect(() => {
    const onInner = () => {
      if (isEdgeSwipeBack()) {
        freezeSwipeAnimations()
        unfreezeSwipeAnimations()
      }
      if (depthRef.current > 0) depthRef.current -= 1
      onInnerBackRef.current()
    }
    window.addEventListener('crt-inner-back', onInner)
    return () => window.removeEventListener('crt-inner-back', onInner)
  }, [])
}

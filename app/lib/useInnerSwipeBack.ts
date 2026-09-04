'use client'

import { useLayoutEffect, useRef } from 'react'
import { freezeSwipeAnimations, thawSwipeAnimations } from '@/app/lib/swipeNav'

export function useInnerSwipeBack(step: number, minStep: number, onInnerBack: () => void) {
  const prevStep = useRef(step)
  const depthRef = useRef(0)
  const ignorePopRef = useRef(0)
  const fromPopRef = useRef(false)
  const onInnerBackRef = useRef(onInnerBack)
  onInnerBackRef.current = onInnerBack

  useLayoutEffect(() => {
    const prev = prevStep.current
    if (step > prev) {
      thawSwipeAnimations()
      if (step > minStep) {
        depthRef.current += 1
        window.history.pushState(
          { ...(window.history.state ?? {}), crtInner: true },
          ''
        )
      }
    } else if (step < prev) {
      if (fromPopRef.current) {
        if (step <= minStep && depthRef.current > 0) {
          const leftover = depthRef.current
          ignorePopRef.current += leftover
          depthRef.current = 0
          window.history.go(-leftover)
        }
      } else if (depthRef.current > 0) {
        const n = step <= minStep ? depthRef.current : 1
        ignorePopRef.current += n
        depthRef.current -= n
        window.history.go(-n)
      }
    }
    fromPopRef.current = false
    prevStep.current = step
  }, [step, minStep])

  useLayoutEffect(() => {
    const onInner = () => {
      if (ignorePopRef.current > 0) {
        ignorePopRef.current -= 1
        return
      }
      freezeSwipeAnimations()
      fromPopRef.current = true
      if (depthRef.current > 0) depthRef.current -= 1
      onInnerBackRef.current()
    }
    window.addEventListener('crt-inner-back', onInner)
    return () => window.removeEventListener('crt-inner-back', onInner)
  }, [])
}

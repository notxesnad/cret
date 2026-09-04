'use client'

let startX = -1
let maxDx = 0

function onTouchStart(e: TouchEvent) {
  startX = e.touches[0]?.clientX ?? -1
  maxDx = 0
}

function onTouchMove(e: TouchEvent) {
  if (startX < 0) return
  const x = e.touches[0]?.clientX ?? startX
  maxDx = Math.max(maxDx, x - startX)
}

if (typeof window !== 'undefined') {
  window.addEventListener('touchstart', onTouchStart, { capture: true, passive: true })
  window.addEventListener('touchmove', onTouchMove, { capture: true, passive: true })
}

export function isEdgeSwipeBack() {
  return startX <= 32 && maxDx > 24
}

export function freezeSwipeAnimations() {
  if (typeof document === 'undefined') return
  document.documentElement.classList.add('crt-swipe-nav')
}

export function unfreezeSwipeAnimations() {
  if (typeof document === 'undefined') return
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('crt-swipe-nav')
    })
  })
}

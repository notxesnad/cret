'use client'

export function freezeSwipeAnimations() {
  if (typeof document === 'undefined') return
  document.documentElement.classList.add('crt-swipe-nav')
}

export function thawSwipeAnimations() {
  if (typeof document === 'undefined') return
  document.documentElement.classList.remove('crt-swipe-nav')
}

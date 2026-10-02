import { Suspense } from 'react'
import { GoLanding } from './GoLanding'

export const metadata = {
  title: 'Who are you working with?',
  description: 'A seller report or a buyer tour. Takes a minute.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  interactiveWidget: 'resizes-content',
}

export default function GoPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-[#0f172a]" />}>
      <GoLanding />
    </Suspense>
  )
}

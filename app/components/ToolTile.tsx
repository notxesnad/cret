'use client'

import { useState, type ReactNode } from 'react'

export function ToolTile({
  onClick,
  className,
  children,
}: {
  onClick: () => void
  className: string
  children: ReactNode
}) {
  const [pressed, setPressed] = useState(false)

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className={`tool-tile cursor-pointer text-left w-full ${className} transition duration-150 ${pressed ? 'scale-[0.97] brightness-90' : 'hover:scale-[1.01]'}`}
    >
      {children}
    </button>
  )
}

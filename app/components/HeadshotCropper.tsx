'use client'

import { useEffect, useRef, useState, type PointerEvent, type SyntheticEvent } from 'react'

const VIEW = 280
const OUTPUT = 512

export function HeadshotCropper({
  file,
  onCancel,
  onConfirm,
}: {
  file: File
  onCancel: () => void
  onConfirm: (blob: Blob, shape: 'square' | 'circle') => void
}) {
  const imgRef = useRef<HTMLImageElement | null>(null)
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const [src, setSrc] = useState('')
  const [shape, setShape] = useState<'square' | 'circle'>('square')
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [natural, setNatural] = useState({ w: 0, h: 0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const minScale = natural.w && natural.h ? Math.max(VIEW / natural.w, VIEW / natural.h) : 1
  const scale = minScale * zoom
  const displayW = natural.w * scale
  const displayH = natural.h * scale

  const clampOffset = (x: number, y: number, nextZoom = zoom) => {
    const nextScale = minScale * nextZoom
    const w = natural.w * nextScale
    const h = natural.h * nextScale
    return {
      x: Math.min(0, Math.max(VIEW - w, x)),
      y: Math.min(0, Math.max(VIEW - h, y)),
    }
  }

  const onImageLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const w = img.naturalWidth
    const h = img.naturalHeight
    setNatural({ w, h })
    const cover = Math.max(VIEW / w, VIEW / h)
    setOffset({
      x: (VIEW - w * cover) / 2,
      y: (VIEW - h * cover) / 2,
    })
    setZoom(1)
  }

  const onPointerDown = (e: PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.x
    const dy = e.clientY - dragRef.current.y
    setOffset(clampOffset(dragRef.current.ox + dx, dragRef.current.oy + dy))
  }

  const onPointerUp = () => {
    dragRef.current = null
  }

  const onZoom = (value: number) => {
    const next = value
    setZoom(next)
    setOffset(prev => clampOffset(prev.x, prev.y, next))
  }

  const confirm = async () => {
    const img = imgRef.current
    if (!img || !natural.w) return
    setSaving(true)
    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT
    canvas.height = OUTPUT
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const sourceSize = VIEW / scale
    const sx = -offset.x / scale
    const sy = -offset.y / scale
    ctx.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, OUTPUT, OUTPUT)
    canvas.toBlob((blob) => {
      if (blob) onConfirm(blob, shape)
      else setSaving(false)
    }, 'image/jpeg', 0.92)
  }

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-sm shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-800">
          <h3 className="text-white font-black">Crop your headshot</h3>
          <p className="text-base text-slate-400 mt-1">Drag to position. Pinch-free zoom with the slider.</p>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setShape('square')}
              className={`py-3 font-black text-sm transition ${shape === 'square' ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-400'}`}
            >
              Square
            </button>
            <button
              type="button"
              onClick={() => setShape('circle')}
              className={`py-3 font-black text-sm transition ${shape === 'circle' ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-400'}`}
            >
              Circle
            </button>
          </div>

          <div
            className="relative mx-auto bg-slate-950 overflow-hidden touch-none cursor-grab active:cursor-grabbing"
            style={{ width: VIEW, height: VIEW, borderRadius: shape === 'circle' ? '9999px' : 0 }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {src && (
              <img
                ref={imgRef}
                src={src}
                alt="Crop preview"
                draggable={false}
                onLoad={onImageLoad}
                className="absolute max-w-none select-none pointer-events-none"
                style={{
                  width: displayW || 'auto',
                  height: displayH || 'auto',
                  transform: `translate(${offset.x}px, ${offset.y}px)`,
                }}
              />
            )}
            <div className={`absolute inset-0 pointer-events-none ring-2 ring-white/40 ${shape === 'circle' ? 'rounded-full' : ''}`} />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={e => onZoom(parseFloat(e.target.value))}
              className="w-full mt-2"
            />
          </div>
        </div>

        <div className="p-5 border-t border-slate-800 flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 bg-slate-800 text-white font-bold py-3">
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={saving || !natural.w}
            className="flex-[2] bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-black py-3 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Use Photo'}
          </button>
        </div>
      </div>
    </div>
  )
}

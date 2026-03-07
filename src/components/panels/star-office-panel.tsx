'use client'

import { useState, useEffect, useRef } from 'react'

export function StarOfficePanel() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/star-office/index.html', { method: 'HEAD' })
      .then(res => {
        if (!res.ok) setError('Star Office assets not found. Run the setup script.')
        setLoading(false)
      })
      .catch(() => {
        setError('Star Office assets not found.')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading Pixel Office...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-card border border-border rounded-xl p-8 max-w-md text-center">
          <div className="text-4xl mb-4">&#x1F3E2;</div>
          <h3 className="text-lg font-semibold mb-2">Pixel Office Not Available</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50">
        <div className="flex items-center gap-2">
          <PixelOfficeIcon />
          <h2 className="text-sm font-semibold">Pixel Office</h2>
          <span className="text-xs text-muted-foreground">Star Office UI</span>
        </div>
      </div>
      <iframe
        ref={iframeRef}
        src="/star-office/index.html"
        className="flex-1 w-full border-0"
        title="Star Office - Pixel Office Visualization"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  )
}

function PixelOfficeIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="12" height="10" rx="1" />
      <path d="M5 4V2h6v2" />
      <path d="M2 8h12" />
      <rect x="6" y="6" width="4" height="4" rx="0.5" />
    </svg>
  )
}

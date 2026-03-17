import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getPrinterByName } from '../services/printers'
import ThemeToggle from '../components/ThemeToggle'

const PrinterView = () => {
  const { name } = useParams()
  const navigate = useNavigate()
  const [printer, setPrinter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPrinter = async () => {
      try {
        setLoading(true)
        const data = await getPrinterByName(name)
        setPrinter(data.printer)
      } catch (err) {
        console.error('Failed to fetch printer details:', err)
        setError('Failed to load printer details')
      } finally {
        setLoading(false)
      }
    }

    fetchPrinter()
  }, [name])

  const getDirectUrl = () => {
    if (!printer) return ''
    const base = printer.hostUrl.endsWith('/') ? printer.hostUrl.slice(0, -1) : printer.hostUrl
    const path = printer.path.startsWith('/') ? printer.path : `/${printer.path}`
    return `${base}:${printer.port}${path}`
  }

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background relative">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-orange-500/15" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-primary/30 rounded-full" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Connecting to printer...</p>
        </div>
      </div>
    )
  }

  if (error || !printer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 relative">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-destructive/15 to-red-500/10 flex items-center justify-center mb-8 ring-1 ring-destructive/20">
          <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold mb-3">Connection failed</h2>
        <p className="text-muted-foreground mb-10 text-center max-w-sm">
          {error || 'Could not establish connection to this printer.'}
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn btn-primary gap-2 h-11 px-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="shrink-0 border-b border-border/50 glass">
        <div className="flex items-center justify-between px-4 sm:px-6 h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-ghost p-2.5 rounded-xl"
              title="Back to dashboard"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 via-orange-500/10 to-pink-500/15 flex items-center justify-center ring-1 ring-border/50">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-semibold">{printer.name}</h1>
                <p className="text-xs text-muted-foreground font-mono">{printer.hostUrl}:{printer.port}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="badge badge-success">
              <span className="status-dot online" />
              Connected
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* iframe */}
      <main className="flex-1 relative overflow-hidden bg-black">
        <iframe
          src={getDirectUrl()}
          className="absolute inset-0 w-full h-full"
          title={printer.name}
          allow="fullscreen"
        />
      </main>
    </div>
  )
}

export default PrinterView

import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPrinters, deletePrinter } from '../services/printers'
import PrinterForm from '../components/PrinterForm'
import ThemeToggle from '../components/ThemeToggle'
import TempChart from '../components/TempChart'
import useMoonraker from '../hooks/useMoonraker'

const PrinterIcon = ({ hostUrl, name }) => {
  const [error, setError] = useState(false)

  const getFaviconUrls = (url) => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
      const domain = urlObj.hostname
      return [
        `${urlObj.protocol}//${domain}/favicon.ico`,
        `https://icons.duckduckgo.com/ip3/${domain}.ico`,
        `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      ]
    } catch {
      return []
    }
  }

  const faviconUrls = hostUrl ? getFaviconUrls(hostUrl) : []

  if (!faviconUrls.length || error) {
    return (
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/15 via-orange-500/10 to-pink-500/15 flex items-center justify-center ring-1 ring-border/50 flex-shrink-0">
        <svg className="w-4.5 h-4.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="w-9 h-9 rounded-lg bg-card ring-1 ring-border/50 flex items-center justify-center flex-shrink-0 overflow-hidden p-1.5">
      <img
        src={faviconUrls[0]}
        alt={name}
        className="w-full h-full object-contain"
        onError={(e) => {
          const currentSrc = e.target.src
          const currentIndex = faviconUrls.findIndex(u => currentSrc.includes(u))
          if (currentIndex < faviconUrls.length - 1) {
            e.target.src = faviconUrls[currentIndex + 1]
          } else {
            setError(true)
          }
        }}
      />
    </div>
  )
}

// Hook to check printer status
const usePrinterStatus = (printer) => {
  const [status, setStatus] = useState('checking')

  const checkStatus = useCallback(async () => {
    if (!printer) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/printers/${printer.id}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStatus(data.online ? 'online' : 'offline')
      } else {
        setStatus('offline')
      }
    } catch (err) {
      console.error('Status check error:', err)
      setStatus('offline')
    }
  }, [printer])

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [checkStatus])

  return status
}

const StatusIndicator = ({ status, moonrakerConnected }) => {
  // If Moonraker is connected, printer is definitely online
  if (moonrakerConnected) {
    return (
      <div className="badge badge-success">
        <span className="status-dot online" />
        Online
      </div>
    )
  }

  const statusConfig = {
    online: { text: 'Online', className: 'badge-success', dotClass: 'online' },
    offline: { text: 'Offline', className: 'badge-danger', dotClass: 'offline' },
    checking: { text: 'Checking...', className: 'badge-warning', dotClass: 'checking' }
  }

  const config = statusConfig[status] || statusConfig.checking

  return (
    <div className={`badge ${config.className}`}>
      <span className={`status-dot ${config.dotClass}`} />
      {config.text}
    </div>
  )
}

// Temperature display component
const TempDisplay = ({ temps }) => {
  if (!temps) return null

  const formatTemp = (temp) => {
    if (temp === null || temp === undefined) return '--'
    return Math.round(temp)
  }

  const getTarget = (obj) => {
    if (!obj) return null
    return obj.target
  }

  return (
    <div className="flex gap-3 text-xs">
      {temps.extruder && (
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">E:</span>
          <span className="font-medium">{formatTemp(temps.extruder.temperature)}°C</span>
          {getTarget(temps.extruder) && (
            <span className="text-muted-foreground/70">/ {formatTemp(temps.extruder.target)}°C</span>
          )}
        </div>
      )}
      {temps.bed && (
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">B:</span>
          <span className="font-medium">{formatTemp(temps.bed.temperature)}°C</span>
          {getTarget(temps.bed) && (
            <span className="text-muted-foreground/70">/ {formatTemp(temps.bed.target)}°C</span>
          )}
        </div>
      )}
    </div>
  )
}

// Progress bar component
const ProgressBar = ({ progress, filename, state }) => {
  if (!filename) return null

  const percent = progress !== null ? Math.round(progress * 100) : null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="truncate flex-1 mr-2" title={filename}>
          {filename}
        </span>
        {percent !== null && (
          <span className="font-medium text-primary">{percent}%</span>
        )}
      </div>
      {percent !== null && (
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-orange-500 rounded-full transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
      {state && (
        <div className="text-xs text-muted-foreground capitalize">
          {state === 'printing' && 'Printing...'}
          {state === 'paused' && 'Paused'}
          {state === 'standby' && 'Ready'}
          {state === 'complete' && 'Complete'}
        </div>
      )}
    </div>
  )
}

const Dashboard = () => {
  const [printers, setPrinters] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadPrinters()
  }, [])

  const loadPrinters = async () => {
    try {
      setLoading(true)
      const data = await getPrinters()
      setPrinters(data.printers || [])
    } catch (error) {
      console.error('Failed to load printers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this printer?')) {
      return
    }

    try {
      await deletePrinter(id)
      setPrinters(printers.filter(p => p.id !== id))
    } catch (error) {
      console.error('Failed to delete printer:', error)
      alert('Failed to remove printer')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-orange-500/15" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-primary/30 rounded-full" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Loading printers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-purple-500/4 to-transparent rounded-full blur-3xl pointer-events-none" />

      <header className="sticky top-0 z-50 w-full border-b border-border/50 glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-orange-500 to-pink-500 flex items-center justify-center shadow-lg shadow-primary/25">
              <span className="text-sm font-bold text-white">KG</span>
            </div>
            <h1 className="font-semibold">Klipper Gateway</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-full bg-secondary/50 border border-border/50">
              <span className="text-sm text-muted-foreground">{user?.username || 'Guest'}</span>
            </div>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="btn-ghost p-2.5 rounded-xl text-destructive"
              title="Sign out"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight mb-2">
              My Printers
            </h2>
            <p className="text-muted-foreground">
              {printers.length === 0
                ? 'Add your first printer to get started'
                : `${printers.length} printer${printers.length === 1 ? '' : 's'} connected`}
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`btn gap-2 h-11 px-5 ${showAddForm ? 'btn-secondary' : 'btn-primary'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            {showAddForm ? 'Cancel' : 'Add printer'}
          </button>
        </div>

        {showAddForm && (
          <div className="mb-8 animate-scale-in">
            <div className="card p-8 glass">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-orange-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Add new printer</h3>
                  <p className="text-sm text-muted-foreground">Connect a Klipper instance to your gateway</p>
                </div>
              </div>
              <PrinterForm onSuccess={() => {
                loadPrinters()
                setShowAddForm(false)
              }} />
            </div>
          </div>
        )}

        {printers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-muted via-muted/80 to-muted/60 flex items-center justify-center mb-8 ring-1 ring-border/50">
              <svg className="w-10 h-10 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">No printers yet</h3>
            <p className="text-muted-foreground mb-8 max-w-sm">
              Get started by adding your first Klipper printer to the gateway.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary gap-2 h-11 px-6"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add your first printer
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {printers.map((printer, index) => (
              <PrinterCard
                key={printer.id}
                printer={printer}
                onDelete={handleDelete}
                index={index}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

const PrinterCard = ({ printer, onDelete, index }) => {
  const serverStatus = usePrinterStatus(printer)
  const moonraker = useMoonraker(printer)

  return (
    <div
      className="card hover:scale-[1.01] transition-all duration-200 animate-fade-in shimmer"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <PrinterIcon hostUrl={printer.hostUrl} name={printer.name} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base truncate">{printer.name}</h3>
              {moonraker.connected && (
                <div className="w-2 h-2 rounded-full bg-emerald-500" title="Moonraker connected" />
              )}
              {!moonraker.connected && serverStatus === 'online' && (
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Connecting to Moonraker..." />
              )}
            </div>
            <div className="mt-2">
              <StatusIndicator status={serverStatus} moonrakerConnected={moonraker.connected} />
            </div>
          </div>
        </div>

        {/* Status Info Section - Always visible */}
        <div className="mb-4 p-3 rounded-xl bg-muted/30">
          {moonraker.connected ? (
            <>
              {/* Print Progress */}
              {moonraker.currentFile || moonraker.isPrinting || moonraker.isPaused ? (
                <ProgressBar
                  progress={moonraker.progressPercent ? moonraker.progressPercent / 100 : null}
                  filename={moonraker.currentFile}
                  state={moonraker.printStats?.state}
                />
              ) : (
                <div className="text-sm text-muted-foreground">
                  {moonraker.printStats?.state === 'standby' ? 'Ready to print' : 'Idle'}
                </div>
              )}

              {/* Temperatures */}
              <div className="mt-3 pt-3 border-t border-border/50">
                {moonraker.temps && (moonraker.temps.extruder || moonraker.temps.bed) ? (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Extruder Temperature */}
                    {moonraker.temps.extruder && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <svg className="w-3 h-3 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                            </svg>
                            E
                          </span>
                          <span className="font-medium tabular-nums">
                            {Math.round(moonraker.temps.extruder.temperature)}°
                          </span>
                        </div>
                        {moonraker.tempHistory?.extruder?.length > 2 && (
                          <div className="rounded-lg overflow-hidden bg-background/50 h-12">
                            <TempChart data={moonraker.tempHistory.extruder} width={130} height={48} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bed Temperature */}
                    {moonraker.temps.bed && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                            </svg>
                            B
                          </span>
                          <span className="font-medium tabular-nums">
                            {Math.round(moonraker.temps.bed.temperature)}°
                          </span>
                        </div>
                        {moonraker.tempHistory?.bed?.length > 2 && (
                          <div className="rounded-lg overflow-hidden bg-background/50 h-12">
                            <TempChart data={moonraker.tempHistory.bed} width={130} height={48} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Waiting for temperature data...
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Connecting to printer...
            </div>
          )}
        </div>

        <div className="space-y-3 mb-5 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground/80 p-2 rounded-lg bg-muted/30">
            <svg className="w-4 h-4 flex-shrink-0 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <span className="font-mono text-xs">{printer.hostUrl}:{printer.port}</span>
          </div>
          {printer.description && (
            <p className="text-muted-foreground/70 line-clamp-2 text-sm leading-relaxed">
              {printer.description}
            </p>
          )}
        </div>

        <div className="flex gap-2 pt-3 border-t border-border/50">
          <Link
            to={`/node/${encodeURIComponent(printer.name)}`}
            className="btn btn-primary flex-1 h-9 text-sm"
          >
            Open
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <button
            onClick={() => onDelete(printer.id)}
            className="btn btn-ghost text-destructive hover:bg-destructive/10 w-9 h-9 p-0"
            title="Remove printer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

import { useState, useEffect, useCallback, useRef } from 'react'

const MAX_HISTORY = 60 // Keep 60 data points (2 minutes at 2s intervals)

const useMoonraker = (printer) => {
  const [connected, setConnected] = useState(false)
  const [printStats, setPrintStats] = useState(null)
  const [temps, setTemps] = useState(null)
  const [tempHistory, setTempHistory] = useState({ bed: [], extruder: [] })
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)
  const printerRef = useRef(printer)

  // Update ref when printer changes
  useEffect(() => {
    printerRef.current = printer
  }, [printer])

  const fetchStatus = useCallback(async () => {
    if (!printer) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/printers/name/${encodeURIComponent(printer.name)}/moonraker`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.result?.status) {
        const status = data.result.status

        // Extract print stats
        if (status.print_stats) {
          setPrintStats(status.print_stats)
        }

        // Extract temperatures and update history
        const newTemps = {}
        if (status.heater_bed) {
          newTemps.bed = status.heater_bed
        }
        if (status.extruder) {
          newTemps.extruder = status.extruder
        }
        if (status.temperature_fan) {
          newTemps.fan = status.temperature_fan
        }
        if (Object.keys(newTemps).length > 0) {
          setTemps(newTemps)

          // Update temperature history
          setTempHistory(prev => {
            const newHistory = { ...prev }

            if (newTemps.bed) {
              const bedPoint = {
                actual: newTemps.bed.temperature,
                target: newTemps.bed.target,
                time: Date.now()
              }
              newHistory.bed = [...prev.bed, bedPoint].slice(-MAX_HISTORY)
            }

            if (newTemps.extruder) {
              const extPoint = {
                actual: newTemps.extruder.temperature,
                target: newTemps.extruder.target,
                time: Date.now()
              }
              newHistory.extruder = [...prev.extruder, extPoint].slice(-MAX_HISTORY)
            }

            return newHistory
          })
        }

        setConnected(true)
        setError(null)
      }
    } catch (err) {
      console.error(`[Moonraker HTTP] Error for ${printer.name}:`, err)
      setConnected(false)
      setError(err.message)
    }
  }, [printer])

  // Poll for status updates
  useEffect(() => {
    if (printer) {
      // Fetch immediately on mount
      fetchStatus()

      // Then poll every 2 seconds
      intervalRef.current = setInterval(fetchStatus, 2000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [printer, fetchStatus])

  // Reset history when printer changes
  useEffect(() => {
    setTempHistory({ bed: [], extruder: [] })
  }, [printer?.id])

  return {
    connected,
    printStats,
    temps,
    tempHistory,
    error,
    isPrinting: printStats?.state === 'printing',
    isPaused: printStats?.state === 'paused',
    progress: printStats?.print_duration || null,
    progressPercent: printStats?.total_progress !== undefined ? Math.round(printStats.total_progress * 100) : null,
    currentFile: printStats?.filename || null,
    eta: printStats?.eta || null,
  }
}

export default useMoonraker

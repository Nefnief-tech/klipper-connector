import { useRef, useEffect, memo } from 'react'

const TempChart = ({ data, width = 300, height = 100 }) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data || data.length === 0) return

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    // Set canvas size with DPR for sharpness
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Find min/max for scaling
    const allTemps = data.flatMap(d => [
      d.actual !== undefined ? d.actual : d.temperature,
      d.target !== undefined ? d.target : null
    ].filter(t => t !== null))

    const minTemp = Math.floor(Math.min(...allTemps) - 5)
    const maxTemp = Math.ceil(Math.max(...allTemps) + 5)
    const range = maxTemp - minTemp || 1

    // Padding
    const padding = { top: 8, bottom: 20, left: 0, right: 0 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    // Helper to get Y position
    const getY = (temp) => {
      const normalized = (temp - minTemp) / range
      return padding.top + chartHeight - (normalized * chartHeight)
    }

    // Helper to get X position
    const getX = (index) => {
      return padding.left + (index / (data.length - 1 || 1)) * chartWidth
    }

    // Draw target line (background)
    const targetData = data.map(d => d.target !== undefined ? d.target : null)
    if (targetData.some(t => t !== null)) {
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.2)'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 4])

      let started = false
      targetData.forEach((temp, i) => {
        if (temp !== null) {
          const x = getX(i)
          const y = getY(temp)
          if (!started) {
            ctx.moveTo(x, y)
            started = true
          } else {
            ctx.lineTo(x, y)
          }
        }
      })
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Draw actual temperature line with gradient fill
    const actualData = data.map(d => d.actual !== undefined ? d.actual : d.temperature)

    // Create gradient
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom)
    gradient.addColorStop(0, 'rgba(249, 115, 22, 0.3)')
    gradient.addColorStop(1, 'rgba(249, 115, 22, 0)')

    // Fill area under curve
    ctx.beginPath()
    ctx.moveTo(getX(0), getY(actualData[0]))
    actualData.forEach((temp, i) => {
      ctx.lineTo(getX(i), getY(temp))
    })
    ctx.lineTo(getX(actualData.length - 1), height - padding.bottom)
    ctx.lineTo(getX(0), height - padding.bottom)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    // Draw line
    ctx.beginPath()
    ctx.strokeStyle = '#f97316'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    actualData.forEach((temp, i) => {
      const x = getX(i)
      const y = getY(temp)
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Draw current value dot
    const lastIndex = actualData.length - 1
    const lastX = getX(lastIndex)
    const lastY = getY(actualData[lastIndex])

    ctx.beginPath()
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#f97316'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(lastX, lastY, 2, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()

    // Draw min/max labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.font = '10px ui-monospace, monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`${maxTemp}°`, 4, padding.top + 10)
    ctx.textAlign = 'left'
    ctx.fillText(`${minTemp}°`, 4, height - 6)

  }, [data, width, height])

  if (!data || data.length === 0) {
    return (
      <div className="text-xs text-muted-foreground flex items-center justify-center h-[100px]">
        No data yet
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ height: `${height}px` }}
    />
  )
}

export default memo(TempChart)

import express from 'express'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import { printerSchema, updatePrinterSchema } from '../utils/validation.js'

const router = express.Router()

router.use(authenticate)

// Check printer status
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params

    const printer = await prisma.printer.findFirst({
      where: {
        id,
        userId: req.userId
      }
    })

    if (!printer) {
      return res.status(404).json({ error: 'Printer not found' })
    }

    // Check if printer is reachable
    const printerUrl = `${printer.hostUrl}:${printer.port}${printer.path || '/'}`

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(printerUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      })

      clearTimeout(timeoutId)

      // Check if it's a Klipper/Moonraker response
      const isOnline = response.ok || response.status === 401 || response.status === 403

      res.json({
        online: isOnline,
        status: response.status,
        printerUrl
      })
    } catch (fetchError) {
      // If fetch fails (network error, timeout, etc), printer is offline
      res.json({
        online: false,
        error: fetchError.message,
        printerUrl
      })
    }
  } catch (error) {
    console.error('Check printer status error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get Moonraker status (print stats, temps, etc) from printer
router.get('/name/:name/moonraker', async (req, res) => {
  try {
    const { name } = req.params

    const printer = await prisma.printer.findFirst({
      where: {
        name,
        userId: req.userId
      }
    })

    if (!printer) {
      return res.status(404).json({ error: 'Printer not found' })
    }

    // Fetch from printer's Moonraker API
    // Handle hostUrl that may or may not include protocol
    let cleanHostUrl = printer.hostUrl
    if (cleanHostUrl.startsWith('http://')) {
      cleanHostUrl = cleanHostUrl.substring(7) // Remove http://
    } else if (cleanHostUrl.startsWith('https://')) {
      cleanHostUrl = cleanHostUrl.substring(8) // Remove https://
    }
    // Query Moonraker for all the objects we need
    const objects = 'webhooks&print_stats&heater_bed&extruder&virtual_sdcard&temperature_fan&gcode_move&idle_timeout&pause_resume'
    const moonrakerUrl = `http://${cleanHostUrl}:${printer.port}/printer/objects/query?${objects}`
    console.log('[Moonraker] Fetching from:', moonrakerUrl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(moonrakerUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Moonraker API error' })
      }

      const data = await response.json()
      res.json(data)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      res.status(503).json({ error: 'Printer offline', message: fetchError.message })
    }
  } catch (error) {
    console.error('Get Moonraker status error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/', async (req, res) => {
  try {
    const printers = await prisma.printer.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ printers })
  } catch (error) {
    console.error('Get printers error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/name/:name', async (req, res) => {
  try {
    const { name } = req.params

    const printer = await prisma.printer.findFirst({
      where: {
        name,
        userId: req.userId
      }
    })

    if (!printer) {
      return res.status(404).json({ error: 'Printer not found' })
    }

    res.json({ printer })
  } catch (error) {
    console.error('Get printer by name error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const printer = await prisma.printer.findFirst({
      where: {
        id,
        userId: req.userId
      }
    })

    if (!printer) {
      return res.status(404).json({ error: 'Printer not found' })
    }

    res.json({ printer })
  } catch (error) {
    console.error('Get printer error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { error, value } = printerSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }

    const printer = await prisma.printer.create({
      data: {
        ...value,
        userId: req.userId
      }
    })

    res.status(201).json({ printer })
  } catch (error) {
    console.error('Create printer error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { error, value } = updatePrinterSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }

    const existingPrinter = await prisma.printer.findFirst({
      where: {
        id,
        userId: req.userId
      }
    })

    if (!existingPrinter) {
      return res.status(404).json({ error: 'Printer not found' })
    }

    const printer = await prisma.printer.update({
      where: { id },
      data: value
    })

    res.json({ printer })
  } catch (error) {
    console.error('Update printer error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const existingPrinter = await prisma.printer.findFirst({
      where: {
        id,
        userId: req.userId
      }
    })

    if (!existingPrinter) {
      return res.status(404).json({ error: 'Printer not found' })
    }

    await prisma.printer.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Delete printer error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

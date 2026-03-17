import express from 'express'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import { printerSchema, updatePrinterSchema } from '../utils/validation.js'

const router = express.Router()

router.use(authenticate)

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

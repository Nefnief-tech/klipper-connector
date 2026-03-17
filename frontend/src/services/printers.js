import api from './api'

export const getPrinters = async () => {
  const response = await api.get('/printers')
  return response.data
}

export const getPrinter = async (id) => {
  const response = await api.get(`/printers/${id}`)
  return response.data
}

export const createPrinter = async (printerData) => {
  const response = await api.post('/printers', printerData)
  return response.data
}

export const updatePrinter = async (id, printerData) => {
  const response = await api.put(`/printers/${id}`, printerData)
  return response.data
}

export const deletePrinter = async (id) => {
  const response = await api.delete(`/printers/${id}`)
  return response.data
}

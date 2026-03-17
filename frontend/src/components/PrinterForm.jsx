import { useState } from 'react'
import { createPrinter } from '../services/printers'

const PrinterForm = ({ onSuccess }) => {
  const [name, setName] = useState('')
  const [hostUrl, setHostUrl] = useState('')
  const [port, setPort] = useState('')
  const [path, setPath] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const printerData = {
        name,
        hostUrl,
        port: parseInt(port, 10),
        path: path || null,
        description: description || null
      }

      await createPrinter(printerData)
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create printer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-gray-700 font-medium mb-2" htmlFor="name">
          Name *
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2" htmlFor="hostUrl">
          Host URL *
        </label>
        <input
          id="hostUrl"
          type="text"
          value={hostUrl}
          onChange={(e) => setHostUrl(e.target.value)}
          placeholder="e.g., 192.168.1.100"
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2" htmlFor="port">
          Port *
        </label>
        <input
          id="port"
          type="number"
          value={port}
          onChange={(e) => setPort(e.target.value)}
          placeholder="e.g., 80"
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2" htmlFor="path">
          Path (optional)
        </label>
        <input
          id="path"
          type="text"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="e.g., /printer"
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2" htmlFor="description">
          Description (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Add Printer'}
      </button>
    </form>
  )
}

export default PrinterForm

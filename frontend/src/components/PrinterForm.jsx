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
      let formattedHostUrl = hostUrl.trim()
      if (!/^https?:\/\//i.test(formattedHostUrl)) {
        formattedHostUrl = 'http://' + formattedHostUrl
      }

      let formattedPath = path.trim()
      if (!formattedPath) {
        formattedPath = '/'
      } else if (!formattedPath.startsWith('/')) {
        formattedPath = '/' + formattedPath
      }

      const printerData = {
        name: name.trim(),
        hostUrl: formattedHostUrl,
        port: parseInt(port, 10) || 80,
        path: formattedPath,
        description: description.trim() || null
      }

      await createPrinter(printerData)
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to create printer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3 animate-slide-up">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-2.5 sm:col-span-2">
          <label htmlFor="name" className="text-sm font-medium">
            Printer name <span className="text-destructive">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="e.g. Main Printer"
            required
          />
        </div>

        <div className="space-y-2.5">
          <label htmlFor="hostUrl" className="text-sm font-medium">
            Host URL <span className="text-destructive">*</span>
          </label>
          <input
            id="hostUrl"
            type="text"
            value={hostUrl}
            onChange={(e) => setHostUrl(e.target.value)}
            className="input"
            placeholder="192.168.1.100"
            required
          />
        </div>

        <div className="space-y-2.5">
          <label htmlFor="port" className="text-sm font-medium">
            Port <span className="text-destructive">*</span>
          </label>
          <input
            id="port"
            type="number"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            className="input"
            placeholder="7125"
            required
          />
        </div>

        <div className="space-y-2.5">
          <label htmlFor="path" className="text-sm font-medium">
            Path
          </label>
          <input
            id="path"
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            className="input"
            placeholder="/"
          />
        </div>

        <div className="space-y-2.5 sm:col-span-2">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Optional notes about this printer..."
            className="textarea"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary flex-1 h-11 relative overflow-hidden"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Adding printer...
            </span>
          ) : (
            <>
              <span>Add printer</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  )
}

export default PrinterForm

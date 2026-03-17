import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPrinters, deletePrinter } from '../services/printers'
import PrinterForm from '../components/PrinterForm'

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
      setPrinters(data)
    } catch (error) {
      console.error('Failed to load printers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this printer?')) {
      return
    }

    try {
      await deletePrinter(id)
      setPrinters(printers.filter(p => p.id !== id))
    } catch (error) {
      console.error('Failed to delete printer:', error)
      alert('Failed to delete printer')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="text-xl font-bold text-gray-800">
                KL Gateway
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {user?.username}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Your Printers</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
          >
            {showAddForm ? 'Cancel' : 'Add Printer'}
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <PrinterForm onSuccess={() => {
              loadPrinters()
              setShowAddForm(false)
            }} />
          </div>
        )}

        {printers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg">No printers configured yet</p>
            <p className="text-gray-500 mt-2">Click "Add Printer" to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {printers.map((printer) => (
              <div key={printer.id} className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">{printer.name}</h2>
                <p className="text-gray-600 text-sm mb-1">
                  <span className="font-medium">Host:</span> {printer.hostUrl}
                </p>
                <p className="text-gray-600 text-sm mb-1">
                  <span className="font-medium">Port:</span> {printer.port}
                </p>
                {printer.path && (
                  <p className="text-gray-600 text-sm mb-2">
                    <span className="font-medium">Path:</span> {printer.path}
                  </p>
                )}
                {printer.description && (
                  <p className="text-gray-500 text-sm mb-4">{printer.description}</p>
                )}
                <div className="flex space-x-2">
                  <Link
                    to={`/printer/${encodeURIComponent(printer.name)}`}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded text-center"
                  >
                    Open
                  </Link>
                  <button
                    onClick={() => handleDelete(printer.id)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Dashboard

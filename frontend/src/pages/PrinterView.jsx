import { useParams, useNavigate } from 'react-router-dom'

const PrinterView = () => {
  const { name } = useParams()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-800 font-medium"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Dashboard
            </button>
            <h1 className="flex-1 text-center text-xl font-bold text-gray-800">
              {decodeURIComponent(name)}
            </h1>
          </div>
        </div>
      </nav>

      <main className="h-[calc(100vh-4rem)]">
        <iframe
          src={`/printer/${encodeURIComponent(name)}`}
          className="w-full h-full border-0"
          title={decodeURIComponent(name)}
        />
      </main>
    </div>
  )
}

export default PrinterView

// frontend/src/pages/public/NotFoundPage.tsx
import React from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Home } from 'lucide-react'
import { Button } from '../../components/common/Button'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-black text-white">404 — Page Not Found</h1>
      <p className="text-slate-400 text-sm max-w-md">
        The page or resource you requested could not be located on EVENTHUB.
      </p>
      <div className="pt-2 flex gap-3">
        <Link to="/">
          <Button variant="primary" size="md">
            <Home className="w-4 h-4 mr-2" />
            Return Home
          </Button>
        </Link>
        <Link to="/events">
          <Button variant="secondary" size="md">
            Browse Events
          </Button>
        </Link>
      </div>
    </div>
  )
}

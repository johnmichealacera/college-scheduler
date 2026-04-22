import { type ReactNode, useState } from 'react'
import { Menu, Calendar } from 'lucide-react'
import { Sidebar } from './Sidebar'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 md:ml-56 min-w-0">
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-blue-500" />
            <span className="font-semibold text-sm text-gray-900">ClassSync</span>
          </div>
        </div>
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

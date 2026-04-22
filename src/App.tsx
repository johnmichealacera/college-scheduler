import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { TeacherList } from './components/teachers/TeacherList'
import { SubjectList } from './components/subjects/SubjectList'
import { RoomList } from './components/rooms/RoomList'
import { SchedulePage } from './components/schedule/SchedulePage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/teachers" element={<TeacherList />} />
            <Route path="/subjects" element={<SubjectList />} />
            <Route path="/rooms" element={<RoomList />} />
            <Route path="/schedule" element={<SchedulePage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

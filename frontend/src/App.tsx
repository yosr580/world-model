import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Encyclopedia } from './pages/Encyclopedia'
import { Home } from './pages/Home'
import { Navbar } from './components/Navbar'
import { TestLab } from './pages/TestLab'
import { ChatWidget } from './components/ChatWidget'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/encyclopedia" element={<Encyclopedia />} />
          <Route path="/lab" element={<TestLab />} />
        </Routes>
        <ChatWidget />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App

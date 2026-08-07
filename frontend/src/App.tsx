import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Encyclopedia } from './pages/Encyclopedia'
import { Home } from './pages/Home'
import { Navbar } from './components/Navbar'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/encyclopedia" element={<Encyclopedia />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App

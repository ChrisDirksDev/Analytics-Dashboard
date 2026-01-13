import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { ThemeProvider } from './contexts/ThemeContext'
import Dashboard from './pages/Dashboard'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <DndProvider backend={HTML5Backend}>
        <Router>
          <Routes>
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </Router>
      </DndProvider>
    </ThemeProvider>
  )
}

export default App


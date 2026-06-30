import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import LandingPage from './components/LandingPage.tsx'
import { ThemeProvider } from './contexts/ThemeContext'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
    <ErrorBoundary>
        <ThemeProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/signup" element={<App />} />
                    <Route path="/app" element={<App />} />
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    </ErrorBoundary>
)

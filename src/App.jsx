import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Header from './components/Header'
import Footer from './components/Footer'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboarding from './pages/volunteer/Onboarding'
import VolunteerDashboard from './pages/volunteer/Dashboard'
import NgoDashboard from './pages/ngo/Dashboard'
import TaskMapPage from './pages/TaskMapPage'
import ImpactShowcase from './pages/ImpactShowcase'
import Leaderboard from './pages/Leaderboard'
import './index.css'

// Suppress Google Maps billing popup via MutationObserver
if (typeof window !== 'undefined') {
  const _alert = window.alert
  window.alert = (msg) => {
    if (typeof msg === 'string' && /google/i.test(msg)) return
    _alert.call(window, msg)
  }

  const removeGooglePopup = () => {
    document.querySelectorAll('.gm-err-container, .gm-err-content, .gm-err-autocomplete').forEach(el => {
      el.style.display = 'none'
    })
  }

  const observer = new MutationObserver(removeGooglePopup)
  observer.observe(document.documentElement, { childList: true, subtree: true })
  // Also run on interval as fallback
  setInterval(removeGooglePopup, 500)
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<WithLayout><Landing /></WithLayout>} />
      <Route path="/login" element={<WithLayout><Login /></WithLayout>} />
      <Route path="/signup" element={<WithLayout><Signup /></WithLayout>} />

      <Route path="/map" element={<TaskMapPage />} />
      <Route path="/impact" element={<WithLayout><ImpactShowcase /></WithLayout>} />
      <Route path="/leaderboard" element={<WithLayout><Leaderboard /></WithLayout>} />

      <Route path="/volunteer/onboarding" element={
        <ProtectedRoute allowedRoles={['volunteer']}>
          <Onboarding />
        </ProtectedRoute>
      } />
      <Route path="/volunteer/dashboard" element={
        <ProtectedRoute allowedRoles={['volunteer']}>
          <VolunteerDashboard />
        </ProtectedRoute>
      } />

      <Route path="/ngo/dashboard" element={
        <ProtectedRoute allowedRoles={['ngo']}>
          <NgoDashboard />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

const WithLayout = ({ children }) => (
  <div className="App">
    <Header />
    <main style={{ flex: 1 }}>{children}</main>
    <Footer />
  </div>
)

export default App
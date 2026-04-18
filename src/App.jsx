import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
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
import './index.css'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<WithLayout><Landing /></WithLayout>} />
        <Route path="/login" element={<WithLayout><Login /></WithLayout>} />
        <Route path="/signup" element={<WithLayout><Signup /></WithLayout>} />

        <Route path="/map" element={<WithLayout><TaskMapPage /></WithLayout>} />
        <Route path="/impact" element={<WithLayout><ImpactShowcase /></WithLayout>} />

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
    </AuthProvider>
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
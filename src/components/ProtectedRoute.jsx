import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Set to true to bypass auth for local UI development
const DEV_BYPASS = false

// allowedRoles: ['volunteer'] | ['ngo'] | undefined (any logged-in user)
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, userProfile, loading } = useAuth()

  if (DEV_BYPASS) return children

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role)) {
    return <Navigate to={userProfile.role === 'ngo' ? '/ngo/dashboard' : '/volunteer/dashboard'} replace />
  }

  return children
}

export default ProtectedRoute

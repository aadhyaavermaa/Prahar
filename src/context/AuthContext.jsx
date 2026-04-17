import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, getUserProfile } from '../firebase'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null) // { role, ... }
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid)
        setUserProfile(profile)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const refreshProfile = async () => {
    if (user) {
      const profile = await getUserProfile(user.uid)
      setUserProfile(profile)
    }
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

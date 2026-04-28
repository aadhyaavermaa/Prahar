import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth, getUserProfile } from "../firebase"

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = async (uid = user?.uid) => {
    if (!uid) {
      setUserProfile(null)
      return null
    }

    try {
      const profile = await getUserProfile(uid)
      setUserProfile(profile)
      return profile
    } catch (err) {
      console.error("Failed to fetch user profile:", err)
      setUserProfile(null)
      return null
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setUser(firebaseUser)

        if (!firebaseUser) {
          setUserProfile(null)
          return
        }

        await refreshProfile(firebaseUser.uid)
      } catch (err) {
        console.error("Auth state handling failed:", err)
        setUserProfile(null)
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  const logout = async () => {
    try {
      setLoading(true)
      await signOut(auth)
      setUser(null)
      setUserProfile(null)
    } catch (err) {
      console.error(err)
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const value = useMemo(
    () => ({
      user,
      userProfile,
      loading,
      refreshProfile,
      logout,
    }),
    [user, userProfile, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
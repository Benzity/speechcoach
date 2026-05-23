import { createContext, useContext, useEffect, useState } from 'react'
import {
  apiLogin,
  apiMe,
  apiSignup,
  clearToken,
  getToken,
  setToken,
  type UserRead,
} from '../api'

type AuthState = {
  user: UserRead | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, displayName?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserRead | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!getToken()) {
      setIsLoading(false)
      return
    }
    apiMe()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setIsLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const { access_token } = await apiLogin(email, password)
    setToken(access_token)
    setUser(await apiMe())
  }

  async function signup(email: string, password: string, displayName?: string) {
    const { access_token } = await apiSignup(email, password, displayName)
    setToken(access_token)
    setUser(await apiMe())
  }

  function logout() {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}

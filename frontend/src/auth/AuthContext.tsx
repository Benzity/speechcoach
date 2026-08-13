import { createContext, useContext, useEffect, useState } from 'react'
import {
  apiDeleteAccount,
  apiLogin,
  apiLogout,
  apiMe,
  apiSignup,
  clearToken,
  getToken,
  setToken,
  type SignupConsents,
  type UserRead,
} from '../api'

type AuthState = {
  user: UserRead | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (
    email: string,
    password: string,
    birthDate: string,
    consents: SignupConsents,
    displayName?: string,
  ) => Promise<void>
  logout: () => Promise<void>
  deleteAccount: () => Promise<void>
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

  async function signup(
    email: string,
    password: string,
    birthDate: string,
    consents: SignupConsents,
    displayName?: string,
  ) {
    const { access_token } = await apiSignup(
      email,
      password,
      birthDate,
      consents,
      displayName,
    )
    setToken(access_token)
    setUser(await apiMe())
  }

  async function logout() {
    // 서버에서 토큰을 무효화해야 탈취된 토큰까지 죽는다.
    await apiLogout()
    setUser(null)
  }

  async function deleteAccount() {
    await apiDeleteAccount()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, signup, logout, deleteAccount }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
